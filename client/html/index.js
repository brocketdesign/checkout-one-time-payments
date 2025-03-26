const stripe = Stripe(
  window.location.hostname !== 'localhost' ? 'pk_live_51PjtRbE5sP7DA1XvCkdmezori9qPGoO21y7yKSVvgkQVyrhWZfHAUkNsjPMnbwpPlp4zzoYsRjn79Ad7XN7HTHcc00UjBA9adF' : 'pk_test_51PjtRbE5sP7DA1XvD68v7X7Qj7pG6ZJpQmvuNodJjxc7MbH1ss2Te2gahFAS9nms4pbmEdMYdfCPxFDWHBbu9CxR003ikTnRES'
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
const NUM_FRAMES_TO_EXTRACT = 10;

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
});

imageModeBtn.addEventListener('click', () => {
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
});

// Source Image Drag and Drop
sourceImageDropZone.addEventListener('dragover', (event) => {
  event.preventDefault();
  sourceImageDropZone.classList.add('hover');
});

sourceImageDropZone.addEventListener('dragleave', () => {
  sourceImageDropZone.classList.remove('hover');
});

sourceImageDropZone.addEventListener('drop', (event) => {
  event.preventDefault();
  sourceImageDropZone.classList.remove('hover');
  const files = event.dataTransfer.files;
  sourceImageInput.files = files;
  handleSourceImageSelection(files[0]);
  getSourceImageDetails(files[0]);
});

sourceImageUploadBtn.addEventListener('click', () => {
  sourceImageInput.click();
});

sourceImageInput.addEventListener('change', (event) => {
  handleSourceImageSelection(sourceImageInput.files[0]);
  getSourceImageDetails(sourceImageInput.files[0]);
});

// Function to handle source image selection and display preview
function handleSourceImageSelection(imageFile) {
  if (imageFile) {
    // Check if file size exceeds the maximum allowed
    if (imageFile.size > MAX_IMAGE_SIZE) {
      sourceImagePreview.style.display = 'none';
      sourceImageDetails.style.display = 'none';
      
      // Disable pay button when file is too large
      payButton.disabled = true;
      return;
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

// Function to get source image details
async function getSourceImageDetails(imageFile) {
  // Check file size first
  if (imageFile.size > MAX_IMAGE_SIZE) {
    sourceImageDetails.innerHTML = `
      <h5>${translationsObj.image_details || 'Image Details'}</h5>
      <div class="alert alert-danger">
        ${translationsObj.image_too_large || 'Image file is too large (Maximum: 1MB). Please compress your image or select a smaller file.'}
        <p><strong>${translationsObj.current_size || 'Current size'}:</strong> ${(imageFile.size / (1024 * 1024)).toFixed(2)} MB</p>
      </div>
    `;
    sourceImageDetails.style.display = 'block';
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

imageDropZone.addEventListener('drop', (event) => {
  event.preventDefault();
  imageDropZone.classList.remove('hover');
  const files = event.dataTransfer.files;
  imageInput.files = files;
  handleImageSelection(files[0]);
  getImageDetails(files[0]);
});

imageUploadBtn.addEventListener('click', () => {
  imageInput.click();
});

imageInput.addEventListener('change', (event) => {
  handleImageSelection(imageInput.files[0]);
  getImageDetails(imageInput.files[0]);
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

// Function to handle image selection and display preview
function handleImageSelection(imageFile) {
  if (imageFile) {
    // Check if file size exceeds the maximum allowed
    if (imageFile.size > MAX_IMAGE_SIZE) {
      imagePreview.style.display = 'none';
      imageDetails.style.display = 'none';
      
      // Disable pay button when file is too large
      payButton.disabled = true;
      return;
    }else{
      payButton.disabled = false;
    }
    
    // Reset status if previously showed an error
    if (status.className.includes('alert-danger')) {
      status.textContent = '';
      status.className = '';
      payButton.disabled = false;
    }
    
    imagePreview.style.display = 'block';
    imagePreview.src = URL.createObjectURL(imageFile);
    imageDetails.style.display = 'block'; // Show image details
  } else {
    imageDetails.style.display = 'none'; // Hide image details if no image
  }
}

// Proceed Button Logic
payButton.addEventListener('click', async () => {
  // Check based on current mode
  if (isImageMode) {
    // Image-to-image mode validation
    if (!sourceImageInput.files.length || !imageInput.files.length) {
      status.textContent = translationsObj.please_upload_both_images || 'Please upload both the source image and the face image.';
      status.classList.remove('hidden');
      status.className = 'alert alert-danger';
      return;
    }
    
    // Double-check source image file size
    if (sourceImageInput.files[0].size > MAX_IMAGE_SIZE) {
      status.textContent = translationsObj.image_too_large || `Source image file is too large. Maximum size is 1MB. Please compress your image or select a smaller file.`;
      status.classList.remove('hidden');
      status.className = 'alert alert-danger';
      return;
    }
    
    // Double-check face image file size
    if (imageInput.files[0].size > MAX_IMAGE_SIZE) {
      status.textContent = translationsObj.image_too_large || `Face image file is too large. Maximum size is 1MB. Please compress your image or select a smaller file.`;
      status.classList.remove('hidden');
      status.className = 'alert alert-danger';
      return;
    }
    
    // Process image-to-image swap
    const formData = new FormData();
    formData.append('image_file', sourceImageInput.files[0]);
    formData.append('face_image_file', imageInput.files[0]);

    try {
      status.textContent = translationsObj.processing_image || 'Processing image...';
      status.classList.remove('hidden');
      status.className = 'alert alert-info';
      
      const response = await fetch('/api/process-image-swap', {
        method: 'POST',
        body: formData,
      });

      if (!response.ok) {
        throw new Error('Failed to process image swap');
      }

      const result = await response.json();
      
      if (result.image_url) {
        // Set the image source in the modal
        document.getElementById('processedImage').src = result.image_url;
        
        // Set the download link
        document.getElementById('downloadLink').href = result.image_url;
        document.getElementById('downloadLink').download = 'processed_image.jpg'; // You can set a default filename
        
        // Show the modal
        const imageModal = new bootstrap.Modal(document.getElementById('imageModal'));
        imageModal.show();
      } else {
        throw new Error('No image URL in response');
      }
    } catch (error) {
      console.error('Error:', error);
      status.textContent = `${translationsObj.an_error_occurred}: ${error.message}`;
      status.classList.remove('hidden');
      status.className = 'alert alert-danger';
    }
  } else {
    // Original video mode validation and processing
    if (!videoInput.files.length || !imageInput.files.length) {
      status.textContent = translationsObj.please_upload_both;
      status.classList.remove('hidden');
      status.className = 'alert alert-danger';
      console.log('Missing files');
      return;
    }
    
    // Dounble-check video file size
    if (videoInput.files[0].size > MAX_VIDEO_SIZE) {
      status.textContent = translationsObj.video_too_large || 'Video file is too large (Maximum: 10MB). Please compress your video or select a smaller file.';
      status.classList.remove('hidden');
      status.className = 'alert alert-danger';
      return;
    }
    // Original video mode processing logic
    // ...existing code for video mode...
    const formData = new FormData();
    formData.append('video_file', videoInput.files[0]);
    formData.append('face_image_file', imageInput.files[0]);

    try {
      status.textContent = translationsObj.uploading_files;
      status.classList.remove('hidden');
      status.className = 'alert alert-info';
      const response = await fetch('/api/temp-upload', {
        method: 'POST',
        body: formData,
      });
      console.log('Temp upload response:', response);

      if (!response.ok) {
        throw new Error('Failed to upload files temporarily');
      }

      const data = await response.json();
      const tempId = data.tempId;

      const skipPayment = document.getElementById('skipPayment').checked;
      
      // Get the current language from cookie preferredLanguage
      const currentLanguage = document.cookie
        .split('; ')
        .find(row => row.startsWith('preferredLanguage='))
        ?.split('=')[1];
      const baseUrl = currentLanguage === 'en' || !currentLanguage ? '/' : `/${currentLanguage}/`;
      const redirectionUrl = `${baseUrl}success?tempId=${tempId}`;
      if (skipPayment) {
        window.location.href = `${baseUrl}success?tempId=${tempId}`;
        console.log('Skipping payment, redirecting with tempId:', tempId);
      } else {
        status.textContent = translationsObj.creating_checkout;
        status.classList.remove('hidden');
        status.className = 'alert alert-info';

        // Extract video details and include currency
        const sessionResponse = await fetch('/api/create-checkout-session', {
          method: 'POST',
          headers: {
            'Content-Type': 'application/json',
          },
          body: JSON.stringify({ 
            tempId: tempId, 
            roundedSellingPrice,
            currency: currency,
            fileName: videoInput.files[0].name,
            duration: videoPreview.duration,
            resolution: `${videoPreview.videoWidth}x${videoPreview.videoHeight}`,
            fileSize: videoInput.files[0].size,
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
    }
  }
});

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
      <div class="alert alert-danger">
        ${translationsObj.image_too_large || 'Image file is too large (Maximum: 1MB). Please compress your image or select a smaller file.'}
        <p><strong>${translationsObj.current_size || 'Current size'}:</strong> ${(imageFile.size / (1024 * 1024)).toFixed(2)} MB</p>
      </div>
    `;
    imageDetails.style.display = 'block';
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
        
        // Trigger the change event to update image preview and details
        const event = new Event('change', { bubbles: true });
        imageInput.dispatchEvent(event);
      } catch (error) {
        console.error('Error selecting sample image:', error);
        status.textContent = translationsObj.error_loading_sample_image || 'Error loading sample image';
        status.classList.remove('hidden');
        status.className = 'alert alert-danger';
      }
    });
  });
}

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
  if (window.location.hostname !== 'localhost') {
    const skipPaymentCheckbox = document.getElementById('skipPayment');
    if (skipPaymentCheckbox) {
      skipPaymentCheckbox.checked = false; // Uncheck the checkbox
    }
  }
}

// Initialize on document load
document.addEventListener('DOMContentLoaded', () => {
  checkAndHideSkipPayment();
  setupSampleImageSelection();
  
  // Initialize with video mode active
  isImageMode = false;
  
  const urlParams = new URLSearchParams(window.location.search);
  const videoUrl = urlParams.get('videoUrl');

  if (videoUrl) {
    loadVideoFromUrl(videoUrl);
  }
});
