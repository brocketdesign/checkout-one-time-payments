// Image to Video API handler
const express = require('express');
const router = express.Router();
const fetch = require('node-fetch');
const multer = require('multer');
const fs = require('fs');
const path = require('path');
const crypto = require('crypto');
const { promisify } = require('util');
const unlinkAsync = promisify(fs.unlink);
const axios = require('axios');
// .env is in ../../
const dotenv = require('dotenv');
dotenv.config({ path: path.join(__dirname, '../../.env') });

// Import utilities from server.js
const server = require('./server'); // This avoids loading the server module before it's ready

const stripe = require('stripe')(process.env.STRIPE_SECRET_KEY);

// Novita.ai API configuration
const NOVITA_API_KEY = process.env.NOVITA_API_KEY;
if (!NOVITA_API_KEY) {
    console.error('Error: NOVITA_API_KEY is not set in the environment variables.');
    process.exit(1);
}
const NOVITA_API_BASE = 'https://api.novita.ai/v3';
const NOVITA_ASYNC_ENDPOINT = `${NOVITA_API_BASE}/async`;
const NOVITA_MODELS = {
  'wan-i2v': 'wan-i2v',
  'kling-v1.6-i2v': 'kling-v1.6-i2v'
};

// Global collections for task management
global.imageToVideoTasks = global.imageToVideoTasks || {};
global.taskPolls = global.taskPolls || new Map();
global.clients = global.clients || new Map();
global.tempFiles = global.tempFiles || new Map();

// Set up multer for file uploads
const storage = multer.diskStorage({
  destination: function (req, file, cb) {
    cb(null, path.join(__dirname, 'uploads/'));
  },
  filename: function (req, file, cb) {
    const uniqueSuffix = Date.now() + '-' + Math.round(Math.random() * 1E9);
    cb(null, uniqueSuffix + path.extname(file.originalname));
  }
});

// Add file filter for images
const fileFilter = (req, file, cb) => {
  if (file.mimetype === 'image/jpeg' || file.mimetype === 'image/png' || file.mimetype === 'image/webp') {
    cb(null, true);
  } else {
    cb(new Error('Unsupported file format. Please upload JPEG, PNG, or WEBP.'), false);
  }
};

const upload = multer({ 
  storage: storage,
  limits: {
    fileSize: 10 * 1024 * 1024, // 10 MB max
  },
  fileFilter: fileFilter
});

// Helper function to upload file to AWS S3
async function uploadImageToTempStorage(filePath) {
  try {
    console.log(`[uploadImageToTempStorage] Uploading image ${filePath} to S3`);
    // Read the file from disk
    const fileBuffer = fs.readFileSync(filePath);
    
    // Create a hash for the file path
    const hash = crypto.createHash('md5').update(filePath + Date.now()).digest('hex');
    const filename = path.basename(filePath);
    
    // Use the server's S3 upload function
    const uploadUrl = await server.utils.uploadToS3(fileBuffer, hash, filename);
    console.log(`[uploadImageToTempStorage] Uploaded to S3: ${uploadUrl}`);
    
    return uploadUrl;
  } catch (error) {
    console.error('[uploadImageToTempStorage] Error uploading to S3:', error);
    
    // Fallback to local URL if S3 upload fails
    const baseUrl = process.env.BASE_URL || 'http://localhost:4242';
    const relativePath = filePath.split('/uploads/')[1] || path.basename(filePath);
    const localUrl = `${baseUrl}/uploads/${relativePath}`;
    
    console.warn(`[uploadImageToTempStorage] Falling back to local URL: ${localUrl}`);
    return localUrl;
  }
}

// Helper function to download and reupload a video
async function downloadAndReuploadVideo(videoUrl, originalFilename) {
  try {
    console.log(`[downloadAndReuploadVideo] Starting download of video from ${videoUrl}`);
    // Create destination path in uploads directory
    const uniqueSuffix = Date.now() + '-' + Math.round(Math.random() * 1E9);
    const fileName = `${uniqueSuffix}-${originalFilename || 'video.mp4'}`;
    const destinationPath = path.join(__dirname, 'uploads', fileName);
    
    console.log(`[downloadAndReuploadVideo] Saving to ${destinationPath}`);
    
    // Download the file
    const response = await axios({
      method: 'get',
      url: videoUrl,
      responseType: 'stream'
    });
    
    // Save the file
    const writer = fs.createWriteStream(destinationPath);
    response.data.pipe(writer);
    
    // Wait for the file to be completely written
    await new Promise((resolve, reject) => {
      writer.on('finish', () => {
        console.log(`[downloadAndReuploadVideo] File successfully written to disk`);
        resolve();
      });
      writer.on('error', (err) => {
        console.error(`[downloadAndReuploadVideo] Error writing file to disk:`, err);
        reject(err);
      });
    });
    
    // Return the new URL
    const baseUrl = process.env.BASE_URL || 'http://localhost:4242';
    const newUrl = `${baseUrl}/uploads/${fileName}`;
    console.log(`[downloadAndReuploadVideo] Video reuploaded successfully. New URL: ${newUrl}`);
    return newUrl;
  } catch (error) {
    console.error('[downloadAndReuploadVideo] Error downloading and reuploading video:', error.message);
    if (error.response) {
      console.error('[downloadAndReuploadVideo] Response status:', error.response.status);
    }
    throw new Error(`Failed to download and reupload video: ${error.message}`);
  }
}

// Function to submit image-to-video task to Novita.ai
async function submitImageToVideoTask(task) {
  try {
    // Determine which endpoint to use based on model name
    const modelName = task.modelName;
    const isWanModel = modelName === NOVITA_MODELS['wan-i2v'];
    
    // Build request payload based on model
    let requestBody;
    let apiEndpoint;
    
    if (isWanModel) {
      // WAN model parameters - updated format
      apiEndpoint = `${NOVITA_ASYNC_ENDPOINT}/wan-i2v`;
      requestBody = {
        model_name: "wan2.1-i2v",
        image_url: task.imageUrl,
        prompt: task.prompt || '',
        negative_prompt: task.negativePrompt || '',
        width: task.width || 720,
        height: task.height || 1280,
        steps: task.steps || 30,
        seed: task.seed || -1,
        flow_shift: task.flowShift || 5.0,
        enable_safety_checker: task.enableSafetyChecker === undefined ? true : task.enableSafetyChecker,
        fast_mode: task.fastMode || false
      };
      console.log(`[submitImageToVideoTask] Using WAN model endpoint: ${apiEndpoint}`);
      console.log(`[submitImageToVideoTask] WAN model request params:`, JSON.stringify(requestBody, null, 2));
    } else {
      // Kling model parameters (default) - updated format
      apiEndpoint = `${NOVITA_ASYNC_ENDPOINT}/kling-v1.6-i2v`;
      requestBody = {
        mode: task.mode || 'Standard',
        image_url: task.imageUrl,
        prompt: task.prompt || '',
        negative_prompt: task.negativePrompt || '',
        guidance_scale: task.guidanceScale || 0.5
      };
      
      // Add end image URL if provided and mode is Professional
      if (task.mode === 'Professional' && task.endImageUrl) {
        requestBody.end_image_url = task.endImageUrl;
      }
      
      console.log(`[submitImageToVideoTask] Using Kling model endpoint: ${apiEndpoint}`);
      console.log(`[submitImageToVideoTask] Kling model request params:`, JSON.stringify(requestBody, null, 2));
    }
    
    console.log(`[submitImageToVideoTask] Submitting task to Novita.ai model: ${modelName}`);
    console.log(`Novita.ai API Key: ${NOVITA_API_KEY}`);
    // Make the API call
    const response = await axios.post(apiEndpoint, requestBody, {
      headers: {
        'Authorization': `Bearer ${NOVITA_API_KEY}`,
        'Content-Type': 'application/json'
      }
    });
    
    console.log(`[submitImageToVideoTask] Task submitted successfully with task_id: ${response.data.task_id}`);
    
    // Return the task ID from Novita.ai
    return response.data.task_id;
  } catch (error) {
    console.error('[submitImageToVideoTask] Error submitting image-to-video task:', error.message);
    if (error.response) {
      console.error('[submitImageToVideoTask] API Response status:', error.response.status);
      console.error('[submitImageToVideoTask] API Response data:', JSON.stringify(error.response.data, null, 2));
      throw new Error(`Novita.ai API error (${error.response.status}): ${JSON.stringify(error.response.data)}`);
    } else if (error.request) {
      console.error('[submitImageToVideoTask] No response received from API');
      throw new Error('No response received from Novita.ai API. Please check your internet connection or API key.');
    } else {
      console.error('[submitImageToVideoTask] Error setting up request:', error.message);
      throw error;
    }
  }
}

// Function to poll task result from Novita.ai
async function pollTaskResult(task_id, localTaskId) {
  let attempts = 0;
  const maxAttempts = 1200; // 10 minutes (1200 attempts * 0.5 seconds)
  const retryAttempts = 3;
  const retryDelay = 500; // 0.5 seconds
  
  const task = global.imageToVideoTasks[localTaskId];
  if (!task) {
    console.error(`[pollTaskResult] Task ${localTaskId} not found in memory`);
    return;
  }
  
  // Update task with novita task_id
  task.novitaTaskId = task_id;
  task.status = 'PROCESSING';
  console.log(`[pollTaskResult] Starting polling for task ${task_id} (local ID: ${localTaskId})`);
  
  const pollInterval = setInterval(async () => {
    attempts++;
    console.log(`[pollTaskResult] Polling task ${task_id} (local: ${localTaskId}), attempt ${attempts}`);
    
    try {
      const pollUrl = `${NOVITA_API_BASE}/async/task-result?task_id=${task_id}`;
      console.log(`[pollTaskResult] Polling URL: ${pollUrl}`);
      
      const response = await axios.get(pollUrl, {
        headers: {
          'Authorization': `Bearer ${NOVITA_API_KEY}`
        },
        timeout: 5000
      });
      
      const result = response.data;
      console.log(`[pollTaskResult] Got response for task ${task_id}, status: ${result.task.status}`);

      // Log the complete response for debugging
      console.log(`[pollTaskResult] Response: ${JSON.stringify(result, null, 2)}`);
      
      // Update task progress
      const progressPercent = result.task.progress_percent !== undefined 
        ? result.task.progress_percent 
        : Math.min(20 + Math.floor((attempts / maxAttempts) * 70), 90);
      
      task.progress = progressPercent;
      task.lastUpdated = new Date().toISOString();
      
      console.log(`[pollTaskResult] Task ${task_id} progress: ${progressPercent}%`);
      
      // Check task status
      if (result.task.status === 'TASK_STATUS_SUCCEED') {
        // Task succeeded
        clearInterval(pollInterval);
        taskPolls.delete(task_id);
        
        // Get the video URL from the result - handle both API formats
        let videoUrl;
        if (result.videos && result.videos.length > 0 && result.videos[0].video_url) {
          // New API format
          videoUrl = result.videos[0].video_url;
        } else if (result.output && result.output.video_url) {
          // Legacy format
          videoUrl = result.output.video_url;
        }
        
        if (!videoUrl) {
          throw new Error('No video URL in successful task result');
        }
        
        // Download and reupload video to get a hosted URL
        const newVideoUrl = await downloadAndReuploadVideo(videoUrl, `video-${localTaskId}.mp4`);
        
        // Update task with video URL and status
        task.status = 'COMPLETED';
        task.videoUrl = newVideoUrl;
        task.completedAt = new Date().toISOString();
        
        console.log(`Task ${task_id} completed successfully. Video URL: ${newVideoUrl}`);
        
        // Notify WebSocket clients
        if (clients.has(localTaskId)) {
          const ws = clients.get(localTaskId);
          ws.send(JSON.stringify({
            task_id: localTaskId,
            status: 'success',
            video_url: newVideoUrl
          }));
        }
      } else if (result.task.status === 'TASK_STATUS_FAILED') {
        // Task failed
        console.log('Task failed:', result);
        clearInterval(pollInterval);
        taskPolls.delete(task_id);
        
        // Update task with error
        task.status = 'FAILED';
        task.error = result.reason || 'Task processing failed on the server';
        
        // Notify WebSocket clients
        if (clients.has(localTaskId)) {
          const ws = clients.get(localTaskId);
          ws.send(JSON.stringify({
            task_id: localTaskId,
            status: 'failed',
            error: task.error
          }));
        }
      } else if (attempts > maxAttempts) {
        // Timeout
        console.log('Task timed out');
        clearInterval(pollInterval);
        taskPolls.delete(task_id);
        
        // Update task with timeout error
        task.status = 'FAILED';
        task.error = 'Processing took too long';
        
        // Notify WebSocket clients
        if (clients.has(localTaskId)) {
          const ws = clients.get(localTaskId);
          ws.send(JSON.stringify({
            task_id: localTaskId,
            status: 'failed',
            error: task.error
          }));
        }
      }
    } catch (error) {
      console.error('Error checking task result:', error);
      
      if (error.response) {
        // API returned an error
        console.log(error.response.status);
        if (error.response.status === 404) {
          console.log('Task not found');
          clearInterval(pollInterval);
          taskPolls.delete(task_id);
          
          // Update task with error
          task.status = 'FAILED';
          task.error = 'Task not found on the server';
          
          // Notify WebSocket clients
          if (clients.has(localTaskId)) {
            const ws = clients.get(localTaskId);
            ws.send(JSON.stringify({
              task_id: localTaskId,
              status: 'failed',
              error: task.error
            }));
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
            
            // Update task with error
            task.status = 'FAILED';
            task.error = `Server error: ${error.response ? error.response.status : 'Unknown'}`;
            
            // Notify WebSocket clients
            if (clients.has(localTaskId)) {
              const ws = clients.get(localTaskId);
              ws.send(JSON.stringify({
                task_id: localTaskId,
                status: 'failed',
                error: task.error
              }));
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
          
          // Update task with error
          task.status = 'FAILED';
          task.error = 'Network error or timeout';
          
          // Notify WebSocket clients
          if (clients.has(localTaskId)) {
            const ws = clients.get(localTaskId);
            ws.send(JSON.stringify({
              task_id: localTaskId,
              status: 'failed',
              error: task.error
            }));
          }
        }
      }
    }
  }, 5000); // Poll every 5 seconds
  
  taskPolls.set(task_id, pollInterval);
}

// Create Stripe checkout session
async function createCheckoutSession(price, currency, successUrl, cancelUrl) {
  try {
    const session = await stripe.checkout.sessions.create({
      payment_method_types: ['card'],
      line_items: [
        {
          price_data: {
            currency: currency,
            product_data: {
              name: 'Image to Video Conversion',
              description: 'Convert your image into a dynamic video',
            },
            unit_amount: price, // Amount in cents/yen
          },
          quantity: 1,
        },
      ],
      mode: 'payment',
      success_url: successUrl,
      cancel_url: cancelUrl,
    });
    
    return session;
  } catch (error) {
    console.error('Error creating checkout session:', error);
    throw error;
  }
}

// POST endpoint to create a Stripe checkout session
router.post('/create-checkout-session', async (req, res) => {
  try {
    const { task_id } = req.body;
    if (!task_id) {
      return res.status(400).json({ error: 'Missing task_id in request body' });
    }
    
    // Price is $2 in cents, or 200 yen
    const price = req.body.currency === 'jpy' ? 200 : 200; // 200 cents = $2, 200 yen = ~$1.50
    const currency = req.body.currency || 'usd';
    
    // URLs for redirect after payment success or cancel
    const baseUrl = process.env.BASE_URL || `${req.protocol}://${req.get('host')}`;
    const successUrl = `${baseUrl}/success?task_id=${task_id}`;
    const cancelUrl = `${baseUrl}/canceled?task_id=${task_id}`;
    
    const session = await createCheckoutSession(price, currency, successUrl, cancelUrl);
    
    res.json({ sessionId: session.id });
  } catch (error) {
    console.error('Error creating checkout session:', error);
    res.status(500).json({ error: 'Failed to create checkout session' });
  }
});

// POST endpoint to initiate image-to-video conversion
router.post('/image-to-video', upload.fields([
  { name: 'image_file', maxCount: 1 },
  { name: 'end_image_file', maxCount: 1 }
]), async (req, res) => {
  try {
    // Check if we have a main image file
    if (!req.files || !req.files.image_file || !req.files.image_file[0]) {
      return res.status(400).json({ error: 'No image file provided' });
    }
    
    const mainImageFile = req.files.image_file[0];
    const endImageFile = req.files.end_image_file ? req.files.end_image_file[0] : null;
    
    // Extract parameters
    const prompt = req.body.prompt || '';
    const videoLength = parseInt(req.body.video_length_seconds || '5', 10);
    const motionIntensity = parseInt(req.body.motion_bucket_id || '127', 10);
    const modelName = req.body.model_name || 'kling-v1.6-i2v';
    const negativePrompt = req.body.negative_prompt || '';
    const guidanceScale = parseFloat(req.body.guidance_scale || '0.5');
    const skipPayment = req.body.skipPayment === 'true';
    
    // Kling-specific parameters
    const mode = req.body.mode || 'Standard';
    
    // Additional parameters for WanX model
    const width = parseInt(req.body.width || '720', 10);
    const height = parseInt(req.body.height || '1280', 10);
    const steps = parseInt(req.body.steps || '30', 10);
    const seed = parseInt(req.body.seed || '-1', 10);
    const flowShift = parseFloat(req.body.flow_shift || '5.0');
    const enableSafetyChecker = req.body.enable_safety_checker === 'true';
    const fastMode = req.body.fast_mode === 'true';
    
    // Upload images to S3 storage to get URLs
    console.log(`[image-to-video] Uploading main image to S3...`);
    const imageUrl = await uploadImageToTempStorage(mainImageFile.path);
    
    // Upload end image if provided
    let endImageUrl = null;
    if (endImageFile && mode === 'Professional') {
      console.log(`[image-to-video] Uploading end image to S3...`);
      endImageUrl = await uploadImageToTempStorage(endImageFile.path);
    }
    
    // Create a unique task ID
    const taskId = crypto.randomUUID();
    
    // Store task details in memory (in production, use a database)
    // This would be replaced by an actual database call in production
    const taskDetails = {
      taskId,
      modelName,
      imageUrl,
      endImageUrl,
      mode,
      prompt,
      negativePrompt,
      guidanceScale,
      status: 'PENDING',
      createdAt: new Date().toISOString(),
      filePath: mainImageFile.path,
      endFilePath: endImageFile ? endImageFile.path : null,
      skipPayment,
      // Store additional parameters based on model
      motionIntensity,
      // WanX model specific parameters
      width,
      height,
      steps,
      seed,
      flowShift,
      enableSafetyChecker,
      fastMode
    };
    
    // Save task details to a global object (would be a DB in production)
    global.imageToVideoTasks = global.imageToVideoTasks || {};
    global.imageToVideoTasks[taskId] = taskDetails;
    
    // In production, you would immediately process the task or queue it
    // For now, we'll just return the task ID
    return res.json({
      success: true,
      message: 'Task created successfully',
      task_id: taskId,
      require_payment: !skipPayment && process.env.NODE_ENV === 'production'
    });
  } catch (error) {
    console.error('Error processing image-to-video request:', error);
    // If there was a file, clean it up
    if (req.file) {
      try {
        await unlinkAsync(req.file.path);
      } catch (unlinkError) {
        console.error('Error deleting file:', unlinkError);
      }
    }
    res.status(500).json({ error: 'Internal server error', message: error.message });
  }
});

// GET endpoint to check task status
router.get('/image-to-video/status/:taskId', async (req, res) => {
  const { taskId } = req.params;
  
  if (!global.imageToVideoTasks || !global.imageToVideoTasks[taskId]) {
    return res.status(404).json({ error: 'Task not found' });
  }
  
  const task = global.imageToVideoTasks[taskId];
  
  if (task.status === 'PENDING') {
    return res.json({
      status: 'PENDING',
      progress: { percentage: 0 },
      task_id: taskId,
      message: 'Task is pending processing'
    });
  }
  
  if (task.status === 'PROCESSING') {
    // Return real progress from Novita.ai polling
    const progress = task.progress || 20; // Default to 20% if no progress info yet
    
    return res.json({
      status: 'PROCESSING',
      progress: { percentage: progress },
      task_id: taskId,
      message: 'Video is being generated'
    });
  }
  
  if (task.status === 'COMPLETED') {
    return res.json({
      status: 'SUCCESS',
      video_url: task.videoUrl,
      task_id: taskId,
      message: 'Video generated successfully'
    });
  }
  
  if (task.status === 'FAILED') {
    return res.json({
      status: 'FAILED',
      error_message: task.error || 'Unknown error occurred',
      task_id: taskId,
      message: 'Video generation failed'
    });
  }
  
  // Default fallback response
  return res.json({
    status: task.status,
    task_id: taskId,
    message: 'Task status retrieved'
  });
});

// POST endpoint to actually process the task (would be triggered after payment in production)
router.post('/image-to-video/process/:taskId', async (req, res) => {
  const { taskId } = req.params;
  
  if (!global.imageToVideoTasks || !global.imageToVideoTasks[taskId]) {
    return res.status(404).json({ error: 'Task not found' });
  }
  
  const task = global.imageToVideoTasks[taskId];
  
  // Check if payment is required and has been made
  if (!task.skipPayment && process.env.NODE_ENV === 'production' && !task.paymentComplete) {
    return res.status(402).json({ 
      error: 'Payment required', 
      message: 'Please complete the payment to process this task' 
    });
  }
  
  try {
    // Update task status
    task.status = 'PROCESSING';
    
    // Submit task to Novita.ai
    const novitaTaskId = await submitImageToVideoTask(task);
    
    // Poll for task result
    pollTaskResult(novitaTaskId, taskId);
    
    return res.json({
      success: true,
      message: 'Task processing started',
      task_id: taskId
    });
  } catch (error) {
    console.error(`Error processing task ${taskId}:`, error);
    
    // Update task status to failed
    task.status = 'FAILED';
    task.error = error.message || 'Unknown error occurred';
    
    return res.status(500).json({ 
      error: 'Failed to process task', 
      message: error.message 
    });
  }
});

// POST endpoint to mark a task as paid
router.post('/image-to-video/mark-paid/:taskId', async (req, res) => {
  const { taskId } = req.params;
  
  if (!global.imageToVideoTasks || !global.imageToVideoTasks[taskId]) {
    return res.status(404).json({ error: 'Task not found' });
  }
  
  const task = global.imageToVideoTasks[taskId];
  
  try {
    // Mark task as paid
    task.paymentComplete = true;
    
    return res.json({
      success: true,
      message: 'Payment recorded successfully',
      task_id: taskId
    });
  } catch (error) {
    console.error(`Error marking task ${taskId} as paid:`, error);
    return res.status(500).json({ 
      error: 'Failed to record payment', 
      message: error.message 
    });
  }
});

module.exports = router;

// WebSocket connection handler for real-time updates
// This function should be called from server.js with the WebSocket instance
// Example: imageToVideoApi.handleWebSocketConnection(ws, request, wss)
module.exports.handleWebSocketConnection = (ws, request, wss) => {
  // Extract task_id from the URL query parameters
  const url = new URL(request.url, 'http://localhost');
  const taskId = url.searchParams.get('task_id');
  
  if (!taskId) {
    console.log('[handleWebSocketConnection] WebSocket connection without task_id');
    ws.send(JSON.stringify({ error: 'No task_id provided' }));
    ws.close();
    return;
  }
  
  console.log(`[handleWebSocketConnection] WebSocket connected for task ${taskId}`);
  
  // Store the WebSocket connection for this task
  clients.set(taskId, ws);
  
  // Store temp ID for video renaming
  if (url.searchParams.get('tempId')) {
    ws.tempId = url.searchParams.get('tempId');
  }
  
  // Send initial status if task exists
  if (global.imageToVideoTasks && global.imageToVideoTasks[taskId]) {
    const task = global.imageToVideoTasks[taskId];
    const progress = task.progress || 0;
    
    ws.send(JSON.stringify({
      task_id: taskId,
      status: task.status,
      progress: progress,
      message: 'Connected to task status updates'
    }));
    
    // If the task is already completed or failed, send the final status
    if (task.status === 'COMPLETED') {
      ws.send(JSON.stringify({
        task_id: taskId,
        status: 'success',
        video_url: task.videoUrl
      }));
    } else if (task.status === 'FAILED') {
      ws.send(JSON.stringify({
        task_id: taskId,
        status: 'failed',
        error: task.error || 'Unknown error occurred'
      }));
    }
  } else {
    ws.send(JSON.stringify({ 
      task_id: taskId,
      status: 'not_found',
      message: 'Task not found'
    }));
  }
  
  // Handle WebSocket close
  ws.on('close', () => {
    console.log(`WebSocket disconnected for task ${taskId}`);
    clients.delete(taskId);
  });
  
  // Handle WebSocket errors
  ws.on('error', (error) => {
    console.error(`WebSocket error for task ${taskId}:`, error);
  });
  
  // Handle WebSocket messages
  ws.on('message', (message) => {
    try {
      const data = JSON.parse(message);
      console.log(`Received message for task ${taskId}:`, data);
      
      // Handle specific message types
      if (data.type === 'check_status') {
        // Send current status if task exists
        if (global.imageToVideoTasks && global.imageToVideoTasks[taskId]) {
          const task = global.imageToVideoTasks[taskId];
          const progress = task.progress || 0;
          
          ws.send(JSON.stringify({
            task_id: taskId,
            status: task.status,
            progress: progress
          }));
        }
      }
    } catch (error) {
      console.error('Error parsing WebSocket message:', error);
    }
  });
};
