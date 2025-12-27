/**
 * LeetCode POTD Reminder - Background Service Worker (Manifest V3)
 * Handles daily alarms, notifications with system sounds
 */

const REMINDER_ALARM = "potd_reminder_repeat";
const MIDNIGHT_ALARM = "midnight_reset";
const REMINDER_INTERVAL_MINUTES = 30; // Repeat every 30 minutes
const FIRST_REMINDER_HOUR = 18; // Start reminders at 6:00 PM

/**
 * Initialize extension on install
 */
chrome.runtime.onInstalled.addListener(() => {
  console.log("LeetCode POTD Reminder installed");
  
  // Initialize storage
  chrome.storage.local.set({
    potdSolved: false,
    remindersScheduled: false
  });
  
  // Schedule all alarms
  scheduleDailyAlarms();
});

/**
 * Initialize on Chrome startup
 */
chrome.runtime.onStartup.addListener(() => {
  console.log("LeetCode POTD Reminder started");
  scheduleDailyAlarms();
});

/**
 * Schedule all daily alarms for the day
 */
function scheduleDailyAlarms() {
  // Clear existing alarms
  chrome.alarms.clearAll(() => {
    const now = new Date();
    
    // Schedule midnight reset alarm
    const midnight = new Date(now);
    midnight.setDate(midnight.getDate() + 1);
    midnight.setHours(0, 0, 0, 0);
    
    chrome.alarms.create(MIDNIGHT_ALARM, {
      when: midnight.getTime(),
      periodInMinutes: 1440 // Daily
    });
    
    // Schedule first reminder for today
    scheduleFirstReminder();
    
    console.log("Daily alarms scheduled");
  });
}

/**
 * Schedule the first reminder of the day
 * Starts at 6:00 PM, then repeats every 30 minutes
 */
function scheduleFirstReminder() {
  const now = new Date();
  const firstReminder = new Date(now);
  firstReminder.setHours(FIRST_REMINDER_HOUR, 0, 0, 0);
  
  // If 6 PM has passed today, start immediately (next 30-minute interval)
  if (firstReminder <= now) {
    // Calculate next 30-minute interval from now
    const minutes = now.getMinutes();
    const nextInterval = Math.ceil(minutes / REMINDER_INTERVAL_MINUTES) * REMINDER_INTERVAL_MINUTES;
    firstReminder.setMinutes(nextInterval, 0, 0);
    
    // If that's still in the past (shouldn't happen), add 30 minutes
    if (firstReminder <= now) {
      firstReminder.setMinutes(firstReminder.getMinutes() + REMINDER_INTERVAL_MINUTES);
    }
  }
  
  // Create repeating alarm that fires every 30 minutes
  chrome.alarms.create(REMINDER_ALARM, {
    when: firstReminder.getTime(),
    periodInMinutes: REMINDER_INTERVAL_MINUTES
  });
  
  console.log(`First reminder scheduled for: ${firstReminder.toLocaleString()}, then every ${REMINDER_INTERVAL_MINUTES} minutes`);
}

/**
 * Handle alarm events
 */
chrome.alarms.onAlarm.addListener((alarm) => {
  console.log(`Alarm triggered: ${alarm.name}`);
  
  // Handle midnight reset
  if (alarm.name === MIDNIGHT_ALARM) {
    chrome.storage.local.set({ potdSolved: false });
    console.log("Midnight reset: potdSolved set to false");
    // Schedule reminders for the new day
    scheduleFirstReminder();
    return;
  }
  
  // Handle repeating reminder alarm
  if (alarm.name === REMINDER_ALARM) {
    checkAndSendReminder();
  }
});

/**
 * Check current status and send reminder if needed
 */
function checkAndSendReminder() {
  chrome.storage.local.get(["potdSolved"], (result) => {
    const isSolved = result.potdSolved === true;
    
    if (!isSolved) {
      // Send notification with priority 2 to ensure system sound plays
      chrome.notifications.create({
        type: "basic",
        iconUrl: "data:image/png;base64,iVBORw0KGgoAAAANSUhEUgAAAAEAAAABCAYAAAAfFcSJAAAADUlEQVR42mNk+M9QDwADhgGAWjR9awAAAABJRU5ErkJggg==",
        title: "LeetCode POTD Reminder",
        message: "You haven't solved today's LeetCode POTD",
        priority: 2, // High priority ensures system notification sound plays
        requireInteraction: false
      }, (notificationId) => {
        if (chrome.runtime.lastError) {
          console.error("Notification error:", chrome.runtime.lastError);
        } else {
          console.log("Reminder notification sent:", notificationId);
        }
      });
    } else {
      // POTD is solved - cancel the repeating alarm
      chrome.alarms.clear(REMINDER_ALARM, (wasCleared) => {
        if (wasCleared) {
          console.log("Reminders stopped: POTD already solved");
        }
      });
    }
  });
}


/**
 * Handle messages from content scripts and other parts
 */
chrome.runtime.onMessage.addListener((message, sender, sendResponse) => {
  if (message.action === "potdSolved") {
    // User solved the problem - stop all reminders immediately
    chrome.storage.local.set({ potdSolved: true }, () => {
      // Cancel the repeating reminder alarm
      chrome.alarms.clear(REMINDER_ALARM, (wasCleared) => {
        if (wasCleared) {
          console.log("POTD marked as solved - all reminders stopped");
        }
        sendResponse({ success: true });
      });
    });
    return true; // Keep message channel open for async response
  } else if (message.action === "getStatus") {
    // Get current POTD status
    chrome.storage.local.get(["potdSolved"], (result) => {
      sendResponse({ potdSolved: result.potdSolved === true });
    });
    return true; // Keep message channel open for async response
  }
  
  return false;
});

/**
 * Handle notification clicks
 */
chrome.notifications.onClicked.addListener((notificationId) => {
  // Open today's POTD page
  chrome.tabs.create({
    url: "https://leetcode.com/problemset/daily-problem"
  });
});
