document.addEventListener('DOMContentLoaded', function() {
  // Parse the translations JSON string into an object

  const translationsObj = JSON.parse(translations);
  
  // Get DOM containers
  const pendingContainer = document.getElementById('pending-container');
  const completedContainer = document.getElementById('completed-container');
  
  // Load processing data from localStorage
  const processingData = JSON.parse(localStorage.getItem('processingData') || '[]');
  
  // Sort by date (newest first)
  processingData.sort((a, b) => new Date(b.date) - new Date(a.date));
  
  // Separate into pending/failed and completed processes
  const pendingItems = processingData.filter(item => !item.processed);
  const completedItems = processingData.filter(item => item.processed);
  
  // Display pending/failed processes
  if (pendingItems.length > 0) {
    pendingContainer.innerHTML = ''; // Clear container
    pendingItems.forEach(item => {
      pendingContainer.appendChild(createPendingItem(item));
    });
  } else {
    // Show empty state
    pendingContainer.innerHTML = createEmptyState(translationsObj.no_pending_processes, 'hourglass');
  }
  
  // Display completed processes
  if (completedItems.length > 0) {
    completedContainer.innerHTML = ''; // Clear container
    completedItems.forEach(item => {
      completedContainer.appendChild(createCompletedItem(item));
    });
  } else {
    // Show empty state
    completedContainer.innerHTML = createEmptyState(translationsObj.no_completed_processes, 'check-circle');
  }
  
  // Function to create a pending/failed process card
  function createPendingItem(item) {
    const col = document.createElement('div');
    col.className = 'col-md-6 col-lg-4 mb-4';
    
    const dateFormatted = formatDate(item.date);
    const idDisplay = formatId(item.tempId);
    
    col.innerHTML = `
      <div class="card pending-card h-100">
        <div class="card-header d-flex justify-content-between align-items-center">
          <span><i class="fas fa-exclamation-circle me-2"></i>${translationsObj.process_id}: ${idDisplay}</span>
        </div>
        <div class="card-body">
          <div class="d-flex align-items-center mb-3">
            <i class="fas fa-clock text-warning me-2"></i>
            <div>
              <p class="mb-0 text-muted">${translationsObj.started_at}</p>
              <p class="mb-0 fw-bold">${dateFormatted}</p>
            </div>
          </div>
          <div class="alert alert-warning">
            <i class="fas fa-exclamation-triangle me-2"></i>${translationsObj.processing_incomplete}
          </div>
        </div>
        <div class="card-footer">
          <button class="btn btn-action w-100 retry-btn" data-tempid="${item.tempId || ''}" data-sessionid="${item.sessionId || ''}">
            <i class="fas fa-sync-alt me-2"></i>${translationsObj.retry_processing}
          </button>
        </div>
      </div>
    `;
    
    // Add event listener to retry button
    const retryBtn = col.querySelector('.retry-btn');
    retryBtn.addEventListener('click', function() {
      const tempId = this.getAttribute('data-tempid');
      const sessionId = this.getAttribute('data-sessionid');
      retryProcessing(tempId, sessionId);
    });
    
    return col;
  }
  
  // Function to create a completed process card
  function createCompletedItem(item) {
    const col = document.createElement('div');
    col.className = 'col-md-6 col-lg-4 mb-4';
    
    const dateFormatted = formatDate(item.date);
    const idDisplay = formatId(item.tempId);
    
    col.innerHTML = `
      <div class="card completed-card h-100">
        <div class="card-header d-flex justify-content-between align-items-center">
          <span><i class="fas fa-check-circle me-2"></i>${translationsObj.process_id}: ${idDisplay}</span>
        </div>
        <div class="video-container">
          <video controls muted>
            <source src="${item.videoUrl}" type="video/mp4">
            ${translationsObj.video_not_supported}
          </video>
        </div>
        <div class="card-body">
          <div class="d-flex align-items-center mb-2">
            <i class="fas fa-calendar-check text-success me-2"></i>
            <div>
              <p class="mb-0 text-muted">${translationsObj.completed_at}</p>
              <p class="mb-0 fw-bold">${dateFormatted}</p>
            </div>
          </div>
        </div>
        <div class="card-footer d-flex justify-content-between">
          <a href="${item.videoUrl}" class="btn btn-success flex-grow-1 me-2" download>
            <i class="fas fa-download me-2"></i>${translationsObj.download_video}
          </a>
          <a href="${getBaseUrl()}?videoUrl=${encodeURIComponent(item.videoUrl)}" class="btn btn-outline-primary flex-grow-1">
            <i class="fas fa-random me-2"></i>${translationsObj.use_again}
          </a>
        </div>
      </div>
    `;
    
    // Load video preview when the card is visible
    const video = col.querySelector('video');
    video.addEventListener('loadedmetadata', function() {
      this.muted = true;
      // Set poster if video fails to load
      this.addEventListener('error', function() {
        this.poster = '/placeholder-image.jpg';
      });
    });
    
    return col;
  }
  
  // Function to create empty state UI
  function createEmptyState(message, icon) {
    return `
      <div class="empty-state">
        <i class="fas fa-${icon}"></i>
        <p>${message}</p>
      </div>
    `;
  }
  
  // Function to format ID for display
  function formatId(id) {
    if (!id) return translationsObj.unknown_id;
    return id.substring(0, 8) + '...';
  }
  
  // Function to format date
  function formatDate(dateString) {
    if (!dateString) return translationsObj.unknown_date;
    const date = new Date(dateString);
    return date.toLocaleDateString() + ' ' + date.toLocaleTimeString();
  }
  
  // Function to get base URL with language prefix
  function getBaseUrl() {
    // Get current language from HTML tag
    const language = document.documentElement.lang || 'en';
    return language === 'en' ? '/' : `/${language}/`;
  }
  
  // Function to handle retry processing
  function retryProcessing(tempId, sessionId) {
    if (!tempId) {
      alert(translationsObj.invalid_process_id);
      return;
    }
    
    // Check if this process already has a result
    const processingData = JSON.parse(localStorage.getItem('processingData') || '[]');
    const existingProcess = processingData.find(item => 
      (item.tempId === tempId && item.sessionId === sessionId) || 
      (item.tempId === tempId)
    );
    
    // If there's an existing successful process, go directly to the result
    if (existingProcess && existingProcess.status === 'success' && existingProcess.videoUrl) {
      // Show the completed video instead of retrying
      const videoUrl = existingProcess.videoUrl;
      const baseUrl = getBaseUrl();
      window.location.href = `${baseUrl}?videoUrl=${encodeURIComponent(videoUrl)}`;
      return;
    }
    
    // Get base URL with language prefix
    const baseUrl = getBaseUrl();
    
    // Redirect to success page with tempId and session_id parameters
    let url = `${baseUrl}success?tempId=${tempId}`;
    if (sessionId) {
      url += `&session_id=${sessionId}`;
    }
    
    window.location.href = url;
  }
});
