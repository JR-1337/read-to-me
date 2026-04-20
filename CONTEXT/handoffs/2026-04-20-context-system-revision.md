# Session Greeting

Read `CONTEXT/TODO.md`, `CONTEXT/DECISIONS.md`, `CONTEXT/ARCHITECTURE.md` first. Skim this handoff's State and Next Step Prompt. Check Verify On Start before resuming any work.

First reply: 1-2 short sentences, then a `Pass-forward:` line (single sentence of carried state), then exactly 1 direct question about how to proceed.

Pass-forward: TTS CONTEXT/ schemas are pre-versioning (v0) while the context-system prompts were revised this session to v1 with LOOP_UPGRADE folded into BOOTSTRAP. Top active task: run BOOTSTRAP on TTS to upgrade schemas to v1.

# State

Project path: /home/johnrichmond007/APPS/TTS
Branch: main (in sync with origin/main, +0 -0)
Working tree: untracked memory-system scaffold (CONTEXT/, LOOP/, CLAUDE.md, .cursor/, .gitignore) and leftover docs/ stubs. TTS code changes committed and pushed at 2fe5ceb.
Active focus: post-revision retrofit of TTS memory and loop to current spec. No in-flight code work on the TTS app itself.

Major constraint: this session revised the global context-system prompts (~/context-system/) significantly. TTS project memory was bootstrapped under the pre-revision spec, so TTS is now one version behind. All retrofit paths exist in the new spec (BOOTSTRAP Upgrade Mode, LOOP_CREATION Step 2 repair); no regressions expected.

# Auto-loop state

Mode: punct-cleaner
Last commit: none (loop scaffolded but never dry-ran; results.tsv has only header row)
Last status: n/a
Dominant failure mode: none observed
Last research: none

# This Session

**Context-system revision (the bulk of this session):** All four prompts at ~/context-system/ were edited in place. Summary of changes per PROMPT_AUDIT_REPORT + LOOP_RESEARCH_REPORT findings:

- PROJECT_MEMORY_BOOTSTRAP.md: absorbed LOOP_UPGRADE.md content as state-aware fold (Step 0 detects fresh/upgrade/no-op; Steps 7-14 are upgrade path); added First-Time Global Setup subsection; added Schema Versioning section; all 7 local schemas carry `Version: 1`; H-holdout confidence variant documented; DECISIONS template graduation example uses H-holdout.
- LOOP_CREATION.md: held-out task partition (tasks/holdout/, run-holdout.sh, .task-hashes tampering guard); Q3e gaming + Q11 repetition_count + Q12 complexity_proxy added to Step 1; plateau cooldown via .last-research-commit enforced in run.sh; crash-infra vs crash-hypothesis enum split; keep-combo/discard-combo for combination experiments; Resume subsection in program.md Setup; Step 4c deferred-task branch; observations.md schema carries Version: 1; Evidence format unified to <mode>/<tag>; precondition redirects to BOOTSTRAP (no LOOP_UPGRADE).
- HANDOFF_PROMPT.md: Step 2b graduation adds explicit Candidate -> LESSONS/DECISIONS schema mapping; held-out verification blocks graduation on regression; Confidence becomes H-holdout when held-out passed; status enum references updated for expanded set.
- LOOP_UPGRADE.md: deleted (content merged into BOOTSTRAP Upgrade Mode).
- ~/context-system/CONTEXT/LESSONS.md: written with global graduated-only schema (Version: 1, mandatory Source field, optional Origin).
- ~/.claude/CLAUDE.md: Cross-Project Memory section added (declared vs graduated split); Rule Supremacy binding chain includes ~/context-system/CONTEXT/LESSONS.md; 75-line bloat ceiling note.

**TTS code work (earlier this session, already committed):** cursor-anchored playback start with sentence-boundary snap (app.js); punctuation sanitization in chunker.js; improved word-follow heuristic with pause weights (player.js); sw.js cache bumped v5->v6. Commit 2fe5ceb pushed.

**TTS memory bootstrap (earlier):** CONTEXT/ + CLAUDE.md + .cursor/rules/context-system.mdc + .gitignore scaffolded under pre-revision spec. Untracked in git.

**TTS loop scaffold (earlier):** LOOP/punct-cleaner/ written as an exploratory walkthrough. Pre-holdout spec (no tasks/holdout/, no run-holdout.sh, no .task-hashes). Task content is TODO placeholders.

**Decanting: clean.** No working assumptions, near-misses, or naive-next-moves worth recording beyond what is captured above.

**Audit: skipped (no adapter or pre-Step-2 CONTEXT writes in this session; no graduations).**

**LOOP: pre-spec** (punct-cleaner: 0 data rows in results.tsv; .task-hashes absent; retrofit pending via LOOP_CREATION Step 2). Held-out partition not yet present.

# Hot Files

- `/home/johnrichmond007/context-system/PROJECT_MEMORY_BOOTSTRAP.md` -- next action reads Step 0
- `/home/johnrichmond007/context-system/LOOP_CREATION.md` -- Step 2 repair path for the punct-cleaner retrofit
- `/home/johnrichmond007/APPS/TTS/CONTEXT/TODO.md` -- active retrofit items
- `/home/johnrichmond007/APPS/TTS/LOOP/punct-cleaner/` -- scaffold that needs retrofit or deletion
- `/home/johnrichmond007/APPS/TTS/docs/` -- stale stubs awaiting deletion (permission blocked earlier)
- `/home/johnrichmond007/.claude/CLAUDE.md` -- 52 lines, 75-line ceiling; global rules updated with Rule Supremacy + Cross-Project Memory

# Anti-Patterns (Don't Retry)

- Do not batch LOOP_CREATION Step 1 questions into a single AskUserQuestion or summary table. Spec explicitly requires one-at-a-time walk-through. The earlier exploratory scaffold shortcut this; do not repeat.
- Do not propose separate v2 files for prompt edits. JR prefers in-place edits on canonical filenames.
- Do not create new prompt files for functionality that can fold into existing ones. GLOBAL_BOOTSTRAP.md was created then absorbed into PROJECT_MEMORY_BOOTSTRAP.md's First-Time Global Setup section; same pattern applied to LOOP_UPGRADE.md which collapsed into BOOTSTRAP Upgrade Mode. Default: fold before splitting.
- Do not run `rm -rf` on user directories without explicit permission; the harness blocked `rm -rf docs/` earlier in the session and will do so again.

# Blocked

- `docs/` deletion waiting on JR (since 2026-04-20).

# Key Context

- Context-system spec changes are documented in two audit reports at `/home/johnrichmond007/context-system/reports/LOOP_RESEARCH_REPORT.md` (historical; session also referenced now-deleted PROMPT_AUDIT_REPORT.md which JR removed after execution).
- The plan that drove this session's execution lives at `/home/johnrichmond007/.claude/plans/ok-i-need-you-mighty-steele.md`.
- H/M/L confidence scale: `H` = directly verified with inline note; `M` = default when verification absent or stale; `L` = plausible but unverified. New variant: `H-holdout` = H specifically ratified by held-out task scoring during auto-loop graduation.

# Verify On Start

- Read CONTEXT/TODO.md, CONTEXT/DECISIONS.md, CONTEXT/ARCHITECTURE.md.
- Confirm git state: `git status` (expect clean on committed TTS code; untracked memory scaffold still uncommitted); `git log -1` should show 2fe5ceb.
- LOOP verification: `LOOP/punct-cleaner/` exists but pre-spec. Before resuming any loop work, run LOOP_CREATION Step 2 repair OR delete the scaffold. Do not dry-run the loop in its current state -- run.sh lacks the tampering guard, repetition loop, and cooldown per current spec.
- Schema version check: none of the project `CONTEXT/*.md` files carry a `Version:` line on their schema header (treat as v0). The first BOOTSTRAP run detects this as upgrade mode.
- Harness switch note: if switching harnesses, read shared CONTEXT first; repair adapters only if stale.

# Next Step Prompt

Run `@PROJECT_MEMORY_BOOTSTRAP.md` in the TTS project. Step 0 will detect the v0 schemas and route to Upgrade-Mode Steps 7-14: snapshot capture, schema replace (bumps to v1), adapter refresh for Loop Access Rules (BOOTSTRAP's First-Time Global Setup is already done since `~/context-system/CONTEXT/LESSONS.md` exists), gitignore update (adds `CONTEXT/.upgrade-snapshot/`), per-item migration consent (none expected; no `[GLOBAL]` lessons in project LESSONS.md), byte-diff verification, snapshot cleanup.

After upgrade verifies clean, run `@LOOP_CREATION.md` with mode `punct-cleaner` to trigger Step 2 repair on the existing scaffold. This adds `tasks/holdout/`, `run-holdout.sh`, `.task-hashes`, and walks new questions (Q3e gaming, Q11 repetition_count, Q12 complexity_proxy) the pre-revision scaffold did not capture. Before the retrofit re-baselines `.task-hashes`, decide whether to fill `tasks/task-01/` and `tasks/holdout/task-h01/` content first (recommended) or accept the empty-stub baseline.

If keeping the loop is not the goal, delete `LOOP/punct-cleaner/` first; the scaffold was exploratory. The upgrade path still works either way.

Last: commit the memory-system scaffold and any retrofit artifacts. Do not commit until JR confirms the retrofit passed and he is ready to push.
