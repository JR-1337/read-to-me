<!-- SCHEMA: ARCHITECTURE.md
Version: 1
Purpose: current structure, boundaries, flows, and integrations.
Write mode: overwrite the snapshot. Do not append history.

Rules:
- Snapshot of the system as it is now. Not a log of how it got here.
- Concise enough to rescan quickly. Long details belong in reference docs.
- Describe components, flows, integrations, and boundaries.
- If you catch yourself writing task state, move it to TODO.md. Rationale
  history belongs in DECISIONS.md; preferences belong in LESSONS.md.
- Bullets under 12 words, sentences under 20 words, no paragraphs.
- ASCII operators only.
- Update on structural change, not on routine progress.
-->

## Overview
- Client-side PWA that reads pasted text or URLs aloud via Google Cloud Text-to-Speech. Vanilla JS, no build step, service-worker cached for offline shell.

## Components
- `js/app.js` -- view routing, settings UI, paste/URL handling, history, sleep timer, cursor tracking, share target
- `js/chunker.js` -- text sanitization + sentence-based splitting into TTS-sized chunks (MAX_BYTES 4500)
- `js/api.js` -- Google Cloud TTS `synthesizeChunk` and `listVoices`
- `js/player.js` -- audio queue playback, word-timing heuristic (sqrt + pause weights), highlighting, MP3 download, skip prev/next
- `js/audio-cache.js` -- IndexedDB cache for synthesized audio blobs, keyed by voice+rate+chunk
- `js/settings.js` -- localStorage for API key, voice, rate, position, history
- `js/media-session.js` -- MediaSession API for lockscreen transport controls
- `sw.js` -- service worker; manual cache version bump per release (`rtm-shell-v6` current)
- `index.html` + `css/app.css` + `icons/` + `manifest.json` -- static shell

## Flows
- play: textInput -> isUrl? extractArticle via allorigins : text -> Chunker.sanitize + chunkText -> synthesize (cache hit or API call) -> Player queue + blob URL -> MediaSession update -> audio element play with highlight via timeupdate
- resume: Settings.savePosition(textHash, chunkIndex) on each chunkStart -> on handlePlay when cursor is 0 and saved position exists -> Player.playFromChunk
- cursor-anchored start: trackCursor listeners (keyup/mouseup/touchend/blur) -> lastCursorPos -> handlePlay snaps to sentence start -> Player.play from sliced text

## Integrations
- Google Cloud Text-to-Speech API -- owned by Google; API key held in localStorage
- allorigins.win `/raw?url=` -- third-party CORS proxy for URL article extraction; owned by allorigins
- IndexedDB -- browser-owned; used by audio-cache.js

## Boundaries
- In scope: text-to-speech pipeline (sanitize, chunk, synthesize, cache, play, highlight), PWA shell, offline audio cache
- Out of scope: server-side anything, authentication beyond user-entered API key, speech recognition, multi-user state
- Tech debt accepted: service worker cache version bumped manually per release; heuristic word-timing will drift on punctuation-heavy text; allorigins dependency is single point of failure for URL extraction

<!-- TEMPLATE
## Overview
- [one line stating what this system is]

## Components
- [component] -- [purpose] -- [key files or dirs]
- [component] -- [purpose] -- [key files or dirs]

## Flows
- [flow name]: [start] -> [middle] -> [end]

## Integrations
- [external system] -- [how we talk to it] -- [owned by us or them]

## Boundaries
- In scope: [what this system owns]
- Out of scope: [what it does not]
-->
