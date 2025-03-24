document.addEventListener('DOMContentLoaded', async () => {
  console.log('=== WebSocket Debug Client Started ===');
  
  // Heroku requires using the same port for both HTTP and WebSocket
  // Don't use a different port (like 4242 + 1)
  const protocol = window.location.protocol === 'https:' ? 'wss:' : 'ws:';
  // Use the same hostname and port as the current page
  const wsUrl = `${protocol}//${window.location.host}`;
  console.log(`Attempting WebSocket connection to: ${wsUrl}`);
  
  try {
    const ws = new WebSocket(wsUrl);
    
    // Connection opened
    ws.onopen = () => {
      console.log('✅ Successfully connected to WebSocket server');
      ws.send(JSON.stringify({
        type: 'debug_message',
        client_info: {
          userAgent: navigator.userAgent,
          timestamp: new Date().toISOString()
        }
      }));
    };
    
    // Listen for messages
    ws.onmessage = (event) => {
      console.log('📥 Message received from server:');
      try {
        const data = JSON.parse(event.data);
        console.log(data);
      } catch (e) {
        console.log('Raw message:', event.data);
      }
    };
    
    // Connection closed
    ws.onclose = (event) => {
      console.log(`⛔ WebSocket disconnected with code: ${event.code}, reason: ${event.reason}`);
      console.log('Try checking if the server is running and if the port matches');
    };
    
    // Connection error
    ws.onerror = (error) => {
      console.error('❌ WebSocket error:', error);
      console.log('Common issues:');
      console.log('1. Server not running');
      console.log('2. Incorrect port (should match the server port)');
      console.log('3. CORS issues (for production servers)');
    };
  } catch (error) {
    console.error('Failed to create WebSocket connection:', error);
  }
});