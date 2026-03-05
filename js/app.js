(() => {
  // DOM refs
  const $ = (id) => document.getElementById(id);

  const views = {
    setup: $('view-setup'),
    main: $('view-main'),
    settings: $('view-settings')
  };

  const els = {
    errorBanner: $('error-banner'),
    // Setup
    setupApiKey: $('setup-api-key'),
    btnSetupSave: $('btn-setup-save'),
    // Main
    btnSettings: $('btn-settings'),
    textInput: $('text-input'),
    langFilter: $('lang-filter'),
    voiceSelect: $('voice-select'),
    speedControl: $('speed-control'),
    speedDisplay: $('speed-display'),
    btnPlay: $('btn-play'),
    btnPause: $('btn-pause'),
    btnResume: $('btn-resume'),
    btnStop: $('btn-stop'),
    progressContainer: $('progress-container'),
    progressFill: $('progress-fill'),
    progressText: $('progress-text'),
    audioEl: $('audio-el'),
    // Settings
    btnBack: $('btn-back'),
    settingsApiKey: $('settings-api-key'),
    settingsLang: $('settings-lang'),
    settingsVoice: $('settings-voice'),
    settingsSpeed: $('settings-speed'),
    settingsSpeedDisplay: $('settings-speed-display'),
    btnSaveSettings: $('btn-save-settings'),
    btnClearSettings: $('btn-clear-settings')
  };

  let voicesCache = [];
  let errorTimeout = null;

  // ─── View Management ───

  function showView(name) {
    Object.values(views).forEach((v) => v.classList.remove('active'));
    views[name].classList.add('active');
  }

  // ─── Error Display ───

  function showError(msg) {
    els.errorBanner.textContent = msg;
    els.errorBanner.classList.add('visible');
    if (errorTimeout) clearTimeout(errorTimeout);
    errorTimeout = setTimeout(() => {
      els.errorBanner.classList.remove('visible');
    }, 6000);
  }

  function hideError() {
    els.errorBanner.classList.remove('visible');
    if (errorTimeout) clearTimeout(errorTimeout);
  }

  // ─── Voice Loading ───

  async function loadVoices(apiKey) {
    const voices = await Api.listVoices(apiKey);
    voicesCache = voices;
    return voices;
  }

  function populateLangFilter(voices, selectEl, savedLang) {
    const langs = [...new Set(voices.map((v) => v.languageCodes[0]))].sort();
    selectEl.innerHTML = langs.map((l) =>
      `<option value="${l}" ${l === savedLang ? 'selected' : ''}>${l}</option>`
    ).join('');

    // If saved lang not in list, select first
    if (savedLang && !langs.includes(savedLang) && langs.length) {
      selectEl.value = langs[0];
    }
  }

  function filterVoices(voices, lang, selectEl, savedVoice) {
    const filtered = voices.filter((v) => v.languageCodes.includes(lang));
    selectEl.innerHTML = filtered.map((v) => {
      const type = Api.getVoiceType(v.name);
      return `<option value="${v.name}" ${v.name === savedVoice ? 'selected' : ''}>
        ${v.name} (${type})
      </option>`;
    }).join('');
  }

  // ─── Setup View ───

  function initSetup() {
    els.btnSetupSave.addEventListener('click', async () => {
      const apiKey = els.setupApiKey.value.trim();
      if (!apiKey) {
        showError('Please enter an API key');
        return;
      }

      els.btnSetupSave.textContent = 'Validating...';
      els.btnSetupSave.disabled = true;

      try {
        await loadVoices(apiKey);
        Settings.set({ apiKey, setupComplete: true });
        hideError();
        initMain();
        showView('main');
      } catch (err) {
        showError('Invalid API key: ' + err.message);
      } finally {
        els.btnSetupSave.textContent = 'Save & Start';
        els.btnSetupSave.disabled = false;
      }
    });
  }

  // ─── Main View ───

  async function initMain() {
    const settings = Settings.get();

    // Load voices if not cached
    if (voicesCache.length === 0) {
      try {
        await loadVoices(settings.apiKey);
      } catch (err) {
        showError('Could not load voices: ' + err.message);
        return;
      }
    }

    // Populate language filter & voice select
    populateLangFilter(voicesCache, els.langFilter, settings.languageCode);
    filterVoices(voicesCache, els.langFilter.value, els.voiceSelect, settings.voiceName);

    // Speed
    els.speedControl.value = settings.speakingRate;
    els.speedDisplay.textContent = settings.speakingRate.toFixed(1) + 'x';

    // Init player
    Player.init(els.audioEl, {
      onProgress: (current, total) => {
        els.progressContainer.hidden = false;
        const pct = total > 0 ? (current / total) * 100 : 0;
        els.progressFill.style.width = pct + '%';
        els.progressText.textContent = `${current} / ${total}`;
      },
      onStateChange: (newState) => {
        updatePlaybackUI(newState);
      },
      onError: showError
    });
  }

  function wireMainEvents() {
    // Language filter change
    els.langFilter.addEventListener('change', () => {
      const settings = Settings.get();
      filterVoices(voicesCache, els.langFilter.value, els.voiceSelect, settings.voiceName);
      Settings.set({ languageCode: els.langFilter.value });
    });

    // Voice change
    els.voiceSelect.addEventListener('change', () => {
      Settings.set({ voiceName: els.voiceSelect.value });
    });

    // Speed slider
    els.speedControl.addEventListener('input', () => {
      const val = parseFloat(els.speedControl.value);
      els.speedDisplay.textContent = val.toFixed(1) + 'x';
    });

    els.speedControl.addEventListener('change', () => {
      Settings.set({ speakingRate: parseFloat(els.speedControl.value) });
    });

    // Play — starts from cursor position or selection
    els.btnPlay.addEventListener('click', () => {
      const fullText = els.textInput.value.trim();
      if (!fullText) {
        showError('Paste some text first');
        return;
      }
      hideError();

      // If there's a cursor position or selection, start from there
      const start = els.textInput.selectionStart;
      const text = start > 0 ? els.textInput.value.slice(start).trim() : fullText;

      if (!text) {
        showError('No text after cursor position');
        return;
      }

      const settings = Settings.get();
      Player.play(text, {
        apiKey: settings.apiKey,
        voiceName: els.voiceSelect.value,
        languageCode: els.langFilter.value,
        speakingRate: parseFloat(els.speedControl.value)
      });
    });

    // Pause
    els.btnPause.addEventListener('click', () => Player.pause());

    // Resume
    els.btnResume.addEventListener('click', () => Player.resume());

    // Stop
    els.btnStop.addEventListener('click', () => Player.stop());

    // Settings button
    els.btnSettings.addEventListener('click', () => {
      openSettings();
      showView('settings');
    });
  }

  function updatePlaybackUI(state) {
    switch (state) {
      case 'playing':
        els.btnPlay.hidden = true;
        els.btnPause.hidden = false;
        els.btnResume.hidden = true;
        els.btnStop.hidden = false;
        break;
      case 'paused':
        els.btnPlay.hidden = true;
        els.btnPause.hidden = true;
        els.btnResume.hidden = false;
        els.btnStop.hidden = false;
        break;
      case 'stopped':
        els.btnPlay.hidden = false;
        els.btnPause.hidden = true;
        els.btnResume.hidden = true;
        els.btnStop.hidden = true;
        els.progressContainer.hidden = true;
        els.progressFill.style.width = '0%';
        break;
    }
  }

  // ─── Settings View ───

  function openSettings() {
    const settings = Settings.get();
    els.settingsApiKey.value = settings.apiKey;
    els.settingsSpeed.value = settings.speakingRate;
    els.settingsSpeedDisplay.textContent = settings.speakingRate.toFixed(1) + 'x';

    // Populate settings voice selectors
    if (voicesCache.length > 0) {
      populateLangFilter(voicesCache, els.settingsLang, settings.languageCode);
      filterVoices(voicesCache, els.settingsLang.value, els.settingsVoice, settings.voiceName);
    }
  }

  function wireSettingsEvents() {
    els.settingsLang.addEventListener('change', () => {
      const settings = Settings.get();
      filterVoices(voicesCache, els.settingsLang.value, els.settingsVoice, settings.voiceName);
    });

    els.settingsSpeed.addEventListener('input', () => {
      els.settingsSpeedDisplay.textContent = parseFloat(els.settingsSpeed.value).toFixed(1) + 'x';
    });

    els.btnSaveSettings.addEventListener('click', async () => {
      const apiKey = els.settingsApiKey.value.trim();
      if (!apiKey) {
        showError('API key cannot be empty');
        return;
      }

      els.btnSaveSettings.textContent = 'Saving...';
      els.btnSaveSettings.disabled = true;

      try {
        // Re-validate API key if changed
        const currentSettings = Settings.get();
        if (apiKey !== currentSettings.apiKey) {
          voicesCache = [];
          sessionStorage.removeItem('rtm_voices_cache');
          await loadVoices(apiKey);
        }

        Settings.set({
          apiKey,
          languageCode: els.settingsLang.value,
          voiceName: els.settingsVoice.value,
          speakingRate: parseFloat(els.settingsSpeed.value)
        });

        // Sync main view
        populateLangFilter(voicesCache, els.langFilter, els.settingsLang.value);
        filterVoices(voicesCache, els.settingsLang.value, els.voiceSelect, els.settingsVoice.value);
        els.speedControl.value = els.settingsSpeed.value;
        els.speedDisplay.textContent = parseFloat(els.settingsSpeed.value).toFixed(1) + 'x';

        hideError();
        showView('main');
      } catch (err) {
        showError('Invalid API key: ' + err.message);
      } finally {
        els.btnSaveSettings.textContent = 'Save Settings';
        els.btnSaveSettings.disabled = false;
      }
    });

    els.btnBack.addEventListener('click', () => {
      hideError();
      showView('main');
    });

    els.btnClearSettings.addEventListener('click', () => {
      if (confirm('Clear all settings and data? You will need to re-enter your API key.')) {
        Player.stop();
        Settings.clear();
        sessionStorage.removeItem('rtm_voices_cache');
        voicesCache = [];
        els.setupApiKey.value = '';
        showView('setup');
      }
    });
  }

  // ─── Init ───

  async function init() {
    wireMainEvents();
    wireSettingsEvents();

    if (Settings.isSetupComplete()) {
      showView('main');
      await initMain();
    } else {
      showView('setup');
    }
  }

  initSetup();
  document.addEventListener('DOMContentLoaded', init);
})();
