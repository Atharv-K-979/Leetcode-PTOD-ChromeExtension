document.addEventListener("DOMContentLoaded", () => {
  loadStatus();
  loadSettings();

  document.getElementById("time-select").addEventListener("change", saveSettings);
  document.getElementById("enable-toggle").addEventListener("change", saveSettings);
  document.getElementById("check-btn").addEventListener("click", checkNow);
});

function loadStatus() {
  chrome.storage.local.get(["potdSolved"], (res) => {
    document.getElementById("status-text").textContent =
      res.potdSolved ? "✅ Solved" : "❌ Not Solved";
  });
}

function loadSettings() {
  chrome.storage.local.get(["reminderTime", "enabled"], (res) => {
    document.getElementById("time-select").value = res.reminderTime || "21:00";
    document.getElementById("enable-toggle").checked = res.enabled !== false;
  });
}

function saveSettings() {
  chrome.storage.local.set({
    reminderTime: document.getElementById("time-select").value,
    enabled: document.getElementById("enable-toggle").checked
  });
}

function checkNow() {
  chrome.tabs.query({ active: true, currentWindow: true }, (tabs) => {
    const tab = tabs[0];
    if (!tab.url.includes("leetcode.com/problems")) {
      alert("Open today’s POTD problem page first.");
      return;
    }

    chrome.tabs.sendMessage(tab.id, { action: "checkStatus" }, (res) => {
      if (chrome.runtime.lastError) {
        alert("Unable to check. Reload POTD page.");
        return;
      }
      chrome.storage.local.set({ potdSolved: res.status }, loadStatus);
    });
  });
}
