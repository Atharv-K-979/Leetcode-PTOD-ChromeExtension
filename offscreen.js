/**
 * Offscreen document script for audio playback
 * External script to avoid CSP violations
 */

// Initialize audio element with correct path
function initializeAudio() {
  const audioElement = document.getElementById("alarm-sound");
  const audioUrl = chrome.runtime.getURL("alarm.mp3");
  audioElement.src = audioUrl;
  
  // Handle audio loading events
  audioElement.addEventListener('canplaythrough', () => {
    console.log("Audio preloaded successfully");
  });
  
  audioElement.addEventListener('error', (e) => {
    console.error("Audio loading error:", e);
  });
  
  // Load the audio
  audioElement.load();
}

/**
 * Handle messages from background script
 */
chrome.runtime.onMessage.addListener((message, sender, sendResponse) => {
  if (message.action === "playAlarmSound") {
    console.log("Playing alarm sound...");
    
    const audioElement = document.getElementById("alarm-sound");
    
    // Ensure audio is loaded
    if (!audioElement.src) {
      initializeAudio();
    }
    
    // Reset audio to beginning
    audioElement.currentTime = 0;
    
    // Play the audio
    const playPromise = audioElement.play();
    
    if (playPromise !== undefined) {
      playPromise.then(() => {
        console.log("Alarm sound played successfully");
        sendResponse({ success: true });
      }).catch((error) => {
        console.error("Error playing alarm sound:", error);
        sendResponse({ success: false, error: error.message });
      });
    } else {
      sendResponse({ success: true });
    }
    
    return true; // Keep message channel open for async response
  } else if (message.action === "stopAlarmSound") {
    console.log("Stopping alarm sound...");
    
    const audioElement = document.getElementById("alarm-sound");
    if (audioElement) {
      audioElement.pause();
      audioElement.currentTime = 0;
      console.log("Alarm sound stopped");
    }
    
    sendResponse({ success: true });
    return true;
  }
});

// Initialize when document loads
if (document.readyState === 'loading') {
  document.addEventListener('DOMContentLoaded', initializeAudio);
} else {
  initializeAudio();
}

