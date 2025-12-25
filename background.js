// Background service worker for scheduling reminders and resets

const DEFAULT_REMINDER_TIME = '21:00'; // 9:00 PM
const DEFAULT_ENABLED = true;

// On install, set defaults and schedule alarms
chrome.runtime.onInstalled.addListener(() => {
  chrome.storage.local.get(['reminderTime', 'enabled', 'potdSolved'], (result) => {
    if (!result.reminderTime) chrome.storage.local.set({ reminderTime: DEFAULT_REMINDER_TIME });
    if (result.enabled === undefined) chrome.storage.local.set({ enabled: DEFAULT_ENABLED });
    if (result.potdSolved === undefined) chrome.storage.local.set({ potdSolved: false });
    scheduleAlarms();
  });
});

// On startup, schedule alarms
chrome.runtime.onStartup.addListener(() => {
  scheduleAlarms();
});

// Listen for storage changes to update alarms
chrome.storage.onChanged.addListener((changes, namespace) => {
  if (changes.reminderTime || changes.enabled) {
    scheduleAlarms();
  }
});

// Schedule the daily reset at midnight and reminder alarm
function scheduleAlarms() {
  chrome.storage.local.get(['reminderTime', 'enabled'], (result) => {
    if (!result.enabled) {
      chrome.alarms.clearAll();
      return;
    }

    // Schedule midnight reset
    const now = new Date();
    const midnight = new Date(now.getFullYear(), now.getMonth(), now.getDate() + 1, 0, 0, 0);
    const resetDelay = (midnight - now) / (1000 * 60);
    chrome.alarms.create('reset', { delayInMinutes: resetDelay, periodInMinutes: 1440 });

    // Schedule reminder
    const reminderTime = result.reminderTime || DEFAULT_REMINDER_TIME;
    const [hours, minutes] = reminderTime.split(':').map(Number);
    const reminderDate = new Date(now.getFullYear(), now.getMonth(), now.getDate(), hours, minutes);
    if (reminderDate <= now) {
      reminderDate.setDate(reminderDate.getDate() + 1);
    }
    const reminderDelay = (reminderDate - now) / (1000 * 60);
    chrome.alarms.create('reminder', { delayInMinutes: reminderDelay, periodInMinutes: 1440 });
  });
}

// On alarm
chrome.alarms.onAlarm.addListener((alarm) => {
  if (alarm.name === 'reset') {
    chrome.storage.local.set({ potdSolved: false });
  } else if (alarm.name === 'reminder') {
    chrome.storage.local.get(['potdSolved'], (result) => {
      if (result.potdSolved === false) {
        // Show notification
        chrome.notifications.create('potd-reminder', {
          type: 'basic',
          title: 'LeetCode POTD Reminder',
          message: 'You haven’t solved today’s problem yet. Don’t break your streak!',
          iconUrl: chrome.runtime.getURL('icon.png'), // Add an icon file if needed
          requireInteraction: true
        });

        // Play sound
        chrome.tts.speak('Reminder: You haven’t solved today’s LeetCode problem yet.', { rate: 1.0 });
      }
    });
  }
});

// Handle notification click
chrome.notifications.onClicked.addListener((notificationId) => {
  if (notificationId === 'potd-reminder') {
    chrome.tabs.create({ url: 'https://leetcode.com/problemset/daily-problem' });
  }
});
