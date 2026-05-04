<!-- SCHEMA: DECISIONS.md
Version: 6
Purpose: durable product, architecture, and workflow decisions with rationale.
Write mode: append new entries at the top. Reverse chronological.

Rules:
- Newest entries at the top.
- Every entry has: date heading, decision title, rationale, Confidence level.
- Confidence scale: H (high), M (medium), L (low).
- Confidence grammar (regex-enforceable):
    Confidence: H(-holdout)? -- <source>, verified YYYY-MM-DD
    Confidence: M( -- <verification hint>)?
    Confidence: L -- <what would verify>
- Confidence: H-holdout is used on entries graduated from auto-loop with
  held-out task scoring passing. Use plain H if the mode predates holdout
  retrofit or the Candidate was promoted without holdout scoring.
- Confidence: M is the default when verification is absent or stale.
- Optional Source field: human (default, omit) or meta-agent-ratified.
  Used when the decision came from auto-loop observation rather than direct human choice.
  Unratified proposals live in LOOP/<mode>/observations.md Candidates, not here.
- Optional Evidence field: <mode>/<tag> (<metric>: <value>). Reference only.
  Links a decision to the run that produced the signal.
- Mark invalidated entries `Superseded` and retain them in the file. The audit trail depends on superseded entries staying readable.
- Rejected alternatives may be noted under the decision when they are likely to
  resurface or when the rejection rationale saves future re-litigation.
- If you catch yourself writing temporary plans, open questions, or task
  checklists, move them to TODO.md.
- Concision via shape, not word count -- match the example structure.
- ASCII operators only.

Archive behavior:
- Active file ceiling: 25,000 chars. Above ceiling, move oldest entries
  to CONTEXT/archive/decisions-archive.md until char count is at or
  below 60 percent of ceiling (15,000 chars for the 25,000-char ceiling). Cut
  deep on each pass so the next trigger is not immediate.
- Move triggers: (1) entry gains `Superseded by: <link>` field;
  (2) ceiling crossed (forced); (3) session-end opportunistic when
  entries are clearly stale.
- Move priority: superseded with link first, oldest first; then
  superseded no link, oldest first; then oldest non-superseded by
  date heading. Never move the top 5 newest entries.
- Both files newest-at-top. Moved entries keep all fields intact.
- On first move, create CONTEXT/archive/decisions-archive.md from
  its schema (see decisions-archive.md header below) if absent.
- Optional theme condensation: when 4 or more archived entries share
  a theme and oldest > 3 months, propose a synthesized entry in the
  active file with backlinks to the merged entries. Confidence on
  the synthesized entry equals the lowest of the merged set, with
  note `Synthesized from N entries, lowest input confidence M`.
  User must approve before write.
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
Confidence: H -- [source], verified YYYY-MM-DD
(or Confidence: M)
(or Confidence: L -- [what would verify])

Rejected alternatives (optional):
- [alternative] -- rejected because [reason]

## YYYY-MM-DD -- [Older decision, still valid]
...

## YYYY-MM-DD -- [Decision ratified from auto-loop observation]
Decision: [one sentence statement]
Rationale: [one to three sentences]
Confidence: H-holdout -- ratified from <mode>/<tag>, verified YYYY-MM-DD
Source: meta-agent-ratified
Evidence: <mode>/<tag> (<metric>: <value>)

## YYYY-MM-DD -- [Old decision] (Superseded by YYYY-MM-DD)
...
-->
