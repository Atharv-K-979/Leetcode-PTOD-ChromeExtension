/**
 * LeetCode POTD Content Script
 * Detects when user has solved today's Problem of the Day
 * ONLY works on today's POTD problem page
 * Version: 2.0 (No warnings - clean detection)
 */

console.log("POTD content script v2.0 loaded:", location.href);

/**
 * Check if current page is today's POTD page
 * @returns {boolean} True if this is the POTD page
 */
function isPOTDPage() {
  // Method 1: Check URL for daily-question parameter (most reliable)
  const urlParams = new URLSearchParams(window.location.search);
  if (urlParams.get('envType') === 'daily-question') {
    console.log("POTD page detected via URL parameter: envType=daily-question");
    return true;
  }
  
  // Method 2: Check URL path for daily-problem redirect
  if (window.location.pathname.includes('/problemset/daily-problem')) {
    return true;
  }
  
  // Method 3: Check for "Daily Challenge" badge or indicator in DOM
  const dailyChallengeIndicators = [
    'text-daily-challenge',
    'daily-challenge',
    '[data-testid*="daily"]',
    '[class*="Daily"]',
    '[class*="daily"]'
  ];
  
  for (const selector of dailyChallengeIndicators) {
    try {
      const elements = document.querySelectorAll(selector);
      if (elements.length > 0) {
        return true;
      }
    } catch (e) {
      // Invalid selector, continue
    }
  }
  
  // Method 4: Check page text for "Daily Challenge" or "Problem of the Day"
  const pageText = document.body.innerText || document.body.textContent || "";
  if (pageText.includes("Daily Challenge") || 
      pageText.includes("Problem of the Day") ||
      pageText.includes("Today's Challenge")) {
    return true;
  }
  
  // Method 5: Check for specific LeetCode POTD UI elements
  const potdBadges = document.querySelectorAll('[class*="badge"], [class*="tag"]');
  for (const badge of potdBadges) {
    const badgeText = badge.textContent || "";
    if (badgeText.toLowerCase().includes("daily") || 
        badgeText.toLowerCase().includes("challenge")) {
      return true;
    }
  }
  
  // Not a POTD page - return false (no warning needed)
  return false;
}

/**
 * Detect if the current POTD problem is solved
 * @returns {boolean} True if solved, false otherwise
 */
function detectSolved() {
  // More comprehensive solved detection
  let isSolved = false;
  
  // Method 1: Check for "Solved" text in various locations
  const bodyText = document.body.innerText || document.body.textContent || "";
  if (bodyText.toLowerCase().includes("solved")) {
    isSolved = true;
  }
  
  // Method 2: Check for solved SVG/icon elements
  const solvedElements = document.querySelectorAll('svg[aria-label="Solved"], svg[aria-label="solved"]');
  if (solvedElements.length > 0) {
    isSolved = true;
  }
  
  // Method 3: Check for specific class names that indicate solved status
  const solvedClassElements = document.querySelectorAll('[class*="solved"], [class*="completed"]');
  if (solvedClassElements.length > 0) {
    isSolved = true;
  }
  
  // Method 4: Check for green checkmark or success indicators
  const checkmarkElements = document.querySelectorAll('svg[data-icon="check"], .text-green-500, .text-green-400');
  if (checkmarkElements.length > 0) {
    isSolved = true;
  }
  
  // Method 5: Look for "Accepted" or success submission status
  const acceptedElements = document.querySelectorAll('[class*="accepted"], [class*="success"]');
  if (acceptedElements.length > 0) {
    isSolved = true;
  }
  
  console.log("POTD solved detection:", isSolved ? "SOLVED" : "NOT SOLVED");
  return isSolved;
}

/**
 * Send solved status to background script
 * Only sends if this is the POTD page
 */
function notifyBackgroundScript() {
  // Only check if this is the POTD page
  if (!isPOTDPage()) {
    console.log("Not a POTD page, skipping detection");
    return;
  }
  
  const isSolved = detectSolved();
  
  if (isSolved) {
    chrome.runtime.sendMessage({
      action: "potdSolved"
    }).catch(error => {
      console.error("Error notifying background script:", error);
    });
  }
}

/**
 * Initial detection after page loads
 */
function initialDetection() {
  // Wait for page to fully load
  setTimeout(() => {
    notifyBackgroundScript();
  }, 2000); // 2 second delay for dynamic content
  
  // Also check after a longer delay for SPA navigation
  setTimeout(() => {
    notifyBackgroundScript();
  }, 5000); // 5 second delay
}

/**
 * Observe DOM changes for dynamic content updates
 */
function observeChanges() {
  const observer = new MutationObserver((mutations) => {
    let shouldCheck = false;
    
    mutations.forEach((mutation) => {
      if (mutation.type === 'childList' && mutation.addedNodes.length > 0) {
        // Check if any added nodes contain relevant content
        mutation.addedNodes.forEach((node) => {
          if (node.nodeType === Node.ELEMENT_NODE) {
            const nodeText = node.textContent || "";
            if (nodeText.toLowerCase().includes("solved") || 
                nodeText.toLowerCase().includes("accepted") ||
                node.querySelector('svg[aria-label="Solved"]')) {
              shouldCheck = true;
            }
          }
        });
      }
    });
    
    if (shouldCheck) {
      setTimeout(notifyBackgroundScript, 500); // Debounce rapid changes
    }
  });
  
  observer.observe(document.body, {
    childList: true,
    subtree: true
  });
}

/**
 * Handle messages from popup or other scripts
 */
chrome.runtime.onMessage.addListener((message, sender, sendResponse) => {
  if (message.action === "checkStatus") {
    // Only check if this is the POTD page
    if (isPOTDPage()) {
    const status = detectSolved();
    sendResponse({ status });
    } else {
      sendResponse({ status: false, notPOTD: true });
    }
  }
});

/**
 * Initialize when DOM is ready
 */
if (document.readyState === 'loading') {
  document.addEventListener('DOMContentLoaded', () => {
    initialDetection();
    observeChanges();
  });
} else {
  // DOM is already ready
  initialDetection();
  observeChanges();
}
