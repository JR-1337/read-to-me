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
    readerView: $('reader-view'),
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

  // Reader view state
  let activeChunkEl = null;
  let activeWordEl = null;
  let chunkElements = [];

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

  // ─── Reader View ───

  function buildReaderView(fullText, chunks) {
    els.readerView.innerHTML = '';
    chunkElements = [];

    // Map each chunk to a span with word spans inside
    for (let i = 0; i < chunks.length; i++) {
      const chunkSpan = document.createElement('span');
      chunkSpan.className = 'chunk';
      chunkSpan.dataset.index = i;

      // Split into words and whitespace, wrap each word
      const tokens = chunks[i].split(/(\s+)/);
      for (const token of tokens) {
        if (token.trim().length === 0) {
          // Whitespace — add as text node
          chunkSpan.appendChild(document.createTextNode(token));
        } else {
          const wordSpan = document.createElement('span');
          wordSpan.className = 'word';
          wordSpan.textContent = token;
          chunkSpan.appendChild(wordSpan);
        }
      }

      els.readerView.appendChild(chunkSpan);
      chunkElements.push(chunkSpan);

      // Add space between chunks
      if (i < chunks.length - 1) {
        els.readerView.appendChild(document.createTextNode(' '));
      }
    }
  }

  function showReaderView() {
    els.textInput.hidden = true;
    els.readerView.hidden = false;
  }

  function hideReaderView() {
    els.textInput.hidden = false;
    els.readerView.hidden = true;
    activeChunkEl = null;
    activeWordEl = null;
  }

  function highlightChunk(chunkIndex) {
    // Remove previous chunk highlight
    if (activeChunkEl) {
      activeChunkEl.classList.remove('active');
    }
    if (activeWordEl) {
      activeWordEl.classList.remove('active');
      activeWordEl = null;
    }

    // Highlight new chunk
    if (chunkIndex < chunkElements.length) {
      activeChunkEl = chunkElements[chunkIndex];
      activeChunkEl.classList.add('active');

      // Scroll chunk into view
      activeChunkEl.scrollIntoView({ behavior: 'smooth', block: 'center' });
    }
  }

  function highlightWord(wordIndex) {
    if (!activeChunkEl) return;

    // Remove previous word highlight
    if (activeWordEl) {
      activeWordEl.classList.remove('active');
    }

    // Get all word spans in the active chunk
    const wordSpans = activeChunkEl.querySelectorAll('.word');
    if (wordIndex < wordSpans.length) {
      activeWordEl = wordSpans[wordIndex];
      activeWordEl.classList.add('active');

      // Scroll word into view within the reader
      activeWordEl.scrollIntoView({ behavior: 'smooth', block: 'nearest' });
    }
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

    if (voicesCache.length === 0) {
      try {
        await loadVoices(settings.apiKey);
      } catch (err) {
        showError('Could not load voices: ' + err.message);
        return;
      }
    }

    populateLangFilter(voicesCache, els.langFilter, settings.languageCode);
    filterVoices(voicesCache, els.langFilter.value, els.voiceSelect, settings.voiceName);

    els.speedControl.value = settings.speakingRate;
    els.speedDisplay.textContent = settings.speakingRate.toFixed(1) + 'x';

    Player.init(els.audioEl, {
      onProgress: (current, total) => {
        els.progressContainer.hidden = false;
        const pct = total > 0 ? (current / total) * 100 : 0;
        els.progressFill.style.width = pct + '%';
        els.progressText.textContent = `${current} / ${total}`;
      },
      onStateChange: (newState, fullText) => {
        updatePlaybackUI(newState);

        if (newState === 'playing' && fullText) {
          // First play — build reader view
          const chunks = Player.getQueue();
          if (chunks.length > 0) {
            buildReaderView(fullText, chunks);
            showReaderView();
          }
        } else if (newState === 'stopped') {
          hideReaderView();
        }
      },
      onChunkStart: (chunkIndex) => {
        highlightChunk(chunkIndex);
      },
      onWordUpdate: (wordIndex) => {
        highlightWord(wordIndex);
      },
      onError: showError
    });
  }

  function wireMainEvents() {
    els.langFilter.addEventListener('change', () => {
      const settings = Settings.get();
      filterVoices(voicesCache, els.langFilter.value, els.voiceSelect, settings.voiceName);
      Settings.set({ languageCode: els.langFilter.value });
    });

    els.voiceSelect.addEventListener('change', () => {
      Settings.set({ voiceName: els.voiceSelect.value });
    });

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

    els.btnPause.addEventListener('click', () => Player.pause());
    els.btnResume.addEventListener('click', () => Player.resume());
    els.btnStop.addEventListener('click', () => Player.stop());

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
