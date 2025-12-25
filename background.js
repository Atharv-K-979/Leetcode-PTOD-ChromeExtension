// ===============================
// TEST MODE: Alarm ALWAYS rings
// Time: 12:00 NOON
// ===============================

const DEFAULT_REMINDER_TIME = "12:00"; // 12 NOON
const DEFAULT_ENABLED = true;

// On install
chrome.runtime.onInstalled.addListener(() => {
  chrome.storage.local.set({
    reminderTime: DEFAULT_REMINDER_TIME,
    enabled: DEFAULT_ENABLED,
    potdSolved: true // doesn't matter in test mode
  });
  scheduleAlarms();
});

// On Chrome startup
chrome.runtime.onStartup.addListener(scheduleAlarms);

// Reschedule if settings change
chrome.storage.onChanged.addListener((changes) => {
  if (changes.reminderTime || changes.enabled) {
    scheduleAlarms();
  }
});

function scheduleAlarms() {
  chrome.alarms.clearAll(() => {
    chrome.storage.local.get(["reminderTime", "enabled"], (res) => {
      if (!res.enabled) return;

      const now = new Date();

      // 🔁 Midnight reset (kept for consistency)
      const midnight = new Date(now);
      midnight.setDate(midnight.getDate() + 1);
      midnight.setHours(0, 0, 0, 0);

      chrome.alarms.create("reset", {
        when: midnight.getTime(),
        periodInMinutes: 1440
      });

      // ⏰ TEST ALARM (12:00 NOON)
      const [h, m] = (res.reminderTime || DEFAULT_REMINDER_TIME)
        .split(":")
        .map(Number);

      const reminder = new Date(now);
      reminder.setHours(h, m, 0, 0);
      if (reminder <= now) reminder.setDate(reminder.getDate() + 1);

      chrome.alarms.create("reminder", {
        when: reminder.getTime(),
        periodInMinutes: 1440
      });
    });
  });
}

// Alarm handler
chrome.alarms.onAlarm.addListener((alarm) => {
  if (alarm.name === "reset") {
    chrome.storage.local.set({ potdSolved: false });
  }

  if (alarm.name === "reminder") {
    // 🚨 TEST MODE: ALWAYS RING
    chrome.notifications.create("potd-test-reminder", {
      type: "basic",
      title: "LeetCode POTD Alarm (TEST)",
      message: "Alarm test at 12:00 noon",
      iconUrl: chrome.runtime.getURL("icon.png"),
      requireInteraction: true
    });

    const audio = new Audio(chrome.runtime.getURL("alarm.mp3"));
    audio.play();
  }
});

// Notification click
chrome.notifications.onClicked.addListener((id) => {
  if (id === "potd-test-reminder") {
    chrome.tabs.create({
      url: "https://leetcode.com/problemset/daily-problem"
    });
  }
});
