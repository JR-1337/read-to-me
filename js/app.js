(() => {
  const $ = (id) => document.getElementById(id);

  const views = {
    setup: $('view-setup'),
    main: $('view-main'),
    history: $('view-history'),
    settings: $('view-settings')
  };

  const els = {
    errorBanner: $('error-banner'),
    // Setup
    setupApiKey: $('setup-api-key'),
    btnSetupSave: $('btn-setup-save'),
    // Main
    btnSettings: $('btn-settings'),
    btnHistory: $('btn-history'),
    btnPaste: $('btn-paste'),
    btnExpand: $('btn-expand'),
    textStats: $('text-stats'),
    textInput: $('text-input'),
    readerView: $('reader-view'),
    langFilter: $('lang-filter'),
    voiceSelect: $('voice-select'),
    speedControl: $('speed-control'),
    speedDisplay: $('speed-display'),
    pitchControl: $('pitch-control'),
    pitchDisplay: $('pitch-display'),
    btnPlay: $('btn-play'),
    btnPause: $('btn-pause'),
    btnResume: $('btn-resume'),
    btnStop: $('btn-stop'),
    btnDownload: $('btn-download'),
    progressContainer: $('progress-container'),
    progressFill: $('progress-fill'),
    progressText: $('progress-text'),
    audioEl: $('audio-el'),
    // History
    historyList: $('history-list'),
    btnHistoryBack: $('btn-history-back'),
    // Settings
    btnBack: $('btn-back'),
    settingsApiKey: $('settings-api-key'),
    settingsLang: $('settings-lang'),
    settingsVoice: $('settings-voice'),
    settingsSpeed: $('settings-speed'),
    settingsSpeedDisplay: $('settings-speed-display'),
    settingsPitch: $('settings-pitch'),
    settingsPitchDisplay: $('settings-pitch-display'),
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

  // ─── Text Stats ───

  function updateTextStats() {
    const text = els.textInput.value;
    if (!text) {
      els.textStats.textContent = '';
      return;
    }
    const chars = text.length;
    const words = text.trim().split(/\s+/).filter(Boolean).length;
    // Cost estimate: $16 per 1M chars for Neural2/WaveNet (free first 1M)
    const costCents = (chars / 1_000_000) * 1600;
    const costStr = costCents < 1 ? '<1\u00A2' : costCents.toFixed(1) + '\u00A2';
    els.textStats.textContent = `${words} words \u00B7 ${chars} chars \u00B7 ~${costStr}`;
  }

  // ─── Reader View ───

  function buildReaderView(fullText, chunks) {
    els.readerView.innerHTML = '';
    chunkElements = [];

    for (let i = 0; i < chunks.length; i++) {
      const chunkSpan = document.createElement('span');
      chunkSpan.className = 'chunk';
      chunkSpan.dataset.index = i;

      const tokens = chunks[i].split(/(\s+)/);
      for (const token of tokens) {
        if (token.trim().length === 0) {
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
    if (activeChunkEl) activeChunkEl.classList.remove('active');
    if (activeWordEl) {
      activeWordEl.classList.remove('active');
      activeWordEl = null;
    }
    if (chunkIndex < chunkElements.length) {
      activeChunkEl = chunkElements[chunkIndex];
      activeChunkEl.classList.add('active');
      activeChunkEl.scrollIntoView({ behavior: 'smooth', block: 'center' });
    }
  }

  function highlightWord(wordIndex) {
    if (!activeChunkEl) return;
    if (activeWordEl) activeWordEl.classList.remove('active');
    const wordSpans = activeChunkEl.querySelectorAll('.word');
    if (wordIndex < wordSpans.length) {
      activeWordEl = wordSpans[wordIndex];
      activeWordEl.classList.add('active');
      activeWordEl.scrollIntoView({ behavior: 'smooth', block: 'nearest' });
    }
  }

  // ─── Download MP3 ───

  function downloadAudio() {
    const chunks = Player.getAudioChunks();
    if (chunks.length === 0) {
      showError('No audio to download — play some text first');
      return;
    }

    // Combine all base64 chunks into a single blob
    const byteArrays = chunks.map((b64) => {
      const binary = atob(b64);
      const bytes = new Uint8Array(binary.length);
      for (let i = 0; i < binary.length; i++) {
        bytes[i] = binary.charCodeAt(i);
      }
      return bytes;
    });
    const blob = new Blob(byteArrays, { type: 'audio/mpeg' });

    // Prompt for filename
    const preview = els.textInput.value.trim().slice(0, 40).replace(/[^a-zA-Z0-9 ]/g, '').trim();
    const defaultName = (preview || 'read-to-me') + '.mp3';
    const filename = prompt('Save as:', defaultName);
    if (!filename) return;

    const url = URL.createObjectURL(blob);
    const a = document.createElement('a');
    a.href = url;
    a.download = filename.endsWith('.mp3') ? filename : filename + '.mp3';
    a.click();
    URL.revokeObjectURL(url);
  }

  // ─── History ───

  function renderHistory() {
    const history = Settings.getHistory();
    if (history.length === 0) {
      els.historyList.innerHTML = '<p class="text-stats" style="text-align:center;padding:32px 0;">No history yet</p>';
      return;
    }

    els.historyList.innerHTML = history.map((item, i) => {
      const date = new Date(item.date);
      const dateStr = date.toLocaleDateString(undefined, { month: 'short', day: 'numeric' });
      return `<div class="history-item" data-index="${i}">
        <span class="history-item-text">${escapeHtml(item.preview)}</span>
        <span class="history-item-date">${dateStr}</span>
      </div>`;
    }).join('');

    // Wire click handlers
    els.historyList.querySelectorAll('.history-item').forEach((el) => {
      el.addEventListener('click', () => {
        const idx = parseInt(el.dataset.index);
        const item = history[idx];
        if (item) {
          els.textInput.value = item.text;
          updateTextStats();
          showView('main');
        }
      });
    });
  }

  function escapeHtml(str) {
    const div = document.createElement('div');
    div.textContent = str;
    return div.innerHTML;
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
    els.pitchControl.value = settings.pitch || 0;
    els.pitchDisplay.textContent = settings.pitch || '0';

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
          const chunks = Player.getQueue();
          if (chunks.length > 0) {
            buildReaderView(fullText, chunks);
            showReaderView();
          }
        } else if (newState === 'stopped') {
          hideReaderView();
          // Show download if we have audio
          els.btnDownload.hidden = Player.getAudioChunks().length === 0;
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
    // Text stats on input
    els.textInput.addEventListener('input', updateTextStats);

    // Auto-paste from clipboard
    els.btnPaste.addEventListener('click', async () => {
      try {
        const text = await navigator.clipboard.readText();
        if (text) {
          els.textInput.value = text;
          updateTextStats();
        }
      } catch {
        showError('Clipboard access denied — paste manually');
      }
    });

    // Language filter
    els.langFilter.addEventListener('change', () => {
      const settings = Settings.get();
      filterVoices(voicesCache, els.langFilter.value, els.voiceSelect, settings.voiceName);
      Settings.set({ languageCode: els.langFilter.value });
    });

    els.voiceSelect.addEventListener('change', () => {
      Settings.set({ voiceName: els.voiceSelect.value });
    });

    // Speed
    els.speedControl.addEventListener('input', () => {
      els.speedDisplay.textContent = parseFloat(els.speedControl.value).toFixed(1) + 'x';
    });
    els.speedControl.addEventListener('change', () => {
      Settings.set({ speakingRate: parseFloat(els.speedControl.value) });
    });

    // Pitch
    els.pitchControl.addEventListener('input', () => {
      els.pitchDisplay.textContent = parseInt(els.pitchControl.value);
    });
    els.pitchControl.addEventListener('change', () => {
      Settings.set({ pitch: parseInt(els.pitchControl.value) });
    });

    // Play
    els.btnPlay.addEventListener('click', () => {
      const fullText = els.textInput.value.trim();
      if (!fullText) {
        showError('Paste some text first');
        return;
      }
      hideError();
      els.btnDownload.hidden = true;

      const start = els.textInput.selectionStart;
      const text = start > 0 ? els.textInput.value.slice(start).trim() : fullText;

      if (!text) {
        showError('No text after cursor position');
        return;
      }

      // Save to history
      Settings.addHistory(fullText);

      const settings = Settings.get();
      Player.play(text, {
        apiKey: settings.apiKey,
        voiceName: els.voiceSelect.value,
        languageCode: els.langFilter.value,
        speakingRate: parseFloat(els.speedControl.value),
        pitch: parseInt(els.pitchControl.value)
      });
    });

    els.btnPause.addEventListener('click', () => Player.pause());
    els.btnResume.addEventListener('click', () => Player.resume());
    els.btnStop.addEventListener('click', () => Player.stop());

    // Download
    els.btnDownload.addEventListener('click', downloadAudio);

    // History
    els.btnHistory.addEventListener('click', () => {
      renderHistory();
      showView('history');
    });

    els.btnHistoryBack.addEventListener('click', () => {
      showView('main');
    });

    // Settings
    els.btnSettings.addEventListener('click', () => {
      openSettings();
      showView('settings');
    });

    // Expand/collapse toggle
    els.btnExpand.addEventListener('click', () => {
      const isExpanded = els.textInput.classList.toggle('expanded');
      els.readerView.classList.toggle('expanded', isExpanded);
      if (isExpanded) {
        els.textInput.scrollIntoView({ behavior: 'smooth', block: 'start' });
      }
    });
  }

  function updatePlaybackUI(state) {
    switch (state) {
      case 'playing':
        els.btnPlay.hidden = true;
        els.btnPause.hidden = false;
        els.btnResume.hidden = true;
        els.btnStop.hidden = false;
        els.btnDownload.hidden = true;
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
    els.settingsPitch.value = settings.pitch || 0;
    els.settingsPitchDisplay.textContent = settings.pitch || '0';

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

    els.settingsPitch.addEventListener('input', () => {
      els.settingsPitchDisplay.textContent = parseInt(els.settingsPitch.value);
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
          speakingRate: parseFloat(els.settingsSpeed.value),
          pitch: parseInt(els.settingsPitch.value)
        });

        populateLangFilter(voicesCache, els.langFilter, els.settingsLang.value);
        filterVoices(voicesCache, els.settingsLang.value, els.voiceSelect, els.settingsVoice.value);
        els.speedControl.value = els.settingsSpeed.value;
        els.speedDisplay.textContent = parseFloat(els.settingsSpeed.value).toFixed(1) + 'x';
        els.pitchControl.value = els.settingsPitch.value;
        els.pitchDisplay.textContent = parseInt(els.settingsPitch.value);

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
        Settings.clearHistory();
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
      updateTextStats();
    } else {
      showView('setup');
    }
  }

  initSetup();
  document.addEventListener('DOMContentLoaded', init);
})();
