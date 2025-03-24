document.addEventListener('DOMContentLoaded', async () => {
  // Parse the translations JSON string into an object
  const translationsObj = JSON.parse(translations);
  
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
      // First, check if this tempId is already being processed or completed
      const processingState = checkProcessingState(tempId, sessionId);
      if (processingState) {
        log('Found existing processing data', processingState);
        
        // If already completed successfully, show the result directly
        if (processingState.status === 'success' && processingState.videoUrl) {
          log('Video already processed successfully, showing result', { videoUrl: processingState.videoUrl });
          
          // Update UI to show completed state
          progressContainer.classList.add('hidden');
          document.querySelector('h1').textContent = translationsObj.success;
          statusMessage.textContent = translationsObj.video_ready;
          
          // Show completion section with video
          completionSection.classList.remove('hidden');
          videoSource.src = processingState.videoUrl;
          videoSource.muted = true;
          videoSource.autoplay = true;
          downloadLink.href = processingState.videoUrl;
          
          return; // Exit function since video is already processed
        }
        
        // If currently being processed, show status message
        if (processingState.status === 'processing') {
          log('Video is currently being processed', { tempId });
          statusMessage.textContent = translationsObj.already_processing;
          // We'll continue to start monitoring via WebSocket, but won't restart the processing
        }
      }

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
        throw new Error(translationsObj.no_temp_id_error);
      }

      // Ensure progress bar is visible
      progressContainer.classList.remove('hidden');
      progressContainer.style.display = 'block';
      updateProgress(0, translationsObj.initializing_processing);

      // Submit for processing
      log('Submitting for processing', { tempId });
      statusMessage.textContent = translationsObj.submitting_files;
      
      const response = await fetch('/api/process-video', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json'
        },
        body: JSON.stringify({ tempId })
      });

      if (!response.ok) {
        throw new Error(`${translationsObj.server_error} ${response.status}: ${await response.text()}`);
      }

      const data = await response.json();
      const taskId = data.task_id;
      log('Process initiated', { taskId });
      
      updateProgress(0, translationsObj.process_started);

      // Set up WebSocket connection with reconnection logic
      function setupWebSocket(taskId) {
        const protocol = window.location.protocol === 'https:' ? 'wss:' : 'ws:';
        // For Heroku and other platforms, use the same host (hostname:port)
        const wsUrl = `${protocol}//${window.location.host}`;
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
              updateProgress(message.progress, message.status || translationsObj.processing);
            }

            if (message.status === 'success') {
              isProcessingComplete = true;
              // Hide progress bar when complete
              progressContainer.classList.add('hidden');
              // Update status messages
              document.querySelector('h1').textContent = translationsObj.success;
              statusMessage.textContent = translationsObj.video_ready;
              
              // Show completion section with video and buttons
              completionSection.classList.remove('hidden');
                            
              videoSource.src = message.video_url;
              // mute and autoplay the video
              videoSource.muted = true;
              videoSource.autoplay = true;
              downloadLink.href = message.video_url;
              
              // Save video URL to local storage
              saveProcessingData(message.video_url, 'success');
              
              ws.close();
            } else if (message.status === 'failed') {
              isProcessingComplete = true;
              // Hide progress bar on failure too
              progressContainer.classList.add('hidden');
              showError(translationsObj.processing_failed.replace('{error}', message.error));
              // Mark as failed in local storage
              saveProcessingData(null, 'failed');
              ws.close();
            } else if (message.status === 'timeout') {
              isProcessingComplete = true;
              // Hide progress bar on timeout
              progressContainer.classList.add('hidden');
              showError(translationsObj.processing_timeout.replace('{error}', message.error));
              // Mark as timeout in local storage
              saveProcessingData(null, 'timeout');
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
            updateProgress(0, translationsObj.connection_lost.replace('{attempts}', reconnectAttempts).replace('{maxAttempts}', maxReconnectAttempts));
            
            reconnectTimeout = setTimeout(() => {
              setupWebSocket(taskId);
            }, delay);
          } else if (event.code !== 1000) {
            showError(translationsObj.connection_closed);
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
      showError(`${translationsObj.error}: ${error.message}`);
    }
  }

  function updateProgress(percent, message) {
    // Ensure progress container is visible
    progressContainer.classList.remove('hidden');
    progressContainer.style.display = 'block';
    
    const roundedPercent = Math.round(percent);
    
    // Update the progress bar
    progressFill.style.width = `${roundedPercent}%`;
    progressFill.textContent = `${roundedPercent}%`;
    progressFill.setAttribute('aria-valuenow', roundedPercent);
    
    // Update status message
    progressStatus.textContent = message;
    
    // Change color based on progress percentage
    progressFill.classList.remove('bg-danger', 'bg-warning', 'bg-info', 'bg-success');
    
    if (roundedPercent < 25) {
      progressFill.classList.add('bg-info');
    } else if (roundedPercent < 50) {
      progressFill.classList.add('bg-info');
    } else if (roundedPercent < 75) {
      progressFill.classList.add('bg-success');
    } else {
      progressFill.classList.add('bg-success');
    }
    
    // Add striped animated effect for in-progress bars
    if (roundedPercent > 0 && roundedPercent < 100) {
      progressFill.classList.add('progress-bar-striped', 'progress-bar-animated');
    } else {
      progressFill.classList.remove('progress-bar-striped', 'progress-bar-animated');
    }
  }

  function showError(message) {
    statusMessage.classList.add('hidden');
    errorMessage.textContent = message;
    errorMessage.classList.remove('hidden');
    updateProgress(100, translationsObj.error);
    
    // Use Bootstrap classes instead of inline styles
    progressFill.classList.remove('bg-success', 'bg-info', 'bg-warning', 'progress-bar-striped', 'progress-bar-animated');
    progressFill.classList.add('bg-danger');
  }

  // Start processing
  saveProcessingData(null, 'processing');
  processVideo();

  // Add event listeners for the buttons
  const anotherVideoButton = document.getElementById('another-video-button');
  const changeFaceButton = document.getElementById('change-face-button');

  anotherVideoButton.addEventListener('click', () => {
    // Get the current language
    const currentLanguage = document.documentElement.lang;
    // Redirect to the home page with the language prefix
    window.location.href = currentLanguage === 'en' ? '/' : `/${currentLanguage}/`;
  });

  changeFaceButton.addEventListener('click', () => {
    // Get the video URL from the video source
    const videoUrl = videoSource.src;
    // Get the current language
    const currentLanguage = document.documentElement.lang;
    // Redirect to the index page with the video URL and language prefix
    const baseUrl = currentLanguage === 'en' ? '/' : `/${currentLanguage}/`;
    window.location.href = `${baseUrl}?videoUrl=${encodeURIComponent(videoUrl)}`;
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

// Function to check if a tempId is already being processed or completed
function checkProcessingState(tempId, sessionId) {
  if (!tempId && !sessionId) return null;
  
  const processingData = JSON.parse(localStorage.getItem('processingData') || '[]');
  
  // Try to find an existing entry for this tempId or sessionId
  let existingItem = null;
  
  if (tempId && sessionId) {
    existingItem = processingData.find(item => 
      item.tempId === tempId && item.sessionId === sessionId
    );
  }
  
  if (!existingItem && tempId) {
    existingItem = processingData.find(item => item.tempId === tempId);
  }
  
  if (!existingItem && sessionId) {
    existingItem = processingData.find(item => item.sessionId === sessionId);
  }
  
  return existingItem;
}

function saveProcessingData(videoUrl, status = 'processing') {
  // Get parameters from URL
  const urlParams = new URLSearchParams(window.location.search);
  const tempId = urlParams.get('tempId');
  const sessionId = urlParams.get('session_id');

  let processingData = JSON.parse(localStorage.getItem('processingData') || '[]');
  
  // Check if there's an existing entry for this tempId/sessionId
  let existingIndex = -1;
  
  // First try to find by tempId (most reliable identifier)
  if (tempId) {
    existingIndex = processingData.findIndex(item => item.tempId === tempId);
  }
  
  // If not found by tempId, try by sessionId
  if (existingIndex === -1 && sessionId) {
    existingIndex = processingData.findIndex(item => item.sessionId === sessionId);
  }
  
  // If still not found, try by videoUrl (if provided)
  if (existingIndex === -1 && videoUrl) {
    existingIndex = processingData.findIndex(item => item.videoUrl === videoUrl);
  }

  // If status indicates a failure (failed/timeout), remove the entry if it exists
  if (status === 'failed' || status === 'timeout') {
    if (existingIndex !== -1) {
      processingData.splice(existingIndex, 1);
      console.log(`Removed failed processing data (status: ${status}) from local storage`);
    }
  } else if (existingIndex !== -1) {
    // Update existing entry
    processingData[existingIndex] = {
      ...processingData[existingIndex],
      videoUrl: videoUrl || processingData[existingIndex].videoUrl,
      processed: status === 'success',
      status: status,
      date: new Date().toISOString(),
      // Preserve identifiers from the existing record
      tempId: tempId || processingData[existingIndex].tempId,
      sessionId: sessionId || processingData[existingIndex].sessionId
    };
    console.log('Updated processing data in local storage', processingData[existingIndex]);
  } else if (tempId || sessionId || videoUrl) {
    // Only create a new entry if we have at least one identifier
    const newData = {
      sessionId: sessionId || null,
      tempId: tempId || null,
      videoUrl: videoUrl || null,
      date: new Date().toISOString(),
      processed: status === 'success',
      status: status
    };
    processingData.push(newData);
    console.log('Saved processing data to local storage', newData);
  }

  // Clean up old entries (keep only the last 10)
  if (processingData.length > 10) {
    processingData = processingData
      .sort((a, b) => new Date(b.date) - new Date(a.date))
      .slice(0, 10);
    console.log('Cleaned up processing data, keeping only the 10 most recent entries');
  }

  localStorage.setItem('processingData', JSON.stringify(processingData));
}
