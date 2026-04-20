const Player = (() => {
  let audioEl = null;
  let audioContext = null;
  let previousBlobUrl = null;
  let audioChunksBase64 = [];
  let prefetchedBase64 = null;
  let prefetchIndex = -1;

  const state = {
    queue: [],
    currentIndex: 0,
    isPlaying: false,
    isPaused: false,
    config: null
  };

  let chunkWords = [];
  let wordTimings = [];
  let currentWordIndex = -1;

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
    state.cachePrefix = config.voiceName + '_' + config.speakingRate;
    audioChunksBase64 = [];
    prefetchedBase64 = null;
    prefetchIndex = -1;

    unlockAudio();

    const title = text.length > 60 ? text.slice(0, 57) + '...' : text;
    MediaSessionManager.setup(title, {
      play: resume,
      pause: pause,
      stop: stop
    });
    MediaSessionManager.updateState('playing');

    onStateChange('playing', text);
    synthesizeAndPlay(state.startFromChunk || 0);
    state.startFromChunk = 0;
  }

  function playFromChunk(text, config, chunkIndex) {
    const chunks = Chunker.chunkText(text);
    if (chunks.length === 0 || chunkIndex >= chunks.length) {
      play(text, config);
      return;
    }

    state.queue = chunks;
    state.currentIndex = chunkIndex;
    state.isPlaying = true;
    state.isPaused = false;
    state.config = config;
    state.cachePrefix = config.voiceName + '_' + config.speakingRate;
    state.startFromChunk = 0;
    audioChunksBase64 = [];
    prefetchedBase64 = null;
    prefetchIndex = -1;

    unlockAudio();

    const title = text.length > 60 ? text.slice(0, 57) + '...' : text;
    MediaSessionManager.setup(title, {
      play: resume,
      pause: pause,
      stop: stop
    });
    MediaSessionManager.updateState('playing');

    onStateChange('playing', text);
    synthesizeAndPlay(chunkIndex);
  }

  async function synthesizeAndPlay(index) {
    if (!state.isPlaying || index >= state.queue.length) {
      if (index >= state.queue.length) onComplete();
      return;
    }

    state.currentIndex = index;
    onProgress(index + 1, state.queue.length);

    chunkWords = state.queue[index].split(/(\s+)/);
    currentWordIndex = -1;

    onChunkStart(index, state.queue[index]);

    try {
      let base64;

      // Check cache → prefetch → API (in priority order)
      const cacheKey = (state.cachePrefix || '') + '_' + index;
      const cached = await AudioCache.get(cacheKey);
      if (cached) {
        base64 = cached;
      } else if (prefetchedBase64 && prefetchIndex === index) {
        base64 = prefetchedBase64;
        prefetchedBase64 = null;
        prefetchIndex = -1;
        AudioCache.put(cacheKey, base64); // fire-and-forget
      } else {
        base64 = await Api.synthesizeChunk(state.config, state.queue[index]);
        AudioCache.put(cacheKey, base64); // fire-and-forget
      }

      if (!state.isPlaying) return;

      audioChunksBase64.push(base64);
      const blobUrl = base64ToBlobUrl(base64);

      if (previousBlobUrl) URL.revokeObjectURL(previousBlobUrl);
      previousBlobUrl = blobUrl;

      audioEl.src = blobUrl;
      audioEl.playbackRate = 1.0;

      audioEl.addEventListener('loadedmetadata', buildWordTimings, { once: true });
      await audioEl.play();

      // Prefetch next chunk while this one plays
      prefetchNext(index + 1);
    } catch (err) {
      onError(err.message);
      stop();
    }
  }

  async function prefetchNext(nextIndex) {
    if (nextIndex >= state.queue.length || !state.isPlaying) return;
    try {
      const base64 = await Api.synthesizeChunk(state.config, state.queue[nextIndex]);
      if (state.isPlaying && state.currentIndex === nextIndex - 1) {
        prefetchedBase64 = base64;
        prefetchIndex = nextIndex;
      }
    } catch {
      // Prefetch failed — will fall back to normal synthesis on ended
    }
  }

  function buildWordTimings() {
    const duration = audioEl.duration;
    if (!duration || !isFinite(duration)) return;

    const actualWords = chunkWords.filter((w) => w.trim().length > 0);

    // Weight = sqrt(length) for speech time + pause bonus for trailing punctuation.
    // Sentence-end (.!?) ≈ extra word; clause (,;:) ≈ half a word.
    function weight(w) {
      const last = w[w.length - 1];
      let pause = 0;
      if (last === '.' || last === '!' || last === '?') pause = 1.6;
      else if (last === ',' || last === ';' || last === ':') pause = 0.7;
      return Math.sqrt(w.length) + pause;
    }

    const weights = actualWords.map(weight);
    const totalWeight = weights.reduce((s, w) => s + w, 0);

    wordTimings = [];
    let cumulative = 0;
    for (let i = 0; i < actualWords.length; i++) {
      cumulative += (weights[i] / totalWeight) * duration;
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
    prefetchedBase64 = null;
    prefetchIndex = -1;
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
    prefetchedBase64 = null;
    prefetchIndex = -1;

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

  function base64ToBytes(base64) {
    const binary = atob(base64);
    const bytes = new Uint8Array(binary.length);
    for (let i = 0; i < binary.length; i++) {
      bytes[i] = binary.charCodeAt(i);
    }
    return bytes;
  }

  function base64ToBlobUrl(base64) {
    const blob = new Blob([base64ToBytes(base64)], { type: 'audio/mpeg' });
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

  function getAudioChunks() {
    return audioChunksBase64;
  }

  function buildDownloadBlob() {
    if (audioChunksBase64.length === 0) return null;
    const byteArrays = audioChunksBase64.map(base64ToBytes);
    return new Blob(byteArrays, { type: 'audio/mpeg' });
  }

  function skipNext() {
    if (!state.isPlaying) return;
    const nextIndex = state.currentIndex + 1;
    if (nextIndex < state.queue.length) {
      audioEl.pause();
      synthesizeAndPlay(nextIndex);
    }
  }

  function skipPrev() {
    if (!state.isPlaying) return;
    const prevIndex = Math.max(0, state.currentIndex - 1);
    audioEl.pause();
    synthesizeAndPlay(prevIndex);
  }

  function getCurrentIndex() {
    return state.currentIndex;
  }

  return { init, play, playFromChunk, pause, resume, stop, skipNext, skipPrev, getState, getQueue, getAudioChunks, buildDownloadBlob, getCurrentIndex };
})();
