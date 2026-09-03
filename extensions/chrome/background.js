// Writely Chrome Extension Background Service Worker
let socket = null;
let isConnected = false;

function connectBridge() {
  try {
    socket = new WebSocket('ws://127.0.0.1:8765');

    socket.onopen = () => {
      isConnected = true;
      console.log('[Writely Extension] Connected to local desktop bridge on 127.0.0.1:8765');
    };

    socket.onmessage = (event) => {
      try {
        const data = JSON.parse(event.data);
        // Forward response to active tabs
        chrome.tabs.query({ active: true, currentWindow: true }, (tabs) => {
          if (tabs[0]?.id) {
            chrome.tabs.sendMessage(tabs[0].id, data);
          }
        });
      } catch (err) {
        console.error('[Writely Extension] Message parse error:', err);
      }
    };

    socket.onclose = () => {
      isConnected = false;
      // Reconnect after 3s
      setTimeout(connectBridge, 3000);
    };

    socket.onerror = () => {
      isConnected = false;
    };
  } catch (err) {
    setTimeout(connectBridge, 5000);
  }
}

connectBridge();

// Listen for messages from content script
chrome.runtime.onMessage.addListener((request, sender, sendResponse) => {
  if (request.action === 'check_status') {
    sendResponse({ connected: isConnected });
    return true;
  }

  if (socket && socket.readyState === WebSocket.OPEN) {
    socket.send(JSON.stringify(request));
  } else {
    sendResponse({ error: 'Writely desktop app bridge is not connected' });
  }
  return true;
});
