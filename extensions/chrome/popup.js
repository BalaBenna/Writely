// Popup status script
document.addEventListener('DOMContentLoaded', () => {
  const statusEl = document.getElementById('bridge-status');

  chrome.runtime.sendMessage({ action: 'check_status' }, (response) => {
    if (response && response.connected) {
      statusEl.innerText = '● Connected';
      statusEl.className = 'val-online';
    } else {
      statusEl.innerText = '○ Bridge Offline';
      statusEl.className = 'val-offline';
    }
  });
});
