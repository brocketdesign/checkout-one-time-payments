const stripe = Stripe(
  window.location.hostname !== 'localhost' && !window.location.hostname.includes('192.168.') ? 'pk_live_51PjtRbE5sP7DA1XvCkdmezori9qPGoO21y7yKSVvgkQVyrhWZfHAUkNsjPMnbwpPlp4zzoYsRjn79Ad7XN7HTHcc00UjBA9adF' : 'pk_test_51PjtRbE5sP7DA1XvD68v7X7Qj7pG6ZJpQmvuNodJjxc7MbH1ss2Te2gahFAS9nms4pbmEdMYdfCPxFDWHBbu9CxR003ikTnRES'
); // Replace with your actual publishable key

// Parse the translations JSON string into an object
const translationsObj = JSON.parse(translations);

// Get the current language from cookie preferredLanguage
const currentLanguage = document.cookie
  .split('; ')
  .find(row => row.startsWith('preferredLanguage='))
  ?.split('=')[1] || 'en';

// Set currency based on language
const currency = currentLanguage === 'ja' ? 'jpy' : 'usd';

// Add variables to store the selling price
let roundedSellingPrice = 0;
let formattedPrice = '';

// Define mode flag
let isImageMode = false;

// Define max video size (10MB)
const MAX_VIDEO_SIZE = 10 * 1024 * 1024; // 10MB in bytes
// Define max image size (1MB)
const MAX_IMAGE_SIZE = 1 * 1024 * 1024; // 1MB in bytes

// Number of frames to extract from video
const NUM_FRAMES_TO_EXTRACT = 20;

// Maximum number of saved faces to store
const MAX_SAVED_FACES = 5;

// Drag and Drop Functionality
const videoDropZone = document.getElementById('videoDropZone');
const videoInput = document.getElementById('videoInput');
const videoUploadBtn = document.getElementById('videoUploadBtn');
const imageDropZone = document.getElementById('imageDropZone');
const imageInput = document.getElementById('imageInput');
const imageUploadBtn = document.getElementById('imageUploadBtn');

// Source image elements
const sourceImageDropZone = document.getElementById('sourceImageDropZone');
const sourceImageInput = document.getElementById('sourceImageInput');
const sourceImageUploadBtn = document.getElementById('sourceImageUploadBtn');
const sourceImagePreview = document.getElementById('sourceImagePreview');
const sourceImageDetails = document.getElementById('sourceImageDetails');

// Mode toggle elements
const videoModeBtn = document.getElementById('videoModeBtn');
const imageModeBtn = document.getElementById('imageModeBtn');
const videoSourceSection = document.getElementById('videoSourceSection');
const imageSourceSection = document.getElementById('imageSourceSection');
const imageFreeBadge = document.querySelector('.image-free-badge');

const payButton = document.getElementById('payButton');
const status = document.getElementById('status');

// Get the video and image preview elements
const videoPreview = document.getElementById('videoPreview');
const imagePreview = document.getElementById('imagePreview');
const videoDetails = document.getElementById('videoDetails');

// Hide videoDetails by default
videoDetails.style.display = 'none';

// Mode toggle functionality
videoModeBtn.addEventListener('click', () => {
  if (isImageMode) {
    setVideoMode();
  }
});

imageModeBtn.addEventListener('click', () => {
  if (!isImageMode) {
    setImageMode();
  }
});

// Source Image Drag and Drop
sourceImageDropZone.addEventListener('dragover', (event) => {
  event.preventDefault();
  sourceImageDropZone.classList.add('hover');
});

sourceImageDropZone.addEventListener('dragleave', () => {
  sourceImageDropZone.classList.remove('hover');
});

// Update Source Image Drag and Drop
sourceImageDropZone.addEventListener('drop', async (event) => {
  event.preventDefault();
  sourceImageDropZone.classList.remove('hover');
  const files = event.dataTransfer.files;
  const file = files[0];
  
  await handleSourceImageSelection(file);
  getSourceImageDetails(file);
});

sourceImageUploadBtn.addEventListener('click', () => {
  sourceImageInput.click();
});

// Update sourceImageInput event listener
sourceImageInput.addEventListener('change', async (event) => {
  const file = sourceImageInput.files[0];
  await handleSourceImageSelection(file);
  getSourceImageDetails(file);
});

// Function to get source image details
async function getSourceImageDetails(imageFile) {
  // Check file size first
  if (imageFile.size > MAX_IMAGE_SIZE) {
    sourceImageDetails.innerHTML = `
      <h5>${translationsObj.image_details || 'Source Image Details'}</h5>
      <div class="alert alert-warning">
        ${translationsObj.image_too_large || 'Image file is too large (Maximum: 1MB).'} 
        <p><strong>${translationsObj.current_size || 'Current size'}:</strong> ${(imageFile.size / (1024 * 1024)).toFixed(2)} MB</p>
        <button class="btn btn-sm btn-primary mt-2" id="compressSourceImageBtn">
          <i class="bi bi-file-zip me-1"></i> ${translationsObj.compress_now || 'Compress Now'}
        </button>
      </div>
    `;
    sourceImageDetails.style.display = 'block';
    
    // Add event listener to the compress button
    document.getElementById('compressSourceImageBtn').addEventListener('click', async () => {
      const compressedFile = await compressImageIfNeeded(imageFile);
      if (compressedFile) {
        // Replace the file in the input
        const dataTransfer = new DataTransfer();
        dataTransfer.items.add(compressedFile);
        sourceImageInput.files = dataTransfer.files;
        
        // Update the preview and details
        handleSourceImageSelection(compressedFile);
        getSourceImageDetails(compressedFile);
      }
    });
    return;
  }

  const image = new Image();

  image.onload = function() {
    const width = image.width;
    const height = image.height;
    const fileSize = imageFile.size;
    const fileName = imageFile.name;

    sourceImageDetails.innerHTML = `
      <h5>${translationsObj.image_details || 'Source Image Details'}</h5>
      <ul style="text-align: left;">
        <li><strong>${translationsObj.name}:</strong> ${fileName}</li>
        <li><strong>${translationsObj.resolution}:</strong> ${width}x${height}</li>
        <li><strong>${translationsObj.size}:</strong> ${(fileSize / (1024 * 1024)).toFixed(2)} MB</li>
      </ul>
    `;
    
    // Store the source image URL to use in the comparison slider
    sourceImagePreview.dataset.originalUrl = URL.createObjectURL(imageFile);
  }

  image.onerror = function() {
    status.textContent = translationsObj.error_loading_metadata;
    sourceImageDetails.innerHTML = `<p>${translationsObj.error_loading_metadata}</p>`;
    sourceImageDetails.style.display = 'block';
    status.classList.remove('hidden');
    status.className = 'alert alert-danger';
  }

  image.src = URL.createObjectURL(imageFile);
}

// Video Drag and Drop
videoDropZone.addEventListener('dragover', (event) => {
  event.preventDefault();
  videoDropZone.classList.add('hover');
});

videoDropZone.addEventListener('dragleave', () => {
  videoDropZone.classList.remove('hover');
});

videoDropZone.addEventListener('drop', (event) => {
  event.preventDefault();
  videoDropZone.classList.remove('hover');
  const files = event.dataTransfer.files;
  videoInput.files = files;
  handleVideoSelection(files[0]);
  getVideoDetails(files[0]);
});

videoUploadBtn.addEventListener('click', () => {
  videoInput.click();
});

videoInput.addEventListener('change', (event) => {
  handleVideoSelection(videoInput.files[0]);
  getVideoDetails(videoInput.files[0]);
});

// Image Drag and Drop
imageDropZone.addEventListener('dragover', (event) => {
  event.preventDefault();
  imageDropZone.classList.add('hover');
});

imageDropZone.addEventListener('dragleave', () => {
  imageDropZone.classList.remove('hover');
});

// Update Image Drag and Drop
imageDropZone.addEventListener('drop', async (event) => {
  event.preventDefault();
  imageDropZone.classList.remove('hover');
  const files = event.dataTransfer.files;
  const file = files[0];
  
  await handleImageSelection(file);
  getImageDetails(file);
  saveFaceToLocalStorage(file);
});

imageUploadBtn.addEventListener('click', () => {
  imageInput.click();
});

// Update imageInput event listener
imageInput.addEventListener('change', async (event) => {
  // Check if this is a programmatic event from a saved face
  const fromSavedFace = event.isTrusted === false;
  const file = imageInput.files[0];
  
  await handleImageSelection(file);
  getImageDetails(file);
  
  // Only save to localStorage if not from a saved face selection
  if (!fromSavedFace && file) {
    saveFaceToLocalStorage(file);
  }
});

// Function to handle video selection and display preview
function handleVideoSelection(videoFile) {
  if (videoFile) {
    // Check if file size exceeds the maximum allowed
    if (videoFile.size > MAX_VIDEO_SIZE) {
      videoPreview.style.display = 'none';
      videoDetails.style.display = 'none';
      document.querySelector('.video-frames-section').style.display = 'none';
      
      // Disable pay button when file is too large
      payButton.disabled = true;
      //return;
    }else{
      payButton.disabled = false;
    }
    
    // Reset status if previously showed an error
    if (status.className.includes('alert-danger')) {
      status.textContent = '';
      status.className = '';
      payButton.disabled = false;
    }
    
    videoPreview.style.display = 'block';
    const videoUrl = URL.createObjectURL(videoFile);
    videoPreview.src = videoUrl;
    videoDetails.style.display = 'block'; // Show video details
    
    // Extract frames when video metadata is loaded
    videoPreview.onloadedmetadata = function() {
      extractVideoFrames(videoUrl);
    };
  } else {
    videoDetails.style.display = 'none'; // Hide video details if no video
    document.querySelector('.video-frames-section').style.display = 'none'; // Hide frames section
  }
}


// Function to compress image files larger than MAX_IMAGE_SIZE
async function compressImageIfNeeded(imageFile) {
  if (!imageFile) return null;
  
  // If file is already under the size limit, no need to compress
  if (imageFile.size <= MAX_IMAGE_SIZE) {
    return imageFile;
  }
  
  // Show compression status
  status.textContent = translationsObj.compressing_image || 'Compressing image...';
  status.classList.remove('hidden');
  status.className = 'alert alert-info';
  
  // Add a spinner to the status
  status.innerHTML = `<div class="d-flex align-items-center">
    <div class="spinner-border spinner-border-sm me-2" role="status"></div>
    <span>${translationsObj.compressing_image || 'Compressing image...'}</span>
  </div>`;
  
  try {
    const options = {
      maxSizeMB: 0.95, // Slightly under 1MB to be safe
      maxWidthOrHeight: 1920, // Reasonable limit for most uses
      useWebWorker: true,
      onProgress: (percent) => {
        // Update progress info
        status.innerHTML = `<div class="d-flex align-items-center">
          <div class="spinner-border spinner-border-sm me-2" role="status"></div>
          <span>${translationsObj.compressing_image || 'Compressing image...'} ${Math.round(percent)}%</span>
        </div>`;
      }
    };
    
    // Compress the image
    const compressedFile = await imageCompression(imageFile, options);
    
    // Show success message with the compression results
    const originalSizeMB = (imageFile.size / (1024 * 1024)).toFixed(2);
    const compressedSizeMB = (compressedFile.size / (1024 * 1024)).toFixed(2);
    const savingsPercent = Math.round((1 - (compressedFile.size / imageFile.size)) * 100);
    
    status.innerHTML = `<div class="alert alert-success">
      ${translationsObj.compression_complete || 'Image compressed successfully!'} 
      ${originalSizeMB}MB → ${compressedSizeMB}MB (${savingsPercent}% ${translationsObj.reduction || 'reduction'})
    </div>`;
    
    // Auto-hide the message after 3 seconds
    setTimeout(() => {
      status.textContent = '';
      status.className = 'status hidden';
    }, 3000);
    
    // Return the compressed file with the original filename
    return new File([compressedFile], imageFile.name, {
      type: compressedFile.type,
      lastModified: new Date().getTime()
    });
  } catch (error) {
    console.error('Error compressing image:', error);
    status.textContent = `${translationsObj.compression_error || 'Error compressing image:'} ${error.message}`;
    status.className = 'alert alert-danger';
    return imageFile; // Return original if compression fails
  }
}

// Update handleSourceImageSelection to use compression
async function handleSourceImageSelection(imageFile) {
  if (imageFile) {
    // Compress the image if it's too large
    if (imageFile.size > MAX_IMAGE_SIZE) {
      const compressedFile = await compressImageIfNeeded(imageFile);
      if (compressedFile) {
        // Replace the file in the input
        const dataTransfer = new DataTransfer();
        dataTransfer.items.add(compressedFile);
        sourceImageInput.files = dataTransfer.files;
        imageFile = compressedFile;
      }
    }
    
    // Reset status if previously showed an error
    if (status.className.includes('alert-danger')) {
      status.textContent = '';
      status.className = '';
      payButton.disabled = false;
    }
    
    sourceImagePreview.style.display = 'block';
    sourceImagePreview.src = URL.createObjectURL(imageFile);
    sourceImageDetails.style.display = 'block';
  } else {
    sourceImageDetails.style.display = 'none';
  }
}

// Update handleImageSelection to use compression
async function handleImageSelection(imageFile) {
  if (imageFile) {
    // Compress the image if it's too large
    if (imageFile.size > MAX_IMAGE_SIZE) {
      const compressedFile = await compressImageIfNeeded(imageFile);
      if (compressedFile) {
        // Replace the file in the input
        const dataTransfer = new DataTransfer();
        dataTransfer.items.add(compressedFile);
        imageInput.files = dataTransfer.files;
        imageFile = compressedFile;
      }
    }
    
    // Reset status if previously showed an error
    if (status.className.includes('alert-danger')) {
      status.textContent = '';
      status.className = '';
      payButton.disabled = false;
    }
    
    imagePreview.style.display = 'block';
    const imageUrl = URL.createObjectURL(imageFile);
    imagePreview.src = imageUrl;
    imageDetails.style.display = 'block'; // Show image details
    
  } else {
    imageDetails.style.display = 'none'; // Hide image details if no image
  }
}

function resetPayButton() {
  payButton.disabled = false;
  payButton.innerHTML = `<i class="bi bi-arrow-right-circle me-2"></i><span>${translationsObj.proceed || 'Proceed'}</span>`;
}

// Function to get video details
async function getVideoDetails(videoFile) {
  // Check file size first
  if (videoFile.size > MAX_VIDEO_SIZE) {
    videoDetails.innerHTML = `
      <h5>${translationsObj.video_details || 'Video Details'}</h5>
      <div class="alert alert-danger">
        ${translationsObj.video_too_large || 'Video file is too large (Maximum: 10MB). Please compress your video or select a smaller file.'}
        <p><strong>${translationsObj.current_size || 'Current size'}:</strong> ${(videoFile.size / (1024 * 1024)).toFixed(2)} MB</p>
      </div>
    `;
    videoDetails.style.display = 'block';
    return;
  }

  const video = document.createElement('video');
  video.preload = 'metadata';

  video.onloadedmetadata = async function() {
    window.URL.revokeObjectURL(video.src);
    const duration = video.duration;
    const width = video.videoWidth;
    const height = video.videoHeight;
    const fileSize = videoFile.size;
    const fileName = videoFile.name;

    // Attempt to get frame rate (frames per second)
    let frameRate = video.frameRate || 30; // Default to 30 FPS if not available
    let frameCount = Math.round(duration * frameRate);

    // Price estimation
    const pricePerFrame = 0.0005;
    const estimatedPrice = frameCount * pricePerFrame;
    // Selling price is 4x the estimated price with a minimum of $1/¥100
    let sellingPrice = Math.max(estimatedPrice * 4, currency === 'jpy' ? 100 : 1);
    
    // Round to whole number for JPY, round up to nearest dollar or 100 yen
    if (currency === 'jpy') {
      // Round up to nearest 100 yen
      roundedSellingPrice = Math.ceil(sellingPrice / 100) * 150;
      formattedPrice = `¥${roundedSellingPrice.toLocaleString()}`;
    } else {
      // Round up to nearest dollar
      roundedSellingPrice = Math.ceil(sellingPrice);
      formattedPrice = `$${roundedSellingPrice.toFixed(2)}`;
    }

    videoDetails.innerHTML = `
      <h5>${translationsObj.video_details}</h5>
      <ul style="text-align: left;">
      <li><strong>${translationsObj.name}:</strong> ${fileName}</li>
      <li><strong>${translationsObj.duration}:</strong> ${duration.toFixed(2)} ${translationsObj.seconds}</li>
      <li><strong>${translationsObj.resolution}:</strong> ${width}x${height}</li>
      <li><strong>${translationsObj.size}:</strong> ${(fileSize / (1024 * 1024)).toFixed(2)} MB</li>
      <li><strong>${translationsObj.estimated_frame_count}:</strong> ${frameCount}</li>
      <li class="d-none"><strong>${translationsObj.processing_fee}:</strong> ${formattedPrice}</li>
      </ul>
    `;
  }

  video.onerror = function() {
    status.textContent = translationsObj.error_loading_metadata;
    status.classList.remove('hidden');
    status.className = 'alert alert-danger'; // Use Bootstrap alert-danger class
  }

  video.src = URL.createObjectURL(videoFile);
}

// Function to get image details
async function getImageDetails(imageFile) {
  // Check file size first
  if (imageFile.size > MAX_IMAGE_SIZE) {
    imageDetails.innerHTML = `
      <h5>${translationsObj.image_details || 'Image Details'}</h5>
      <div class="alert alert-warning">
        ${translationsObj.image_too_large || 'Image file is too large (Maximum: 1MB).'} 
        <p><strong>${translationsObj.current_size || 'Current size'}:</strong> ${(imageFile.size / (1024 * 1024)).toFixed(2)} MB</p>
        <button class="btn btn-sm btn-primary mt-2" id="compressFaceImageBtn">
          <i class="bi bi-file-zip me-1"></i> ${translationsObj.compress_now || 'Compress Now'}
        </button>
      </div>
    `;
    imageDetails.style.display = 'block';
    
    // Add event listener to the compress button
    document.getElementById('compressFaceImageBtn').addEventListener('click', async () => {
      const compressedFile = await compressImageIfNeeded(imageFile);
      if (compressedFile) {
        // Replace the file in the input
        const dataTransfer = new DataTransfer();
        dataTransfer.items.add(compressedFile);
        imageInput.files = dataTransfer.files;
        
        // Update the preview and details
        handleImageSelection(compressedFile);
        getImageDetails(compressedFile);
      }
    });
    return;
  }

  const image = new Image();

  image.onload = function() {
    const width = image.width;
    const height = image.height;
    const fileSize = imageFile.size;
    const fileName = imageFile.name;

    imageDetails.innerHTML = `
      <h5>${translationsObj.image_details}</h5>
      <ul style="text-align: left;">
        <li><strong>${translationsObj.name}:</strong> ${fileName}</li>
        <li><strong>${translationsObj.resolution}:</strong> ${width}x${height}</li>
        <li><strong>${translationsObj.size}:</strong> ${(fileSize / (1024 * 1024)).toFixed(2)} MB</li>
      </ul>
    `;
  }

  image.onerror = function() {
    status.textContent = translationsObj.error_loading_metadata;
    imageDetails.innerHTML = `<p>${translationsObj.error_loading_metadata}</p>`;
    imageDetails.style.display = 'block';
    status.classList.remove('hidden');
    status.className = 'alert alert-danger'; // Use Bootstrap alert-danger class
  }

  image.src = URL.createObjectURL(imageFile);
}

// Function to extract frames from a video
function extractVideoFrames(videoUrl) {
  const video = document.createElement('video');
  const framesGallery = document.getElementById('videoFramesGallery');
  const framesSection = document.querySelector('.video-frames-section');
  
  // Clear previous frames
  framesGallery.innerHTML = '';
  
  video.src = videoUrl;
  video.crossOrigin = 'anonymous'; // To avoid CORS issues when drawing on canvas
  
  video.onloadeddata = function() {
    const duration = video.duration;
    const frameInterval = duration / (NUM_FRAMES_TO_EXTRACT + 1); // +1 to avoid the very first and last frames
    
    // Show loading message
    framesGallery.innerHTML = '<p>Extracting frames...</p>';
    framesSection.style.display = 'block';
    
    // Create canvas element for frame extraction
    const canvas = document.createElement('canvas');
    const ctx = canvas.getContext('2d');
    
    // Set canvas dimensions to match video
    canvas.width = video.videoWidth;
    canvas.height = video.videoHeight;
    
    // Extract frames at intervals - using sequential approach with index tracking
    let currentFrameIndex = 1;
    framesGallery.innerHTML = ''; // Clear loading message
    
    function extractNextFrame() {
      if (currentFrameIndex <= NUM_FRAMES_TO_EXTRACT) {
        const frameTime = currentFrameIndex * frameInterval;
        
        // Set up one-time event handler for this seek operation
        video.onseeked = function() {
          // Remove the event handler to avoid it being called multiple times
          video.onseeked = null;
          
          // Draw current video frame on canvas
          ctx.drawImage(video, 0, 0, canvas.width, canvas.height);
          
          // Get image data from canvas
          const frameDataUrl = canvas.toDataURL('image/jpeg', 0.8);
          
          // Create frame element
          const frameElement = document.createElement('div');
          frameElement.classList.add('video-frame');
          frameElement.dataset.time = frameTime.toFixed(2);
          
          const frameImage = document.createElement('img');
          frameImage.src = frameDataUrl;
          frameImage.alt = `Frame at ${frameTime.toFixed(2)}s`;
          frameElement.appendChild(frameImage);
          
          // Add click handler to use this frame
          frameElement.addEventListener('click', function() {
            useFrameForFaceSwap(frameDataUrl, frameTime.toFixed(2));
          });
          
          framesGallery.appendChild(frameElement);
          
          // Move to next frame
          currentFrameIndex++;
          extractNextFrame();
        };
        
        // Seek to the specified time
        video.currentTime = frameTime;
      } else {
        // All frames have been extracted
        framesSection.style.display = 'block';
      }
    }
    
    // Start the extraction process
    extractNextFrame();
  };
  
  video.onerror = function() {
    framesGallery.innerHTML = '<p>Error extracting frames</p>';
    framesSection.style.display = 'block';
  };
  
  // Start loading the video
  video.load();
}

// Function to use a selected frame for face swap
function useFrameForFaceSwap(frameDataUrl, timeStamp) {
  // First, remove selected class from all frames
  const frames = document.querySelectorAll('.video-frame');
  frames.forEach(frame => frame.classList.remove('selected'));
  
  // Find and mark the selected frame
  const selectedFrame = Array.from(frames).find(frame => 
    frame.dataset.time === timeStamp
  );
  if (selectedFrame) {
    selectedFrame.classList.add('selected');
  }
  
  // Switch to image mode if not already in image mode
  if (!isImageMode) {
    isImageMode = true;
    imageModeBtn.classList.add('active');
    imageModeBtn.classList.remove('btn-outline-primary');
    imageModeBtn.classList.add('btn-primary');
    videoModeBtn.classList.remove('active');
    videoModeBtn.classList.add('btn-outline-primary');
    videoModeBtn.classList.remove('btn-primary');
    
    imageFreeBadge.style.display = 'block';
    videoSourceSection.style.display = 'none';
    imageSourceSection.style.display = 'block';
    
    // Move video frames section to image source section
    const framesSection = document.querySelector('.video-frames-section');
    if (framesSection && framesSection.parentNode !== imageSourceSection) {
      imageSourceSection.appendChild(framesSection);
      framesSection.style.display = 'block';
    }
  }
  
  // Convert data URL to a file and set it as the source image
  fetch(frameDataUrl)
    .then(res => res.blob())
    .then(blob => {
      const file = new File([blob], `frame_${timeStamp}s.jpg`, { type: 'image/jpeg' });
      
      // Create a DataTransfer to set the files property
      const dataTransfer = new DataTransfer();
      dataTransfer.items.add(file);
      
      // Set the file as source image
      sourceImageInput.files = dataTransfer.files;
      
      // Show the image preview
      sourceImagePreview.style.display = 'block';
      sourceImagePreview.src = frameDataUrl;
      
      // Update image details
      getSourceImageDetails(file);
      
      // Show a message to the user
      status.textContent = translationsObj.frame_selected || 'Frame selected as source image. You can select another frame or upload a face image to proceed.';
      status.classList.remove('hidden');
      status.className = 'alert alert-info';
      
      // Set timeout to remove the message after a few seconds
      setTimeout(() => {
        if (status.textContent === (translationsObj.frame_selected || 'Frame selected as source image. You can select another frame or upload a face image to proceed.')) {
          status.textContent = '';
          status.className = 'status hidden';
        }
      }, 3000);
    });
}

// Function to reset the form
function resetForm() {
  document.getElementById('videoInput').value = '';
  document.getElementById('imageInput').value = '';
  document.getElementById('sourceImageInput').value = '';
  document.getElementById('skipPayment').checked = false;
  document.getElementById('status').textContent = '';
  document.getElementById('status').className = '';
  roundedSellingPrice = 0;
  payButton.disabled = false; // Re-enable the pay button when form is reset
}

// Function to handle sample image selection
function setupSampleImageSelection() {
  const sampleImages = document.querySelectorAll('.sample-image');
  const status = document.getElementById('status');
  
  sampleImages.forEach(imgContainer => {
    imgContainer.addEventListener('click', async () => {
      // Remove selected class from all images
      sampleImages.forEach(img => img.classList.remove('selected'));
      
      // Add selected class to clicked image
      imgContainer.classList.add('selected');
      
      const imgSrc = imgContainer.getAttribute('data-img-src');
      
      try {
        // Fetch the image file
        const response = await fetch(imgSrc);
        const blob = await response.blob();
        
        // Get the filename from the path
        const filename = imgSrc.split('/').pop();
        
        // Create a File object from the blob
        const imageFile = new File([blob], filename, { type: 'image/webp' });
        
        // Create a DataTransfer to set the files property
        const dataTransfer = new DataTransfer();
        dataTransfer.items.add(imageFile);
        
        // Set the files property of the imageInput
        const imageInput = document.getElementById('imageInput');
        imageInput.files = dataTransfer.files; 

        // Trigger the change event to update image preview and details only for face-sample images
        if (imageInput.files[0].name.startsWith('face-sample')) {
          const event = new Event('change', { bubbles: true });
          imageInput.dispatchEvent(event);
        }
        
      } catch (error) {
        console.error('Error selecting sample image:', error);
        status.textContent = translationsObj.error_loading_sample_image || 'Error loading sample image';
        status.classList.remove('hidden');
        status.className = 'alert alert-danger';
      }
    });
  });
}

// Function to save face image to localStorage
function saveFaceToLocalStorage(imageFile) {
  // Check if it is a sample image by name
  const isSampleImage = imageFile.name.startsWith('face-sample');
  if (isSampleImage) {
    // Don't save sample images to localStorage
    return;
  }
  
  // Create a FileReader to convert the image to a data URL
  const reader = new FileReader();
  reader.onload = function(event) {
    const imageDataUrl = event.target.result;
    
    // Get existing saved faces or initialize empty array
    let savedFaces = JSON.parse(localStorage.getItem('savedFaces') || '[]');
    
    // Add timestamp and filename to identify the face
    const faceData = {
      id: Date.now().toString(),
      name: imageFile.name,
      dataUrl: imageDataUrl,
      timestamp: new Date().toISOString()
    };

    // Check if the face already exists in saved faces
    const existingFaceIndex = savedFaces.findIndex(face => face.name === imageFile.name);
    if (existingFaceIndex !== -1) {
      return; // Face already exists, do not save again
    }
    
    // Add new face to the beginning of the array
    savedFaces.unshift(faceData);
    
    // Limit the number of saved faces to MAX_SAVED_FACES
    if (savedFaces.length > MAX_SAVED_FACES) {
      savedFaces = savedFaces.slice(0, MAX_SAVED_FACES);
    }
    
    // Save back to localStorage
    try {
      localStorage.setItem('savedFaces', JSON.stringify(savedFaces));
      
      // Update the saved faces gallery
      displaySavedFaces();
    } catch (e) {
      // Handle localStorage quota exceeded
      console.error('localStorage quota exceeded:', e);
      
      // Try removing the oldest face and retrying
      if (savedFaces.length > 1) {
        savedFaces.pop();
        localStorage.setItem('savedFaces', JSON.stringify(savedFaces));
        displaySavedFaces();
      }
    }
  };
  
  // Read the image file as data URL
  reader.readAsDataURL(imageFile);
}

// Update the displaySavedFaces function to handle URL-based faces properly
function displaySavedFaces() {
  // Get the saved faces gallery container
  const savedFacesContainer = document.getElementById('savedFacesGallery');
  if (!savedFacesContainer) return;
  
  // Clear current saved faces
  savedFacesContainer.innerHTML = '';
  
  // Get saved faces from localStorage
  const savedFaces = JSON.parse(localStorage.getItem('savedFaces') || '[]');
  
  if (savedFaces.length === 0) {
    // Hide the saved faces section if no faces are saved
    const savedFacesSection = document.querySelector('.saved-faces-section');
    if (savedFacesSection) {
      savedFacesSection.style.display = 'none';
    }
    return;
  }
  
  // Show the saved faces section
  const savedFacesSection = document.querySelector('.saved-faces-section');
  if (savedFacesSection) {
    savedFacesSection.style.display = 'block';
  }
  
  // Add each saved face to the gallery
  savedFaces.forEach(face => {
    const faceElement = document.createElement('div');
    faceElement.classList.add('sample-image');
    faceElement.setAttribute('data-img-src', face.dataUrl);
    faceElement.setAttribute('data-saved', 'true');
    faceElement.setAttribute('data-face-id', face.id);
    
    const faceImage = document.createElement('img');
    faceImage.src = face.dataUrl;
    faceImage.alt = `Saved face ${face.name}`;
    
    // Add delete button
    const deleteButton = document.createElement('button');
    deleteButton.className = 'delete-saved-face';
    deleteButton.classList.add('hidden');
    deleteButton.innerHTML = '×';
    deleteButton.title = translationsObj.delete_saved_face || 'Remove saved face';
    deleteButton.onclick = function(e) {
      e.stopPropagation(); // Prevent triggering the parent click event
      removeSavedFace(face.id);
    };
    // On hover, show delete button
    faceElement.addEventListener('mouseenter', () => {
        deleteButton.classList.remove('hidden');
    });
    faceElement.addEventListener('mouseleave', () => {
      deleteButton.classList.add('hidden');
    });
    faceElement.appendChild(faceImage);
    faceElement.appendChild(deleteButton);
    savedFacesContainer.appendChild(faceElement);
    
    // Add the same click handler as sample images
    faceElement.addEventListener('click', async () => {
      const sampleImages = document.querySelectorAll('.sample-image');
      sampleImages.forEach(img => img.classList.remove('selected'));
      faceElement.classList.add('selected');
      
      try {
        if (face.isUrlBased) {
          // For URL-based faces, directly set the URL
          faceImageUrlValue = face.originalUrl || face.dataUrl;
          
          // Update the UI
          imagePreview.style.display = 'block';
          imagePreview.src = face.dataUrl;
          imagePreview.crossOrigin = 'anonymous';
          
          // Create a dummy image element to get dimensions for the details display
          const img = new Image();
          img.onload = function() {
            // IMPORTANT: Only update details, don't save the face again
            imageDetails.innerHTML = `
              <h5>${translationsObj.image_details}</h5>
              <ul style="text-align: left;">
                <li><strong>${translationsObj.name}:</strong> ${face.name}</li>
                <li><strong>${translationsObj.resolution}:</strong> ${img.width || img.naturalWidth}x${img.height || img.naturalHeight}</li>
              </ul>
            `;
            imageDetails.style.display = 'block';
          };
          img.src = face.dataUrl;
          
          // Set the input field value if it exists
          const faceImageUrlInput = document.getElementById('faceImageUrlInput');
          if (faceImageUrlInput) {
            faceImageUrlInput.value = face.originalUrl || face.dataUrl;
          }
        } else {
          // For file-based faces, convert data URL back to a File object
          const response = await fetch(face.dataUrl);
          const blob = await response.blob();
          const imageFile = new File([blob], face.name || 'saved-face.jpg', { type: blob.type });
          
          // Create a DataTransfer to set the files property
          const dataTransfer = new DataTransfer();
          dataTransfer.items.add(imageFile);
          
          // Set the files property of the imageInput
          const imageInput = document.getElementById('imageInput');
          imageInput.files = dataTransfer.files;
          
          // Trigger the change event to update image preview and details
          const event = new Event('change', { bubbles: true });
          imageInput.dispatchEvent(event);
        }
      } catch (error) {
        console.error('Error selecting saved face:', error);
      }
    });
  });
}

// Function to remove a saved face from localStorage
function removeSavedFace(faceId) {
  // Get saved faces from localStorage
  let savedFaces = JSON.parse(localStorage.getItem('savedFaces') || '[]');
  
  // Remove the face with the given ID
  savedFaces = savedFaces.filter(face => face.id !== faceId);
  
  // Save back to localStorage
  localStorage.setItem('savedFaces', JSON.stringify(savedFaces));
  
  // Update the display
  displaySavedFaces();
}

// Check for videoUrl in query parameters on page load
document.addEventListener('DOMContentLoaded', () => {
  checkAndHideSkipPayment();
  displaySavedFaces(); // Display saved faces from localStorage
  setupSampleImageSelection(); // Initialize sample image selection
  
  const urlParams = new URLSearchParams(window.location.search);
  const videoUrl = urlParams.get('videoUrl');

  if (videoUrl) {
    // Load the video from the URL and set it as the videoInput
    loadVideoFromUrl(videoUrl);
  }
});

// Check for videoUrl in query parameters on page load
document.addEventListener('DOMContentLoaded', () => {
  checkAndHideSkipPayment();
  setupSampleImageSelection(); // Initialize sample image selection
  const urlParams = new URLSearchParams(window.location.search);
  const videoUrl = urlParams.get('videoUrl');

  if (videoUrl) {
    // Load the video from the URL and set it as the videoInput
    loadVideoFromUrl(videoUrl);
  }
});

async function loadVideoFromUrl(videoUrl) {
  try {
    const response = await fetch(videoUrl);
    const blob = await response.blob();
    const videoFile = new File([blob], 'video.mp4', { type: 'video/mp4' });

    // Create a new DataTransfer object to simulate file selection
    const dataTransfer = new DataTransfer();
    dataTransfer.items.add(videoFile);

    // Set the files property of the videoInput
    videoInput.files = dataTransfer.files;

    // Trigger the change event to update video details
    const event = new Event('change', { bubbles: true });
    videoInput.dispatchEvent(event);
  } catch (error) {
    console.error('Error loading video from URL:', error);
    status.textContent = translationsObj.error_loading_url;
    status.classList.remove('hidden');
    status.className = 'alert alert-danger'; // Use Bootstrap alert-danger class
  }
}

// Function to hide the skip payment option if not on localhost
function checkAndHideSkipPayment() {
  if (window.location.hostname !== 'localhost' && !window.location.hostname.includes('192.168.') ) {
    const skipPaymentCheckbox = document.getElementById('skipPayment');
    if (skipPaymentCheckbox) {
      skipPaymentCheckbox.checked = false; // Uncheck the checkbox
    }
  }
}

// Initialize on document load
document.addEventListener('DOMContentLoaded', () => {
  checkAndHideSkipPayment();
  displaySavedFaces(); // Display saved faces on page load
  setupSampleImageSelection();
  
  // Initialize with video mode active
  isImageMode = false;
  
  const urlParams = new URLSearchParams(window.location.search);
  const videoUrl = urlParams.get('videoUrl');

  if (videoUrl) {
    loadVideoFromUrl(videoUrl);
  }
});

// Function to set up the image comparison slider
function setupComparisonSlider(originalImageUrl, processedImageUrl) {
  const comparisonContainer = document.getElementById('imageComparisonContainer');

  // Clear previous content
  comparisonContainer.innerHTML = '';

  // Create the structure for the comparison slider
  comparisonContainer.innerHTML = `
    <div class="img-comp-container">
      <div class="img-comp-after">
        <img src="${processedImageUrl}" alt="Processed Image">
      </div>
      <div class="img-comp-before">
        <img src="${originalImageUrl}" alt="Original Image">
      </div>
      <div class="img-comp-slider">
        <div class="img-comp-vertical-line"></div>
        <div class="img-comp-handle">
          <span class="img-comp-arrow-left">❮</span>
          <span class="img-comp-arrow-right">❯</span>
        </div>
      </div>
    </div>
  `;

  // Wait for images to load before initializing comparison
  const images = comparisonContainer.querySelectorAll('img');
  let loadedCount = 0;
  let errorOccurred = false; // Flag to track if any image fails to load

  const imagePromises = Array.from(images).map(img => {
    return new Promise((resolve, reject) => {
      img.onload = () => {
        // Check for natural dimensions after load
        if (!img.naturalWidth || !img.naturalHeight) {
          console.warn('Image dimensions not available yet, delaying initComparison');
          setTimeout(() => {
            img.onload(); // Re-trigger onload after a delay
          }, 200);
          reject('Image dimensions not available');
          return;
        }
        resolve();
      };
      img.onerror = () => {
        errorOccurred = true;
        status.textContent = translationsObj.error_loading_images || 'Error loading images for comparison.';
        status.classList.remove('hidden');
        status.className = 'alert alert-danger';
        reject('Error loading image');
      };
      // Handle already cached images
      if (img.complete) {
        img.onload();
      }
    });
  });

  Promise.all(imagePromises)
    .then(() => {
      // Delay initComparison to ensure images are rendered
      setTimeout(initComparison, 100);
    })
    .catch(error => {
      console.error('Image loading failed:', error);
    });

  // Also update the processedImage element for backward compatibility
  document.getElementById('processedImage').src = processedImageUrl;
}

// Function to initialize the comparison slider
function initComparison() {
  const container = document.querySelector('.img-comp-container');
  const slider = document.querySelector('.img-comp-slider');
  const before = document.querySelector('.img-comp-before');
  const after = document.querySelector('.img-comp-after');
  const afterImg = document.querySelector('.img-comp-after img');
  const beforeImg = document.querySelector('.img-comp-before img');

  // Check if images have valid dimensions
  if (!afterImg.naturalWidth || !afterImg.naturalHeight || !beforeImg.naturalWidth || !beforeImg.naturalHeight) {
    console.error('Images have no dimensions!');
    return;
  }

  // Calculate natural aspect ratio of images
  const imgWidth = afterImg.naturalWidth;
  const imgHeight = afterImg.naturalHeight;
  const aspectRatio = imgWidth / imgHeight;

  // Calculate container dimensions based on aspect ratio
  let containerWidth = container.offsetWidth;
  let containerHeight = containerWidth / aspectRatio;

  // If the calculated height exceeds max-height, adjust width accordingly
  if (containerHeight > 400) {
    containerHeight = 400;
    containerWidth = containerHeight * aspectRatio;
  }

  // Set container height
  container.style.height = containerHeight + 'px';

  // Calculate the actual displayed dimensions of the images
  let displayedWidth, displayedHeight, scale;

  if (aspectRatio > container.offsetWidth / containerHeight) {
    // Width constrained - image will be full width
    displayedWidth = container.offsetWidth;
    displayedHeight = displayedWidth / aspectRatio;
    scale = displayedWidth / imgWidth;
  } else {
    // Height constrained - image will be full height
    displayedHeight = containerHeight;
    displayedWidth = displayedHeight * aspectRatio;
    scale = displayedHeight / imgHeight;
  }

  // Calculate horizontal offset to center images
  const horizontalOffset = (container.offsetWidth - displayedWidth) / 2;

  // Style both images identically
  afterImg.style.width = 'auto';
  afterImg.style.height = 'auto';
  afterImg.style.maxWidth = `${displayedWidth}px`;
  afterImg.style.maxHeight = `${containerHeight}px`;
  afterImg.style.left = `${horizontalOffset}px`;

  beforeImg.style.width = 'auto';
  beforeImg.style.height = 'auto';
  beforeImg.style.maxWidth = `${displayedWidth}px`;
  beforeImg.style.maxHeight = `${containerHeight}px`;
  beforeImg.style.left = `${horizontalOffset}px`;

  // Set initial slider position (center)
  const initialPosition = container.offsetWidth / 2;
  slider.style.left = initialPosition + 'px';

  // Set initial clip for before image (show left half)
  updateClipPath(initialPosition);

  // Add event listeners for slider interaction
  slider.addEventListener('mousedown', startSliding);
  slider.addEventListener('touchstart', startSliding, { passive: true });

  function startSliding(e) {
    e.preventDefault();

    // Add event listeners for moving and stopping
    document.addEventListener('mousemove', slide);
    document.addEventListener('touchmove', slide, { passive: false });
    document.addEventListener('mouseup', stopSliding);
    document.addEventListener('touchend', stopSliding);
  }

  function slide(e) {
    let pos = getPosition(e);

    // Constrain position within the valid image bounds
    if (pos < horizontalOffset) pos = horizontalOffset;
    if (pos > horizontalOffset + displayedWidth) pos = horizontalOffset + displayedWidth;

    // Update slider position
    slider.style.left = pos + 'px';

    // Update clip path instead of width
    updateClipPath(pos);
  }

  function updateClipPath(position) {
    // Calculate how much of the right side to clip (as a percentage)
    const rightClip = 100 - ((position / container.offsetWidth) * 100);

    // Apply clip-path to show only the portion left of the slider
    before.style.clipPath = `inset(0 ${rightClip}% 0 0)`;
  }

  function getPosition(e) {
    const containerRect = container.getBoundingClientRect();
    let clientX;

    // Handle both mouse and touch events
    if (e.type.includes('touch')) {
      clientX = e.touches[0].clientX;
    } else {
      clientX = e.clientX;
    }

    return clientX - containerRect.left;
  }

  function stopSliding() {
    // Remove event listeners
    document.removeEventListener('mousemove', slide);
    document.removeEventListener('touchmove', slide);
    document.removeEventListener('mouseup', stopSliding);
    document.removeEventListener('touchend', stopSliding);
  }
}

// URL input variables
let videoUrlValue = '';
let sourceImageUrlValue = '';
let faceImageUrlValue = '';

// Add event listeners for URL input buttons
document.addEventListener('DOMContentLoaded', () => {
  // URL input handling
  const videoUrlInput = document.getElementById('videoUrlInput');
  const loadVideoUrlBtn = document.getElementById('loadVideoUrlBtn');
  const sourceImageUrlInput = document.getElementById('sourceImageUrlInput');
  const loadSourceImageUrlBtn = document.getElementById('loadSourceImageUrlBtn');
  const faceImageUrlInput = document.getElementById('faceImageUrlInput');
  const loadFaceImageUrlBtn = document.getElementById('loadFaceImageUrlBtn');
  
  if (loadVideoUrlBtn) {
    loadVideoUrlBtn.addEventListener('click', () => {
      loadVideoFromUrl(videoUrlInput.value);
    });
    
    // Also load on Enter key
    videoUrlInput.addEventListener('keypress', (e) => {
      if (e.key === 'Enter') {
        loadVideoFromUrl(videoUrlInput.value);
      }
    });
  }
  
  if (loadSourceImageUrlBtn) {
    loadSourceImageUrlBtn.addEventListener('click', () => {
      loadSourceImageFromUrl(sourceImageUrlInput.value);
    });
    
    // Also load on Enter key
    sourceImageUrlInput.addEventListener('keypress', (e) => {
      if (e.key === 'Enter') {
        loadSourceImageFromUrl(sourceImageUrlInput.value);
      }
    });
  }
  
  if (loadFaceImageUrlBtn) {
    loadFaceImageUrlBtn.addEventListener('click', () => {
      loadFaceImageFromUrl(faceImageUrlInput.value);
    });
    
    // Also load on Enter key
    faceImageUrlInput.addEventListener('keypress', (e) => {
      if (e.key === 'Enter') {
        loadFaceImageFromUrl(faceImageUrlInput.value);
      }
    });
  }
});

// Function to validate a URL
function isValidUrl(url) {
  try {
    new URL(url);
    return true;
  } catch (error) {
    return false;
  }
}

// Function to load video from URL
async function loadVideoFromUrl(url) {
  if (!url) {
    status.textContent = translationsObj.no_url_provided || 'Please enter a URL';
    status.classList.remove('hidden');
    status.className = 'alert alert-danger';
    return;
  }
  
  if (!isValidUrl(url)) {
    status.textContent = translationsObj.invalid_url || 'Please enter a valid URL';
    status.classList.remove('hidden');
    status.className = 'alert alert-danger';
    return;
  }
  
  status.textContent = translationsObj.loading_from_url || 'Loading video from URL...';
  status.classList.remove('hidden');
  status.className = 'alert alert-info';
  
  try {
    // Create a video element to test the URL
    const video = document.createElement('video');
    video.crossOrigin = 'anonymous';
    video.controls = true;
    video.preload = 'metadata';
    video.style.display = 'none';
    document.body.appendChild(video);
    
    // Set up event handlers
    let videoLoaded = false;
    
    video.onloadedmetadata = function() {
      videoLoaded = true;
      document.body.removeChild(video);
      
      // Store the URL value for later use
      videoUrlValue = url;
      
      // Update the UI
      videoPreview.style.display = 'block';
      videoPreview.src = url;
      videoPreview.crossOrigin = 'anonymous'; // Ensure CORS support
      videoDetails.style.display = 'block';
      
      // Get video details once metadata is loaded
      videoPreview.onloadedmetadata = function() {
        getVideoDetailsFromElement(videoPreview, url);
        extractVideoFrames(url);
      };
      
      status.textContent = '';
      status.className = 'hidden';
    };
    
    video.onerror = function() {
      document.body.removeChild(video);
      throw new Error('Failed to load video from URL. The video might be restricted or the format is not supported.');
    };
    
    // Set timeout in case the video doesn't load
    setTimeout(() => {
      if (!videoLoaded) {
        document.body.removeChild(video);
        throw new Error('Timeout while loading video. Please check the URL and try again.');
      }
    }, 15000); // 15 second timeout
    
    video.src = url;
  } catch (error) {
    console.error('Error loading video from URL:', error);
    status.textContent = `${translationsObj.error_loading_url || 'Error loading video from URL'}: ${error.message}`;
    status.classList.remove('hidden');
    status.className = 'alert alert-danger';
  }
}

// Function to load source image from URL
function loadSourceImageFromUrl(url) {
  if (!url) {
    status.textContent = translationsObj.no_url_provided || 'Please enter a URL';
    status.classList.remove('hidden');
    status.className = 'alert alert-danger';
    return;
  }
  
  if (!isValidUrl(url)) {
    status.textContent = translationsObj.invalid_url || 'Please enter a valid URL';
    status.classList.remove('hidden');
    status.className = 'alert alert-danger';
    return;
  }
  
  status.textContent = translationsObj.loading_from_url || 'Loading image from URL...';
  status.classList.remove('hidden');
  status.className = 'alert alert-info';
  
  // Create a new image element
  const img = new Image();
  img.crossOrigin = 'anonymous';
  
  img.onload = function() {
    // Store the URL value for later use
    sourceImageUrlValue = url;
    
    // Update the UI
    sourceImagePreview.style.display = 'block';
    sourceImagePreview.src = url;
    sourceImagePreview.crossOrigin = 'anonymous';
    
    // Store the source image URL to use in the comparison slider
    sourceImagePreview.dataset.originalUrl = url;
    
    // Display image details
    getSourceImageDetailsFromElement(img, url);
    
    status.textContent = '';
    status.className = 'hidden';
  };
  
  img.onerror = function() {
    console.error('Error loading image from URL');
    status.textContent = translationsObj.error_loading_image || 'Error loading image from URL. The image might be restricted or the format is not supported.';
    status.classList.remove('hidden');
    status.className = 'alert alert-danger';
  };
  
  img.src = url;
}

// Function to load face image from URL
function loadFaceImageFromUrl(url) {
  if (!url) {
    status.textContent = translationsObj.no_url_provided || 'Please enter a URL';
    status.classList.remove('hidden');
    status.className = 'alert alert-danger';
    return;
  }
  
  if (!isValidUrl(url)) {
    status.textContent = translationsObj.invalid_url || 'Please enter a valid URL';
    status.classList.remove('hidden');
    status.className = 'alert alert-danger';
    return;
  }
  
  status.textContent = translationsObj.loading_from_url || 'Loading image from URL...';
  status.classList.remove('hidden');
  status.className = 'alert alert-info';
  
  // Create a new image element
  const img = new Image();
  img.crossOrigin = 'anonymous';
  
  img.onload = function() {
    // Store the URL value for later use
    faceImageUrlValue = url;
    
    // Update the UI
    imagePreview.style.display = 'block';
    imagePreview.src = url;
    imagePreview.crossOrigin = 'anonymous';
    
    // Display image details
    getImageDetailsFromElement(img, url);
    
    // Save face image URL to localStorage for future use
    saveFaceImageFromUrl(url, img);
    
    status.textContent = '';
    status.className = 'hidden';
  };
  
  img.onerror = function() {
    console.error('Error loading image from URL');
    status.textContent = translationsObj.error_loading_image || 'Error loading image from URL. The image might be restricted or the format is not supported.';
    status.classList.remove('hidden');
    status.className = 'alert alert-danger';
  };
  
  img.src = url;
}

// Function to get video details from a video element
function getVideoDetailsFromElement(videoElement, url) {
  try {
    const duration = videoElement.duration;
    const width = videoElement.videoWidth;
    const height = videoElement.videoHeight;
    const fileName = url.split('/').pop().split('?')[0] || 'video.mp4';
    
    // Attempt to get frame rate (frames per second)
    let frameRate = videoElement.frameRate || 30; // Default to 30 FPS if not available
    let frameCount = Math.round(duration * frameRate);
    
    // Price estimation logic (identical to original function)
    const pricePerFrame = 0.0005;
    const estimatedPrice = frameCount * pricePerFrame;
    let sellingPrice = Math.max(estimatedPrice * 4, currency === 'jpy' ? 100 : 1);
    
    if (currency === 'jpy') {
      roundedSellingPrice = Math.ceil(sellingPrice / 100) * 150;
      formattedPrice = `¥${roundedSellingPrice.toLocaleString()}`;
    } else {
      roundedSellingPrice = Math.ceil(sellingPrice);
      formattedPrice = `$${roundedSellingPrice.toFixed(2)}`;
    }
    
    videoDetails.innerHTML = `
      <h5>${translationsObj.video_details}</h5>
      <ul style="text-align: left;">
        <li><strong>${translationsObj.name}:</strong> ${fileName}</li>
        <li><strong>${translationsObj.duration}:</strong> ${duration.toFixed(2)} ${translationsObj.seconds}</li>
        <li><strong>${translationsObj.resolution}:</strong> ${width}x${height}</li>
        <li><strong>${translationsObj.estimated_frame_count}:</strong> ${frameCount}</li>
        <li class="d-none"><strong>${translationsObj.processing_fee}:</strong> ${formattedPrice}</li>
      </ul>
    `;
  } catch (error) {
    console.error('Error getting video details:', error);
    videoDetails.innerHTML = `<p>${translationsObj.error_loading_metadata || 'Error loading video metadata'}</p>`;
    videoDetails.style.display = 'block';
  }
}

// Function to get source image details from an image element
function getSourceImageDetailsFromElement(imgElement, url) {
  try {
    const width = imgElement.width || imgElement.naturalWidth;
    const height = imgElement.height || imgElement.naturalHeight;
    const fileName = url.split('/').pop().split('?')[0] || 'image.jpg';
    
    sourceImageDetails.innerHTML = `
      <h5>${translationsObj.image_details || 'Source Image Details'}</h5>
      <ul style="text-align: left;">
        <li><strong>${translationsObj.name}:</strong> ${fileName}</li>
        <li><strong>${translationsObj.resolution}:</strong> ${width}x${height}</li>
      </ul>
    `;
    sourceImageDetails.style.display = 'block';
  } catch (error) {
    console.error('Error getting image details:', error);
    sourceImageDetails.innerHTML = `<p>${translationsObj.error_loading_metadata || 'Error loading image metadata'}</p>`;
    sourceImageDetails.style.display = 'block';
  }
}

// Function to get image details from an image element
function getImageDetailsFromElement(imgElement, url) {
  try {
    const width = imgElement.width || imgElement.naturalWidth;
    const height = imgElement.height || imgElement.naturalHeight;
    const fileName = url.split('/').pop().split('?')[0] || 'image.jpg';
    
    imageDetails.innerHTML = `
      <h5>${translationsObj.image_details}</h5>
      <ul style="text-align: left;">
        <li><strong>${translationsObj.name}:</strong> ${fileName}</li>
        <li><strong>${translationsObj.resolution}:</strong> ${width}x${height}</li>
      </ul>
    `;
    imageDetails.style.display = 'block';
  } catch (error) {
    console.error('Error getting image details:', error);
    imageDetails.innerHTML = `<p>${translationsObj.error_loading_metadata || 'Error loading image metadata'}</p>`;
    imageDetails.style.display = 'block';
  }
}

// Update the payButton event listener to handle URL inputs
payButton.addEventListener('click', async () => {
  // Disable the button and add a spinner with Bootstrap icons
  payButton.disabled = true;
  payButton.innerHTML = `<span class="spinner-border spinner-border-sm" role="status" aria-hidden="true"></span> ${translationsObj.processing || 'Processing...'}`;

  // Check based on current mode
  if (isImageMode) {
    // Image-to-image mode validation
    const hasSourceFile = sourceImageInput.files.length > 0;
    const hasFaceFile = imageInput.files.length > 0;
    const hasSourceUrl = !!sourceImageUrlValue;
    const hasFaceUrl = !!faceImageUrlValue;
    
    // Check if we have both source and face images (either as files or URLs)
    if ((!hasSourceFile && !hasSourceUrl) || (!hasFaceFile && !hasFaceUrl)) {
      status.textContent = translationsObj.please_upload_both_images || 'Please upload both the source image and the face image or provide URLs.';
      status.classList.remove('hidden');
      status.className = 'alert alert-danger';
      resetPayButton();
      return;
    }
    
    try {
      let formData;
      
      // If we have URLs for both, use the dedicated API endpoint
      if (hasSourceUrl && hasFaceUrl) {
        // Use JSON payload with URLs
        const response = await fetch('/api/process-image-swap', {
          method: 'POST',
          headers: {
            'Content-Type': 'application/json',
          },
          body: JSON.stringify({
            source_image_url: sourceImageUrlValue,
            face_image_url: faceImageUrlValue
          })
        });
        
        if (!response.ok) {
          throw new Error('Failed to process image swap from URLs');
        }
        
        const result = await response.json();
        
        if (result.image_url) {
          console.log('Line : 1739')

          // Update modal to show comparison slider
          const originalImageUrl = sourceImagePreview.src;
          setupComparisonSlider(originalImageUrl, result.image_url);
          
          // Set the download link
          document.getElementById('downloadLink').href = result.image_url;
          document.getElementById('downloadLink').download = 'processed_image.jpg';
          
          // Show the modal
          const imageModal = new bootstrap.Modal(document.getElementById('imageModal'));
          imageModal.show();
        } else {
          throw new Error('No image URL in response');
        }
      } 
      // If we have a mix of files and URLs or all files
      else {
        formData = new FormData();
        
        // Add source image (either file or URL)
        if (hasSourceFile) {
          formData.append('image_file', sourceImageInput.files[0]);
        } else {
          formData.append('source_image_url', sourceImageUrlValue);
        }
        
        // Add face image (either file or URL)
        if (hasFaceFile) {
          formData.append('face_image_file', imageInput.files[0]);
        } else {
          formData.append('face_image_url', faceImageUrlValue);
        }
        
        const response = await fetch('/api/process-image-swap', {
          method: 'POST',
          body: formData,
        });
        
        if (!response.ok) {
          throw new Error('Failed to process image swap');
        }
        
        const result = await response.json();
        
        if (result.image_url) {

          // Update modal to show comparison slider
          const originalImageUrl = sourceImagePreview.src;
          setupComparisonSlider(originalImageUrl, result.image_url);
          
          // Set the download link
          document.getElementById('downloadLink').href = result.image_url;
          document.getElementById('downloadLink').download = 'processed_image.jpg';
          
          // Show the modal
          const imageModal = new bootstrap.Modal(document.getElementById('imageModal'));
          imageModal.show();
        } else {
          throw new Error('No image URL in response');
        }
      }
    } catch (error) {
      console.error('Error:', error);
      status.textContent = `${translationsObj.an_error_occurred}: ${error.message}`;
      status.classList.remove('hidden');
      status.className = 'alert alert-danger';
    } finally {
      resetPayButton();
    }
  } else {
    // Video mode validation
    const hasVideoFile = videoInput.files.length > 0;
    const hasFaceFile = imageInput.files.length > 0;
    const hasVideoUrl = !!videoUrlValue;
    const hasFaceUrl = !!faceImageUrlValue;
    
    // Check if we have both video and face image (either as files or URLs)
    if ((!hasVideoFile && !hasVideoUrl) || (!hasFaceFile && !hasFaceUrl)) {
      status.textContent = translationsObj.please_upload_both || 'Please upload both a video and a face image or provide URLs.';
      status.classList.remove('hidden');
      status.className = 'alert alert-danger';
      resetPayButton();
      return;
    }
    
    try {
      let tempId;
      
      status.textContent = translationsObj.uploading_files || 'Uploading files...';
      status.classList.remove('hidden');
      status.className = 'alert alert-info';
      
      // If we have URLs for both, use the dedicated API endpoint
      if (hasVideoUrl && hasFaceUrl) {
        const response = await fetch('/api/temp-upload-from-url', {
          method: 'POST',
          headers: {
            'Content-Type': 'application/json',
          },
          body: JSON.stringify({ 
            video_url: videoUrlValue, 
            face_image_url: faceImageUrlValue 
          })
        });
        
        if (!response.ok) {
          throw new Error('Failed to process files from URLs');
        }
        
        const data = await response.json();
        tempId = data.tempId;
      } 
      // If we have a mix of files and URLs or all files
      else {
        const formData = new FormData();
        
        // Add video (either file or URL)
        if (hasVideoFile) {
          formData.append('video_file', videoInput.files[0]);
        } else {
          // For video URLs, we need to download it on the server side
          formData.append('video_url', videoUrlValue);
        }
        
        // Add face image (either file or URL)
        if (hasFaceFile) {
          formData.append('face_image_file', imageInput.files[0]);
        } else {
          // For image URLs, we need to download it on the server side
          formData.append('face_image_url', faceImageUrlValue);
        }
        
        const response = await fetch('/api/temp-upload', {
          method: 'POST',
          body: formData,
        });
        
        if (!response.ok) {
          throw new Error('Failed to upload files temporarily');
        }
        
        const data = await response.json();
        tempId = data.tempId;
      }
      
      const skipPayment = document.getElementById('skipPayment').checked;
      
      // Get the current language from cookie
      const currentLanguage = document.cookie
        .split('; ')
        .find(row => row.startsWith('preferredLanguage='))
        ?.split('=')[1];
      const baseUrl = currentLanguage === 'en' || !currentLanguage ? '/' : `/${currentLanguage}/`;
      
      if (skipPayment) {
        window.location.href = `${baseUrl}success?tempId=${tempId}`;
      } else {
        // Extract video details for checkout session
        const sessionResponse = await fetch('/api/create-checkout-session', {
          method: 'POST',
          headers: {
            'Content-Type': 'application/json',
          },
          body: JSON.stringify({ 
            tempId: tempId, 
            roundedSellingPrice,
            currency: currency,
            fileName: hasVideoFile ? videoInput.files[0].name : videoUrlValue.split('/').pop().split('?')[0] || 'video.mp4',
            duration: videoPreview.duration,
            resolution: `${videoPreview.videoWidth}x${videoPreview.videoHeight}`,
            fileSize: hasVideoFile ? videoInput.files[0].size : 0, // We don't know the file size for URLs
            frameCount: Math.round(videoPreview.duration * (videoPreview.frameRate || 30))
          }),
        });
        
        if (!sessionResponse.ok) {
          throw new Error('Failed to create checkout session');
        }
        
        const sessionData = await sessionResponse.json();
        const sessionId = sessionData.id;
        
        const result = await stripe.redirectToCheckout({
          sessionId: sessionId,
        });
        
        if (result.error) {
          status.textContent = result.error.message;
          status.classList.remove('hidden');
          status.className = 'alert alert-danger';
        }
      }
    } catch (error) {
      console.error('Error:', error);
      status.textContent = `${translationsObj.an_error_occurred}: ${error.message}`;
      status.classList.remove('hidden');
      status.className = 'alert alert-danger';
    } finally {
      resetPayButton();
      status.textContent = "";
      status.classList.add('hidden');
    }
  }
});

// Improved function to extract a meaningful filename from a URL
function getFilenameFromUrl(url) {
  try {
    // Check if it's a data URL
    if (url.startsWith('data:')) {
      return `face-data-${Date.now()}.jpg`;
    }
    
    // Try to extract the filename from the URL path
    const urlObj = new URL(url);
    let pathname = urlObj.pathname;
    
    // Get the last part of the path which should be the filename
    let filename = pathname.split('/').pop();
    
    // Remove any query parameters and fragments
    filename = filename.split(/[?#]/)[0];
    
    // If no filename was found or it's empty or just a fragment/parameter, use a default name
    if (!filename || filename === '' || filename.length < 3 || filename.includes('=')) {
      return `face-from-url-${Date.now()}.jpg`;
    }
    
    // If filename has no extension, add .jpg
    if (!filename.includes('.')) {
      filename = `${filename}.jpg`;
    }
    
    return filename;
  } catch (error) {
    // If URL parsing fails, use a timestamp-based filename
    return `face-from-url-${Date.now()}.jpg`;
  }
}

// Improved function to save face image from URL with better duplicate detection
function saveFaceImageFromUrl(url, imgElement) {
  // Skip if the URL is from our sample images
  if (url.includes('/face-sample-')) {
    return;
  }
  
  // Get existing saved faces or initialize empty array
  let savedFaces = JSON.parse(localStorage.getItem('savedFaces') || '[]');
  
  // More comprehensive duplicate check
  // Check both originalUrl and dataUrl to catch all duplicates
  const existingFaceIndex = savedFaces.findIndex(face => 
    (face.originalUrl === url) || (face.dataUrl === url)
  );

  if (existingFaceIndex !== -1) {
    // Face already exists, don't save again
    console.log('Face already exists in saved faces, not saving duplicate');
    return;
  }
  
  // Get a meaningful filename from the URL
  const filename = getFilenameFromUrl(url);
  
  // Create face data object with consistent ID
  const faceData = {
    id: Date.now().toString(),
    name: filename,
    dataUrl: url,
    originalUrl: url,
    timestamp: new Date().toISOString(),
    isUrlBased: true
  };
  
  // Add new face to the beginning of the array
  savedFaces.unshift(faceData);
  
  // Limit the number of saved faces
  if (savedFaces.length > MAX_SAVED_FACES) {
    savedFaces = savedFaces.slice(0, MAX_SAVED_FACES);
  }
  
  // Save back to localStorage
  try {
    localStorage.setItem('savedFaces', JSON.stringify(savedFaces));
    
    // Update the saved faces gallery
    displaySavedFaces();
  } catch (e) {
    console.error('localStorage quota exceeded:', e);
    
    if (savedFaces.length > 1) {
      savedFaces.pop();
      localStorage.setItem('savedFaces', JSON.stringify(savedFaces));
      displaySavedFaces();
    }
  }
}

// Function to load face image from URL
function loadFaceImageFromUrl(url) {
  if (!url) {
    status.textContent = translationsObj.no_url_provided || 'Please enter a URL';
    status.classList.remove('hidden');
    status.className = 'alert alert-danger';
    return;
  }
  
  if (!isValidUrl(url)) {
    status.textContent = translationsObj.invalid_url || 'Please enter a valid URL';
    status.classList.remove('hidden');
    status.className = 'alert alert-danger';
    return;
  }
  
  status.textContent = translationsObj.loading_from_url || 'Loading image from URL...';
  status.classList.remove('hidden');
  status.className = 'alert alert-info';
  
  // Create a new image element
  const img = new Image();
  img.crossOrigin = 'anonymous';
  
  img.onload = function() {
    // Store the URL value for later use
    faceImageUrlValue = url;
    
    // Update the UI
    imagePreview.style.display = 'block';
    imagePreview.src = url;
    imagePreview.crossOrigin = 'anonymous';
    
    // Display image details
    getImageDetailsFromElement(img, url);
    
    // Save face image URL to localStorage for future use
    saveFaceImageFromUrl(url, img);
    
    status.textContent = '';
    status.className = 'hidden';
  };
  
  img.onerror = function() {
    console.error('Error loading image from URL');
    status.textContent = translationsObj.error_loading_image || 'Error loading image from URL. The image might be restricted or the format is not supported.';
    status.classList.remove('hidden');
    status.className = 'alert alert-danger';
  };
  
  img.src = url;
}

// Update the displaySavedFaces function to handle URL-based faces
function displaySavedFaces() {
  // Get the saved faces gallery container
  const savedFacesContainer = document.getElementById('savedFacesGallery');
  if (!savedFacesContainer) return;
  
  // Clear current saved faces
  savedFacesContainer.innerHTML = '';
  
  // Get saved faces from localStorage
  const savedFaces = JSON.parse(localStorage.getItem('savedFaces') || '[]');
  
  if (savedFaces.length === 0) {
    // Hide the saved faces section if no faces are saved
    const savedFacesSection = document.querySelector('.saved-faces-section');
    if (savedFacesSection) {
      savedFacesSection.style.display = 'none';
    }
    return;
  }
  
  // Show the saved faces section
  const savedFacesSection = document.querySelector('.saved-faces-section');
  if (savedFacesSection) {
    savedFacesSection.style.display = 'block';
  }
  
  // Add each saved face to the gallery
  savedFaces.forEach(face => {
    const faceElement = document.createElement('div');
    faceElement.classList.add('sample-image');
    faceElement.setAttribute('data-img-src', face.dataUrl);
    faceElement.setAttribute('data-saved', 'true');
    faceElement.setAttribute('data-face-id', face.id);
    
    const faceImage = document.createElement('img');
    faceImage.src = face.dataUrl;
    faceImage.alt = `Saved face ${face.name}`;
    
    // Add delete button with Bootstrap icon
    const deleteButton = document.createElement('button');
    deleteButton.className = 'delete-saved-face';
    deleteButton.classList.add('hidden');
    // We're using the CSS ::after pseudo-element with the Bootstrap icon SVG now
    deleteButton.title = translationsObj.delete_saved_face || 'Remove saved face';
    deleteButton.onclick = function(e) {
      e.stopPropagation(); // Prevent triggering the parent click event
      removeSavedFace(face.id);
    };
    // On hover, show delete button
    faceElement.addEventListener('mouseenter', () => {
        deleteButton.classList.remove('hidden');
    });
    faceElement.addEventListener('mouseleave', () => {
      deleteButton.classList.add('hidden');
    });
    faceElement.appendChild(faceImage);
    faceElement.appendChild(deleteButton);
    savedFacesContainer.appendChild(faceElement);
    
    // Add the same click handler as sample images
    faceElement.addEventListener('click', async () => {
      const sampleImages = document.querySelectorAll('.sample-image');
      sampleImages.forEach(img => img.classList.remove('selected'));
      faceElement.classList.add('selected');
      
      try {
        if (face.isUrlBased) {
          // For URL-based faces, directly set the URL
          faceImageUrlValue = face.originalUrl || face.dataUrl;
          
          // Update the UI
          imagePreview.style.display = 'block';
          imagePreview.src = face.dataUrl;
          imagePreview.crossOrigin = 'anonymous';
          
          // Create a dummy image element to get dimensions for the details display
          const img = new Image();
          img.onload = function() {
            getImageDetailsFromElement(img, face.dataUrl);
          };
          img.src = face.dataUrl;
          
          // Set the input field value if it exists
          const faceImageUrlInput = document.getElementById('faceImageUrlInput');
          if (faceImageUrlInput) {
            faceImageUrlInput.value = face.originalUrl || face.dataUrl;
          }
        } else {
          // For file-based faces, convert data URL back to a File object (existing logic)
          const response = await fetch(face.dataUrl);
          const blob = await response.blob();
          const imageFile = new File([blob], face.name || 'saved-face.jpg', { type: blob.type });
          
          // Create a DataTransfer to set the files property
          const dataTransfer = new DataTransfer();
          dataTransfer.items.add(imageFile);
          
          // Set the files property of the imageInput
          const imageInput = document.getElementById('imageInput');
          imageInput.files = dataTransfer.files;
          
          // Trigger the change event to update image preview and details
          const event = new Event('change', { bubbles: true });
          imageInput.dispatchEvent(event);
        }
      } catch (error) {
        console.error('Error selecting saved face:', error);
      }
    });
  });
}

// Ensure the mode toggle works correctly and consistently
function setVideoMode() {
  isImageMode = false;
  videoModeBtn.classList.add('active');
  videoModeBtn.classList.remove('btn-outline-primary');
  videoModeBtn.classList.add('btn-primary');
  imageModeBtn.classList.remove('active');
  imageModeBtn.classList.add('btn-outline-primary');
  imageModeBtn.classList.remove('btn-primary');

  imageFreeBadge.style.display = 'none';
  videoSourceSection.style.display = 'block';
  imageSourceSection.style.display = 'none';
  
  // Move video frames section back to the video source section if it exists
  const framesSection = document.querySelector('.video-frames-section');
  if (framesSection && framesSection.parentNode !== videoSourceSection) {
    videoSourceSection.appendChild(framesSection);
  }
  
  // Recalculate pricing if we have a video uploaded
  if (videoInput.files.length > 0) {
    getVideoDetails(videoInput.files[0]);
  }
}

function setImageMode() {
  isImageMode = true;
  imageModeBtn.classList.add('active');
  imageModeBtn.classList.remove('btn-outline-primary');
  imageModeBtn.classList.add('btn-primary');
  videoModeBtn.classList.remove('active');
  videoModeBtn.classList.add('btn-outline-primary');
  videoModeBtn.classList.remove('btn-primary');

  imageFreeBadge.style.display = 'block';
  videoSourceSection.style.display = 'none';
  imageSourceSection.style.display = 'block';
  
  // Move video frames section to image source section if it exists and has frames
  const framesSection = document.querySelector('.video-frames-section');
  const framesGallery = document.getElementById('videoFramesGallery');
  if (framesSection && framesGallery && framesGallery.children.length > 0) {
    if (framesSection.parentNode !== imageSourceSection) {
      imageSourceSection.appendChild(framesSection);
    }
    framesSection.style.display = 'block';
  }
  
  // Clear video pricing since image mode is free
  roundedSellingPrice = 0;
  formattedPrice = 'Free';
}
// Initialize with video mode active on page load
document.addEventListener('DOMContentLoaded', () => {
  checkAndHideSkipPayment();
  displaySavedFaces(); // Display saved faces on page load
  setupSampleImageSelection();
  
  // Ensure we start in video mode
  setVideoMode();
  
  const urlParams = new URLSearchParams(window.location.search);
  const videoUrl = urlParams.get('videoUrl');

  if (videoUrl) {
    loadVideoFromUrl(videoUrl);
  }
});

// Update video upload button with proper Bootstrap icon
if (videoUploadBtn) {
  videoUploadBtn.innerHTML = `<i class="bi bi-cloud-arrow-up me-2"></i><span>${translationsObj.upload_video || 'Upload Video'}</span>`;
}

// Update image upload button with proper Bootstrap icon
if (imageUploadBtn) {
  imageUploadBtn.innerHTML = `<i class="bi bi-person-square me-2"></i><span>${translationsObj.upload_photo || 'Upload Photo'}</span>`;
}

// Update source image upload button with proper Bootstrap icon
if (sourceImageUploadBtn) {
  sourceImageUploadBtn.innerHTML = `<i class="bi bi-image me-2"></i><span>${translationsObj.upload_source_image || 'Upload Source Image'}</span>`;
}