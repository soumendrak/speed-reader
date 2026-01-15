/**
 * RSVP Reader Engine
 * Handles text parsing, word display timing, and ORP calculation
 */

const Reader = {
  words: [],
  currentIndex: 0,
  isPlaying: false,
  timer: null,
  expectedTime: 0,
  
  // Callbacks
  onWordChange: null,
  onProgress: null,
  onComplete: null,
  getWPM: null,

  /**
   * Remove citation patterns like [1], [2], [123] and URLs from text
   * @param {string} text - Raw input text
   * @returns {string} Text with citations and URLs removed
   */
  removeCitations(text) {
    return text
      .replace(/\[\d+\]/g, '')                          // Remove [1], [2], [123] etc.
      .replace(/https?:\/\/[^\s]+/g, '')                // Remove http:// and https:// URLs
      .replace(/www\.[^\s]+/g, '');                     // Remove www. URLs
  },

  /**
   * Parse input text into an array of words
   * @param {string} text - Raw input text
   * @returns {string[]} Array of words
   */
  parseText(text) {
    return this.removeCitations(text)
      .trim()
      .split(/\s+/)
      .filter(word => word.length > 0);
  },

  /**
   * Initialize the reader with text
   * @param {string} text - Text to read
   */
  init(text) {
    this.words = this.parseText(text);
    this.currentIndex = 0;
    this.isPlaying = false;
    this.stop();
  },

  /**
   * Get the total word count
   * @returns {number}
   */
  getTotalWords() {
    return this.words.length;
  },

  /**
   * Get the current word
   * @returns {string|null}
   */
  getCurrentWord() {
    if (this.currentIndex < this.words.length) {
      return this.words[this.currentIndex];
    }
    return null;
  },

  /**
   * Calculate the Optimal Recognition Point (Spritz-style, first third of word)
   * Based on research: ORP is slightly left of center for fastest word recognition
   * @param {string} word - The word to analyze
   * @returns {number} Index of the letter to highlight
   */
  getORPIndex(word) {
    // Remove punctuation for calculation
    const cleanWord = word.replace(/[^\w]/g, '');
    const length = cleanWord.length;
    
    // Spritz-style ORP: positioned at roughly first third of word
    if (length <= 1) return 0;       // 1 letter: highlight it
    if (length <= 5) return 1;       // 2-5 letters: 2nd letter (index 1)
    if (length <= 9) return 2;       // 6-9 letters: 3rd letter (index 2)
    if (length <= 13) return 3;      // 10-13 letters: 4th letter (index 3)
    return 4;                        // 14+ letters: 5th letter (index 4)
  },

  /**
   * Get the highlight index accounting for leading punctuation
   * @param {string} word - The word to analyze
   * @returns {number} Index in original word to highlight
   */
  getHighlightIndex(word) {
    const leadingPunct = word.match(/^[^\w]*/)[0].length;
    return leadingPunct + this.getORPIndex(word);
  },

  /**
   * Strip punctuation from word for display (keep letters only)
   * @param {string} word - The word to clean
   * @returns {string} Word with punctuation removed
   */
  stripPunctuation(word) {
    return word.replace(/[^\w]/g, '');
  },

  /**
   * Split word into parts for display (punctuation stripped)
   * @param {string} word - The word to split
   * @returns {Object} { before, highlight, after }
   */
  splitWord(word) {
    const cleanWord = this.stripPunctuation(word);
    const highlightIndex = this.getORPIndex(word);
    
    return {
      before: cleanWord.substring(0, highlightIndex),
      highlight: cleanWord[highlightIndex] || '',
      after: cleanWord.substring(highlightIndex + 1)
    };
  },

  /**
   * Calculate display duration for a word
   * @param {string} word - The word being displayed
   * @param {number} wpm - Words per minute setting
   * @returns {number} Duration in milliseconds
   */
  getWordDuration(word, wpm) {
    const baseDelay = 60000 / wpm;
    
    // Strip trailing quotes/brackets to find actual punctuation
    // Handles cases like: "Hello," or (end). or 'word'
    const cleanWord = word.replace(/['"""'\)\]]+$/, '');
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
  },

  /**
   * Calculate reading progress
   * @param {number} wpm - Words per minute
   * @returns {Object} Progress data
   */
  getProgress(wpm) {
    const totalWords = this.words.length;
    const percentage = totalWords > 0 ? (this.currentIndex / totalWords) * 100 : 0;
    const remainingWords = totalWords - this.currentIndex;
    const remainingSeconds = (remainingWords / wpm) * 60;
    
    return {
      percentage: Math.round(percentage),
      currentWord: this.currentIndex + 1,
      totalWords,
      remainingTime: this.formatTime(remainingSeconds)
    };
  },

  /**
   * Format seconds to MM:SS
   * @param {number} seconds
   * @returns {string}
   */
  formatTime(seconds) {
    const mins = Math.floor(seconds / 60);
    const secs = Math.round(seconds % 60);
    return `${mins}:${secs.toString().padStart(2, '0')}`;
  },

  /**
   * Start or resume playback with delta-time correction
   */
  play() {
    if (this.isPlaying) return;
    if (this.currentIndex >= this.words.length) {
      this.currentIndex = 0;
    }
    
    this.isPlaying = true;
    this.expectedTime = Date.now();
    this.scheduleNext();
  },

  /**
   * Schedule the next word display with drift correction
   * Fetches current WPM dynamically via getWPM callback
   */
  scheduleNext() {
    if (!this.isPlaying || this.currentIndex >= this.words.length) {
      this.isPlaying = false;
      if (this.currentIndex >= this.words.length && this.onComplete) {
        this.onComplete();
      }
      return;
    }

    // Get current WPM dynamically to support real-time speed changes
    const wpm = this.getWPM ? this.getWPM() : 300;

    const word = this.words[this.currentIndex];
    const duration = this.getWordDuration(word, wpm);
    
    // Calculate drift and adjust delay
    const now = Date.now();
    const drift = now - this.expectedTime;
    const delay = Math.max(0, duration - drift);
    
    this.expectedTime += duration;

    // Display current word
    if (this.onWordChange) {
      this.onWordChange(this.splitWord(word));
    }
    if (this.onProgress) {
      this.onProgress(this.getProgress(wpm));
    }

    // Schedule next word
    this.timer = setTimeout(() => {
      this.currentIndex++;
      this.scheduleNext();
    }, delay);
  },

  /**
   * Pause playback
   */
  pause() {
    this.isPlaying = false;
    if (this.timer) {
      clearTimeout(this.timer);
      this.timer = null;
    }
  },

  /**
   * Stop playback completely
   */
  stop() {
    this.pause();
    this.currentIndex = 0;
  },

  /**
   * Go to the beginning
   */
  restart() {
    this.pause();
    this.currentIndex = 0;
    
    if (this.words.length > 0 && this.onWordChange) {
      this.onWordChange(this.splitWord(this.words[0]));
    }
    if (this.onProgress) {
      this.onProgress(this.getProgress(300)); // Default WPM for display
    }
  },

  /**
   * Go to the end
   */
  goToEnd() {
    this.pause();
    this.currentIndex = Math.max(0, this.words.length - 1);
    
    if (this.words.length > 0 && this.onWordChange) {
      this.onWordChange(this.splitWord(this.words[this.currentIndex]));
    }
    if (this.onProgress) {
      this.onProgress(this.getProgress(300));
    }
  },

  /**
   * Display a specific word by index
   * @param {number} index - Word index
   * @param {number} wpm - Words per minute for progress calculation
   */
  displayWordAt(index, wpm) {
    if (index >= 0 && index < this.words.length) {
      this.currentIndex = index;
      if (this.onWordChange) {
        this.onWordChange(this.splitWord(this.words[index]));
      }
      if (this.onProgress) {
        this.onProgress(this.getProgress(wpm));
      }
    }
  }
};
