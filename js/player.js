const Player = (() => {
  let audioEl = null;
  let audioContext = null;
  let previousBlobUrl = null;

  const state = {
    queue: [],
    currentIndex: 0,
    isPlaying: false,
    isPaused: false,
    config: null
  };

  // Word timing for current chunk
  let chunkWords = [];
  let wordTimings = []; // cumulative end-time for each word
  let currentWordIndex = -1;

  // Callbacks set by app.js
  let onProgress = null;
  let onStateChange = null;
  let onError = null;
  let onChunkStart = null;
  let onWordUpdate = null;

  function init(audioElement, callbacks = {}) {
    audioEl = audioElement;
    onProgress = callbacks.onProgress || (() => {});
    onStateChange = callbacks.onStateChange || (() => {});
    onError = callbacks.onError || (() => {});
    onChunkStart = callbacks.onChunkStart || (() => {});
    onWordUpdate = callbacks.onWordUpdate || (() => {});

    audioEl.addEventListener('ended', handleEnded);
    audioEl.addEventListener('error', () => {
      onError('Audio playback error');
      stop();
    });
    audioEl.addEventListener('timeupdate', handleTimeUpdate);
  }

  function play(text, config) {
    const chunks = Chunker.chunkText(text);
    if (chunks.length === 0) {
      onError('No text to read');
      return;
    }

    state.queue = chunks;
    state.currentIndex = 0;
    state.isPlaying = true;
    state.isPaused = false;
    state.config = config;

    // iOS audio unlock
    unlockAudio();

    // Setup media session
    const title = text.length > 60 ? text.slice(0, 57) + '...' : text;
    MediaSessionManager.setup(title, {
      play: resume,
      pause: pause,
      stop: stop
    });
    MediaSessionManager.updateState('playing');

    onStateChange('playing', text);
    synthesizeAndPlay(0);
  }

  async function synthesizeAndPlay(index) {
    if (!state.isPlaying || index >= state.queue.length) {
      if (index >= state.queue.length) {
        onComplete();
      }
      return;
    }

    state.currentIndex = index;
    onProgress(index + 1, state.queue.length);

    // Prepare word timing for this chunk
    chunkWords = state.queue[index].split(/(\s+)/); // preserve whitespace tokens
    currentWordIndex = -1;

    // Notify app of new chunk
    onChunkStart(index, state.queue[index]);

    try {
      const base64 = await Api.synthesizeChunk(
        state.config.apiKey,
        state.queue[index],
        state.config.voiceName,
        state.config.languageCode,
        state.config.speakingRate
      );

      if (!state.isPlaying) return;

      const blobUrl = base64ToBlobUrl(base64);

      if (previousBlobUrl) {
        URL.revokeObjectURL(previousBlobUrl);
      }
      previousBlobUrl = blobUrl;

      audioEl.src = blobUrl;
      audioEl.playbackRate = 1.0;

      // Wait for duration to be available before building timings
      audioEl.addEventListener('loadedmetadata', buildWordTimings, { once: true });

      await audioEl.play();
    } catch (err) {
      onError(err.message);
      stop();
    }
  }

  function buildWordTimings() {
    const duration = audioEl.duration;
    if (!duration || !isFinite(duration)) return;

    // Get only actual words (not whitespace tokens)
    const actualWords = chunkWords.filter((w) => w.trim().length > 0);
    const totalChars = actualWords.reduce((sum, w) => sum + w.length, 0);

    // Build cumulative timings proportional to word length
    wordTimings = [];
    let cumulative = 0;
    for (const word of actualWords) {
      cumulative += (word.length / totalChars) * duration;
      wordTimings.push(cumulative);
    }
  }

  function handleTimeUpdate() {
    if (!state.isPlaying || wordTimings.length === 0) return;

    const currentTime = audioEl.currentTime;
    let newWordIndex = 0;

    for (let i = 0; i < wordTimings.length; i++) {
      if (currentTime < wordTimings[i]) {
        newWordIndex = i;
        break;
      }
      newWordIndex = i;
    }

    if (newWordIndex !== currentWordIndex) {
      currentWordIndex = newWordIndex;
      onWordUpdate(currentWordIndex);
    }
  }

  function handleEnded() {
    if (state.isPlaying && !state.isPaused) {
      const nextIndex = state.currentIndex + 1;
      if (nextIndex < state.queue.length) {
        synthesizeAndPlay(nextIndex);
      } else {
        onComplete();
      }
    }
  }

  function onComplete() {
    state.isPlaying = false;
    state.isPaused = false;
    chunkWords = [];
    wordTimings = [];
    currentWordIndex = -1;
    if (previousBlobUrl) {
      URL.revokeObjectURL(previousBlobUrl);
      previousBlobUrl = null;
    }
    MediaSessionManager.updateState('none');
    MediaSessionManager.clear();
    onStateChange('stopped');
    onProgress(state.queue.length, state.queue.length);
  }

  function pause() {
    if (!state.isPlaying || state.isPaused) return;
    audioEl.pause();
    state.isPaused = true;
    MediaSessionManager.updateState('paused');
    onStateChange('paused');
  }

  function resume() {
    if (!state.isPlaying || !state.isPaused) return;
    audioEl.play();
    state.isPaused = false;
    MediaSessionManager.updateState('playing');
    onStateChange('playing');
  }

  function stop() {
    audioEl.pause();
    audioEl.removeAttribute('src');
    state.isPlaying = false;
    state.isPaused = false;
    state.queue = [];
    state.currentIndex = 0;
    chunkWords = [];
    wordTimings = [];
    currentWordIndex = -1;

    if (previousBlobUrl) {
      URL.revokeObjectURL(previousBlobUrl);
      previousBlobUrl = null;
    }

    MediaSessionManager.updateState('none');
    MediaSessionManager.clear();
    onStateChange('stopped');
  }

  function unlockAudio() {
    if (!audioContext) {
      audioContext = new (window.AudioContext || window.webkitAudioContext)();
    }
    if (audioContext.state === 'suspended') {
      audioContext.resume();
    }
  }

  function base64ToBlobUrl(base64) {
    const binary = atob(base64);
    const bytes = new Uint8Array(binary.length);
    for (let i = 0; i < binary.length; i++) {
      bytes[i] = binary.charCodeAt(i);
    }
    const blob = new Blob([bytes], { type: 'audio/mpeg' });
    return URL.createObjectURL(blob);
  }

  function getState() {
    if (!state.isPlaying) return 'stopped';
    if (state.isPaused) return 'paused';
    return 'playing';
  }

  function getQueue() {
    return state.queue;
  }

  return { init, play, pause, resume, stop, getState, getQueue };
})();
