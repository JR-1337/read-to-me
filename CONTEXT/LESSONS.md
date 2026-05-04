<!-- SCHEMA: LESSONS.md
Version: 6
Purpose: durable user preferences, repeated pitfalls, and workflow corrections; structured for machine-detectable findings extraction.
Write mode: append new entries. Update Affirmations counter on recurrence.

Slot structure (per entry):
- Rule: (required) imperative single-clause stating what to do or avoid.
- Trigger: (required) when this rule fires -- one clause.
- Why: (required) mechanism -> consequence in <=2 sentences.
- Provenance: (required) date -- commit -- 1-line incident description.
- Wrong way: (optional) concrete anti-pattern only: code snippet, named function, or named pattern with a name. Omit if fuzzy.
- Tags: (required) 1 controlled surface: tag + 1 controlled concern: tag; optional free-form tags appended.
- Affirmations: N (carry over from v3; starts at 0 for new entries).
- [Confidence: / Graduated: / Source: / Origin:] (optional; same semantics as v3).

Per-slot sentence frames:
- Rule: <verb-imperative> <object> <when/where>. (one clause, one period)
- Trigger: When <condition or workflow step>. (one clause, one period)
- Why: <mechanism>. <consequence if rule omitted>. (two sentences max)
- Provenance: <YYYY-MM-DD> -- <commit-or-session> -- <1-line incident>.
- Wrong way: <named pattern or code snippet>. (concrete; omit if fuzzy)

Atomicity rule (replaces word/sentence caps): one rule, one trigger, one why per entry. If your draft fuses multiple lessons, split into N entries.

Wrong way slot guard: `Wrong way:` is filled only when the anti-pattern is concrete: a code snippet, a named function call, a specific pattern with a name. Fuzzy anti-patterns ("don't be sloppy", "avoid bad code") conflict with other rules; omit the slot when the anti-pattern is fuzzy.

Tags controlled vocabulary (starter set):
- surface: [react, css, html-pdf, sheets, apps-script, vercel, neon, deploy, ci, schema, prompt-kit, harness, build]
- concern: [type-coercion, auth, perf, layout, render, data-shape, migration, ux, error-handling, observability, dependency, naming]
- Consumers may extend their per-project vocab in their own LESSONS schema header during BOOTSTRAP migration.

Rules:
- Each entry scoped with [GLOBAL], [PROJECT], or [MODULE: {module-name}].
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
- Skip one-off chat trivia. The graduation signal stays load-bearing only when entries earn their place.
- If you catch yourself duplicating state from TODO.md or DECISIONS.md,
  remove the duplicate.
- ASCII operators only.

Archive behavior:
- Active file ceiling: 25,000 chars. Above ceiling, move oldest entries
  to CONTEXT/archive/lessons-archive.md until char count is at or below
  60 percent of ceiling (15,000 chars for the 25,000-char ceiling). Cut deep
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
## [PROJECT] -- [Lesson title]
Rule: [verb-imperative object when/where.]
Trigger: When [condition or workflow step.]
Why: [mechanism.] [consequence if rule omitted.]
Provenance: YYYY-MM-DD -- [commit-or-session] -- [1-line incident].
Tags: surface: prompt-kit, concern: migration
Affirmations: 0

## [GLOBAL] -- [Lesson title]
Rule: [verb-imperative object when/where.]
Trigger: When [condition or workflow step.]
Why: [mechanism.] [consequence if rule omitted.]
Provenance: YYYY-MM-DD -- [commit-or-session] -- [1-line incident].
Tags: surface: schema, concern: naming
Affirmations: 1
(Graduates to root adapter at Affirmations: 2)

## [MODULE: auth] -- [Lesson title, inferred]
Rule: [verb-imperative object when/where.]
Trigger: When [condition or workflow step.]
Why: [mechanism.] [consequence if rule omitted.]
Provenance: YYYY-MM-DD -- [commit-or-session] -- [1-line incident].
Tags: surface: harness, concern: auth
Confidence: M -- [what would verify]
Affirmations: 0

## [PROJECT] -- [Lesson ratified from auto-loop]
Rule: [verb-imperative object when/where.]
Trigger: When [condition or workflow step.]
Why: [mechanism.] [consequence if rule omitted.]
Provenance: YYYY-MM-DD -- [commit-or-session] -- [1-line incident].
Wrong way: [named pattern or code snippet.]
Tags: surface: ci, concern: observability
Affirmations: 0
Source: meta-agent-ratified
Evidence: <mode>/<tag> (<metric>: <value>)

## [GLOBAL] -- [Lesson graduated from cross-project pattern]
Rule: [verb-imperative object when/where.]
Trigger: When [condition or workflow step.]
Why: [mechanism.] [consequence if rule omitted.]
Provenance: YYYY-MM-DD -- [commit-or-session] -- [1-line incident].
Tags: surface: prompt-kit, concern: migration
Affirmations: 0
Source: graduated-from-project
Origin: [project-a, project-b]
Graduated: YYYY-MM-DD to [target file or step]
-->
