/**
 * Main Application Controller
 * Handles UI interactions, view management, and settings
 */

const App = {
  // DOM Elements
  elements: {},
  
  // Current settings
  settings: {},

  /**
   * Initialize the application
   */
  init() {
    this.cacheElements();
    this.loadSettings();
    this.initTheme();
    this.bindEvents();
    this.setupReaderCallbacks();
    this.checkBookmarkletData();
    this.generateBookmarklet();
    this.updateWordCount();
  },

  /**
   * Cache DOM elements for performance
   */
  cacheElements() {
    this.elements = {
      // Views
      inputView: document.getElementById('inputView'),
      readerView: document.getElementById('readerView'),
      
      // Input View
      textInput: document.getElementById('textInput'),
      wordCount: document.getElementById('wordCount'),
      clearBtn: document.getElementById('clearBtn'),
      pasteBtn: document.getElementById('pasteBtn'),
      startBtn: document.getElementById('startBtn'),
      
      // Reader View
      wordDisplay: document.getElementById('wordDisplay'),
      wordBefore: document.querySelector('.word-display__before'),
      wordHighlight: document.querySelector('.word-display__highlight'),
      wordAfter: document.querySelector('.word-display__after'),
      fixationPoint: document.getElementById('fixationPoint'),
      
      // Progress
      wordProgress: document.getElementById('wordProgress'),
      timeRemaining: document.getElementById('timeRemaining'),
      progressFill: document.getElementById('progressFill'),
      progressPercent: document.getElementById('progressPercent'),
      
      // Controls
      restartBtn: document.getElementById('restartBtn'),
      playPauseBtn: document.getElementById('playPauseBtn'),
      playIcon: document.querySelector('.play-icon'),
      pauseIcon: document.querySelector('.pause-icon'),
      endBtn: document.getElementById('endBtn'),
      backBtn: document.getElementById('backBtn'),
      
      // Settings
      wpmSlider: document.getElementById('wpmSlider'),
      wpmValue: document.getElementById('wpmValue'),
      fontSizeOptions: document.getElementById('fontSizeOptions'),
      highlightToggle: document.getElementById('highlightToggle'),
      fixationToggle: document.getElementById('fixationToggle'),
      
      // Theme
      themeToggle: document.getElementById('themeToggle'),
      
      // Bookmarklet
      bookmarkletLink: document.getElementById('bookmarkletLink')
    };
  },

  /**
   * Load settings from storage
   */
  loadSettings() {
    this.settings = Storage.getSettings();
    this.applySettings();
  },

  /**
   * Apply settings to UI
   */
  applySettings() {
    // WPM
    this.elements.wpmSlider.value = this.settings.wpm;
    this.elements.wpmValue.textContent = `${this.settings.wpm} WPM`;
    
    // Font Size
    this.elements.wordDisplay.dataset.size = this.settings.fontSize;
    this.updateFontSizeButtons();
    
    // Highlight Focus
    this.elements.highlightToggle.setAttribute('aria-pressed', this.settings.highlightFocus);
    this.updateHighlightDisplay();
    
    // Fixation Point
    this.elements.fixationToggle.setAttribute('aria-pressed', this.settings.fixationPoint);
    this.updateFixationPoint();
  },

  /**
   * Initialize theme based on preference
   */
  initTheme() {
    const savedTheme = Storage.getTheme();
    
    if (savedTheme === 'dark') {
      document.documentElement.setAttribute('data-theme', 'dark');
    } else if (savedTheme === 'light') {
      document.documentElement.setAttribute('data-theme', 'light');
    } else {
      // System preference
      if (window.matchMedia('(prefers-color-scheme: dark)').matches) {
        document.documentElement.setAttribute('data-theme', 'dark');
      } else {
        document.documentElement.removeAttribute('data-theme');
      }
    }
    
    // Listen for system theme changes
    window.matchMedia('(prefers-color-scheme: dark)').addEventListener('change', (e) => {
      if (Storage.getTheme() === 'system') {
        if (e.matches) {
          document.documentElement.setAttribute('data-theme', 'dark');
        } else {
          document.documentElement.removeAttribute('data-theme');
        }
      }
    });
  },

  /**
   * Bind event listeners
   */
  bindEvents() {
    // Input View
    this.elements.textInput.addEventListener('input', () => this.updateWordCount());
    this.elements.clearBtn.addEventListener('click', () => this.clearInput());
    this.elements.pasteBtn.addEventListener('click', () => this.pasteFromClipboard());
    this.elements.startBtn.addEventListener('click', () => this.startReading());
    
    // Reader Controls
    this.elements.restartBtn.addEventListener('click', () => this.restart());
    this.elements.playPauseBtn.addEventListener('click', () => this.togglePlayPause());
    this.elements.endBtn.addEventListener('click', () => this.goToEnd());
    this.elements.backBtn.addEventListener('click', () => this.showInputView());
    
    // Settings
    this.elements.wpmSlider.addEventListener('input', (e) => this.updateWPM(e.target.value));
    this.elements.fontSizeOptions.addEventListener('click', (e) => this.handleFontSizeClick(e));
    this.elements.highlightToggle.addEventListener('click', () => this.toggleHighlight());
    this.elements.fixationToggle.addEventListener('click', () => this.toggleFixation());
    
    // Theme
    this.elements.themeToggle.addEventListener('click', () => this.toggleTheme());
    
    // Keyboard shortcuts
    document.addEventListener('keydown', (e) => this.handleKeyboard(e));
  },

  /**
   * Setup Reader callbacks
   */
  setupReaderCallbacks() {
    Reader.onWordChange = (wordParts) => {
      this.elements.wordBefore.textContent = wordParts.before;
      this.elements.wordHighlight.textContent = wordParts.highlight;
      this.elements.wordAfter.textContent = wordParts.after;
    };
    
    Reader.onProgress = (progress) => {
      this.elements.wordProgress.textContent = `${progress.currentWord} of ${progress.totalWords} words`;
      this.elements.timeRemaining.textContent = `${progress.remainingTime} remaining`;
      this.elements.progressFill.style.width = `${progress.percentage}%`;
      this.elements.progressPercent.textContent = `${progress.percentage}%`;
    };
    
    Reader.onComplete = () => {
      this.updatePlayPauseButton(false);
    };
    
    Reader.getWPM = () => this.settings.wpm;
  },

  /**
   * Update word count display
   */
  updateWordCount() {
    const text = this.elements.textInput.value.trim();
    const words = text ? text.split(/\s+/).filter(w => w.length > 0) : [];
    const count = words.length;
    
    this.elements.wordCount.textContent = `${count} word${count !== 1 ? 's' : ''}`;
    this.elements.startBtn.disabled = count === 0;
  },

  /**
   * Clear input textarea
   */
  clearInput() {
    this.elements.textInput.value = '';
    this.updateWordCount();
    this.elements.textInput.focus();
  },

  /**
   * Paste text from clipboard
   */
  async pasteFromClipboard() {
    try {
      const text = await navigator.clipboard.readText();
      this.elements.textInput.value = text;
      this.updateWordCount();
      this.elements.textInput.focus();
    } catch (err) {
      console.error('Failed to read clipboard:', err);
    }
  },

  /**
   * Start reading - switch to reader view
   */
  startReading() {
    const text = this.elements.textInput.value.trim();
    if (!text) return;
    
    Reader.init(text);
    this.showReaderView();
    
    // Display first word
    Reader.displayWordAt(0, this.settings.wpm);
  },

  /**
   * Show input view
   */
  showInputView() {
    Reader.stop();
    this.updatePlayPauseButton(false);
    
    this.elements.readerView.classList.add('hidden');
    this.elements.inputView.classList.remove('hidden');
    this.elements.textInput.focus();
  },

  /**
   * Show reader view
   */
  showReaderView() {
    this.elements.inputView.classList.add('hidden');
    this.elements.readerView.classList.remove('hidden');
  },

  /**
   * Toggle play/pause
   */
  togglePlayPause() {
    if (Reader.isPlaying) {
      Reader.pause();
      this.updatePlayPauseButton(false);
    } else {
      Reader.play();
      this.updatePlayPauseButton(true);
    }
  },

  /**
   * Update play/pause button state
   * @param {boolean} isPlaying
   */
  updatePlayPauseButton(isPlaying) {
    if (isPlaying) {
      this.elements.playIcon.classList.add('hidden');
      this.elements.pauseIcon.classList.remove('hidden');
      this.elements.playPauseBtn.setAttribute('aria-label', 'Pause');
    } else {
      this.elements.playIcon.classList.remove('hidden');
      this.elements.pauseIcon.classList.add('hidden');
      this.elements.playPauseBtn.setAttribute('aria-label', 'Play');
    }
  },

  /**
   * Restart reading
   */
  restart() {
    Reader.restart();
    this.updatePlayPauseButton(false);
    Reader.displayWordAt(0, this.settings.wpm);
  },

  /**
   * Go to end
   */
  goToEnd() {
    Reader.goToEnd();
    this.updatePlayPauseButton(false);
  },

  /**
   * Update WPM setting
   * @param {number} value
   */
  updateWPM(value) {
    this.settings.wpm = parseInt(value, 10);
    this.elements.wpmValue.textContent = `${this.settings.wpm} WPM`;
    Storage.updateSetting('wpm', this.settings.wpm);
  },

  /**
   * Handle font size button click
   * @param {Event} e
   */
  handleFontSizeClick(e) {
    const btn = e.target.closest('.setting__option');
    if (!btn) return;
    
    const size = btn.dataset.size;
    this.settings.fontSize = size;
    this.elements.wordDisplay.dataset.size = size;
    this.updateFontSizeButtons();
    Storage.updateSetting('fontSize', size);
  },

  /**
   * Update font size button states
   */
  updateFontSizeButtons() {
    const buttons = this.elements.fontSizeOptions.querySelectorAll('.setting__option');
    buttons.forEach(btn => {
      if (btn.dataset.size === this.settings.fontSize) {
        btn.classList.add('setting__option--active');
      } else {
        btn.classList.remove('setting__option--active');
      }
    });
  },

  /**
   * Toggle highlight focus
   */
  toggleHighlight() {
    this.settings.highlightFocus = !this.settings.highlightFocus;
    this.elements.highlightToggle.setAttribute('aria-pressed', this.settings.highlightFocus);
    this.updateHighlightDisplay();
    Storage.updateSetting('highlightFocus', this.settings.highlightFocus);
  },

  /**
   * Update highlight display based on setting
   */
  updateHighlightDisplay() {
    if (this.settings.highlightFocus) {
      this.elements.wordDisplay.classList.remove('word-display--no-highlight');
    } else {
      this.elements.wordDisplay.classList.add('word-display--no-highlight');
    }
  },

  /**
   * Toggle fixation point
   */
  toggleFixation() {
    this.settings.fixationPoint = !this.settings.fixationPoint;
    this.elements.fixationToggle.setAttribute('aria-pressed', this.settings.fixationPoint);
    this.updateFixationPoint();
    Storage.updateSetting('fixationPoint', this.settings.fixationPoint);
  },

  /**
   * Update fixation point visibility
   */
  updateFixationPoint() {
    if (this.settings.fixationPoint) {
      this.elements.fixationPoint.classList.remove('hidden');
    } else {
      this.elements.fixationPoint.classList.add('hidden');
    }
  },

  /**
   * Toggle theme
   */
  toggleTheme() {
    const currentTheme = document.documentElement.getAttribute('data-theme');
    
    if (currentTheme === 'dark') {
      document.documentElement.removeAttribute('data-theme');
      Storage.saveTheme('light');
    } else {
      document.documentElement.setAttribute('data-theme', 'dark');
      Storage.saveTheme('dark');
    }
  },

  /**
   * Handle keyboard shortcuts
   * @param {KeyboardEvent} e
   */
  handleKeyboard(e) {
    // Only handle shortcuts when reader view is visible
    if (this.elements.readerView.classList.contains('hidden')) return;
    
    // Don't handle if user is typing in an input
    if (e.target.tagName === 'INPUT' || e.target.tagName === 'TEXTAREA') return;
    
    switch (e.key) {
      case ' ':
        e.preventDefault();
        this.togglePlayPause();
        break;
      case 'Home':
      case 'r':
      case 'R':
        e.preventDefault();
        this.restart();
        break;
      case 'End':
      case 'e':
      case 'E':
        e.preventDefault();
        this.goToEnd();
        break;
      case 'Escape':
        e.preventDefault();
        this.showInputView();
        break;
    }
  },

  /**
   * Check for bookmarklet data on page load
   */
  checkBookmarkletData() {
    // Check if opened via bookmarklet (hash flag)
    if (window.location.hash === '#speedread') {
      // Clear the hash without triggering reload
      history.replaceState(null, '', window.location.pathname);
      
      // Auto-read from clipboard
      navigator.clipboard.readText().then(text => {
        if (text && text.trim()) {
          // Store text in textarea (for back button functionality)
          this.elements.textInput.value = text;
          this.updateWordCount();
          
          // Directly start reading - skip input view
          this.startReadingDirect(text);
        }
      }).catch(err => {
        console.error('Failed to read clipboard:', err);
        // Fallback: user can manually paste
      });
    }
  },

  /**
   * Start reading directly (used by bookmarklet)
   * @param {string} text - Text to read
   */
  startReadingDirect(text) {
    if (!text || !text.trim()) return;
    
    Reader.init(text);
    this.showReaderView();
    
    // Display first word
    Reader.displayWordAt(0, this.settings.wpm);
  },

  /**
   * Generate bookmarklet code and set href
   */
  generateBookmarklet() {
    const appUrl = window.location.origin + window.location.pathname;
    
    // Bookmarklet code - uses clipboard approach for cross-origin reliability
    // 1. Load Readability from CDN
    // 2. Extract text content
    // 3. Copy text to clipboard
    // 4. Open app with #speedread hash flag
    // 5. App auto-reads from clipboard on load
    const bookmarkletCode = `javascript:(function(){
      var appUrl='${appUrl}';
      var s=document.createElement('script');
      s.src='https://cdn.jsdelivr.net/npm/@mozilla/readability/Readability.js';
      s.onload=function(){
        try{
          var clone=document.cloneNode(true);
          var article=new Readability(clone).parse();
          if(article&&article.textContent){
            var text=article.textContent.trim();
            if(text.length>0){
              navigator.clipboard.writeText(text).then(function(){
                window.open(appUrl+'#speedread','_blank');
              }).catch(function(){
                alert('Could not copy to clipboard. Please copy the text manually.');
              });
            }else{alert('No readable content found on this page.');}
          }else{alert('Could not extract content from this page.');}
        }catch(e){alert('Error: '+e.message);}
      };
      s.onerror=function(){alert('Failed to load Readability library.');};
      document.head.appendChild(s);
    })();`;
    
    // Encode and set href
    const encoded = bookmarkletCode.replace(/\\s+/g, ' ').trim();
    this.elements.bookmarkletLink.href = encoded;
  }
};

// Initialize app when DOM is ready
document.addEventListener('DOMContentLoaded', () => App.init());
