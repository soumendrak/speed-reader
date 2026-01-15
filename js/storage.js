/**
 * Storage Module
 * Handles LocalStorage operations for persisting user settings
 */

const Storage = {
  KEYS: {
    SETTINGS: 'speedreader_settings',
    THEME: 'speedreader_theme'
  },

  DEFAULT_SETTINGS: {
    wpm: 300,
    fontSize: 'medium',
    highlightFocus: true,
    fixationPoint: false
  },

  /**
   * Get all settings from LocalStorage
   * @returns {Object} Settings object with defaults applied
   */
  getSettings() {
    try {
      const stored = localStorage.getItem(this.KEYS.SETTINGS);
      if (stored) {
        return { ...this.DEFAULT_SETTINGS, ...JSON.parse(stored) };
      }
    } catch (e) {
      console.warn('Failed to load settings:', e);
    }
    return { ...this.DEFAULT_SETTINGS };
  },

  /**
   * Save settings to LocalStorage
   * @param {Object} settings - Settings object to save
   */
  saveSettings(settings) {
    try {
      localStorage.setItem(this.KEYS.SETTINGS, JSON.stringify(settings));
    } catch (e) {
      console.warn('Failed to save settings:', e);
    }
  },

  /**
   * Update a single setting
   * @param {string} key - Setting key
   * @param {*} value - Setting value
   */
  updateSetting(key, value) {
    const settings = this.getSettings();
    settings[key] = value;
    this.saveSettings(settings);
  },

  /**
   * Get theme preference
   * @returns {string} 'light', 'dark', or 'system'
   */
  getTheme() {
    try {
      return localStorage.getItem(this.KEYS.THEME) || 'system';
    } catch (e) {
      return 'system';
    }
  },

  /**
   * Save theme preference
   * @param {string} theme - 'light', 'dark', or 'system'
   */
  saveTheme(theme) {
    try {
      localStorage.setItem(this.KEYS.THEME, theme);
    } catch (e) {
      console.warn('Failed to save theme:', e);
    }
  }
};
