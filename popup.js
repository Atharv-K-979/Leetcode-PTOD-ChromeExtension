/**
 * LeetCode POTD Popup Script
 * Simple status display with alarm controls
 */

document.addEventListener("DOMContentLoaded", () => {
  loadPOTDStatus();
  setupEventListeners();
});

/**
 * Setup UI event listeners
 */
function setupEventListeners() {
  const stopAlarmBtn = document.getElementById("stop-alarm-btn");
  const testAlarmBtn = document.getElementById("test-alarm-btn");
  
  if (stopAlarmBtn) {
    stopAlarmBtn.addEventListener("click", () => {
      // Send message to stop the alarm
      chrome.runtime.sendMessage({ action: "stopAlarmSound" }, (response) => {
        if (chrome.runtime.lastError) {
          console.error("Error stopping alarm:", chrome.runtime.lastError);
        } else {
          // Visual feedback
          const originalText = stopAlarmBtn.innerHTML;
          stopAlarmBtn.innerHTML = "Stopped!";
          setTimeout(() => {
            stopAlarmBtn.innerHTML = originalText;
            stopAlarmBtn.style.display = "none";
          }, 1500);
        }
      });
    });
  }
  
  if (testAlarmBtn) {
    testAlarmBtn.addEventListener("click", () => {
      chrome.runtime.sendMessage({ action: "testAlarm" }, (response) => {
        if (chrome.runtime.lastError) {
          console.error("Error testing alarm:", chrome.runtime.lastError);
        } else {
          // If tested, show the stop button
          if (stopAlarmBtn) {
            stopAlarmBtn.style.display = "flex";
          }
        }
      });
    });
  }
  
  const resetStatusBtn = document.getElementById("reset-status-btn");
  if (resetStatusBtn) {
    resetStatusBtn.addEventListener("click", () => {
      chrome.runtime.sendMessage({ action: "resetStatus" }, (response) => {
        if (chrome.runtime.lastError) {
          console.error("Error resetting status:", chrome.runtime.lastError);
        } else {
          // Change text to show success
          const originalText = resetStatusBtn.innerHTML;
          resetStatusBtn.innerHTML = "Status Reset!";
          setTimeout(() => {
            resetStatusBtn.innerHTML = originalText;
            loadPOTDStatus(); // Reload the UI status
          }, 1500);
        }
      });
    });
  }
}

/**
 * Load and display current POTD status
 */
function loadPOTDStatus() {
  // Get status from storage
  chrome.storage.local.get(["potdSolved"], (result) => {
    const isSolved = result.potdSolved === true;
    updateStatusDisplay(isSolved);
    
    // Show stop button if not solved (might be ringing)
    // or we'll just show it if an alarm is active (simplification: show when not solved)
    const stopAlarmBtn = document.getElementById("stop-alarm-btn");
    if (!isSolved && stopAlarmBtn) {
      // Let's always show it if not solved just in case it's ringing
      stopAlarmBtn.style.display = "flex";
    }
  });
  
  // Also try to get status from content script if on POTD page
  chrome.tabs.query({ active: true, currentWindow: true }, (tabs) => {
    const currentTab = tabs[0];
    
    if (currentTab && currentTab.url && currentTab.url.includes("leetcode.com/problems")) {
      chrome.tabs.sendMessage(currentTab.id, { action: "checkStatus" }, (response) => {
        if (!chrome.runtime.lastError && response) {
          updateStatusDisplay(response.status);
          
          if (response.status) {
            const stopAlarmBtn = document.getElementById("stop-alarm-btn");
            if (stopAlarmBtn) stopAlarmBtn.style.display = "none";
          }
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
      <span class="status-text">Solved Today!</span>
    `;
    statusDisplay.className = "status-solved";
  } else {
    statusDisplay.innerHTML = `
      <span class="status-icon">⚠️</span>
      <span class="status-text">Not Solved Yet</span>
    `;
    statusDisplay.className = "status-not-solved";
  }
}
