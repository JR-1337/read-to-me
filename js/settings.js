const Settings = (() => {
  const STORAGE_KEY = 'rtm_settings';

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
    return get().setupComplete === true && get().apiKey !== '';
  }

  function clear() {
    localStorage.removeItem(STORAGE_KEY);
  }

  return { get, set, isSetupComplete, clear };
})();
