# Chrome Extension POTD Reminder - Implementation Plan

## Current State Analysis
- Extension exists but has multiple issues:
  - Uses `new Audio()` in background.js (NOT MV3 compliant)
  - Only has single alarm at 1:00 PM instead of required 6 times
  - Popup is over-engineered with time selection/toggles
  - Midnight reset logic exists but doesn't integrate with multiple alarms

## Required Changes

### 1. manifest.json
- Add "offscreen" permission for audio playback
- Keep existing permissions: storage, notifications, alarms, activeTab
- Keep host_permissions for leetcode.com

### 2. background.js (Complete Rewrite)
- Remove test mode and single alarm logic
- Implement exactly 6 reminder times: 6:00 PM, 7:00 PM, 8:00 PM, 8:30 PM, 9:00 PM, 9:30 PM
- Create individual chrome.alarms for each time
- Use chrome.offscreen.createDocument() to handle audio
- Remove `new Audio()` usage completely
- Integrate midnight reset with multiple alarm management
- Handle alarm logic: only ring if potdSolved === false (check state, don't cancel)

### 3. content.js (Minor Improvements)
- Improve "Solved" detection reliability
- Ensure it only triggers on today's POTD problem page
- Better DOM inspection for "Solved" status

### 4. popup.html (Complete Redesign)
- Remove time selection and toggle controls
- Simple informational display only
- Show "Today's POTD status" with ✅/❌ status

### 5. popup.js (Complete Rewrite)
- Remove settings management logic
- Only load and display current potdSolved status
- No user interaction logic

### 6. popup.css (Simplify)
- Remove styles for removed elements
- Keep clean, minimal design for status display

### 7. offscreen.html (Already Good)
- Currently implements audio playback correctly
- No changes needed

### 8. alarm.mp3 (Keep Existing)
- File already exists and should work

## Key Technical Requirements
✅ Chrome Extension Manifest V3
✅ NO backend, NO APIs, NO login/session checks
✅ Use chrome.alarms for scheduling
✅ Use offscreen.html for audio (NOT new Audio())
✅ Work with single Chrome tab
✅ Work even if LeetCode never opened
✅ Clean, commented, minimal code

## Implementation Steps ✅ COMPLETED
1. ✅ Rewrite manifest.json with offscreen permission
2. ✅ Complete rewrite of background.js with correct alarm logic
3. ✅ Update content.js for better solved detection
4. ✅ Simplify popup.html/popup.js/popup.css
5. ✅ Update offscreen.html for proper audio handling

## Final Implementation Status ✅
**ALL FILES REWRITTEN AND COMPLETE**

✅ manifest.json - Added "offscreen" permission
✅ background.js - 6 reminder alarms + MV3 audio via offscreen
✅ content.js - Enhanced solved detection with DOM observation
✅ popup.html - Simple status display only
✅ popup.js - Status-only functionality (no settings)
✅ popup.css - Clean, minimal design
✅ offscreen.html - Proper audio playback handling
✅ alarm.mp3 - Existing file (kept as-is)

## Expected Outcome ✅ ACHIEVED
Production-ready extension that:
- ✅ Rings 6 specific times daily if POTD not solved
- ✅ Checks state but doesn't cancel alarms when solved
- ✅ Plays reliable audio through offscreen document (MV3 compliant)
- ✅ Shows simple status in popup
- ✅ Resets daily at midnight
- ✅ Works with single Chrome tab
- ✅ Works even if LeetCode never opened
- ✅ Clean, commented, minimal code
