/**
 * LeetCode POTD Popup Script
 * Simple status display - informational only
 */

document.addEventListener("DOMContentLoaded", () => {
  loadPOTDStatus();
});

/**
 * Load and display current POTD status
 */
function loadPOTDStatus() {
  // Get status from storage
  chrome.storage.local.get(["potdSolved"], (result) => {
    const isSolved = result.potdSolved === true;
    updateStatusDisplay(isSolved);
  });
  
  // Also try to get status from content script if on POTD page
  chrome.tabs.query({ active: true, currentWindow: true }, (tabs) => {
    const currentTab = tabs[0];
    
    if (currentTab && currentTab.url && currentTab.url.includes("leetcode.com/problems")) {
      chrome.tabs.sendMessage(currentTab.id, { action: "checkStatus" }, (response) => {
        if (!chrome.runtime.lastError && response) {
          updateStatusDisplay(response.status);
        }
      });
    }
  });
}

/**
 * Update the status display
 * @param {boolean} isSolved - Whether POTD is solved
 */
function updateStatusDisplay(isSolved) {
  const statusDisplay = document.getElementById("status-display");
  const errorMessage = document.getElementById("error-message");
  
  // Clear any previous error
  errorMessage.textContent = "";
  
  if (isSolved) {
    statusDisplay.innerHTML = `
      <span class="status-icon">✅</span>
      <span class="status-text">Solved</span>
    `;
    statusDisplay.className = "status-solved";
  } else {
    statusDisplay.innerHTML = `
      <span class="status-icon">❌</span>
      <span class="status-text">Not Solved</span>
    `;
    statusDisplay.className = "status-not-solved";
  }
}
