console.log("POTD content script active:", location.href);

function detectSolved() {
  const solved =
    document.body.innerText.includes("Solved") ||
    document.querySelector('svg[aria-label="Solved"]') !== null;

  if (solved) {
    chrome.storage.local.set({ potdSolved: true });
  }

  return solved;
}

// SPA delay handling
setTimeout(detectSolved, 3000);

// Manual check from popup
chrome.runtime.onMessage.addListener((msg, sender, sendResponse) => {
  if (msg.action === "checkStatus") {
    const status = detectSolved();
    sendResponse({ status });
  }
});
