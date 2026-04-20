<!-- SCHEMA: LESSONS.md
Version: 1
Purpose: durable user preferences, repeated pitfalls, and workflow corrections.
Write mode: append new entries. Update Affirmations counter on recurrence.

Rules:
- Each entry scoped with [GLOBAL], [PROJECT], or [MODULE: {module-name}].
- Each entry carries Affirmations: N starting at 0.
- Increment Affirmations when the user restates the lesson or the same
  correction recurs in a later session.
- Graduate to the root adapter when Affirmations reaches 2, OR when its
  absence caused a repeated failure class that cost real time.
- Confidence level only when the lesson is inferred rather than explicitly
  stated by the user. Same H/M/L scale as DECISIONS.md.
- Optional Evidence field when the lesson came from auto-loop observation.
  Format: <mode>/<tag> (<metric>: <value>). Reference only.
- Optional Source field: graduated-from-project (cross-project graduation)
  or meta-agent-ratified (auto-loop observation). Default human (omit).
- Optional Origin field: short name(s) of the project(s) the lesson originated
  in. Used on globally-graduated entries to preserve provenance.
- Do not log one-off chat trivia.
- Do not duplicate state that belongs in TODO.md or DECISIONS.md.
- Bullets under 12 words, sentences under 20 words, no paragraphs.
- ASCII operators only.
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
Confidence: M - [what would verify]
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
