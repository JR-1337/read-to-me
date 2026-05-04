<!-- SCHEMA: LESSONS.md
Version: 6.3
Purpose: durable user preferences, repeated pitfalls, and workflow corrections.
Write mode: append. Increment Affirmations counter on recurrence.

Schema body (slot definitions, sentence frames, tags vocabulary, rules, archive behavior, graduation flow):
~/context-system/specs/TEMPLATES.md, section `LESSONS.md schema body`. Read it before writing any entry.

Critical numbers (inline so a writer can write defensively without the sidecar read):
- Per-entry char cap: 500c. Overflow -> split per atomicity rule (one rule, one trigger, one why per entry).
- Active file ceiling: 25,000c. On cross, archive oldest to CONTEXT/archive/lessons-archive.md until <=15,000c (60%).
- Graduation auto-mark: when Affirmations reaches 2, write `Graduation: due YYYY-MM-DD` on the entry. HANDOFF Step 2 audits these and prompts review.
- Archive cadence: HANDOFF Step 3 runs an opportunistic archive pass when this session added 3+ entries, even if under ceiling.

ASCII operators only.
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
