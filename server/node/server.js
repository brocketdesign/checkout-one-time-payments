const express = require('express');
const app = express();
const { resolve } = require('path');
const multer = require('multer');
const axios = require('axios');
const fs = require('fs');
const FormData = require('form-data');
const { WebSocket, WebSocketServer } = require('ws');
const { S3Client, PutObjectCommand, ListObjectsV2Command } = require('@aws-sdk/client-s3');
const { createHash } = require('crypto');
const { v4: uuidv4 } = require('uuid');
const handlebars = require('express-handlebars'); // Require Handlebars
const cookieParser = require('cookie-parser'); // Add cookie-parser

// Copy the .env.example in the root into a .env file in this folder
require('dotenv').config({ path: './.env' });

// Ensure environment variables are set.
checkEnv();

// Initialize S3 client
const s3 = new S3Client({
  region: process.env.AWS_REGION,
  credentials: {
    accessKeyId: process.env.AWS_ACCESS_KEY_ID,
    secretAccessKey: process.env.AWS_SECRET_ACCESS_KEY
  }
});

// Store temporary file mapping
const tempFiles = new Map();

const stripe = require('stripe')(process.env.STRIPE_SECRET_KEY, {
  apiVersion: '2020-08-27',
  appInfo: { // For sample support and debugging, not required for production:
    name: "stripe-samples/checkout-one-time-payments",
    version: "0.0.1",
    url: "https://github.com/stripe-samples/checkout-one-time-payments"
  }
});

// Configure multer for memory storage instead of disk
const upload = multer({ 
  storage: multer.memoryStorage(),
  limits: { fileSize: 50 * 1024 * 1024 } // 50MB limit
});

// Redirect to https if not local and not already https
app.use((req, res, next) => {
  if (process.env.MODE !== 'local' && req.headers['x-forwarded-proto'] !== 'https') {
    res.redirect(`https://${req.headers['host']}${req.url}`);
  } else {
    next();
  }
});

app.use(express.static(process.env.STATIC_DIR));
app.use(express.urlencoded({ extended: true }));
app.use(
  express.json({
    // We need the raw body to verify webhook signatures.
    // Let's compute it only when hitting the Stripe webhook endpoint.
    verify: function (req, res, buf) {
      if (req.originalUrl.startsWith('/webhook')) {
        req.rawBody = buf.toString();
      }
    },
  })
);

// Add cookie-parser middleware
app.use(cookieParser());

// S3 Upload Helper Functions
const uploadToS3 = async (buffer, hash, filename) => {
    const key = `${hash}/${filename}`;
    const params = {
        Bucket: process.env.AWS_S3_BUCKET_NAME,
        Key: key,
        Body: buffer,
        ACL: 'public-read', // Ensures the file is publicly accessible
        ContentType: 'application/octet-stream', // Set default content type for binary files
    };

    try {
        console.log("Uploading to S3:", key);
        const command = new PutObjectCommand(params);
        await s3.send(command);
        const location = `https://${process.env.AWS_S3_BUCKET_NAME}.s3.${process.env.AWS_REGION}.amazonaws.com/${key}`;
        console.log("S3 Upload Successful:", location);
        return location;
    } catch (error) {
        console.error("S3 Upload Error:", error.message);
        throw new Error("Failed to upload file to S3. Please try again.");
    }
};

async function listFiles(prefix = '') {
    try {
        // Create the command with the required parameters
        const command = new ListObjectsV2Command({
            Bucket: process.env.AWS_S3_BUCKET_NAME,
            Prefix: prefix,
        });

        // Send the command and wait for the response
        const existingFiles = await s3.send(command);

        return existingFiles;
    } catch (err) {
        console.error('Error listing objects:', err);
        throw err;
    }
}

function isValidUrl(string) {
    try {
        new URL(string);
        return true;
    } catch (_) {
        return false;
    }
}

const handleFileUpload = async (file) => {
    if (!file) {
        throw new Error('No file provided');
    }

    const buffer = file.buffer;
    const hash = createHash('sha256').update(buffer).digest('hex');
    
    const existingFiles = await listFiles(hash);
    if (existingFiles.Contents && existingFiles.Contents.length > 0) {
        const foundFile = existingFiles.Contents[0];
        return `https://${process.env.AWS_S3_BUCKET_NAME}.s3.${process.env.AWS_REGION}.amazonaws.com/${foundFile.Key}`;
    } else {
        const uploadUrl = await uploadToS3(buffer, hash, file.originalname);
        return uploadUrl;
    }
};

// Configure Express to use Handlebars template engine
const hbs = handlebars.create({
  helpers: {
    ifCond: function (v1, operator, v2, options) {
      switch (operator) {
        case '==':
          return (v1 == v2) ? options.fn(this) : options.inverse(this);
        case '===':
          return (v1 === v2) ? options.fn(this) : options.inverse(this);
        case '!=':
          return (v1 != v2) ? options.fn(this) : options.inverse(this);
        case '!==':
          return (v1 !== v2) ? options.fn(this) : options.inverse(this);
        case '<':
          return (v1 < v2) ? options.fn(this) : options.inverse(this);
        case '<=':
          return (v1 <= v2) ? options.fn(this) : options.inverse(this);
        case '>':
          return (v1 > v2) ? options.fn(this) : options.inverse(this);
        case '>=':
          return (v1 >= v2) ? options.fn(this) : options.inverse(this);
        default:
          return options.inverse(this);
      }
    }
  },
  defaultLayout: false // Disable default layout
});
hbs.handlebars.registerHelper('json', function(context) {
  return JSON.stringify(context);
});
app.engine('handlebars', hbs.engine);
app.set('view engine', 'handlebars');
app.set('views', process.env.STATIC_DIR);


app.get(['/success', '/:lang/success'], (req, res) => {
  const path = 'success';

  // Determine language from cookie, URL parameter, or headers, default to 'en'
  let language = req.cookies?.preferredLanguage || req.params.lang || (req.headers['accept-language']?.startsWith('ja') ? 'ja' : 'en');
  if (language !== 'ja' && language !== 'en') {
    language = 'en'; // Default to English if the language is not supported
  }

  // Correct the translation path - looking for translations in the lang directory
  const translationPath = resolve(`${process.env.STATIC_DIR}/lang/${language}.json`);
  let translations = {};
  try {
    const translationFile = fs.readFileSync(translationPath, 'utf-8');
    translations = JSON.parse(translationFile);
    console.log(`Loaded translations from ${translationPath}`);
  } catch (error) {
    console.error(`Error loading translations from ${translationPath}:`, error);
  }

  console.log(`Rendering success template with language: ${language}, tempId: ${req.query.tempId}`);
  // Send the translation data to the client
  res.render(path, { 
    translations, 
    language,
    tempId: req.query.tempId  // Pass the tempId to the template
  });
});

app.get(['/canceled', '/:lang/canceled'], (req, res) => {
  const path = 'canceled';

  // Determine language from cookie, URL parameter, or headers, default to 'en'
  let language = req.cookies?.preferredLanguage || req.params.lang || (req.headers['accept-language']?.startsWith('ja') ? 'ja' : 'en');
  if (language !== 'ja' && language !== 'en') {
    language = 'en'; // Default to English if the language is not supported
  }

  // Correct the translation path - looking for translations in the lang directory
  const translationPath = resolve(`${process.env.STATIC_DIR}/lang/${language}.json`);
  let translations = {};
  try {
    const translationFile = fs.readFileSync(translationPath, 'utf-8');
    translations = JSON.parse(translationFile);
  } catch (error) {
    console.error('Error loading translations:', error);
  }

  // Send the translation data to the client
  res.render(path, { translations, language });
});

app.get(['/', '/:lang/'], (req, res) => {
  const path = 'index';

  // Determine language from URL parameter or headers, default to 'en'
  let language = req.params.lang || (req.headers['accept-language']?.startsWith('ja') ? 'ja' : 'en');
  if (language !== 'ja' && language !== 'en') {
    language = 'en'; // Default to English if the language is not supported
  }

  // Set the preferred language cookie
  res.cookie('preferredLanguage', language, { maxAge: 365 * 24 * 60 * 60 * 1000, httpOnly: false }); // Expires in 1 year

  // Load translation file
  const translationPath = resolve(`${process.env.STATIC_DIR}/lang/${language}.json`);
  let translations = {};
  try {
    const translationFile = fs.readFileSync(translationPath, 'utf-8');
    translations = JSON.parse(translationFile);
  } catch (error) {
    console.error('Error loading translations:', error);
  }

  // Send the translation data to the client
  res.render(path, { translations, language });
});

// Prefix API routes with /api for consistency
app.get('/api/config', async (req, res) => {
  const price = await stripe.prices.retrieve(process.env.PRICE);

  res.send({
    publicKey: process.env.STRIPE_PUBLISHABLE_KEY,
    unitAmount: price.unit_amount,
    currency: price.currency,
  });
});

// Fetch the Checkout Session to display the JSON result on the success page
app.get('/api/checkout-session', async (req, res) => {
  const { sessionId } = req.query;
  const session = await stripe.checkout.sessions.retrieve(sessionId);
  res.send(session);
});

app.post('/api/create-checkout-session', async (req, res) => {
  try {
    // on localhost, use http://localhost:4242 but on production use the domain
    const currentURL = req.protocol + '://' + req.get('host');
    console.log('Current URL:', currentURL);
    const domainURL = process.env.MODE === 'local' ? 'http://localhost:4242' : currentURL;
    const { tempId, roundedSellingPrice, fileName, duration, resolution, fileSize, frameCount } = req.body;
    
    if (!tempId || !tempFiles.has(tempId)) {
      return res.status(400).json({ error: 'Invalid tempId or files have expired' });
    }

    // Construct line_items array using roundedSellingPrice
    const line_items = [
      {
        price_data: {
          currency: 'usd',
          product_data: {
            name: 'Video Processing Service',
            description: `Face replacement processing for your video: ${fileName}, Duration: ${duration.toFixed(2)}s, Resolution: ${resolution}, Size: ${(fileSize / (1024 * 1024)).toFixed(2)} MB, Frame Count: ${frameCount}`
          },
          unit_amount: roundedSellingPrice * 100, // Convert to cents for Stripe
        },
        quantity: 1
      }
    ];
    
    // Determine language from cookie, URL parameter, or headers, default to 'en'
    let language = req.cookies?.preferredLanguage || req.params.lang || (req.headers['accept-language']?.startsWith('ja') ? 'ja' : 'en');
    if (language !== 'ja' && language !== 'en') {
      language = 'en'; // Default to English if the language is not supported
    }
    // Create new Checkout Session for the order
    const session = await stripe.checkout.sessions.create({
      mode: 'payment',
      line_items: line_items,
      // Add tempId to success URL to retrieve files after payment
      success_url: `${domainURL}/${language}/success?session_id={CHECKOUT_SESSION_ID}&tempId=${tempId}`,
      cancel_url: `${domainURL}/${language}/canceled`,
      // automatic_tax: {enabled: true},
    });

    return res.json(session);
  } catch (error) {
    console.error('Error creating checkout session:', error);
    return res.status(500).json({ error: error.message });
  }
});

// Webhook handler for asynchronous events.
app.post('/webhook', async (req, res) => {
  let data;
  let eventType;
  // Check if webhook signing is configured.
  if (process.env.STRIPE_WEBHOOK_SECRET) {
    // Retrieve the event by verifying the signature using the raw body and secret.
    let event;
    let signature = req.headers['stripe-signature'];

    try {
      event = stripe.webhooks.constructEvent(
        req.rawBody,
        signature,
        process.env.STRIPE_WEBHOOK_SECRET
      );
    } catch (err) {
      console.log(`⚠️  Webhook signature verification failed.`);
      return res.sendStatus(400);
    }
    // Extract the object from the event.
    data = event.data;
    eventType = event.type;
  } else {
    // Webhook signing is recommended, but if the secret is not configured in `config.js`,
    // retrieve the event data directly from the request body.
    data = req.body.data;
    eventType = req.body.type;
  }

  if (eventType === 'checkout.session.completed') {
    console.log(`🔔  Payment received!`);
  }

  res.sendStatus(200);
});

// Endpoint for temporary file upload
app.post('/api/temp-upload', upload.fields([
  { name: 'video_file', maxCount: 1 }, 
  { name: 'face_image_file', maxCount: 1 }
]), async (req, res) => {
  try {
    if (!req.files || !req.files['video_file'] || !req.files['face_image_file']) {
      return res.status(400).json({ error: 'Missing required files' });
    }

    const videoFile = req.files['video_file'][0];
    const faceImageFile = req.files['face_image_file'][0];

    // Upload files to S3
    const videoUrl = await handleFileUpload(videoFile);
    const faceImageUrl = await handleFileUpload(faceImageFile);

    // Generate a unique ID for this file pair
    const tempId = uuidv4();
    
    // Store mapping in memory (for demo purposes - production should use a database)
    tempFiles.set(tempId, {
      videoUrl,
      faceImageUrl,
      videoFilename: videoFile.originalname, // Store the original filename
      createdAt: Date.now()
    });

    // Clean up old entries (files older than 1 hour)
    const oneHourAgo = Date.now() - (60 * 60 * 1000);
    for (const [key, value] of tempFiles.entries()) {
      if (value.createdAt < oneHourAgo) {
        tempFiles.delete(key);
      }
    }

    return res.json({ tempId });
  } catch (error) {
    console.error('Temp upload error:', error);
    return res.status(500).json({ error: error.message });
  }
});

// Add new utility functions for Novita API integration
async function uploadToNovitaAssets(buffer) {
    try {
        console.log("Uploading to Novita Assets API");
        const response = await axios.put('https://assets.novitai.com/video', buffer, {
            headers: {
                'Content-Type': 'application/octet-stream',
                'Authorization': `Bearer ${process.env.NOVITA_API_KEY}`
            }
        });
        
        console.log("Novita Assets Upload Response:", response.data);
        return response.data.assets_id;
    } catch (error) {
        console.error("Novita Assets Upload Error:", error.message);
        throw new Error("Failed to upload video to Novita. Please try again.");
    }
}

function imageToBase64(buffer) {
    return buffer.toString('base64');
}

// Add this utility function to sanitize filenames
function sanitizeFilename(filename) {
  // Remove file extension first
  const parts = filename.split('.');
  const extension = parts.pop();
  const name = parts.join('.');
  
  // Replace special characters and spaces with hyphens
  const sanitized = name.replace(/[^a-zA-Z0-9]/g, '-')
                       .replace(/-+/g, '-')  // Replace multiple hyphens with single hyphen
                       .replace(/^-|-$/g, '') // Remove leading/trailing hyphens
                       .toLowerCase();
                       
  return sanitized ? `swap-${sanitized}.${extension}` : `swap-video.${extension}`;
}

// Add a function to handle downloading and reuploading with new name
async function downloadAndReuploadVideo(videoUrl, originalFilename) {
  try {
    console.log("Downloading video from Novita for renaming");
    const response = await axios.get(videoUrl, { responseType: 'arraybuffer' });
    
    // Create a unique hash for the S3 folder
    const buffer = Buffer.from(response.data);
    const hash = createHash('sha256').update(buffer).digest('hex');
    
    // Sanitize the original filename and prepend "swap-"
    const purifiedFilename = sanitizeFilename(originalFilename);
    
    // Upload to S3 with the new filename
    const s3Url = await uploadToS3(buffer, hash, purifiedFilename);
    
    console.log("Reuploaded video with new filename:", purifiedFilename);
    return s3Url;
  } catch (error) {
    console.error("Error downloading and reuploading video:", error);
    // Return the original URL as fallback
    return videoUrl;
  }
}

// Updated endpoint to process video with tempId
app.post('/api/process-video', async (req, res) => {
  try {
    const { tempId } = req.body;
    
    if (!tempId || !tempFiles.has(tempId)) {
      return res.status(400).json({ error: 'Invalid tempId or files have expired' });
    }

    const { videoUrl, faceImageUrl } = tempFiles.get(tempId);

    // Download files from S3
    const videoResponse = await axios.get(videoUrl, { responseType: 'arraybuffer' });
    const faceImageResponse = await axios.get(faceImageUrl, { responseType: 'arraybuffer' });
    
    // Get video_assets_id by uploading to Novita assets API
    const videoAssetsId = await uploadToNovitaAssets(Buffer.from(videoResponse.data));
    
    // Convert face image to base64
    const faceImageBase64 = imageToBase64(Buffer.from(faceImageResponse.data));
    
    // Prepare request body according to Novita API documentation
    const requestBody = {
      extra: {
        response_video_type: "mp4"
      },
      request: {
        video_assets_id: videoAssetsId,
        enable_restore: true,
        face_image_base64: faceImageBase64
      }
    };

    // Make API request to Novita
    const response = await axios.post('https://api.novita.ai/v3/async/video-merge-face', 
      requestBody, 
      {
        headers: {
          'Content-Type': 'application/json',
          'Authorization': `Bearer ${process.env.NOVITA_API_KEY}`
        },
        timeout: 10000,
      }
    );

    const task_id = response.data.task_id;
    console.log('API Response:', response.data);
    res.json({ task_id });

    // Start polling for the task result
    pollTaskResult(task_id);
  } catch (error) {
    console.error('API Error:', error);

    if (error.response) {
      // API returned an error
      if (error.response.status === 400) {
        return res.status(400).json({ error: 'Invalid video or image file' });
      } else if (error.response.status === 401) {
        return res.status(401).json({ error: 'Authentication failed' });
      } else {
        return res.status(500).json({ error: 'Failed to start processing' });
      }
    } else {
      // Network error or timeout
      return res.status(500).json({ error: 'Failed to start processing' });
    }
  }
});

// Map to store WebSocket clients by task_id
const clients = new Map();

// Map to store active polling intervals by task_id
const taskPolls = new Map();

// Function to poll the task result
async function pollTaskResult(task_id) {
  let attempts = 0;
  const maxAttempts = 1200; // 10 minutes (1200 attempts * 0.5 seconds)
  const retryAttempts = 3;
  const retryDelay = 500; // 0.5 seconds

  const pollInterval = setInterval(async () => {
    attempts++;
    console.log(`Polling task ${task_id}, attempt ${attempts}`);

    try {
      const response = await axios.get(`https://api.novita.ai/v3/async/task-result?task_id=${task_id}`, {
        headers: {
          'Authorization': `Bearer ${process.env.NOVITA_API_KEY}`,
        },
        timeout: 5000,
      });

      const result = response.data;
      console.log('Task Result:', result);

      // Send progress updates to the client
      const ws = clients.get(task_id);
      if (ws) {
        // Use progress_percent from the API if available, otherwise fallback to the calculated progress
        const progressPercent = result.task.progress_percent !== undefined ? result.task.progress_percent : Math.min(20 + Math.floor((attempts / maxAttempts) * 70), 90);
        console.log('Send progress to client:', progressPercent);
        ws.send(JSON.stringify({ 
          task_id: task_id, 
          progress: progressPercent,
          status: 'Processing video...' 
        }));
      }
      console.log(`result.task.status`,result.task.status);
      // Check the status of the task
      if (result.task.status === 'TASK_STATUS_SUCCEED') {
        // Task succeeded
        clearInterval(pollInterval);
        taskPolls.delete(task_id);
        
        // Find which tempId this task_id is associated with
        let originalVideoFilename = null;
        let videoTempId = null;
        
        // Check all clients to find which one has this task_id
        clients.forEach((clientWs, taskId) => {
          if (taskId === task_id) {
            // Get the tempId from the clientData 
            videoTempId = clientWs.tempId;
          }
        });
        
        // If we found a tempId, get the original filename
        if (videoTempId && tempFiles.has(videoTempId)) {
          originalVideoFilename = tempFiles.get(videoTempId).videoFilename;
        } else {
          // Default filename if original can't be found
          originalVideoFilename = "video.mp4";
        }
        
        // Download the processed video and reupload with the new filename
        const originalVideoUrl = result.videos[0].video_url;
        const newVideoUrl = await downloadAndReuploadVideo(originalVideoUrl, originalVideoFilename);
        
        const ws = clients.get(task_id);
        if (ws) {
          ws.send(JSON.stringify({ 
            task_id: task_id, 
            status: 'success', 
            video_url: newVideoUrl 
          }));
          ws.close();
          clients.delete(task_id);
        }
      } else if (result.task.status === 'TASK_STATUS_FAILED') {
        // Task failed
        console.log('Task failed:', result.reason); 
        clearInterval(pollInterval);
        taskPolls.delete(task_id);
        if (ws) {
          ws.send(JSON.stringify({ task_id: task_id, status: 'failed', error: result.reason }));
          ws.close();
          clients.delete(task_id);
        }
      } else if (attempts > maxAttempts) {
        // Timeout
        console.log('Task timed out');
        clearInterval(pollInterval);
        taskPolls.delete(task_id);
        if (ws) {
          ws.send(JSON.stringify({ task_id: task_id, status: 'timeout', error: 'Processing took too long' }));
          ws.close();
          clients.delete(task_id);
        }
      }
    } catch (error) {
      console.error('Error checking task result:', error);

      if (error.response) {
        // API returned an error
        console.log(error.response.status)
        if (error.response.status === 404) {
          console.log('Task not found');
          clearInterval(pollInterval);
          taskPolls.delete(task_id);
          const ws = clients.get(task_id);
          if (ws) {
            ws.send(JSON.stringify({ task_id: task_id, status: 'failed', error: 'Task not found' }));
            ws.close();
            clients.delete(task_id);
          }
        } else {
          // Retryable server error
          if (attempts <= retryAttempts) {
            console.log(`Retrying in ${retryDelay}ms...`);
            await new Promise(resolve => setTimeout(resolve, retryDelay));
          } else {
            console.log('Server error, stopping polling');
            clearInterval(pollInterval);
            taskPolls.delete(task_id);
            const ws = clients.get(task_id);
            if (ws) {
              ws.send(JSON.stringify({ task_id: task_id, status: 'failed', error: 'Server error' }));
              ws.close();
              clients.delete(task_id);
            }
          }
        }
      } else {
        // Network error or timeout
        if (attempts <= retryAttempts) {
          console.log(`Retrying in ${retryDelay}ms...`);
          await new Promise(resolve => setTimeout(resolve, retryDelay));
        } else {
          console.log('Network error or timeout, stopping polling');
          clearInterval(pollInterval);
          taskPolls.delete(task_id);
          const ws = clients.get(task_id);
          if (ws) {
            ws.send(JSON.stringify({ task_id: task_id, status: 'failed', error: 'Network error' }));
            ws.close();
            clients.delete(task_id);
          }
        }
      }
    }
  }, 1000);

  taskPolls.set(task_id, pollInterval);
}

const port = process.env.PORT || 4242;

// Create HTTP server for both Express and WebSocket
const server = require('http').createServer(app);

// Create WebSocket server attached to the HTTP server
const wss = new WebSocketServer({ 
  server,
  // Add options to handle connections from any domain
  verifyClient: (info) => {
    // Accept connections from any origin when deployed
    return true;
  }
});

// Track active connections with unique IDs
const connections = new Map();
let connectionCounter = 0;

// Setup a heartbeat interval to keep connections alive on Heroku (which has a 55s timeout)
const HEARTBEAT_INTERVAL = 30000; // 30 seconds
const heartbeatInterval = setInterval(() => {
  wss.clients.forEach(ws => {
    if (ws.isAlive === false) {
      console.log(`Terminating inactive connection: ${ws.connectionId}`);
      return ws.terminate();
    }
    
    ws.isAlive = false;
    ws.ping('', false, true);
    
    // Also send a custom ping message that clients can respond to
    try {
      ws.send(JSON.stringify({ type: 'ping', timestamp: Date.now() }));
    } catch (e) {
      console.error('Error sending ping:', e);
    }
  });
}, HEARTBEAT_INTERVAL);

wss.on('connection', (ws, req) => {
  // Assign unique ID to connection
  ws.connectionId = ++connectionCounter;
  ws.isAlive = true;
  
  console.log(`Client connected - ID: ${ws.connectionId}, IP: ${req.socket.remoteAddress}`);

  // Handle pong response
  ws.on('pong', () => {
    ws.isAlive = true;
  });

  ws.on('message', message => {
    try {
      const data = JSON.parse(message.toString());
      
      // Handle client pong responses
      if (data.type === 'pong') {
        ws.isAlive = true;
        return;
      }
      
      // Handle task_id registration
      if (data.task_id) {
        // If this task_id already has a connection, close the old one
        clients.forEach((existingWs, taskId) => {
          if (taskId === data.task_id && existingWs !== ws) {
            console.log(`Replacing existing connection for task_id: ${data.task_id}`);
            existingWs.close();
            clients.delete(taskId);
          }
        });
        
        // Store the tempId along with the WebSocket client if provided
        if (data.tempId) {
          ws.tempId = data.tempId;
        }
        
        clients.set(data.task_id, ws);
        console.log(`Client connected with task_id: ${data.task_id}, connection ID: ${ws.connectionId}`);
      }
    } catch (error) {
      console.error('Error parsing message:', error);
    }
  });

  ws.on('close', () => {
    console.log(`Client disconnected - ID: ${ws.connectionId}`);
    // Clean up clients and taskPolls when a client disconnects
    clients.forEach((clientWs, taskId) => {
      if (clientWs === ws) {
        clients.delete(taskId);
        const pollInterval = taskPolls.get(taskId);
        if (pollInterval) {
          clearInterval(pollInterval);
          taskPolls.delete(taskId);
        }
      }
    });
    
    // Remove from connections map
    connections.delete(ws.connectionId);
  });

  ws.on('error', error => {
    console.error(`WebSocket error on connection ${ws.connectionId}:`, error);
  });
  
  // Store in our connections map
  connections.set(ws.connectionId, ws);
});

// Clean up interval on server close
wss.on('close', () => {
  clearInterval(heartbeatInterval);
});

// Start server listening on the specified port
server.listen(port, '0.0.0.0', () => console.log(`Server listening on port ${port}!`));

function checkEnv() {
  const price = process.env.PRICE;
  if (price === "price_12345" || !price) {
    console.log("You must set a Price ID in the environment variables. Please see the README.");
    process.exit(0);
  }

  if (!process.env.NOVITA_API_KEY) {
    console.log("You must set NOVITA_API_KEY in the environment variables.");
    process.exit(0);
  }
  
  // Check for required AWS environment variables
  if (!process.env.AWS_ACCESS_KEY_ID || !process.env.AWS_SECRET_ACCESS_KEY || 
      !process.env.AWS_REGION || !process.env.AWS_S3_BUCKET_NAME) {
    console.log("You must set AWS_ACCESS_KEY_ID, AWS_SECRET_ACCESS_KEY, AWS_REGION, and AWS_S3_BUCKET_NAME in the environment variables.");
    process.exit(0);
  }
}
