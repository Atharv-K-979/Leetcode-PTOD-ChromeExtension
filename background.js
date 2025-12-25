const DEFAULT_REMINDER_TIME = "09:00"; // 9 AM
const DEFAULT_ENABLED = true;

chrome.runtime.onInstalled.addListener(() => {
  chrome.storage.local.set({
    reminderTime: DEFAULT_REMINDER_TIME,
    enabled: DEFAULT_ENABLED,
    potdSolved: false
  });
  scheduleAlarms();
});

chrome.runtime.onStartup.addListener(scheduleAlarms);

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

      // 🔁 Midnight reset
      const midnight = new Date(now);
      midnight.setDate(midnight.getDate() + 1);
      midnight.setHours(0, 0, 0, 0);

      chrome.alarms.create("reset", {
        when: midnight.getTime(),
        periodInMinutes: 1440
      });

      // ⏰ Reminder
      const [h, m] = (res.reminderTime || DEFAULT_REMINDER_TIME).split(":").map(Number);
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

chrome.alarms.onAlarm.addListener((alarm) => {
  if (alarm.name === "reset") {
    chrome.storage.local.set({ potdSolved: false });
  }

  if (alarm.name === "reminder") {
    chrome.storage.local.get(["potdSolved"], (res) => {
      if (!res.potdSolved) {
        chrome.notifications.create("potd-reminder", {
          type: "basic",
          title: "LeetCode POTD Reminder",
          message: "You haven’t solved today’s POTD yet. Click to solve now!",
          iconUrl: chrome.runtime.getURL("icon.png"),
          requireInteraction: true
        });

        const audio = new Audio(chrome.runtime.getURL("alarm.mp3"));
        audio.play();
      }
    });
  }
});

chrome.notifications.onClicked.addListener((id) => {
  if (id === "potd-reminder") {
    chrome.tabs.create({ url: "https://leetcode.com/problemset/daily-problem" });
  }
});
