const Settings = (() => {
  const STORAGE_KEY = 'rtm_settings';
  const HISTORY_KEY = 'rtm_history';
  const MAX_HISTORY = 10;
  const MAX_HISTORY_TEXT_LEN = 50000;

  const DEFAULTS = {
    apiKey: '',
    voiceName: 'en-US-Neural2-C',
    languageCode: 'en-US',
    speakingRate: 1.0,
    setupComplete: false
  };

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
    const s = get();
    return s.setupComplete === true && s.apiKey !== '';
  }

  function clear() {
    localStorage.removeItem(STORAGE_KEY);
  }

  // ─── History ───

  function getHistory() {
    try {
      return JSON.parse(localStorage.getItem(HISTORY_KEY) || '[]');
    } catch {
      return [];
    }
  }

  function addHistory(text) {
    if (!text || text.length < 10) return;
    try {
      const preview = text.slice(0, 100).trim();
      const stored = text.length > MAX_HISTORY_TEXT_LEN ? text.slice(0, MAX_HISTORY_TEXT_LEN) : text;
      let history = getHistory();
      history = history.filter((h) => h.preview !== preview);
      history.unshift({ preview, text: stored, date: Date.now() });
      if (history.length > MAX_HISTORY) history.length = MAX_HISTORY;
      localStorage.setItem(HISTORY_KEY, JSON.stringify(history));
    } catch {
      // QuotaExceededError — silently ignore
    }
  }

  function removeHistory(index) {
    try {
      const history = getHistory();
      if (index >= 0 && index < history.length) {
        history.splice(index, 1);
        localStorage.setItem(HISTORY_KEY, JSON.stringify(history));
      }
    } catch {
      // ignore
    }
  }

  function clearHistory() {
    localStorage.removeItem(HISTORY_KEY);
  }

  // ─── Playback Position ───

  const POSITION_KEY = 'rtm_position';

  function savePosition(textHash, chunkIndex) {
    try {
      localStorage.setItem(POSITION_KEY, JSON.stringify({ textHash, chunkIndex }));
    } catch { /* ignore */ }
  }

  function getPosition() {
    try {
      return JSON.parse(localStorage.getItem(POSITION_KEY) || 'null');
    } catch {
      return null;
    }
  }

  function clearPosition() {
    localStorage.removeItem(POSITION_KEY);
  }

  return { get, set, isSetupComplete, clear, getHistory, addHistory, removeHistory, clearHistory, savePosition, getPosition, clearPosition };
})();
