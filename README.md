# X.com Safe Unfollow Script (v7.3)

A sophisticated Tampermonkey userscript for safely and efficiently unfollowing accounts on X.com (formerly Twitter). This script prioritizes human-like behavior patterns to minimize detection risk while providing full configurability and real-time progress tracking.

If you like this script, feel free to Buy me a coffee :) https://buymeacoffee.com/esrevorter
---

## 📋 Table of Contents

- [Overview](#overview)
- [Features](#features)
- [Installation](#installation)
- [Usage](#usage)
- [Configuration Options](#configuration-options)
- [Technical Details](#technical-details)
- [Safety Mechanisms](#safety-mechanisms)
- [Troubleshooting](#troubleshooting)
- [API Reference](#api-reference)

---

## Overview

This userscript automates the process of unfollowing accounts on X.com by:

1. **Scanning** your following list for target accounts
2. **Clicking** the "Following" button with humanized timing
3. **Confirming** the unfollow action in the modal dialog
4. **Tracking** progress with detailed statistics and logging

The script is designed with anti-detection measures including randomized delays, varied scroll patterns, and human-like interaction sequences.

---

## Features

### Core Functionality
- ✅ **Bidirectional Sorting**: Process oldest or newest follows first
- ✅ **Configurable Limits**: Set maximum unfollow count per session
- ✅ **Randomized Delays**: Human-like timing between actions
- ✅ **Empty Page Tolerance**: Configurable threshold for stopping when no targets found
- ✅ **Progress Tracking**: Real-time counter with ETA estimation
- ✅ **Detailed Logging**: Color-coded log with timestamps and status indicators

### User Interface
- 🎨 **Modern Dark Theme**: Matches X.com's native design
- 🎨 **Draggable Panel**: Repositionable widget with persistent positioning
- 🎨 **Collapsible Design**: Minimize to save screen space
- 🎨 **Animated Progress Bar**: Visual feedback with sheen animation
- 🎨 **Status Indicator**: Live running/stopped state display

### Safety & Reliability
- 🛡️ **Humanized Clicks**: Simulated mouse movements with natural timing
- 🛡️ **Modal Detection**: Robust confirmation dialog handling
- 🛡️ **Retry Logic**: Automatic retry on failed clicks (max 3 attempts)
- 🛡️ **Scroll Recovery**: Multiple strategies for stuck scroll states
- 🛡️ **Duplicate Prevention**: Tracks processed users to avoid repeats
- 🛡️ **Followers Protection**: Skips users who follow you back

---

## Installation

### Prerequisites
- A modern web browser (Chrome, Firefox, Edge, Safari)
- A userscript manager extension:
  - [Tampermonkey](https://www.tampermonkey.net/) (Recommended)
  - [Violentmonkey](https://violentmonkey.github.io/)
  - [Greasemonkey](https://www.greasespot.net/)

### Steps

1. **Install a userscript manager** from your browser's extension store
2. **Navigate to your X.com following page**:
   - `https://x.com/<your_username>/following`
   - `https://twitter.com/<your_username>/following`
3. **Create a new script** in your userscript manager
4. **Paste the entire script code** into the editor
5. **Save the script** (Ctrl+S / Cmd+S)
6. **Refresh the page** to activate the script

---

## Usage

### Starting the Script

1. Navigate to your following list page on X.com
2. The control panel will appear in the bottom-right corner
3. Configure your settings (see [Configuration Options](#configuration-options))
4. Click **"▶ Start"** to begin the unfollow process
5. Monitor progress in the real-time log
6. Click **"⏹ STOP"** at any time to halt operations

### Control Panel Elements

| Element | Description |
|---------|-------------|
| **Status Dot** | Green (●) = Running, Gray (○) = Stopped |
| **Progress Bar** | Visual representation of unfollow progress |
| **Counter** | Shows `unfollowed / limit` with ETA |
| **Log Panel** | Detailed activity feed with color-coded messages |
| **Start/Stop Button** | Toggle automation on/off |

### Log Message Types

| Icon | Type | Description |
|------|------|-------------|
| ✅ | Success | Successful unfollow completed |
| ❌ | Error | Failed operation or critical issue |
| ⚠️ | Warning | Non-critical issues or notices |
| 🔄 | System | State changes and milestones |
| ℹ️ | Info | Target identification and general info |
| 🔍 | Debug | Detailed technical information |

---

## Configuration Options

### Input Fields

| Setting | Default | Min | Max | Description |
|---------|---------|-----|-----|-------------|
| **Max Unfollows** | 50 | 1 | 1000 | Maximum number of accounts to unfollow per session |
| **Min Delay (s)** | 8 | 3 | 60 | Minimum random delay between unfollow actions |
| **Max Delay (s)** | 15 | 5 | 120 | Maximum random delay between unfollow actions |
| **Sort Order** | Oldest First | — | — | Toggle between oldest/newest follows first |
| **Empty Page Tolerance** | 50 | 1 | 999 | Number of empty pages before auto-stop |

### Settings Persistence

All configuration values are automatically saved to `localStorage` and persist across page reloads. Settings are stored under the key `xuf_cfg_v73`.

### Recommended Settings

#### Conservative (Low Risk)
```
Max Unfollows: 20-30
Min Delay: 12-15s
Max Delay: 20-30s
Empty Tolerance: 30-50
```

#### Balanced (Moderate Risk)
```
Max Unfollows: 50-75
Min Delay: 8-10s
Max Delay: 15-20s
Empty Tolerance: 50-75
```

#### Aggressive (Higher Risk)
```
Max Unfollows: 100+
Min Delay: 5-7s
Max Delay: 10-12s
Empty Tolerance: 100+
```

> ⚠️ **Warning**: Using aggressive settings may increase the risk of account restrictions. Always start with conservative settings and adjust gradually.

---

## Technical Details

### Architecture

The script follows a modular architecture with the following components:

```
┌─────────────────────────────────────────┐
│           UI Layer                      │
│  ┌───────────┬───────────┬───────────┐  │
│  │  Panel    │  Inputs   │   Log     │  │
│  └───────────┴───────────┴───────────┘  │
├─────────────────────────────────────────┤
│         Controller Layer                │
│  ┌───────────┬───────────┬───────────┐  │
│  │  Config   │  State    │ Progress  │  │
│  └───────────┴───────────┴───────────┘  │
├─────────────────────────────────────────┤
│          Action Layer                   │
│  ┌───────────┬───────────┬───────────┐  │
│  │  Scroll   │   Click   │   Modal   │  │
│  └───────────┴───────────┴───────────┘  │
├─────────────────────────────────────────┤
│        Utility Layer                    │
│  ┌───────────┬───────────┬───────────┐  │
│  │  Logger   │  Storage  │   DOM     │  │
│  └───────────┴───────────┴───────────┘  │
└─────────────────────────────────────────┘
```

### Key Functions

#### `run(minMs, maxMs, oldest)`
Main execution loop that processes the following list. Continues until:
- Target unfollow count reached
- User manually stops
- Empty page tolerance exceeded
- End of list reached

#### `realClickOnButton(buttonElement)`
Simulates human-like clicking behavior:
1. Calculates safe click coordinates (avoiding edges)
2. Fires `pointerover` and `mouseover` events
3. Waits 150-400ms (human reaction time)
4. Fires `pointerdown` and `mousedown` events
5. Waits 50-150ms (button press duration)
6. Fires `pointerup`, `mouseup`, and `click` events
7. Executes native `.click()` as fallback

#### `getVisibleDialog()`
Detects confirmation modals using multiple selectors:
- `[role="dialog"]`
- `[data-testid="sheetDialog"]`
- `[data-testid="DialogContainer"]`
- `[data-testid="confirmationSheetDialog"]`
- `[aria-modal="true"]`

#### `scrollStrategy()`
Implements varied scrolling patterns:
- Random scroll fractions (40%, 50%, 60%, 70%, 80% of viewport)
- Occasional scroll-back behavior (8% chance)
- Progressive backoff on stuck detection
- Multiple recovery attempts before giving up

### Data Structures

#### Processed Users Set
```javascript
processed = new Set()  // Stores usernames already handled
```

#### Configuration Object
```javascript
DEFAULTS = { 
    limit: 50, 
    minDelay: 8, 
    maxDelay: 15, 
    oldestFirst: true,
    emptyTolerance: 50 
}
```

#### DOM Cache (WeakMap)
```javascript
domCache = new WeakMap()  // Caches username/button lookups per cell
```

### LocalStorage Keys

| Key | Purpose | Format |
|-----|---------|--------|
| `xuf_pos_v73` | Panel position | JSON `{left: number, top: number}` |
| `xuf_col_v73` | Collapse state | String `"0"` or `"1"` |
| `xuf_cfg_v73` | User configuration | JSON object with all settings |

---

## Safety Mechanisms

### Anti-Detection Features

1. **Randomized Timing**
   - All delays use `Math.random()` for unpredictability
   - Reading pauses between 1-3 seconds before clicking
   - Variable scroll wait times (1.5-3 seconds)

2. **Human-Like Interactions**
   - Mouse hover simulation before clicks
   - Natural button press duration (50-150ms)
   - Occasional scroll reversals (mimics hesitation)

3. **Rate Limiting**
   - Configurable minimum 3-second delay between actions
   - Automatic stop on 3 consecutive failures
   - Empty page tolerance prevents endless scanning

4. **Error Recovery**
   - 3-retry limit on failed clicks
   - Progressive backoff for modal closing
   - Multiple scroll recovery strategies

5. **Account Protection**
   - Skips users who follow you back
   - Validates username match in confirmation modal
   - Prevents duplicate processing via Set tracking

### Known Limitations

- Requires visible following list (won't work on private accounts without access)
- May need manual intervention if X.com changes DOM structure
- Not effective against accounts with CAPTCHA challenges
- Browser must remain active and in focus for optimal performance

---

## Troubleshooting

### Common Issues

#### Script doesn't appear
- Ensure you're on the correct URL (`/following` page)
- Check that Tampermonkey is enabled
- Verify the script is enabled in Tampermonkey dashboard
- Refresh the page after installation

#### "Scroll stuck" messages
- Normal behavior when reaching end of list
- May indicate network issues loading more content
- Try manual scroll to verify page responsiveness

#### Click failures
- Modal may be blocked by ad blockers
- X.com may have updated their UI
- Try reducing speed settings
- Clear browser cache and retry

#### Settings not saving
- Check browser localStorage permissions
- Ensure private/incognito mode isn't blocking storage
- Verify no console errors related to localStorage

### Console Commands

Access the browser console (F12) for debugging:

```javascript
// View current configuration
console.log(JSON.parse(localStorage.getItem('xuf_cfg_v73')))

// Reset all settings to defaults
localStorage.removeItem('xuf_cfg_v73')
localStorage.removeItem('xuf_pos_v73')
localStorage.removeItem('xuf_col_v73')
location.reload()

// Check processed users count
// (Only available during runtime via script scope)
```

### Getting Help

If you encounter persistent issues:

1. Open browser console (F12) and check for errors
2. Review the script's internal log for specific error messages
3. Verify X.com hasn't changed their interface
4. Try disabling other extensions that might interfere

---

## API Reference

### Global Variables

| Variable | Type | Description |
|----------|------|-------------|
| `unfollowCount` | number | Current successful unfollow count |
| `currentLimit` | number | Active session limit |
| `isRunning` | boolean | Script execution state |
| `shouldStop` | boolean | Stop request flag |
| `processed` | Set | Usernames already handled |
| `scannedCount` | number | Total cells examined |
| `consecutiveEmptyPages` | number | Counter for empty scroll results |
| `emptyTolerance` | number | Threshold for auto-stop |

### Utility Functions

#### `log(msg, type)`
Adds entry to visual log and console.

| Parameter | Type | Values |
|-----------|------|--------|
| `msg` | string | Message text |
| `type` | string | `'success'`, `'error'`, `'warn'`, `'system'`, `'info'`, `'debug'` |

#### `sleep(a, b)`
Promise-based delay with optional randomization.

| Parameter | Type | Description |
|-----------|------|-------------|
| `a` | number | If both params provided: min delay in ms. Single param: fixed delay |
| `b` | number | Max delay in ms (for randomization) |

#### `getUsername(cell)`
Extracts username from user cell element.

| Parameter | Type | Description |
|-----------|------|-------------|
| `cell` | Element | DOM element containing user info |

**Returns:** `string|null` — Username without @ symbol, or null if not found

#### `findFollowingButton(cell)`
Locates the "Following" button within a user cell.

| Parameter | Type | Description |
|-----------|------|-------------|
| `cell` | Element | DOM element containing user row |

**Returns:** `Element|null` — Button element or null

#### `closeModal(modal)`
Dismisses an open confirmation dialog.

| Parameter | Type | Description |
|-----------|------|-------------|
| `modal` | Element | Dialog element to close |

#### `setStatus(text)`
Updates the status display text and indicator.

| Parameter | Type | Description |
|-----------|------|-------------|
| `text` | string | Status message to display |

#### `setProgress()`
Updates progress bar and counter with current statistics.

### CSS Custom Properties

The UI uses the following CSS variables (defined in `#xuf` scope):

| Variable | Default | Purpose |
|----------|---------|---------|
| `--b` | `#1d9bf0` | Primary blue (X brand color) |
| `--ok` | `#00ba7c` | Success green |
| `--err` | `#f4212e` | Error red |
| `--warn` | `#ffd400` | Warning yellow |
| `--mut` | `#8b98a5` | Muted gray |
| `--ink` | `#e7e9ea` | Text white |
| `--panel` | `rgba(13,17,23,.92)` | Background with transparency |

---

## Version History

### v7.3 (Current)
- Added configurable empty page tolerance
- Improved scroll recovery algorithms
- Enhanced DOM caching for performance
- Better modal detection with multiple selectors
- Refined human-like click simulation

### Previous Versions
- **v7.x**: Introduced bidirectional sorting, progress tracking
- **v6.x**: Added draggable panel, collapsible UI
- **v5.x**: Implemented retry logic, failure detection
- **v4.x**: Basic automation with fixed delays

---

## Disclaimer

> ⚠️ **Important Notice**
> 
> This script is provided for educational purposes only. Use at your own risk.
> 
> - Automated actions may violate X.com's Terms of Service
> - Excessive use could result in account restrictions or suspension
> - The authors are not responsible for any consequences of using this script
> - Always follow X.com's automation rules and rate limits
> - Consider using official X.com tools for bulk management

### Best Practices

1. **Start Small**: Begin with conservative settings (20-30 unfollows/day)
2. **Monitor Activity**: Watch for unusual account behavior
3. **Take Breaks**: Space out sessions over multiple days
4. **Stay Updated**: Keep the script updated for UI changes
5. **Respect Limits**: Never exceed recommended daily thresholds

---

## License

This script is provided as-is without warranty. You are free to modify and distribute it under the terms of your userscript manager's license agreement.

---

## Author

Original author: Esrevorter  
Maintained by: Esrevorter 

For questions, issues, or contributions, please refer to your userscript manager's community forums.
