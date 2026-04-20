<!-- SCHEMA: DECISIONS.md
Version: 1
Purpose: durable product, architecture, and workflow decisions with rationale.
Write mode: append new entries at the top. Reverse chronological.

Rules:
- Newest entries at the top.
- Every entry has: date heading, decision title, rationale, Confidence level.
- Confidence scale: H (high), M (medium), L (low).
- Confidence: H requires inline verification note with source and date.
  Example: `Confidence: H - tests pass 2026-04-16`
- Confidence: H-holdout variant for entries graduated from auto-loop with
  held-out task scoring passing. Format:
  `Confidence: H-holdout - ratified from <mode>/<tag> on YYYY-MM-DD, held-out passed`
  Use plain H if the mode predates holdout retrofit or the Candidate was
  promoted without holdout scoring.
- Confidence: M is the default when verification is absent or stale.
- Confidence: L when plausible but unverified; name what would confirm.
- Optional Source field: human (default, omit) or meta-agent-ratified.
  Used when the decision came from auto-loop observation rather than direct human choice.
  Unratified proposals live in LOOP/<mode>/observations.md Candidates, not here.
- Optional Evidence field: <mode>/<tag> (<metric>: <value>). Reference only.
  Links a decision to the run that produced the signal.
- Invalidated entries get marked `Superseded` but stay in the file. Do not erase.
- Rejected alternatives may be noted under the decision when they are likely to
  resurface or when the rejection rationale saves future re-litigation.
- Do not store temporary plans, open questions, or task checklists (use TODO.md).
- Bullets under 12 words, sentences under 20 words, no paragraphs.
- ASCII operators only.
-->

## 2026-04-20 -- Word-follow heuristic uses punctuation pause weights
Decision: Word timing in player.js uses `sqrt(length)` base plus pause bonus of 1.6 for sentence-end (`.!?`) and 0.7 for clause (`,;:`).
Rationale: Flat sqrt weighting drifted on punctuated text. Pause bonuses approximate natural speech cadence. Deferred v1beta1 timepoints API upgrade because it requires SSML mark rewrite in chunker.js; heuristic is good enough for now.
Confidence: H - verified by browser test on sample articles 2026-04-20

Rejected alternatives:
- Google TTS v1beta1 `enableTimePointing` with SSML `<mark>` tags -- rejected because requires chunker and API rewrite; defer until heuristic drift becomes unacceptable

## 2026-04-20 -- Playback starts at cursor, snapped to sentence boundary
Decision: `handlePlay` slices text from cursor position snapped back to the nearest sentence start via `snapToSentenceStart`. Cursor is persisted across blur via `trackCursor` listeners so clicking Play does not reset selection.
Rationale: Starting mid-word or mid-clause produced garbled playback. Mobile focus loss on button tap would otherwise lose the cursor before `handlePlay` read it.
Confidence: H - verified in browser 2026-04-20

## 2026-04-20 -- Chunker sanitizes markdown symbols before TTS synthesis
Decision: `Chunker.sanitize()` strips `* _ # > | [ ] { } \ / ` + other non-speech symbols, converts em-dashes and double-hyphens to comma pauses, collapses repeated punctuation. Runs before sentence splitting so reader view and audio stay in sync.
Rationale: Pasted markdown articles spoke symbols aloud (asterisks, hashes). User wanted clean playback without manual cleanup.
Confidence: H - tested on sample markdown articles 2026-04-20

(no loop-ratified decisions yet)

<!-- TEMPLATE
## YYYY-MM-DD -- [Decision title]
Decision: [one sentence statement of what was decided]
Rationale: [one to three sentences on why]
Confidence: H - [verification source and date]
(or Confidence: M)
(or Confidence: L - [what would verify])

Rejected alternatives (optional):
- [alternative] -- rejected because [reason]

## YYYY-MM-DD -- [Older decision, still valid]
...

## YYYY-MM-DD -- [Decision ratified from auto-loop observation]
Decision: [one sentence statement]
Rationale: [one to three sentences]
Confidence: H-holdout - ratified from <mode>/<tag> on YYYY-MM-DD, held-out passed
Source: meta-agent-ratified
Evidence: <mode>/<tag> (<metric>: <value>)

## YYYY-MM-DD -- [Old decision] (Superseded by YYYY-MM-DD)
...
-->
