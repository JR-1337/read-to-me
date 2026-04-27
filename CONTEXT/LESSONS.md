<!-- SCHEMA: LESSONS.md
Version: 3
Purpose: durable user preferences, repeated pitfalls, and workflow corrections.
Write mode: append new entries. Update Affirmations counter on recurrence.

Rules:
- Each entry scoped with [GLOBAL], [PROJECT], or [MODULE: {module-name}].
- Each entry carries Affirmations: N starting at 0.
- Before appending a new entry, grep this file for existing entries with a
  similar title (case-insensitive, substring match on the main noun phrase).
  If a match exists, increment its Affirmations counter instead of creating
  a duplicate. Duplicates dilute the graduation signal.
- Increment Affirmations when the user restates the lesson or the same
  correction recurs in a later session.
- Graduate to the root adapter (or kit prompt) when Affirmations reaches 2,
  OR when its absence caused a repeated failure class that cost real time.
  When a lesson is folded into a kit prompt, root adapter, or canonical
  CONTEXT file, mark the entry with `Graduated: YYYY-MM-DD to <target>` so
  future sessions do not re-fold and the archive flow can move it under
  ceiling pressure.
- Confidence level only when the lesson is inferred rather than explicitly
  stated by the user. Same H/M/L scale as DECISIONS.md (same grammar).
- Optional Evidence field when the lesson came from auto-loop observation.
  Format: <mode>/<tag> (<metric>: <value>). Reference only.
- Optional Source field: graduated-from-project (cross-project graduation)
  or meta-agent-ratified (auto-loop observation). Default human (omit).
- Optional Origin field: short name(s) of the project(s) the lesson originated
  in. Used on globally-graduated entries to preserve provenance.
- Do not log one-off chat trivia.
- If you catch yourself duplicating state from TODO.md or DECISIONS.md,
  remove the duplicate.
- Bullets under 12 words, sentences under 20 words, no paragraphs.
- ASCII operators only.

Archive behavior:
- Active file ceiling: 200 lines. Above ceiling, move oldest entries
  to CONTEXT/archive/lessons-archive.md until line count is at or below
  60 percent of ceiling (120 lines for the 200-line ceiling). Cut deep
  on each pass so the next trigger is not immediate.
- Move triggers: (1) entry gains a `Graduated: YYYY-MM-DD to <target>` field;
  (2) ceiling crossed (forced); (3) session-end opportunistic when
  entries are clearly stale (lesson references files no longer in the
  project, or the cited failure class can no longer occur).
- Move priority: graduated entries first, oldest first; then oldest
  non-graduated by entry order. Never move the top 5 newest entries.
- Both files newest-at-top. Moved entries keep all fields intact,
  including Affirmations counter and Graduated note.
- On first move, create CONTEXT/archive/lessons-archive.md from
  its schema (see lessons-archive.md header below) if absent.
- Cross-project graduation flow is separate and unchanged:
  `[GLOBAL]`-tagged lessons hitting 2+ cross-project affirmations move to
  `{GLOBAL_ROOT}/CONTEXT/LESSONS.md` per HANDOFF graduation flow, NOT to
  the per-project archive. The archive holds project-scoped graduated
  and stale entries only.
-->

(no lessons recorded yet)

<!-- TEMPLATE
## [GLOBAL] -- [Lesson title]
Lesson: [what to do or avoid, in one sentence]
Context: [when it applies]
Affirmations: 0

## [PROJECT] -- [Lesson title]
Lesson: [what to do or avoid]
Context: [when it applies]
Affirmations: 1
(Graduates to root adapter at Affirmations: 2)

## [MODULE: auth] -- [Lesson title, inferred]
Lesson: [what to do or avoid]
Context: [when it applies]
Confidence: M -- [what would verify]
Affirmations: 0

## [PROJECT] -- [Lesson ratified from auto-loop]
Lesson: [what to do or avoid]
Context: [when it applies]
Affirmations: 0
Source: meta-agent-ratified
Evidence: <mode>/<tag> (<metric>: <value>)

## [GLOBAL] -- [Lesson graduated from cross-project pattern]
Lesson: [what to do or avoid]
Context: [when it applies]
Affirmations: 0
Source: graduated-from-project
Origin: [project-a, project-b]
-->
