# TODO: Chrome Extension for LeetCode POTD Reminders

- [x] Create manifest.json with necessary permissions and file references
- [x] Create content.js to detect POTD solved status via DOM on leetcode.com
- [x] Create background.js to schedule daily alarm, check status, and trigger notifications
- [x] Create popup.html for the UI layout (title, status, time selector, toggle, check button)
- [x] Create popup.js to handle UI interactions (update status, toggle reminders, change time, manual check)
- [x] Create popup.css for minimal styling (LeetCode green/gray, light/dark mode friendly)
- [ ] Test the extension by loading in Chrome Developer Mode on leetcode.com
