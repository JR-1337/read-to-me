const Chunker = (() => {
  const encoder = new TextEncoder();
  const MAX_BYTES = 4500;

  function byteLength(text) {
    return encoder.encode(text).length;
  }

  function sanitize(text) {
    if (!text) return '';
    return text
      .replace(/\r\n/g, '\n')
      // Strip non-speech symbols (markdown, brackets, pipes, slashes, backticks, etc.)
      // Keep: letters, numbers, whitespace, sentence/clause punctuation, apostrophe, quotes, parens, hyphen
      .replace(/[*_#>|`~\[\]{}\\\/^=+<@$%&]/g, ' ')
      // Em dash / double-hyphen → comma pause
      .replace(/[\u2013\u2014]/g, ', ')
      .replace(/--+/g, ', ')
      // Collapse repeated punctuation: !!! → !
      .replace(/([.!?,;:])\1+/g, '$1')
      // Collapse whitespace inside lines but preserve paragraph breaks
      .replace(/[ \t]+/g, ' ')
      .replace(/\n{3,}/g, '\n\n');
  }

  function chunkText(text, maxBytes = MAX_BYTES) {
    if (!text || !text.trim()) return [];

    const normalized = sanitize(text).trim();

    // Split at sentence boundaries: after . ! ? followed by whitespace or end
    const sentences = normalized.split(/(?<=[.!?])\s+/);

    const chunks = [];
    let current = '';

    for (const sentence of sentences) {
      const trimmed = sentence.trim();
      if (!trimmed) continue;

      const candidate = current ? current + ' ' + trimmed : trimmed;

      if (byteLength(candidate) <= maxBytes) {
        current = candidate;
      } else {
        // Push what we have
        if (current) chunks.push(current);

        // Check if single sentence exceeds limit
        if (byteLength(trimmed) > maxBytes) {
          const subChunks = splitByWords(trimmed, maxBytes);
          // All but last go directly to chunks
          for (let i = 0; i < subChunks.length - 1; i++) {
            chunks.push(subChunks[i]);
          }
          current = subChunks[subChunks.length - 1] || '';
        } else {
          current = trimmed;
        }
      }
    }

    if (current.trim()) {
      chunks.push(current.trim());
    }

    return chunks;
  }

  function splitByWords(text, maxBytes) {
    const words = text.split(/\s+/);
    const result = [];
    let current = '';

    for (const word of words) {
      if (!word) continue;

      const candidate = current ? current + ' ' + word : word;

      if (byteLength(candidate) <= maxBytes) {
        current = candidate;
      } else {
        if (current) result.push(current);

        if (byteLength(word) > maxBytes) {
          // Hard truncate single long word (very rare — URLs, etc.)
          result.push(truncateToBytes(word, maxBytes));
          current = '';
        } else {
          current = word;
        }
      }
    }

    if (current) result.push(current);
    return result;
  }

  function truncateToBytes(text, maxBytes) {
    // Slice characters until we fit within byte limit
    let end = text.length;
    while (end > 0 && byteLength(text.slice(0, end)) > maxBytes) {
      end--;
    }
    return text.slice(0, end);
  }

  return { chunkText, byteLength, sanitize };
})();
