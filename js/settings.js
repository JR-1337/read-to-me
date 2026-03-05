const Settings = (() => {
  const STORAGE_KEY = 'rtm_settings';

  const DEFAULTS = {
    apiKey: '',
    voiceName: 'en-US-Neural2-C',
    languageCode: 'en-US',
    speakingRate: 1.0,
    pitch: 0,
    setupComplete: false
  };

  const HISTORY_KEY = 'rtm_history';
  const MAX_HISTORY = 10;

  function getHistory() {
    try {
      return JSON.parse(localStorage.getItem(HISTORY_KEY) || '[]');
    } catch {
      return [];
    }
  }

  function addHistory(text) {
    if (!text || text.length < 10) return;
    const preview = text.slice(0, 100).trim();
    let history = getHistory();
    // Remove duplicate if exists
    history = history.filter((h) => h.preview !== preview);
    history.unshift({ preview, text, date: Date.now() });
    if (history.length > MAX_HISTORY) history.length = MAX_HISTORY;
    localStorage.setItem(HISTORY_KEY, JSON.stringify(history));
  }

  function clearHistory() {
    localStorage.removeItem(HISTORY_KEY);
  }

  function get() {
    try {
      const stored = JSON.parse(localStorage.getItem(STORAGE_KEY) || '{}');
      return { ...DEFAULTS, ...stored };
    } catch {
      return { ...DEFAULTS };
    }
  }

  function set(patch) {
    const current = get();
    const updated = { ...current, ...patch };
    localStorage.setItem(STORAGE_KEY, JSON.stringify(updated));
    return updated;
  }

  function isSetupComplete() {
    return get().setupComplete === true && get().apiKey !== '';
  }

  function clear() {
    localStorage.removeItem(STORAGE_KEY);
  }

  return { get, set, isSetupComplete, clear, getHistory, addHistory, clearHistory };
})();
