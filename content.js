// Content script to detect POTD solved status on leetcode.com

function checkPOTDSolved() {
  // DOM-based check: Look for indicators that the problem is solved
  // Check for 'Accepted' text in the page or specific classes LeetCode uses
  const acceptedText = document.body.innerText.includes('Accepted');
  const solvedClass = !!document.querySelector('.ac__status--accepted') || !!document.querySelector('.text-green-600');
  return acceptedText || solvedClass;
}

// On page load, if on a problem page, check and store the solved status
if (window.location.pathname.startsWith('/problems/')) {
  const isSolved = checkPOTDSolved();
  const today = new Date().toDateString();
  chrome.storage.local.set({ [today]: isSolved });
}

// Listen for messages from popup to manually check status
chrome.runtime.onMessage.addListener((request, sender, sendResponse) => {
  if (request.action === 'checkStatus') {
    const isSolved = checkPOTDSolved();
    const today = new Date().toDateString();
    chrome.storage.local.set({ [today]: isSolved });
    sendResponse({ status: isSolved });
  }
});
