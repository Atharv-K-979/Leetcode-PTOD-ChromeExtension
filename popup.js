// Popup script to handle UI interactions

document.addEventListener('DOMContentLoaded', () => {
  loadStatus();
  loadSettings();

  // Event listeners
  document.getElementById('time-select').addEventListener('change', saveSettings);
  document.getElementById('enable-toggle').addEventListener('change', saveSettings);
  document.getElementById('check-btn').addEventListener('click', checkStatusNow);
});

// Load and display today's POTD status
function loadStatus() {
  const today = new Date().toDateString();
  chrome.storage.local.get([today], (result) => {
    const status = result[today];
    const statusText = status === true ? '✅ Solved' : status === false ? '❌ Not Solved' : '⚠️ Not Checked';
    document.getElementById('status-text').textContent = statusText;
  });
}

// Load settings into UI
function loadSettings() {
  chrome.storage.local.get(['reminderTime', 'enabled'], (result) => {
    document.getElementById('time-select').value = result.reminderTime || '21:00';
    document.getElementById('enable-toggle').checked = result.enabled !== false;
  });
}

// Save settings to storage
function saveSettings() {
  const reminderTime = document.getElementById('time-select').value;
  const enabled = document.getElementById('enable-toggle').checked;
  chrome.storage.local.set({ reminderTime, enabled });
}

// Manual check status: Send message to content script on active LeetCode tab
function checkStatusNow() {
  chrome.tabs.query({ active: true, currentWindow: true }, (tabs) => {
    const tab = tabs[0];
    if (tab.url && tab.url.includes('leetcode.com')) {
      chrome.tabs.sendMessage(tab.id, { action: 'checkStatus' }, (response) => {
        if (response) {
          loadStatus(); // Refresh status after check
        }
      });
    } else {
      // If not on LeetCode, open a tab or show message
      alert('Please navigate to leetcode.com to check status.');
    }
  });
}
