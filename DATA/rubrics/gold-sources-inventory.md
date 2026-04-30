# Gold Sources Inventory -- TTS

Forward-looking map of in-tree canonical sources that any future scoring loop
or regression rubric should treat as ground truth. No fixtures pre-fabricated;
this rubric names where the gold lives. First-loop candidates listed last.

## In-tree gold sources

- `js/chunker.js` -- canonical text sanitization set (markdown symbol stripping,
  em-dash and double-hyphen to comma-pause conversion, repeated-punctuation
  collapsing, sentence boundary splitter, MAX_BYTES 4500 chunk cap).
  Any sanitize regression (a symbol leaks through to TTS, a sentence boundary
  miscounts) is detectable by diffing chunker output against a frozen snapshot
  of this file's behavior.

- `js/player.js` -- word-timing heuristic. Constants of record:
  base = `sqrt(length)`, sentence-end pause bonus = 1.6 (`.!?`),
  clause pause bonus = 0.7 (`,;:`). Highlight drift on punctuated text is the
  observable failure mode (DECISIONS 2026-04-20).

- `js/api.js` -- Google Cloud TTS contract surface: `synthesizeChunk` request
  shape, `listVoices` response handling. Vendor changes here are exogenous
  (Google-owned); the gold is the current request/response shape this file
  encodes, not the vendor docs.

- `js/settings.js` -- localStorage schema (api key, voice, rate, position
  pointer, history). Schema sovereignty applies: field names and types are
  immutable once set; unknown field on read = flag.

- `js/audio-cache.js` -- IndexedDB cache shape; key = voice+rate+chunk hash.
  Cache hit/miss behavior is the observable.

- `js/media-session.js` + `sw.js` -- MediaSession transport contract +
  service-worker shell version (`rtm-shell-v6` current). Cache version bump
  per release is manual; drift here breaks offline shell.

- `index.html` + `manifest.json` + `icons/` + `css/app.css` -- PWA shell
  surface. Layout / install flow regressions are visual; not loop-scorable
  without screenshot fixtures.

## External vendor surfaces (not in-tree)

- Google Cloud Text-to-Speech API (https://cloud.google.com/text-to-speech)
  -- v1 endpoint contract; v1beta1 `enableTimePointing` deferred per
  DECISIONS 2026-04-20 (requires SSML mark rewrite in chunker).

- allorigins.win `/raw?url=` -- third-party CORS proxy for URL article
  extraction. Single point of failure; vendor-owned; observable downtime
  is the only signal.

- Web Platform: SpeechSynthesis API (fallback path), MediaSession API
  (lockscreen controls), IndexedDB (audio cache), Web Audio (timing).
  Browser-vendor canonical; MDN is the doc surface.

## Boundaries

- No PII in repo. User-entered Google Cloud API key lives only in their
  browser localStorage; never written to DATA/, never logged.
- No PHI. Pasted text is ephemeral in browser memory + IndexedDB cache;
  out of scope for repo storage.
- No cohort or trace data captured today. If future trace capture lands
  (e.g. anonymized punctuation-distribution histograms from real articles
  to validate chunker drift), it goes under `DATA/traces/` with
  `sensitivity: public` only after redaction review.

## First-loop candidates (when LOOP capacity is allocated)

1. **Chunker sanitize regression** -- frozen input set of markdown article
   snippets; score = byte-diff of chunker output against snapshot. Triggers
   on any change to `Chunker.sanitize()` or sentence-splitter.

2. **Word-timing drift on punctuated text** -- sample sentences with known
   pause-bonus targets; score = absolute deviation between heuristic-predicted
   word-end times and a reference timeline. Sensitive to constant changes
   (1.6 / 0.7 / `sqrt`).

3. **Google TTS v1 -> v1beta1 timepoints migration readiness** -- gated
   rubric, not a runnable loop yet. Becomes scorable once SSML mark rewrite
   in chunker is staged and v1beta1 path is live in `js/api.js`.

None of the above is fabricated as a fixture today; this rubric records
where to start when the appetite for a scoring loop arrives.
