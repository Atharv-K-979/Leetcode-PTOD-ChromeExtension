/**
 * LeetCode POTD Reminder - Background Service Worker (Manifest V3)
 * Handles daily alarms, notifications with system sounds
 */

const REMINDER_ALARM = "potd_reminder_repeat";
const MIDNIGHT_ALARM = "midnight_reset";
const REMINDER_INTERVAL_MINUTES = 60; // Repeat every 1 hour
const FIRST_REMINDER_HOUR = 18; // Start reminders at 6:00 PM
const LAST_REMINDER_HOUR = 23; // Stop reminders at 11:00 PM (last reminder at 11 PM)

// Track current notification ID to stop audio when closed
let currentNotificationId = null;

/**
 * Initialize extension on install
 */
chrome.runtime.onInstalled.addListener(() => {
  console.log("LeetCode POTD Reminder installed");
  
  // Initialize storage
  chrome.storage.local.get(["potdSolved"], (result) => {
    const isSolved = result.potdSolved === true;
    
    // Set default if not exists
    if (result.potdSolved === undefined) {
      chrome.storage.local.set({
        potdSolved: false,
        remindersScheduled: false
      });
    }
    
    // Schedule all alarms
    scheduleDailyAlarms();
    
    // Test notification if POTD not solved (for immediate testing)
    if (!isSolved) {
      setTimeout(() => {
        sendTestNotification();
      }, 2000); // Wait 2 seconds after install/reload to send test notification
    }
  });
});

/**
 * Initialize on Chrome startup
 */
chrome.runtime.onStartup.addListener(() => {
  console.log("LeetCode POTD Reminder started");
  scheduleDailyAlarms();
  
  // Test notification on startup if POTD not solved
  chrome.storage.local.get(["potdSolved"], (result) => {
    const isSolved = result.potdSolved === true;
    if (!isSolved) {
      setTimeout(() => {
        sendTestNotification();
      }, 2000);
    }
  });
});

/**
 * Send a test notification (for testing purposes)
 */
function sendTestNotification() {
  console.log("Sending test notification...");
  chrome.notifications.create({
    type: "basic",
    iconUrl: "data:image/png;base64,iVBORw0KGgoAAAANSUhEUgAAAAEAAAABCAYAAAAfFcSJAAAADUlEQVR42mNk+M9QDwADhgGAWjR9awAAAABJRU5ErkJggg==",
    title: "LeetCode POTD Reminder",
    message: "You haven't solved today's LeetCode POTD",
    priority: 2,
    requireInteraction: false
  }, (notificationId) => {
    if (chrome.runtime.lastError) {
      console.error("Test notification error:", chrome.runtime.lastError);
    } else {
      console.log("✅ Test notification sent! Playing alarm sound...");
    }
  });
  
  // Play alarm sound for test
  playAlarmSound();
}

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
 * Starts at 6:00 PM, repeats every 1 hour until 11:00 PM
 */
function scheduleFirstReminder() {
  const now = new Date();
  const firstReminder = new Date(now);
  firstReminder.setHours(FIRST_REMINDER_HOUR, 0, 0, 0);
  
  // If 6 PM has passed today, start at next hour
  if (firstReminder <= now) {
    // Move to next hour
    firstReminder.setHours(firstReminder.getHours() + 1);
    firstReminder.setMinutes(0, 0, 0);
    
    // If that's still in the past, add 1 hour
    if (firstReminder <= now) {
      firstReminder.setHours(firstReminder.getHours() + 1);
    }
  }
  
  // Don't schedule if it's past 11 PM
  if (firstReminder.getHours() > LAST_REMINDER_HOUR) {
    console.log("Past 11 PM, no reminders scheduled for today");
    return;
  }
  
  // Create repeating alarm that fires every 1 hour
  chrome.alarms.create(REMINDER_ALARM, {
    when: firstReminder.getTime(),
    periodInMinutes: REMINDER_INTERVAL_MINUTES
  });
  
  console.log(`First reminder scheduled for: ${firstReminder.toLocaleString()}, then every ${REMINDER_INTERVAL_MINUTES} minutes until 11 PM`);
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
    const now = new Date();
    // Stop reminders after 11 PM (last reminder was at 11 PM)
    if (now.getHours() > LAST_REMINDER_HOUR) {
      chrome.alarms.clear(REMINDER_ALARM);
      console.log("Reminders stopped: Past 11 PM");
      return;
    }
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
      // Send notification
      chrome.notifications.create({
        type: "basic",
        iconUrl: "data:image/png;base64,iVBORw0KGgoAAAANSUhEUgAAAAEAAAABCAYAAAAfFcSJAAAADUlEQVR42mNk+M9QDwADhgGAWjR9awAAAABJRU5ErkJggg==",
        title: "LeetCode POTD Reminder",
        message: "You haven't solved today's LeetCode POTD",
        priority: 2,
        requireInteraction: false
      }, (notificationId) => {
        if (chrome.runtime.lastError) {
          console.error("Notification error:", chrome.runtime.lastError);
        } else {
          console.log("Reminder notification sent:", notificationId);
          currentNotificationId = notificationId; // Track notification ID
        }
      });
      
      // Play alarm sound via offscreen document
      playAlarmSound();
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
 * Play alarm sound using offscreen document (MV3 compliant)
 */
function playAlarmSound() {
  // Check if offscreen document already exists
  chrome.runtime.getContexts({
    contextTypes: ["OFFSCREEN_DOCUMENT"],
    documentUrls: [chrome.runtime.getURL("offscreen.html")]
  }, (contexts) => {
    if (contexts.length === 0) {
      // Create offscreen document
      chrome.offscreen.createDocument({
        url: "offscreen.html",
        reasons: ["AUDIO_PLAYBACK"],
        justification: "Play alarm sound for LeetCode POTD reminder"
      }).then(() => {
        // Wait a bit for document to load, then send message
        setTimeout(() => {
          sendPlaySoundMessage();
        }, 500);
      }).catch(error => {
        console.error("Error creating offscreen document:", error);
      });
    } else {
      // Document exists, send message directly
      sendPlaySoundMessage();
    }
  });
}

/**
 * Send play sound message to offscreen document
 */
function sendPlaySoundMessage() {
  chrome.runtime.sendMessage({
    action: "playAlarmSound"
  }).catch(error => {
    console.error("Error sending message to offscreen document:", error);
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
  // Stop alarm sound when notification is clicked/closed
  stopAlarmSound();
  
  // Open today's POTD page
  chrome.tabs.create({
    url: "https://leetcode.com/problemset/daily-problem"
  });
});

/**
 * Handle notification closed (user dismisses it)
 */
chrome.notifications.onClosed.addListener((notificationId, byUser) => {
  // Stop alarm sound when notification is closed
  if (notificationId === currentNotificationId) {
    stopAlarmSound();
    currentNotificationId = null;
  }
});

/**
 * Stop alarm sound
 */
function stopAlarmSound() {
  chrome.runtime.sendMessage({
    action: "stopAlarmSound"
  }).catch(error => {
    // Ignore errors if offscreen document doesn't exist
  });
}
