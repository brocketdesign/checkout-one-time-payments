const stripe = Stripe(
  window.location.hostname !== 'localhost' ? 'pk_live_51PjtRbE5sP7DA1XvCkdmezori9qPGoO21y7yKSVvgkQVyrhWZfHAUkNsjPMnbwpPlp4zzoYsRjn79Ad7XN7HTHcc00UjBA9adF' : 'pk_test_51PjtRbE5sP7DA1XvD68v7X7Qj7pG6ZJpQmvuNodJjxc7MbH1ss2Te2gahFAS9nms4pbmEdMYdfCPxFDWHBbu9CxR003ikTnRES'
); // Replace with your actual publishable key

// Parse the translations JSON string into an object
const translationsObj = JSON.parse(translations);

// Add a variable to store the rounded selling price
let roundedSellingPrice = 0;

// Define max video size (10MB)
const MAX_VIDEO_SIZE = 10 * 1024 * 1024; // 10MB in bytes
// Define max image size (1MB)
const MAX_IMAGE_SIZE = 1 * 1024 * 1024; // 1MB in bytes

// Drag and Drop Functionality
const videoDropZone = document.getElementById('videoDropZone');
const videoInput = document.getElementById('videoInput');
const videoUploadBtn = document.getElementById('videoUploadBtn');
const imageDropZone = document.getElementById('imageDropZone');
const imageInput = document.getElementById('imageInput');
const imageUploadBtn = document.getElementById('imageUploadBtn');
const payButton = document.getElementById('payButton');
const status = document.getElementById('status');

// Get the video and image preview elements
const videoPreview = document.getElementById('videoPreview');
const imagePreview = document.getElementById('imagePreview');
const videoDetails = document.getElementById('videoDetails');

// Hide videoDetails by default
videoDetails.style.display = 'none';

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
    
    videoPreview.style.display = 'block';
    videoPreview.src = URL.createObjectURL(videoFile);
    videoDetails.style.display = 'block'; // Show video details
  } else {
    videoDetails.style.display = 'none'; // Hide video details if no video
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
  if (!videoInput.files.length || !imageInput.files.length) {
    status.textContent = translationsObj.please_upload_both;
    status.classList.remove('hidden');
    status.className = 'alert alert-danger'; // Use Bootstrap alert-danger class
    console.log('Missing files');
    return;
  }
  
  // Double-check file size before proceeding
  if (videoInput.files[0].size > MAX_VIDEO_SIZE) {
    status.textContent = translationsObj.video_too_large || `Video file is too large. Maximum size is 10MB. Please compress your video or select a smaller file.`;
    status.classList.remove('hidden');
    status.className = 'alert alert-danger';
    return;
  }
  
  // Double-check image file size before proceeding
  if (imageInput.files[0].size > MAX_IMAGE_SIZE) {
    status.textContent = translationsObj.image_too_large || `Image file is too large. Maximum size is 1MB. Please compress your image or select a smaller file.`;
    status.classList.remove('hidden');
    status.className = 'alert alert-danger';
    return;
  }

  const formData = new FormData();
  formData.append('video_file', videoInput.files[0]);
  formData.append('face_image_file', imageInput.files[0]);

  try {
    status.textContent = translationsObj.uploading_files;
    status.classList.remove('hidden');
    status.className = 'alert alert-info'; // Use Bootstrap alert-info class
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
      status.className = 'alert alert-info'; // Use Bootstrap alert-info class

      // Extract video details
      const sessionResponse = await fetch('/api/create-checkout-session', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({ 
          tempId: tempId, 
          roundedSellingPrice,
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
        status.className = 'alert alert-danger'; // Use Bootstrap alert-danger class
      }
    }
  } catch (error) {
    console.error('Error:', error);
    status.textContent = `${translationsObj.an_error_occurred}: ${error.message}`;
    status.classList.remove('hidden');
    status.className = 'alert alert-danger'; // Use Bootstrap alert-danger class
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
    // Selling price is 4x the estimated price with a minimum of $1
    const sellingPrice = Math.max(estimatedPrice * 4, 1);
    // Round to whole number and store in the global variable
    roundedSellingPrice = Math.ceil(sellingPrice);

    videoDetails.innerHTML = `
      <h5>${translationsObj.video_details}</h5>
      <ul style="text-align: left;">
      <li><strong>${translationsObj.name}:</strong> ${fileName}</li>
      <li><strong>${translationsObj.duration}:</strong> ${duration.toFixed(2)} ${translationsObj.seconds}</li>
      <li><strong>${translationsObj.resolution}:</strong> ${width}x${height}</li>
      <li><strong>${translationsObj.size}:</strong> ${(fileSize / (1024 * 1024)).toFixed(2)} MB</li>
      <li><strong>${translationsObj.estimated_frame_count}:</strong> ${frameCount}</li>
      <li><strong>${translationsObj.processing_fee}:</strong> $${roundedSellingPrice.toFixed(2)}</li>
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

// Function to reset the form
function resetForm() {
  document.getElementById('videoInput').value = '';
  document.getElementById('imageInput').value = '';
  document.getElementById('skipPayment').checked = false;
  document.getElementById('status').textContent = '';
  document.getElementById('status').className = '';
  roundedSellingPrice = 0;
  payButton.disabled = false; // Re-enable the pay button when form is reset
}

// Check for videoUrl in query parameters on page load
document.addEventListener('DOMContentLoaded', () => {
  checkAndHideSkipPayment();
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
