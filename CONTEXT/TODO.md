<!-- SCHEMA: TODO.md
Version: 1
Purpose: current worklist, blockers, verification state, recent completions.
Write mode: overwrite in place as status changes. Not append-only.

Sections (in order):
- Active: ordered list of current work. Top item is the next step.
- Blocked: items waiting on external dependencies or user input.
- Verification: what has been validated, what is missing, known risks.
- Completed: up to 5 most recent completed items. Older items drop off.

Rules:
- Bullets under 12 words, sentences under 20 words, no paragraphs.
- ASCII operators only (see Operator Legend in PROJECT_MEMORY_BOOTSTRAP.md).
- Do not store rationale (use DECISIONS.md), architecture (use ARCHITECTURE.md),
  or preferences (use LESSONS.md).
- Items graduate to Completed when done and verified. Durable rationale
  moves to DECISIONS.md.
-->

## Active
- (none -- scaffold upgraded and committed; LOOP deleted as exploratory)

## Blocked
- (none)

## Verification
- Last validated: BOOTSTRAP Upgrade-Mode v0->v1 -- byte-diff confirms user content preserved, all 4 CONTEXT schemas at Version: 1 (2026-04-20)
- Missing validation: none
- RISK: none

## Completed
- [2026-04-20] Deleted LOOP/punct-cleaner/ -- exploratory pre-holdout scaffold, no dry runs recorded; recreate via LOOP_CREATION.md if needed
- [2026-04-20] Scaffold commit db69602: CONTEXT/, CLAUDE.md, .cursor/, .gitignore, LOOP/ -- 19 files, 825 insertions
- [2026-04-20] BOOTSTRAP Upgrade-Mode v0->v1: 4 CONTEXT/* schemas, DECISIONS+LESSONS templates updated, CLAUDE.md Loop Access Rules appended, .gitignore extended -- verified by byte-diff user content preserved
- [2026-04-20] Deleted docs/ stubs (todo.md, decisions.md, lessons.md, schemas/TEMPLATE-schema.md, 2x .gitkeep, 3 empty dirs) -- superseded by CONTEXT/; verified by git status
- [2026-04-20] TTS code: cursor-anchored start, sentence snap, punctuation sanitization, word-follow heuristic -- verified in browser; commit 2fe5ceb pushed

<!-- TEMPLATE
## Active
- [task] -- next step: [concrete action]
- [task] -- blocked by [item in Blocked]

## Blocked
- [task] -- waiting on [external or user] -- since [YYYY-MM-DD]

## Verification
- Last validated: [what was checked, how, date]
- Missing validation: [what still needs checking]
- RISK: [known risk, impact]

## Completed
- [YYYY-MM-DD] [task] -- verified by [test or user confirmation]
-->
