/**
 * LeetCode POTD Reminder - Background Service Worker (Manifest V3)
 * Handles daily alarms, notifications, and audio playback
 */

// Reminder times (24-hour format)
const REMINDER_TIMES = [
  "18:00", // 6:00 PM
  "19:00", // 7:00 PM
  "20:00", // 8:00 PM
  "20:30", // 8:30 PM
  "21:00", // 9:00 PM
  "21:30"  // 9:30 PM
];

const ALARM_PREFIX = "potd_reminder_";
const MIDNIGHT_ALARM = "midnight_reset";

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
    
    // Schedule reminder alarms
    REMINDER_TIMES.forEach(timeStr => {
      const [hours, minutes] = timeStr.split(":").map(Number);
      const alarmTime = new Date(now);
      alarmTime.setHours(hours, minutes, 0, 0);
      
      // If time has passed today, schedule for tomorrow
      if (alarmTime <= now) {
        alarmTime.setDate(alarmTime.getDate() + 1);
      }
      
      const alarmName = ALARM_PREFIX + timeStr.replace(":", "");
      chrome.alarms.create(alarmName, {
        when: alarmTime.getTime(),
        periodInMinutes: 1440 // Daily
      });
      
      console.log(`Scheduled alarm: ${alarmName} at ${alarmTime.toLocaleString()}`);
    });
    
    // Mark reminders as scheduled
    chrome.storage.local.set({ remindersScheduled: true });
  });
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
    return;
  }
  
  // Handle reminder alarms
  if (alarm.name.startsWith(ALARM_PREFIX)) {
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
        title: "LeetCode POTD Reminder",
        message: "You haven't solved today's LeetCode POTD",
        iconUrl: "data:image/png;base64,iVBORw0KGgoAAAANSUhEUgAAAAEAAAABCAYAAAAfFcSJAAAADUlEQVR42mNk+M9QDwADhgGAWjR9awAAAABJRU5ErkJggg==",
        requireInteraction: true
      });
      
      // Play alarm sound via offscreen document
      playAlarmSound();
      
      console.log("Reminder sent: POTD not solved");
    } else {
      console.log("Reminder skipped: POTD already solved");
    }
  });
}

/**
 * Play alarm sound using offscreen document
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
  // Send message - offscreen document will receive it via chrome.runtime.onMessage
  chrome.runtime.sendMessage({
    action: "playAlarmSound"
  }).catch(error => {
    console.error("Error sending message to offscreen document:", error);
    // If message fails, try creating offscreen document again
    chrome.offscreen.createDocument({
      url: "offscreen.html",
      reasons: ["AUDIO_PLAYBACK"],
      justification: "Play alarm sound for LeetCode POTD reminder"
    }).then(() => {
      setTimeout(() => {
        chrome.runtime.sendMessage({
          action: "playAlarmSound"
        }).catch(err => {
          console.error("Retry failed:", err);
        });
      }, 500);
    });
  });
}

/**
 * Handle messages from content scripts and other parts
 */
chrome.runtime.onMessage.addListener((message, sender, sendResponse) => {
  if (message.action === "potdSolved") {
    // User solved the problem
    chrome.storage.local.set({ potdSolved: true });
    console.log("POTD marked as solved");
    sendResponse({ success: true });
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
