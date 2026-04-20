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
- Decide fate of LOOP/punct-cleaner/ -- keep as real loop (requires filling task content) or delete as exploratory
- Retrofit LOOP/punct-cleaner/ to current spec (if keeping) -- next step: run @LOOP_CREATION.md, Step 2 repair adds tasks/holdout/, run-holdout.sh, .task-hashes; ask Q3e/Q11/Q12
- Commit memory-system scaffold -- untracked: CONTEXT/, LOOP/, CLAUDE.md, .cursor/, .gitignore; do after loop fate decided

## Blocked
- (none)

## Verification
- Last validated: TTS code (cursor/sentence/punctuation) verified by browser test 2026-04-20
- Missing validation: BOOTSTRAP Upgrade-Mode run on TTS; LOOP_CREATION Step 2 repair on punct-cleaner; first punct-cleaner dry run
- RISK: LOOP_CREATION Step 2 re-baselines .task-hashes from current tasks/ content; fill task-01 and task-h01 BEFORE retrofit or accept empty-stub baseline

## Completed
- [2026-04-20] BOOTSTRAP Upgrade-Mode v0->v1: 4 CONTEXT/* schemas, DECISIONS+LESSONS templates updated, CLAUDE.md Loop Access Rules appended, .gitignore extended -- verified by byte-diff user content preserved
- [2026-04-20] Deleted docs/ stubs (todo.md, decisions.md, lessons.md, schemas/TEMPLATE-schema.md, 2x .gitkeep, 3 empty dirs) -- superseded by CONTEXT/; verified by git status
- [2026-04-20] TTS code: cursor-anchored start, sentence snap, punctuation sanitization, word-follow heuristic -- verified in browser; commit 2fe5ceb pushed
- [2026-04-20] TTS bootstrap: CONTEXT/, CLAUDE.md, .cursor/rules/context-system.mdc, .gitignore -- written per PROJECT_MEMORY_BOOTSTRAP spec
- [2026-04-20] context-system revision: all 4 prompts updated, LOOP_UPGRADE folded into BOOTSTRAP, schema versioning v1, H-holdout confidence, 75-line CLAUDE.md ceiling -- see handoff This Session

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
