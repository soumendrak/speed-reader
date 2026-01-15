# Speed Reader App - Requirements & Implementation Guide

> A lightweight, accessible RSVP (Rapid Serial Visual Presentation) speed reading Progressive Web App built with vanilla HTML, CSS, and JavaScript.

---

## Table of Contents

1. [Project Overview](#project-overview)
2. [Non-Functional Requirements](#non-functional-requirements)
3. [Functional Requirements](#functional-requirements)
4. [Technical Architecture](#technical-architecture)
5. [Design System](#design-system)
6. [Implementation Milestones](#implementation-milestones)
7. [File Structure](#file-structure)
8. [API & Algorithm Specifications](#api--algorithm-specifications)
9. [Testing Checklist](#testing-checklist)
10. [Deployment Notes](#deployment-notes)

---

## Project Overview

### What is RSVP Speed Reading?

RSVP (Rapid Serial Visual Presentation) is a speed reading technique where words are displayed one at a time at a fixed focal point. This eliminates the need for eye movement across a page, allowing readers to process text faster.

### Key Concept: ORP (Optimal Recognition Point)

The ORP is the letter in a word where the eye naturally focuses for fastest recognition. In this app, we highlight the **middle letter** (or near-middle for even-length words) to anchor the reader's gaze.

### Target Users

- Students wanting to read faster
- Professionals processing large amounts of text
- Anyone looking to improve reading speed and comprehension

---

## Non-Functional Requirements

### NFR-1: Lightweight

| Requirement | Target |
|-------------|--------|
| Total bundle size | < 100KB (uncompressed) |
| No external dependencies | Vanilla JS only |
| No build tools required | Direct browser execution |
| First Contentful Paint | < 1.5 seconds |
| Time to Interactive | < 2 seconds |

### NFR-2: Client-Side Processing

- **All text processing happens in the browser**
- No server-side API calls for core functionality
- Text is never sent to external servers
- LocalStorage for persisting user preferences
- No analytics or tracking scripts

### NFR-3: Progressive Web App (PWA)

| Feature | Implementation |
|---------|---------------|
| Installable | `manifest.json` with app metadata |
| Offline capable | Service Worker with cache-first strategy |
| App-like experience | Standalone display mode |
| Icons | Multiple sizes (192x192, 512x512) |

### NFR-4: Accessibility

| Criterion | Implementation |
|-----------|---------------|
| Color contrast | Minimum 4.5:1 for normal text, 3:1 for large text |
| Color-blind friendly | Blue-based highlight (avoids red-green) |
| Keyboard navigation | Full app control via keyboard |
| Focus indicators | Visible focus rings on all interactive elements |
| Reduced motion | Respect `prefers-reduced-motion` |

### NFR-5: Theme Support

- **Light Mode**: Default, follows system preference
- **Dark Mode**: Manual toggle + `prefers-color-scheme` detection
- Smooth theme transitions
- Persistent theme preference in LocalStorage

### NFR-6: Responsive Design

| Breakpoint | Target Device | Layout Adjustments |
|------------|---------------|-------------------|
| < 480px | Mobile phones | Single column, larger touch targets |
| 480px - 768px | Tablets (portrait) | Adjusted spacing |
| 768px - 1024px | Tablets (landscape), small laptops | Two-column settings |
| > 1024px | Desktops | Full layout with side panels |

---

## Functional Requirements

### FR-1: Text Input

#### Desktop Behavior
- Large textarea for pasting text
- Placeholder text with instructions
- Character/word count display
- Clear button to reset input
- Auto-focus on page load

#### Mobile Behavior
- Optimized textarea with appropriate keyboard
- Paste from clipboard button

### FR-2: RSVP Word Display

#### Core Display
```
┌─────────────────────────────────────┐
│                                     │
│           sp[e]ed                   │
│              ↑                      │
│         highlighted                 │
│         middle letter               │
│                                     │
└─────────────────────────────────────┘
```

#### ORP (Middle Letter) Highlighting Algorithm

```javascript
function getMiddleIndex(word) {
  const length = word.length;
  if (length <= 1) return 0;
  if (length <= 3) return 1;
  // For longer words, use middle or just before middle
  return Math.floor((length - 1) / 2);
}

// Examples:
// "a"       → index 0 → "a"
// "to"      → index 0 → "to" (first letter)
// "the"     → index 1 → "t[h]e"
// "word"    → index 1 → "w[o]rd"
// "speed"   → index 2 → "sp[e]ed"
// "reading" → index 3 → "rea[d]ing"
```

#### Display Requirements
- Word centered horizontally
- Fixed vertical position (eye doesn't move)
- Large, readable font (configurable)
- High contrast between highlight and regular text
- Optional: Fixation point marker (vertical line showing center)

### FR-3: Punctuation Delay

Words ending with punctuation receive extended display time:

| Punctuation | Delay Multiplier |
|-------------|------------------|
| `.` (period) | 2.0x |
| `!` (exclamation) | 2.0x |
| `?` (question) | 2.0x |
| `,` (comma) | 1.5x |
| `;` (semicolon) | 1.5x |
| `:` (colon) | 1.5x |
| `—` (em dash) | 1.3x |
| `-` (hyphen at end) | 1.2x |

### FR-4: Progress Bar

```
┌─────────────────────────────────────┐
│ 34 of 69 words          0:07 left   │
├─────────────────────────────────────┤
│ ████████████░░░░░░░░░░░░░░░░░░░░░░░ │
│ 49%                            100% │
└─────────────────────────────────────┘
```

#### Progress Metrics
- **Current word / Total words**: `34 of 69 words`
- **Percentage complete**: Visual bar + numeric display
- **Time remaining**: Calculated as `(remainingWords / WPM) * 60` seconds
- **Elapsed time**: Optional display

### FR-5: Playback Controls

```
┌─────────────────────────────────────┐
│                                     │
│       ⏮️      ▶️/⏸️      ⏭️          │
│     restart   play     end          │
│                                     │
└─────────────────────────────────────┘
```

| Control | Action | Keyboard Shortcut |
|---------|--------|-------------------|
| Restart | Go to first word | `Home` or `R` |
| Play/Pause | Toggle playback | `Space` |
| End | Go to last word | `End` or `E` |

### FR-6: Speed Control (WPM)

```
Reading Speed
├──●────────────────────────────┤ 300 WPM
100                            1000
```

| Setting | Range | Default |
|---------|-------|---------|
| Minimum WPM | 100 | - |
| Maximum WPM | 1000 | - |
| Default WPM | 300 | ✓ |
| Step increment | 25 | - |

#### WPM to Delay Calculation
```javascript
function getBaseDelay(wpm) {
  return 60000 / wpm; // milliseconds per word
}

// Examples:
// 300 WPM → 200ms per word
// 600 WPM → 100ms per word
// 150 WPM → 400ms per word
```

### FR-7: Additional Settings

| Setting | Options | Default |
|---------|---------|---------|
| Font Size | Small, Medium, Large, X-Large | Medium |
| Highlight Focus | On/Off | On |
| Fixation Point | On/Off | Off |
| Theme | Light, Dark, System | System |

---

## Technical Architecture

### Component Diagram

```
┌─────────────────────────────────────────────────────────────┐
│                        index.html                           │
│  ┌─────────────┐  ┌─────────────┐  ┌─────────────────────┐  │
│  │ Input View  │  │ Reader View │  │   Settings Panel    │  │
│  │             │  │             │  │                     │  │
│  │ - Textarea  │  │ - Word      │  │ - WPM Slider        │  │
│  │ - Start Btn │  │   Display   │  │ - Font Size         │  │
│  │ - Word Count│  │ - Progress  │  │ - Words per Flash   │  │
│  │             │  │ - Controls  │  │ - Theme Toggle      │  │
│  └─────────────┘  └─────────────┘  └─────────────────────┘  │
└─────────────────────────────────────────────────────────────┘
                              │
                              ▼
┌─────────────────────────────────────────────────────────────┐
│                        js/app.js                            │
│  - View management (input ↔ reader)                         │
│  - Event listeners                                          │
│  - Settings management                                      │
│  - Keyboard shortcuts                                       │
└─────────────────────────────────────────────────────────────┘
                              │
                              ▼
┌─────────────────────────────────────────────────────────────┐
│                       js/reader.js                          │
│  - Text parsing (split into words)                          │
│  - RSVP engine (timing, word display)                       │
│  - ORP calculation (middle letter)                          │
│  - Punctuation delay logic                                  │
│  - Progress tracking                                        │
└─────────────────────────────────────────────────────────────┘
                              │
                              ▼
┌─────────────────────────────────────────────────────────────┐
│                      js/storage.js                          │
│  - LocalStorage wrapper                                     │
│  - Settings persistence                                     │
│  - Default values                                           │
└─────────────────────────────────────────────────────────────┘
                              │
                              ▼
┌─────────────────────────────────────────────────────────────┐
│                         sw.js                               │
│  - Service Worker                                           │
│  - Cache management                                         │
│  - Offline support                                          │
└─────────────────────────────────────────────────────────────┘
```

### State Management

```javascript
const AppState = {
  // View state
  currentView: 'input', // 'input' | 'reader'
  
  // Text state
  text: '',
  words: [],
  currentIndex: 0,
  
  // Playback state
  isPlaying: false,
  isPaused: false,
  
  // Settings
  settings: {
    wpm: 300,
    wordsPerFlash: 1,
    fontSize: 'medium',
    highlightFocus: true,
    fixationPoint: false,
    theme: 'system'
  }
};
```

---

## Design System

### Color Palette (Accessible & Color-Blind Friendly)

#### Light Theme

| Element | Color | Hex | Contrast Ratio |
|---------|-------|-----|----------------|
| Background | White | `#FFFFFF` | - |
| Surface | Light Gray | `#F5F5F7` | - |
| Primary Text | Dark Gray | `#1D1D1F` | 16:1 on white |
| Secondary Text | Medium Gray | `#6E6E73` | 4.6:1 on white |
| Highlight Letter | Blue | `#0066CC` | 4.5:1 on white |
| Progress Bar | Blue | `#0066CC` | - |
| Border | Light Gray | `#D2D2D7` | - |
| Focus Ring | Blue | `#0066CC` | - |

#### Dark Theme

| Element | Color | Hex | Contrast Ratio |
|---------|-------|-----|----------------|
| Background | Near Black | `#1D1D1F` | - |
| Surface | Dark Gray | `#2C2C2E` | - |
| Primary Text | White | `#F5F5F7` | 12:1 on bg |
| Secondary Text | Light Gray | `#A1A1A6` | 5.3:1 on bg |
| Highlight Letter | Cyan | `#00B4D8` | 6.8:1 on bg |
| Progress Bar | Cyan | `#00B4D8` | - |
| Border | Dark Gray | `#3A3A3C` | - |
| Focus Ring | Cyan | `#00B4D8` | - |

#### Why Blue/Cyan?

- **Deuteranopia** (green-blind): Can distinguish blue
- **Protanopia** (red-blind): Can distinguish blue
- **Tritanopia** (blue-blind): Rare (~0.01%), cyan still visible
- High contrast against both light and dark backgrounds

### Typography

```css
:root {
  --font-family: -apple-system, BlinkMacSystemFont, 'Segoe UI', Roboto, 
                 Oxygen, Ubuntu, Cantarell, sans-serif;
  
  /* Font sizes */
  --font-size-small: 2rem;      /* 32px */
  --font-size-medium: 3rem;     /* 48px */
  --font-size-large: 4rem;      /* 64px */
  --font-size-xlarge: 5rem;     /* 80px */
  
  /* For UI elements */
  --font-size-body: 1rem;       /* 16px */
  --font-size-label: 0.875rem;  /* 14px */
  --font-size-small-ui: 0.75rem;/* 12px */
}
```

### Spacing Scale

```css
:root {
  --space-xs: 0.25rem;   /* 4px */
  --space-sm: 0.5rem;    /* 8px */
  --space-md: 1rem;      /* 16px */
  --space-lg: 1.5rem;    /* 24px */
  --space-xl: 2rem;      /* 32px */
  --space-2xl: 3rem;     /* 48px */
  --space-3xl: 4rem;     /* 64px */
}
```

### Border Radius

```css
:root {
  --radius-sm: 4px;
  --radius-md: 8px;
  --radius-lg: 12px;
  --radius-xl: 16px;
  --radius-full: 9999px;
}
```

### Shadows

```css
:root {
  /* Light theme shadows */
  --shadow-sm: 0 1px 2px rgba(0, 0, 0, 0.05);
  --shadow-md: 0 4px 6px rgba(0, 0, 0, 0.07);
  --shadow-lg: 0 10px 15px rgba(0, 0, 0, 0.1);
  
  /* Dark theme shadows */
  --shadow-sm-dark: 0 1px 2px rgba(0, 0, 0, 0.3);
  --shadow-md-dark: 0 4px 6px rgba(0, 0, 0, 0.4);
  --shadow-lg-dark: 0 10px 15px rgba(0, 0, 0, 0.5);
}
```

---

## Implementation Milestones

### Milestone 1: Project Setup & Core HTML Structure
**Status**: 🔴 Not Started  
**Estimated Time**: 1 hour

#### Tasks
- [ ] Create project folder structure
- [ ] Create `index.html` with semantic HTML5 structure
- [ ] Add meta tags for viewport, theme-color, description
- [ ] Create basic CSS reset and variables in `css/styles.css`
- [ ] Link CSS and JS files
- [ ] Add placeholder content for both views (input & reader)

#### Deliverables
- `index.html` - Complete HTML structure
- `css/styles.css` - CSS variables and reset
- Basic page renders in browser

#### Acceptance Criteria
- [ ] Page loads without errors
- [ ] Semantic HTML structure (header, main, sections)
- [ ] Proper meta tags for mobile

---

### Milestone 2: Input View UI
**Status**: 🔴 Not Started  
**Estimated Time**: 1.5 hours

#### Tasks
- [ ] Style the input view container
- [ ] Create textarea with placeholder
- [ ] Add word count display (updates on input)
- [ ] Create "Start Reading" button
- [ ] Add "Clear" button
- [ ] Style for all breakpoints (mobile, tablet, desktop)

#### Deliverables
- Fully styled input view
- Responsive layout

#### Acceptance Criteria
- [ ] Textarea is usable on all devices
- [ ] Word count updates in real-time
- [ ] Buttons are accessible (focus states, ARIA labels)

---

### Milestone 3: Reader View UI
**Status**: 🔴 Not Started  
**Estimated Time**: 2 hours

#### Tasks
- [ ] Create word display area (centered, large font)
- [ ] Add progress bar component
- [ ] Create playback controls (buttons)
- [ ] Add statistics display (word count, time remaining)
- [ ] Style settings panel (collapsible on mobile)
- [ ] Add "Back to Input" button

#### Deliverables
- Complete reader view layout
- All UI components styled

#### Acceptance Criteria
- [ ] Word display area is prominent and centered
- [ ] Controls are touch-friendly on mobile
- [ ] Settings panel works on all screen sizes

---

### Milestone 4: RSVP Engine Core
**Status**: 🔴 Not Started  
**Estimated Time**: 3 hours

#### Tasks
- [ ] Create `js/reader.js` module
- [ ] Implement text parsing (split into words array)
- [ ] Implement ORP (middle letter) calculation
- [ ] Create word display function with highlight
- [ ] Implement timing engine (setInterval/setTimeout)
- [ ] Add punctuation delay logic
- [ ] Create play/pause functionality

#### Deliverables
- `js/reader.js` - Complete RSVP engine
- Words display one at a time with highlighting

#### Acceptance Criteria
- [ ] Words display at correct WPM rate
- [ ] Middle letter is highlighted correctly
- [ ] Punctuation adds appropriate delay
- [ ] Play/pause works smoothly

---

### Milestone 5: Playback Controls & Navigation
**Status**: 🔴 Not Started  
**Estimated Time**: 2 hours

#### Tasks
- [ ] Wire up all playback buttons
- [ ] Implement keyboard shortcuts
- [ ] Add progress bar updates
- [ ] Implement word navigation (prev/next)
- [ ] Add restart and jump-to-end functions
- [ ] Implement fullscreen mode

#### Deliverables
- Fully functional playback controls
- Keyboard navigation

#### Acceptance Criteria
- [ ] All buttons work correctly
- [ ] Keyboard shortcuts function
- [ ] Progress bar updates in real-time
- [ ] Fullscreen mode works

---

### Milestone 6: Settings & Preferences
**Status**: 🔴 Not Started  
**Estimated Time**: 2 hours

#### Tasks
- [ ] Create `js/storage.js` for LocalStorage
- [ ] Implement WPM slider with live preview
- [ ] Add font size selector
- [ ] Add words per flash selector
- [ ] Implement highlight toggle
- [ ] Implement fixation point toggle
- [ ] Persist all settings to LocalStorage
- [ ] Load settings on app start

#### Deliverables
- `js/storage.js` - Storage utilities
- All settings functional and persistent

#### Acceptance Criteria
- [ ] Settings persist across sessions
- [ ] WPM changes take effect immediately
- [ ] Font size changes are visible
- [ ] All toggles work correctly

---

### Milestone 7: Theme System (Light/Dark Mode)
**Status**: 🔴 Not Started  
**Estimated Time**: 1.5 hours

#### Tasks
- [ ] Implement CSS custom properties for theming
- [ ] Add theme toggle button
- [ ] Detect system preference (`prefers-color-scheme`)
- [ ] Implement smooth theme transitions
- [ ] Persist theme preference
- [ ] Update meta theme-color dynamically

#### Deliverables
- Complete theme system
- Accessible color schemes

#### Acceptance Criteria
- [ ] Light and dark modes look correct
- [ ] System preference is respected
- [ ] Manual toggle overrides system
- [ ] Theme persists across sessions
- [ ] All colors meet WCAG AA contrast

---

### Milestone 8: PWA Setup
**Status**: 🔴 Not Started  
**Estimated Time**: 2 hours

#### Tasks
- [ ] Create `manifest.json` with app metadata
- [ ] Generate placeholder icons (192x192, 512x512)
- [ ] Create `sw.js` service worker
- [ ] Implement cache-first strategy
- [ ] Add install prompt handling
- [ ] Test offline functionality

#### Deliverables
- `manifest.json` - PWA manifest
- `sw.js` - Service worker
- `icons/` - App icons

#### Acceptance Criteria
- [ ] App is installable on mobile and desktop
- [ ] App works offline
- [ ] Icons display correctly
- [ ] Lighthouse PWA score > 90

---

### Milestone 9: Final Polish & Testing
**Status**: 🔴 Not Started  
**Estimated Time**: 2 hours

#### Tasks
- [ ] Cross-browser testing (Chrome, Firefox, Safari, Edge)
- [ ] Mobile device testing (iOS Safari, Android Chrome)
- [ ] Performance optimization
- [ ] Final accessibility review
- [ ] Code cleanup and comments
- [ ] Update README with usage instructions

#### Deliverables
- Production-ready application

#### Acceptance Criteria
- [ ] Works on all major browsers
- [ ] No console errors
- [ ] Lighthouse scores > 90 (all categories)
- [ ] README is complete

---

## File Structure

```
speed-reader/
├── index.html              # Main HTML file
├── css/
│   └── styles.css          # All styles (variables, components, responsive)
├── js/
│   ├── app.js              # Main application controller
│   ├── reader.js           # RSVP engine
│   └── storage.js          # LocalStorage utilities
├── icons/
│   ├── icon-192.png        # PWA icon (192x192)
│   ├── icon-512.png        # PWA icon (512x512)
│   └── favicon.svg         # Favicon
├── manifest.json           # PWA manifest
├── sw.js                   # Service worker
├── AGENTS.md               # This file
└── README.md               # User documentation
```

---

## API & Algorithm Specifications

### Text Parsing

```javascript
/**
 * Parse input text into an array of words
 * @param {string} text - Raw input text
 * @returns {string[]} Array of words
 */
function parseText(text) {
  return text
    .trim()
    .split(/\s+/)
    .filter(word => word.length > 0);
}
```

### ORP Calculation

```javascript
/**
 * Calculate the Optimal Recognition Point (middle letter index)
 * @param {string} word - The word to analyze
 * @returns {number} Index of the letter to highlight
 */
function getORPIndex(word) {
  // Remove punctuation for calculation
  const cleanWord = word.replace(/[^\w]/g, '');
  const length = cleanWord.length;
  
  if (length <= 1) return 0;
  if (length <= 3) return 1;
  
  // Middle index (or just before middle for even length)
  return Math.floor((length - 1) / 2);
}

// The actual character index in the original word
// needs to account for any leading punctuation
function getHighlightIndex(word) {
  const leadingPunct = word.match(/^[^\w]*/)[0].length;
  return leadingPunct + getORPIndex(word);
}
```

### Word Display with Highlight

```javascript
/**
 * Render a word with the ORP letter highlighted
 * @param {string} word - The word to display
 * @param {HTMLElement} container - The display container
 */
function renderWord(word, container) {
  const highlightIndex = getHighlightIndex(word);
  
  const before = word.substring(0, highlightIndex);
  const highlight = word[highlightIndex] || '';
  const after = word.substring(highlightIndex + 1);
  
  container.innerHTML = `
    <span class="word-before">${before}</span>
    <span class="word-highlight">${highlight}</span>
    <span class="word-after">${after}</span>
  `;
}
```

### Timing Calculation

```javascript
/**
 * Calculate display duration for a word
 * @param {string} word - The word being displayed
 * @param {number} wpm - Words per minute setting
 * @returns {number} Duration in milliseconds
 */
function getWordDuration(word, wpm) {
  const baseDelay = 60000 / wpm;
  
  // Strip trailing quotes/brackets to find actual punctuation
  // Handles cases like: "Hello," or (end). or 'word'
  const cleanWord = word.replace(/['"“”’\)\]]+$/, '');
  const lastChar = cleanWord[cleanWord.length - 1];
  
  const punctuationMultipliers = {
    '.': 2.0,
    '!': 2.0,
    '?': 2.0,
    ',': 1.5,
    ';': 1.5,
    ':': 1.5,
    '—': 1.3,
    '-': 1.2
  };
  
  const multiplier = punctuationMultipliers[lastChar] || 1.0;
  
  return baseDelay * multiplier;
}
```

### Precision Timing (Delta-Time Correction)

At high WPM (e.g., 1000 WPM = 60ms/word), standard `setTimeout` can drift. Use delta-time correction:

```javascript
/**
 * RSVP timing engine with drift correction
 * Ensures accurate WPM even at high speeds
 */
class RSVPTimer {
  constructor() {
    this.expectedTime = 0;
    this.timeoutId = null;
  }
  
  start(displayCallback, getNextDuration) {
    this.expectedTime = Date.now();
    this.scheduleNext(displayCallback, getNextDuration);
  }
  
  scheduleNext(displayCallback, getNextDuration) {
    const duration = getNextDuration();
    if (duration === null) return; // End of text
    
    const now = Date.now();
    const drift = now - this.expectedTime;
    const delay = Math.max(0, duration - drift);
    
    this.expectedTime += duration;
    
    this.timeoutId = setTimeout(() => {
      displayCallback();
      this.scheduleNext(displayCallback, getNextDuration);
    }, delay);
  }
  
  stop() {
    if (this.timeoutId) {
      clearTimeout(this.timeoutId);
      this.timeoutId = null;
    }
  }
}
```

### Progress Calculation

```javascript
/**
 * Calculate reading progress and time remaining
 * @param {number} currentIndex - Current word index
 * @param {number} totalWords - Total number of words
 * @param {number} wpm - Words per minute
 * @returns {Object} Progress data
 */
function getProgress(currentIndex, totalWords, wpm) {
  const percentage = (currentIndex / totalWords) * 100;
  const remainingWords = totalWords - currentIndex;
  const remainingSeconds = (remainingWords / wpm) * 60;
  
  return {
    percentage: Math.round(percentage),
    currentWord: currentIndex + 1,
    totalWords,
    remainingTime: formatTime(remainingSeconds)
  };
}

function formatTime(seconds) {
  const mins = Math.floor(seconds / 60);
  const secs = Math.round(seconds % 60);
  return `${mins}:${secs.toString().padStart(2, '0')}`;
}
```

---

## Testing Checklist

### Functional Tests

- [ ] Text input accepts pasted content
- [ ] Word count updates correctly
- [ ] Start button initiates reading
- [ ] Words display one at a time
- [ ] Middle letter is highlighted
- [ ] Punctuation adds delay
- [ ] Play/pause works
- [ ] Previous/next word navigation works
- [ ] Progress bar updates
- [ ] Time remaining is accurate
- [ ] WPM slider changes speed
- [ ] Font size changes apply
- [ ] Theme toggle works
- [ ] Settings persist after reload
- [ ] Fullscreen mode works

### Accessibility Tests

- [ ] All buttons have accessible names
- [ ] Keyboard navigation works throughout
- [ ] Focus is visible on all elements
- [ ] Color contrast meets WCAG AA
- [ ] Reduced motion is respected

### PWA Tests

- [ ] App installs on Android
- [ ] App installs on iOS (Add to Home Screen)
- [ ] App installs on desktop (Chrome)
- [ ] App works offline
- [ ] Icons display correctly

### Browser Tests

- [ ] Chrome (latest)
- [ ] Firefox (latest)
- [ ] Safari (latest)
- [ ] Edge (latest)
- [ ] iOS Safari
- [ ] Android Chrome

### Device Tests

- [ ] iPhone (various sizes)
- [ ] Android phone
- [ ] iPad
- [ ] Android tablet
- [ ] Desktop (various resolutions)

---

## Deployment Notes

### Requirements for Full PWA Functionality

1. **HTTPS Required**: Service workers require HTTPS
2. **Recommended Hosting**: 
   - GitHub Pages (free, HTTPS included)
   - Netlify (free tier, HTTPS included)
   - Vercel (free tier, HTTPS included)

### GitHub Pages Deployment

```bash
# Push to main branch, then enable GitHub Pages in repo settings
# Or use gh-pages branch:
git subtree push --prefix . origin gh-pages
```

### Lighthouse Audit Targets

| Category | Target Score |
|----------|-------------|
| Performance | > 90 |
| Accessibility | > 95 |
| Best Practices | > 95 |
| SEO | > 90 |
| PWA | > 90 |

---

## Changelog

| Date | Version | Changes |
|------|---------|---------|
| 2026-01-15 | 0.1.0 | Initial requirements document |

---

## References

- [WCAG 2.1 Guidelines](https://www.w3.org/WAI/WCAG21/quickref/)
- [PWA Documentation](https://web.dev/progressive-web-apps/)
- [RSVP Speed Reading Research](https://en.wikipedia.org/wiki/Rapid_serial_visual_presentation)
