const MediaSessionManager = (() => {
  function setup(title, handlers) {
    if (!('mediaSession' in navigator)) return;

    navigator.mediaSession.metadata = new MediaMetadata({
      title: title || 'Read To Me',
      artist: 'Read To Me'
    });

    if (handlers.play) {
      navigator.mediaSession.setActionHandler('play', handlers.play);
    }
    if (handlers.pause) {
      navigator.mediaSession.setActionHandler('pause', handlers.pause);
    }
    if (handlers.stop) {
      navigator.mediaSession.setActionHandler('stop', handlers.stop);
    }
  }

  function updateState(state) {
    if (!('mediaSession' in navigator)) return;
    navigator.mediaSession.playbackState = state; // 'playing' | 'paused' | 'none'
  }

  function clear() {
    if (!('mediaSession' in navigator)) return;
    navigator.mediaSession.metadata = null;
    navigator.mediaSession.playbackState = 'none';
  }

  return { setup, updateState, clear };
})();
