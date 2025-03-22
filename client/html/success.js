document.addEventListener('DOMContentLoaded', async () => {
  // Get elements
  const statusMessage = document.getElementById('status-message');
  const videoResult = document.getElementById('video-result');
  const videoSource = document.getElementById('video-source');
  const downloadLink = document.getElementById('download-link');
  const errorMessage = document.getElementById('error-message');
  const debugLog = document.getElementById('debug-log');
  const debugOutput = document.getElementById('debug-output');
  const progressContainer = document.getElementById('progress-container');
  const progressFill = document.getElementById('progress-fill');
  const progressText = document.getElementById('progress-text');
  const progressStatus = document.getElementById('progress-status');
  const completionSection = document.getElementById('completion-section');

  // Enable debug mode in development (on localhost)
  let DEBUG = false;
  if (window.location.hostname === 'localhost') {
    DEBUG = true;
  }
  
  // Utility functions
  function log(message, data) {
    if (DEBUG) {
      console.log(message, data);
      debugLog.classList.remove('hidden');
      const timestamp = new Date().toISOString().substr(11, 8);
      const logMessage = data ? `[${timestamp}] ${message}: ${JSON.stringify(data)}` : `[${timestamp}] ${message}`;
      debugOutput.textContent += logMessage + '\n';
    }
  }

  // Get parameters from URL
  const urlParams = new URLSearchParams(window.location.search);
  const tempId = urlParams.get('tempId');
  const sessionId = urlParams.get('session_id');
  
  log('URL parameters', { tempId, sessionId });

  // Process video function
  async function processVideo() {
    try {
      // If we have a session ID from Stripe, log it
      if (sessionId) {
        log('Retrieving Stripe session', { sessionId });
        try {
          const sessionResponse = await fetch(`/api/checkout-session?sessionId=${sessionId}`);
          const sessionData = await sessionResponse.json();
          log('Stripe session data', sessionData);
        } catch (e) {
          log('Error fetching session data', e.message);
        }
      }

      if (!tempId) {
        throw new Error('No tempId found. Cannot retrieve your files.');
      }

      // Ensure progress bar is visible
      progressContainer.classList.remove('hidden');
      progressContainer.style.display = 'block';
      updateProgress(0, 'Initializing video processing...');

      // Submit for processing
      log('Submitting for processing', { tempId });
      statusMessage.textContent = 'Submitting files for processing...';
      
      const response = await fetch('/api/process-video', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json'
        },
        body: JSON.stringify({ tempId })
      });

      if (!response.ok) {
        throw new Error(`Server responded with ${response.status}: ${await response.text()}`);
      }

      const data = await response.json();
      const taskId = data.task_id;
      log('Process initiated', { taskId });
      
      updateProgress(0, 'Process started. Connecting to status updates...');

      // Set up WebSocket connection with reconnection logic
      function setupWebSocket(taskId) {
        const protocol = window.location.protocol === 'https:' ? 'wss:' : 'ws:';
        const wsPort = (window.location.port ? parseInt(window.location.port) : 80) + 1;
        const wsUrl = `${protocol}//${window.location.hostname}:${wsPort}`;
        log('Connecting to WebSocket', { url: wsUrl });
        
        let reconnectAttempts = 0;
        const maxReconnectAttempts = 5;
        let reconnectTimeout;
        let isProcessingComplete = false;

        const ws = new WebSocket(wsUrl);

        ws.onopen = () => {
          log('WebSocket connected');
          reconnectAttempts = 0; // Reset reconnect attempts on successful connection
          
          // Send task ID to server to subscribe to updates
          ws.send(JSON.stringify({ 
            task_id: taskId,
            tempId: tempId  // Also send the tempId to help the server identify the original filename
          }));
          log('Sent task_id to WebSocket', { taskId, tempId });
        };

        ws.onmessage = (event) => {
          try {
            const message = JSON.parse(event.data);
            log('WebSocket message received', message);

            if (message.progress && !isProcessingComplete) {
              // Use the exact progress value from the server, don't modify it
              updateProgress(message.progress, message.status || 'Processing...');
            }

            if (message.status === 'success') {
              isProcessingComplete = true;
              // Hide progress bar when complete
              progressContainer.classList.add('hidden');
              // Update status messages
              document.querySelector('h1').textContent = 'Success!';
              statusMessage.textContent = 'Your video is ready! Download it below.';
              
              // Show completion section with video and buttons
              completionSection.classList.remove('hidden');
                            
              videoSource.src = message.video_url;
              // mute and autoplay the video
              videoSource.muted = true;
              videoSource.autoplay = true;
              downloadLink.href = message.video_url;
              
              // Save video URL to local storage
              saveVideoUrl(message.video_url);
              
              // Make sure to close the WebSocket connection
              ws.close();
            } else if (message.status === 'failed') {
              isProcessingComplete = true;
              // Hide progress bar on failure too
              progressContainer.classList.add('hidden');
              showError(`Video processing failed: ${message.error}`);
              ws.close();
            } else if (message.status === 'timeout') {
              isProcessingComplete = true;
              // Hide progress bar on timeout
              progressContainer.classList.add('hidden');
              showError(`Video processing timed out: ${message.error}`);
              ws.close();
            }
          } catch (error) {
            log('Error parsing WebSocket message', { error: error.message, data: event.data });
          }
        };

        ws.onerror = (error) => {
          log('WebSocket error', error);
        };

        ws.onclose = (event) => {
          log('WebSocket connection closed', { code: event.code, reason: event.reason });
          
          // Attempt to reconnect unless this was a normal closure
          if (event.code !== 1000 && reconnectAttempts < maxReconnectAttempts) {
            if(isProcessingComplete){
              log('Processing complete, not attempting to reconnect');
              return;
            }
            reconnectAttempts++;
            const delay = Math.min(1000 * Math.pow(2, reconnectAttempts), 10000);
            log(`Attempting to reconnect in ${delay}ms (attempt ${reconnectAttempts}/${maxReconnectAttempts})...`);
            updateProgress(0, `Connection lost. Reconnecting (${reconnectAttempts}/${maxReconnectAttempts})...`);
            
            reconnectTimeout = setTimeout(() => {
              setupWebSocket(taskId);
            }, delay);
          } else if (event.code !== 1000) {
            showError('Connection closed unexpectedly. Please refresh to try again.');
          }
        };

        return {
          close: () => {
            clearTimeout(reconnectTimeout);
            ws.close();
          }
        };
      }

      const wsConnection = setupWebSocket(taskId);

      // Clean up the connection when the page is closed
      window.addEventListener('beforeunload', () => {
        if (wsConnection) {
          wsConnection.close();
        }
      });

    } catch (error) {
      log('Error in processVideo', { error: error.message });
      showError(`Error: ${error.message}`);
    }
  }

  function updateProgress(percent, message) {
    // Ensure progress container is visible
    progressContainer.classList.remove('hidden');
    progressContainer.style.display = 'block';
    
    progressFill.style.width = `${percent}%`;
    progressText.textContent = `${Math.round(percent)}%`;
    progressStatus.textContent = message;
  }

  function showError(message) {
    statusMessage.classList.add('hidden');
    errorMessage.textContent = message;
    errorMessage.classList.remove('hidden');
    updateProgress(100, 'Error');
    progressFill.style.backgroundColor = '#e74c3c';
  }

  // Start processing
  processVideo();

  // Add event listeners for the buttons
  const anotherVideoButton = document.getElementById('another-video-button');
  const changeFaceButton = document.getElementById('change-face-button');

  anotherVideoButton.addEventListener('click', () => {
    window.location.href = '/';
  });

  changeFaceButton.addEventListener('click', () => {
    // Get the video URL from the video source
    const videoUrl = videoSource.src;
    // Redirect to the index page with the video URL as a query parameter
    window.location.href = `/?videoUrl=${encodeURIComponent(videoUrl)}`;
  });
});

// Original Stripe session handler (preserved for compatibility)
var urlParams = new URLSearchParams(window.location.search);
var sessionId = urlParams.get('session_id');

if (sessionId) {
  fetch('/api/checkout-session?sessionId=' + sessionId)
    .then(function (result) {
      return result.json();
    })
    .then(function (session) {
      var sessionJSON = JSON.stringify(session, null, 2);
      if (document.querySelector('pre')) {
        document.querySelector('pre').textContent = sessionJSON;
      }
    })
    .catch(function (err) {
      console.log('Error when fetching Checkout session', err);
    });
}

function saveVideoUrl(videoUrl) {
  let videoUrls = JSON.parse(localStorage.getItem('videoUrls') || '[]');
  const now = new Date();
  const videoData = {
    url: videoUrl,
    date: now.toISOString()
  };
  videoUrls.push(videoData);
  localStorage.setItem('videoUrls', JSON.stringify(videoUrls));
  console.log('Video URL saved to local storage', videoData);
}
