const stripe = Stripe(
  'pk_test_51PjtRbE5sP7DA1XvD68v7X7Qj7pG6ZJpQmvuNodJjxc7MbH1ss2Te2gahFAS9nms4pbmEdMYdfCPxFDWHBbu9CxR003ikTnRES'
); // Replace with your actual publishable key

// Parse the translations JSON string into an object
const translationsObj = JSON.parse(translations);

// Add a variable to store the rounded selling price
let roundedSellingPrice = 0;

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
  console.log('Video dropped:', files);
  handleVideoSelection(files[0]);
  getVideoDetails(files[0]);
});

videoUploadBtn.addEventListener('click', () => {
  videoInput.click();
});

videoInput.addEventListener('change', (event) => {
  console.log('Video selected:', videoInput.files);
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
  console.log('Image dropped:', files);
  handleImageSelection(files[0]);
});

imageUploadBtn.addEventListener('click', () => {
  imageInput.click();
});

imageInput.addEventListener('change', (event) => {
  console.log('Image selected:', imageInput.files);
  handleImageSelection(imageInput.files[0]);
});

// Function to handle video selection and display preview
function handleVideoSelection(videoFile) {
  if (videoFile) {
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
    imagePreview.style.display = 'block';
    imagePreview.src = URL.createObjectURL(imageFile);
  }
}

// Proceed Button Logic
payButton.addEventListener('click', async () => {
  if (!videoInput.files.length || !imageInput.files.length) {
    status.textContent = translationsObj.please_upload_both;
    console.log('Missing files');
    return;
  }

  const formData = new FormData();
  formData.append('video_file', videoInput.files[0]);
  formData.append('face_image_file', imageInput.files[0]);

  try {
    status.textContent = translationsObj.uploading_files;
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
    console.log('Current language:', currentLanguage);
    const baseUrl = currentLanguage === 'en' || !currentLanguage ? '/' : `/${currentLanguage}/`;
    const redirectionUrl = `${baseUrl}success?tempId=${tempId}`;
    console.log('Redirection URL:', redirectionUrl);
    if (skipPayment) {
      window.location.href = `${baseUrl}success?tempId=${tempId}`;
      console.log('Skipping payment, redirecting with tempId:', tempId);
    } else {
      status.textContent = translationsObj.creating_checkout;

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
      console.log('Stripe session created:', sessionId);

      const result = await stripe.redirectToCheckout({
        sessionId: sessionId,
      });

      if (result.error) {
        status.textContent = result.error.message;
      }
    }
  } catch (error) {
    console.error('Error:', error);
    status.textContent = `${translationsObj.an_error_occurred}: ${error.message}`;
  }
});

// Function to get video details
async function getVideoDetails(videoFile) {
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
      <h3>${translationsObj.video_details}</h3>
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
  }

  video.src = URL.createObjectURL(videoFile);
}

// Function to reset the form
function resetForm() {
  document.getElementById('videoInput').value = '';
  document.getElementById('imageInput').value = '';
  document.getElementById('skipPayment').checked = false;
  document.getElementById('status').textContent = '';
  roundedSellingPrice = 0;
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
