const Api = (() => {
  const BASE = 'https://texttospeech.googleapis.com/v1';
  const VOICES_CACHE_KEY = 'rtm_voices_cache';

  async function listVoices(apiKey) {
    const cached = sessionStorage.getItem(VOICES_CACHE_KEY);
    if (cached) {
      try {
        return JSON.parse(cached);
      } catch {
        sessionStorage.removeItem(VOICES_CACHE_KEY);
      }
    }

    const res = await fetch(`${BASE}/voices?key=${encodeURIComponent(apiKey)}`);
    if (!res.ok) {
      const body = await res.json().catch(() => ({}));
      throw new Error(body.error?.message || `Failed to load voices (${res.status})`);
    }

    const data = await res.json();
    const voices = (data.voices || []).sort((a, b) => {
      const langA = a.languageCodes[0];
      const langB = b.languageCodes[0];
      if (langA !== langB) return langA.localeCompare(langB);
      return typeRank(a.name) - typeRank(b.name);
    });

    sessionStorage.setItem(VOICES_CACHE_KEY, JSON.stringify(voices));
    return voices;
  }

  function typeRank(name) {
    if (name.includes('Neural2')) return 0;
    if (name.includes('Wavenet')) return 1;
    if (name.includes('Standard')) return 2;
    return 3;
  }

  async function synthesizeChunk(apiKey, text, voiceName, languageCode, speakingRate) {
    const body = {
      input: { text },
      voice: { languageCode, name: voiceName },
      audioConfig: {
        audioEncoding: 'MP3',
        speakingRate: speakingRate || 1.0
      }
    };

    const res = await fetch(`${BASE}/text:synthesize?key=${encodeURIComponent(apiKey)}`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify(body)
    });

    if (!res.ok) {
      const data = await res.json().catch(() => ({}));
      throw new Error(data.error?.message || `Synthesis failed (${res.status})`);
    }

    const data = await res.json();
    return data.audioContent;
  }

  function getVoiceType(name) {
    if (name.includes('Neural2')) return 'Neural2';
    if (name.includes('Wavenet')) return 'WaveNet';
    if (name.includes('Standard')) return 'Standard';
    return 'Other';
  }

  return { listVoices, synthesizeChunk, getVoiceType };
})();
