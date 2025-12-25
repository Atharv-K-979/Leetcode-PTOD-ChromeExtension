// Background service worker for scheduling reminders

// Default settings
const DEFAULT_REMINDER_TIME = '21:00'; // 9:00 PM
const DEFAULT_ENABLED = true;

// On install, set defaults and schedule alarm
chrome.runtime.onInstalled.addListener(() => {
  chrome.storage.local.get(['reminderTime', 'enabled'], (result) => {
    if (!result.reminderTime) chrome.storage.local.set({ reminderTime: DEFAULT_REMINDER_TIME });
    if (result.enabled === undefined) chrome.storage.local.set({ enabled: DEFAULT_ENABLED });
    scheduleAlarm();
  });
});

// On startup, schedule alarm
chrome.runtime.onStartup.addListener(() => {
  scheduleAlarm();
});

// Listen for storage changes to update alarm
chrome.storage.onChanged.addListener((changes, namespace) => {
  if (changes.reminderTime || changes.enabled) {
    scheduleAlarm();
  }
});

// Schedule the daily alarm
function scheduleAlarm() {
  chrome.storage.local.get(['reminderTime', 'enabled'], (result) => {
    if (!result.enabled) {
      chrome.alarms.clear('reminder');
      return;
    }
    const reminderTime = result.reminderTime || DEFAULT_REMINDER_TIME;
    const [hours, minutes] = reminderTime.split(':').map(Number);
    const now = new Date();
    const reminderDate = new Date(now.getFullYear(), now.getMonth(), now.getDate(), hours, minutes);
    if (reminderDate <= now) {
      reminderDate.setDate(reminderDate.getDate() + 1);
    }
    const delayInMinutes = (reminderDate - now) / (1000 * 60);
    chrome.alarms.create('reminder', { delayInMinutes, periodInMinutes: 1440 }); // Daily
  });
}

// On alarm, check status and notify if not solved
chrome.alarms.onAlarm.addListener((alarm) => {
  if (alarm.name === 'reminder') {
    const today = new Date().toDateString();
    chrome.storage.local.get([today], (result) => {
      const isSolved = result[today];
      if (!isSolved) {
        chrome.notifications.create({
          type: 'basic',
          title: 'LeetCode POTD Reminder',
          message: 'You haven’t solved today’s problem yet. Don’t break your streak!',
          iconUrl: chrome.runtime.getURL('icon.png') // Assuming an icon is added later
        });
      }
    });
  }
});
