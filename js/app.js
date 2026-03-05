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
    setupApiKey: $('setup-api-key'),
    btnSetupSave: $('btn-setup-save'),
    btnSettings: $('btn-settings'),
    btnHistory: $('btn-history'),
    btnPaste: $('btn-paste'),
    btnExpand: $('btn-expand'),
    expandIcon: $('expand-icon'),
    expandLabel: $('expand-label'),
    textStats: $('text-stats'),
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
    btnDownload: $('btn-download'),
    progressContainer: $('progress-container'),
    progressFill: $('progress-fill'),
    progressText: $('progress-text'),
    audioEl: $('audio-el'),
    historyList: $('history-list'),
    btnHistoryBack: $('btn-history-back'),
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

  let activeChunkEl = null;
  let activeWordEl = null;
  let activeWordSpans = null;
  let chunkElements = [];

  const escapeDiv = document.createElement('div');

  // Simple hash for comparing text identity
  function textHash(text) {
    let hash = 0;
    for (let i = 0; i < Math.min(text.length, 500); i++) {
      hash = ((hash << 5) - hash + text.charCodeAt(i)) | 0;
    }
    return hash + '_' + text.length;
  }

  // ─── Utilities ───

  function escapeHtml(str) {
    escapeDiv.textContent = str;
    return escapeDiv.innerHTML;
  }

  function formatSpeed(val) {
    return parseFloat(val).toFixed(1) + 'x';
  }

  function wireSlider(sliderEl, displayEl, formatter, settingsKey) {
    sliderEl.addEventListener('input', () => {
      displayEl.textContent = formatter(sliderEl.value);
    });
    if (settingsKey) {
      sliderEl.addEventListener('change', () => {
        Settings.set({ [settingsKey]: parseFloat(sliderEl.value) });
      });
    }
  }

  let statsTimeout = null;
  function updateTextStats() {
    clearTimeout(statsTimeout);
    statsTimeout = setTimeout(() => {
      const text = els.textInput.value;
      if (!text) {
        els.textStats.textContent = '';
        return;
      }
      const chars = text.length;
      const words = text.trim().split(/\s+/).filter(Boolean).length;
      const costCents = (chars / 1_000_000) * 1600;
      const costStr = costCents < 1 ? '<1\u00A2' : costCents.toFixed(1) + '\u00A2';
      els.textStats.textContent = `${words} words \u00B7 ${chars} chars \u00B7 ~${costStr}`;
    }, 80);
  }

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

  function buildReaderView(chunks) {
    const frag = document.createDocumentFragment();
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

      frag.appendChild(chunkSpan);
      chunkElements.push(chunkSpan);

      if (i < chunks.length - 1) {
        frag.appendChild(document.createTextNode(' '));
      }
    }

    els.readerView.innerHTML = '';
    els.readerView.appendChild(frag);
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
    activeWordSpans = null;
  }

  function highlightChunk(chunkIndex) {
    if (activeChunkEl) activeChunkEl.classList.remove('active');
    if (activeWordEl) {
      activeWordEl.classList.remove('active');
      activeWordEl = null;
    }
    activeWordSpans = null;

    if (chunkIndex < chunkElements.length) {
      activeChunkEl = chunkElements[chunkIndex];
      activeChunkEl.classList.add('active');
      activeWordSpans = activeChunkEl.querySelectorAll('.word');
      activeChunkEl.scrollIntoView({ behavior: 'smooth', block: 'center' });
    }
  }

  function highlightWord(wordIndex) {
    if (!activeWordSpans) return;
    if (activeWordEl) activeWordEl.classList.remove('active');
    if (wordIndex < activeWordSpans.length) {
      activeWordEl = activeWordSpans[wordIndex];
      activeWordEl.classList.add('active');
      activeWordEl.scrollIntoView({ behavior: 'smooth', block: 'nearest' });
    }
  }

  // ─── Download MP3 ───

  function downloadAudio() {
    const blob = Player.buildDownloadBlob();
    if (!blob) {
      showError('No audio to download — play some text first');
      return;
    }

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
      els.historyList.innerHTML = '<p class="history-empty">No history yet</p>';
      return;
    }

    els.historyList.innerHTML = history.map((item, i) => {
      const date = new Date(item.date);
      const dateStr = date.toLocaleDateString(undefined, { month: 'short', day: 'numeric' });
      return `<div class="history-item" data-index="${i}">
        <span class="history-item-text">${escapeHtml(item.preview)}</span>
        <span class="history-item-date">${dateStr}</span>
        <button class="history-delete" data-index="${i}" aria-label="Delete">\u2715</button>
      </div>`;
    }).join('');
  }

  function wireHistoryDelegation() {
    els.historyList.addEventListener('click', (e) => {
      // Handle delete button
      const deleteBtn = e.target.closest('.history-delete');
      if (deleteBtn) {
        e.stopPropagation();
        const idx = parseInt(deleteBtn.dataset.index);
        Settings.removeHistory(idx);
        renderHistory();
        return;
      }

      // Handle item click (load text)
      const item = e.target.closest('.history-item');
      if (!item) return;
      const idx = parseInt(item.dataset.index);
      const history = Settings.getHistory();
      if (history[idx]) {
        els.textInput.value = history[idx].text;
        updateTextStats();
        showView('main');
      }
    });
  }

  // ─── Voice Loading ───

  async function loadVoices(apiKey) {
    voicesCache = await Api.listVoices(apiKey);
    return voicesCache;
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

  function syncMainControls() {
    const settings = Settings.get();
    populateLangFilter(voicesCache, els.langFilter, settings.languageCode);
    filterVoices(voicesCache, els.langFilter.value, els.voiceSelect, settings.voiceName);
    els.speedControl.value = settings.speakingRate;
    els.speedDisplay.textContent = formatSpeed(settings.speakingRate);
  }

  async function initMain() {
    if (voicesCache.length === 0) {
      try {
        await loadVoices(Settings.get().apiKey);
      } catch (err) {
        showError('Could not load voices: ' + err.message);
        return;
      }
    }

    syncMainControls();

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
            buildReaderView(chunks);
            showReaderView();
          }
        } else if (newState === 'stopped') {
          hideReaderView();
          els.btnDownload.hidden = Player.getAudioChunks().length === 0;
          // Clear saved position on normal completion (not on stop mid-play)
          if (Player.getAudioChunks().length > 0 && Player.getCurrentIndex() >= Player.getQueue().length - 1) {
            Settings.clearPosition();
          }
        }
      },
      onChunkStart: (chunkIndex) => {
        highlightChunk(chunkIndex);
        // Save position so we can resume after crash/close
        const text = els.textInput.value.trim();
        if (text) Settings.savePosition(textHash(text), chunkIndex);
      },
      onWordUpdate: highlightWord,
      onError: showError
    });
  }

  function buildPlayConfig() {
    const settings = Settings.get();
    return {
      apiKey: settings.apiKey,
      voiceName: els.voiceSelect.value,
      languageCode: els.langFilter.value,
      speakingRate: parseFloat(els.speedControl.value)
    };
  }

  function wireMainEvents() {
    els.textInput.addEventListener('input', updateTextStats);

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

    els.langFilter.addEventListener('change', () => {
      filterVoices(voicesCache, els.langFilter.value, els.voiceSelect, Settings.get().voiceName);
      Settings.set({ languageCode: els.langFilter.value });
    });
    els.voiceSelect.addEventListener('change', () => {
      Settings.set({ voiceName: els.voiceSelect.value });
    });

    wireSlider(els.speedControl, els.speedDisplay, formatSpeed, 'speakingRate');

    els.btnPlay.addEventListener('click', () => {
      const fullText = els.textInput.value.trim();
      if (!fullText) {
        showError('Paste some text first');
        return;
      }
      hideError();
      els.btnDownload.hidden = true;

      // If cursor is placed mid-text, start from cursor
      const start = els.textInput.selectionStart;
      if (start > 0) {
        const text = els.textInput.value.slice(start).trim();
        if (!text) {
          showError('No text after cursor position');
          return;
        }
        Settings.clearPosition();
        Settings.addHistory(fullText);
        Player.play(text, buildPlayConfig());
        return;
      }

      // No cursor — check for saved position (crash recovery)
      const saved = Settings.getPosition();
      const hash = textHash(fullText);
      if (saved && saved.textHash === hash && saved.chunkIndex > 0) {
        Settings.addHistory(fullText);
        Player.playFromChunk(fullText, buildPlayConfig(), saved.chunkIndex);
        return;
      }

      // Fresh start
      Settings.addHistory(fullText);
      Player.play(fullText, buildPlayConfig());
    });

    els.btnPause.addEventListener('click', () => Player.pause());
    els.btnResume.addEventListener('click', () => Player.resume());
    els.btnStop.addEventListener('click', () => Player.stop());
    els.btnDownload.addEventListener('click', downloadAudio);

    els.btnHistory.addEventListener('click', () => {
      renderHistory();
      showView('history');
    });
    els.btnHistoryBack.addEventListener('click', () => showView('main'));
    wireHistoryDelegation();

    els.btnSettings.addEventListener('click', () => {
      openSettings();
      showView('settings');
    });

    els.btnExpand.addEventListener('click', () => {
      const isExpanded = els.textInput.classList.toggle('expanded');
      els.readerView.classList.toggle('expanded', isExpanded);
      els.btnExpand.classList.toggle('active', isExpanded);
      els.expandLabel.textContent = isExpanded ? 'Show less' : 'Show more';
      if (isExpanded) {
        els.textInput.scrollIntoView({ behavior: 'smooth', block: 'start' });
      }
    });
  }

  function updatePlaybackUI(state) {
    const playing = state === 'playing';
    const paused = state === 'paused';
    const stopped = state === 'stopped';

    els.btnPlay.hidden = !stopped;
    els.btnPause.hidden = !playing;
    els.btnResume.hidden = !paused;
    els.btnStop.hidden = stopped;
    els.btnDownload.hidden = playing || paused || els.btnDownload.hidden;

    if (stopped) {
      els.progressContainer.hidden = true;
      els.progressFill.style.width = '0%';
    }
  }

  // ─── Settings View ───

  function openSettings() {
    const settings = Settings.get();
    els.settingsApiKey.value = settings.apiKey;
    els.settingsSpeed.value = settings.speakingRate;
    els.settingsSpeedDisplay.textContent = formatSpeed(settings.speakingRate);

    if (voicesCache.length > 0) {
      populateLangFilter(voicesCache, els.settingsLang, settings.languageCode);
      filterVoices(voicesCache, els.settingsLang.value, els.settingsVoice, settings.voiceName);
    }
  }

  function wireSettingsEvents() {
    els.settingsLang.addEventListener('change', () => {
      filterVoices(voicesCache, els.settingsLang.value, els.settingsVoice, Settings.get().voiceName);
    });

    wireSlider(els.settingsSpeed, els.settingsSpeedDisplay, formatSpeed, null);

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

        syncMainControls();
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
