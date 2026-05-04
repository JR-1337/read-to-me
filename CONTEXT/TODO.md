<!-- SCHEMA: TODO.md
Version: 6
Purpose: current worklist, blockers, verification state, recent completions.
Write mode: overwrite in place as status changes. Not append-only.

Sections (in order):
- Active: ordered list of current work. Top item is the next step.
- Blocked: items waiting on external dependencies or user input.
- Verification: what has been validated, what is missing, known risks.
- Completed: up to 5 most recent completed items. Older items drop off.

Rules:
- Concision via shape, not word count -- match the example structure.
- ASCII operators only (see Operator Legend in the Telegraphic Memory Style section of specs/BOOTSTRAP_REFERENCE.md).
- If you catch yourself writing rationale, move it to DECISIONS.md.
- If you catch yourself writing architecture notes, move them to ARCHITECTURE.md.
- If you catch yourself writing preferences, move them to LESSONS.md.
- Items graduate to Completed when done and verified. Durable rationale
  moves to DECISIONS.md.
-->

## Active
- (none -- scaffold upgraded and committed; LOOP deleted as exploratory)

## Blocked
- `CONTEXT/.upgrade-snapshot/` lingers after s048 v6 rollout -- sandbox denied `rm -rf CONTEXT/.upgrade-snapshot` per Step 13 sandbox cleanup note. Verification passed; gitignored, harmless in place. Manual cleanup: `rm -rf CONTEXT/.upgrade-snapshot` from a shell with permissions.

## Verification
- Last validated 2026-05-04 (s048 TTS v6 upgrade rollout): /bootstrap Upgrade Mode walked Steps 0/7-15. Schemas-march at v6 across 6 files (4 CONTEXT + 2 DATA); user content byte-identical to snapshot via two-sided extraction (TODO/DECISIONS/LESSONS/catalog/routing-index); ARCHITECTURE per-file-exemption awk clean (drift-scan integration line allowlisted); AGENTS.md Branch A text-drift refresh deployed byte-identical to canonical with {project-name}=TTS (8191c). Drift-scan trigger registered: trig_015xMW5DNpa91ZnQDhR3Eaus, weekly Mon 02:07 UTC, next fire 2026-05-11T02:07:00Z, body byte-identical to driver canonical (verified via RemoteTrigger.get). 5 hooks installed in .claude/hooks/ (executable); .claude/settings.local.json carries canonical hook block (5 commands). Kit projects.md upserted: https://github.com/JR-1337/read-to-me. Selftest 29/29. Adversarial Sonnet audit returned H=0 M=1 (kit-side projects.md `>>` driver bug; logged to kit TODO Active for harvest before next consumer roll) L=1 (pre-existing prompts/v2/ stale dir, see RISK below) F=2 (one closed via RemoteTrigger.get; one architectural about CCR settings.local.json -- see RISK below). All HIGH+MEDIUM resolved.
- Last validated 2026-04-26: BOOTSTRAP Upgrade-Mode pre-v2.7 -> v2.9 -- byte-diff confirms 73 lines user content preserved across 4 CONTEXT files; AGENTS.md canonical + 3 shims; DECISIONS schema v1 -> v2 (adds archive behavior)
- Missing validation: none
- RISK: pre-existing `prompts/v2/` directory (project root) carries stale copies of kit drivers with unsubstituted `{project-name}` placeholders, from commit 33f55f5. Out of scope for this v6 rollout (Non-Destructive Guarantee on snapshot; not in CONTEXT/* or adapter set). Cleanup candidate at a future session.
- RISK: `.claude/settings.local.json` is globally gitignored on this machine (`~/.config/git/ignore: **/.claude/settings.local.json`) and will not commit. The drift-scan cron fires in a fresh CCR sandbox cloning only the GitHub source; settings.local.json from this machine is irrelevant in that environment. The hooks themselves ship in `.claude/hooks/` (committed) and do enforce behavior on local Claude Code sessions. No runtime risk; flagged for awareness only.

## Completed
- [2026-05-04] s048 TTS v6 upgrade rollout: /bootstrap Upgrade Mode shipped end-to-end. 6 schemas v5.2 -> 6 (4 CONTEXT + 2 DATA); AGENTS.md text-drift refresh to v6 canonical (8191c, H1 "TTS"); drift-scan trigger trig_015xMW5DNpa91ZnQDhR3Eaus registered (weekly Mon 02:07 UTC, source https://github.com/JR-1337/read-to-me); 5 hooks installed; settings.local.json created; kit projects.md upserted; gitignore extended with .claude/.upgrade-in-progress. Adversarial audit returned 0 HIGH; surfaced 1 cross-kit MEDIUM (projects.md `>>` driver bug, logged to kit TODO Active for harvest pass).
- [2026-04-26] context-system pre-v2.7 -> v2.9 upgrade: AGENTS.md canonical + 3 shims (CLAUDE/KIMI/.mdc; KIMI.md created from scratch); CONTEXT/* schema headers refreshed (DECISIONS v1 -> v2); 73 lines user content preserved verbatim. Branch C consolidation. -56 lines of duplicated adapter routing.
- [2026-04-20] Deleted LOOP/punct-cleaner/ -- exploratory pre-holdout scaffold, no dry runs recorded; recreate via LOOP_CREATION.md if needed
- [2026-04-20] Scaffold commit db69602: CONTEXT/, CLAUDE.md, .cursor/, LOOP/ -- 19 files, 825 insertions
- [2026-04-20] BOOTSTRAP Upgrade-Mode v0->v1: 4 CONTEXT/* schemas, DECISIONS+LESSONS templates updated, CLAUDE.md Loop Access Rules appended, .gitignore extended -- verified by byte-diff user content preserved

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
