<!-- SCHEMA: observations.md
Purpose: meta-agent inbox for candidate lessons, findings, and open questions.
Write mode: meta-agent appends at end of each batch. Human reviews and marks
graduations via checkboxes; handoff Step 2b processes marks.

Sections (in order):
- Findings: what recent batches surfaced. Retention: last 10.
- Candidates: staged for graduation to CONTEXT/LESSONS.md or CONTEXT/DECISIONS.md.
  Each candidate is a checkbox entry.
  - `- [ ]` = pending human review (default state written by meta-agent)
  - `- [x]` = affirmed by human; handoff Step 2b will graduate and delete
  - entry deleted entirely = rejected by human
  Unchanged `- [ ]` entries remain across sessions until affirmed or rejected.
- Open Questions: meta-agent uncertainty. Retention: until resolved or superseded.

Rules:
- Telegraphic ASCII per CONTEXT/* style. No LaTeX, no Unicode math.
- Each entry carries enough reference to reconstruct the finding (mode, tag, metric).
- Candidate format:
  `- [ ] <short title>`
  `  Target: LESSONS.md` or `Target: DECISIONS.md`
  `  Scope: [GLOBAL] | [PROJECT] | [MODULE: <name>]` (LESSONS candidates only)
  `  Evidence: <commit-sha> (<metric>: <value>)`
  `  Rationale: <one telegraphic line>`
- Do not duplicate results.tsv rows here. Reference the commit tag instead.
-->

## Findings
(none yet)

## Candidates
(none yet. Meta-agent appends `- [ ]` checkbox entries. Change to `- [x]` to affirm for graduation at next handoff; delete the entry entirely to reject.)

## Open Questions
(none yet)
