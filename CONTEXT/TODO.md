<!-- SCHEMA: TODO.md
Version: 6.3
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
- (none)

## Verification
- Last validated 2026-05-04 (s054 TTS v6 -> v6.3 upgrade rollout): /bootstrap Upgrade Mode walked Steps 0/7-15. 6 schemas-march bumped to v6.3 (4 CONTEXT + 2 DATA); LESSONS v6.2 sidecar split deployed (schema header full body -> SHORT pointer 1016c; 0 live entries so Graduation:due back-fill no-op); user content byte-identical to snapshot via two-sided extraction across all 5 CONTEXT/DATA files with content (catalog has none); AGENTS.md Branch A text-drift refresh to v6.3 canonical (8418c, H1 "TTS", both V1 markers preserved, 0-diff against canonical-with-substitution); DATA/routing-index.md TEMPLATE block appended (was missing pre-run; spec-required append). Drift-scan trigger trig_015xMW5DNpa91ZnQDhR3Eaus already registered from s048 (RemoteTrigger.get verified body byte-identical to v6.3 driver canonical with {project-name}=TTS; cron 7 2 * * 1; next fire 2026-05-11T02:07:00Z). Settings.json migration: canonical hook block moved from .claude/settings.local.json (now {}) into .claude/settings.json (committed; ships in git for cloud session inheritance); 5 kit-shipped commands across 3 matchers; settings.local.json post-purge clean. 5 hooks refreshed in .claude/hooks/ (executable). Kit projects.md self-entry preserved at registered 2026-05-04. Selftest 29/29 (kit-side). Adversarial Sonnet audit returned H=0 M=2 L=2 F=3; both MEDIUMs fixed inline (routing-index TEMPLATE append; this TODO refresh); LOWs skipped per pre-existing-not-from-this-run rule; FLAG 3 (cross-kit gap: DATA_CAPTURE_BOOTSTRAP.md does not check for TEMPLATE block on routing-index -- explains why TTS deployed file lacked it) logged to kit's CONTEXT/TODO.md Active for next kit-internal session.
- Last validated 2026-05-04 (s048 TTS v6 upgrade rollout): /bootstrap Upgrade Mode walked Steps 0/7-15. Schemas-march at v6 across 6 files; AGENTS.md Branch A text-drift refresh deployed; drift-scan trigger registered; 5 hooks installed; kit projects.md upserted.
- Missing validation: none
- RISK: pre-existing `prompts/v2/` directory (project root) carries stale copies of kit drivers with unsubstituted `{project-name}` placeholders, from commit 33f55f5. Out of scope for v6.3 rollout (Non-Destructive Guarantee; not in CONTEXT/* or adapter set). Cleanup candidate at a future session.
- RISK (pre-existing, s048-or-earlier, audit LOW 2): three DECISIONS entries use single-hyphen Confidence format (`Confidence: H - verified...`) instead of the schema's `Confidence: H -- <source>, verified YYYY-MM-DD` grammar. Pre-existing user content; preserved unchanged per Non-Destructive Guarantee. Cleanup is a future-session edit when the affected entries get re-litigated.

## Completed
- [2026-05-04] s054 TTS v6 -> v6.3 upgrade rollout: /bootstrap Upgrade Mode shipped end-to-end. 6 schemas v6 -> v6.3 (4 CONTEXT + 2 DATA); LESSONS v6.2 sidecar split (full body -> SHORT pointer); AGENTS.md text-drift refresh (8418c, env-prefix bypass clarification picked up from kit s050); settings.json migration from settings.local.json (canonical block now ships in git); 5 hooks refreshed; routing-index TEMPLATE block back-filled. Adversarial audit 0 HIGH; 2 MEDIUM fixed inline; 1 cross-kit FLAG (DATA_CAPTURE_BOOTSTRAP routing-index template-check gap) logged to kit Active for harvest.
- [2026-05-04] s048 TTS v6 upgrade rollout: /bootstrap Upgrade Mode shipped end-to-end. 6 schemas v5.2 -> 6 (4 CONTEXT + 2 DATA); AGENTS.md text-drift refresh to v6 canonical; drift-scan trigger trig_015xMW5DNpa91ZnQDhR3Eaus registered; 5 hooks installed; settings.local.json created; kit projects.md upserted; gitignore extended with .claude/.upgrade-in-progress.
- [2026-04-26] context-system pre-v2.7 -> v2.9 upgrade: AGENTS.md canonical + 3 shims (CLAUDE/KIMI/.mdc; KIMI.md created from scratch); CONTEXT/* schema headers refreshed (DECISIONS v1 -> v2); 73 lines user content preserved verbatim. Branch C consolidation. -56 lines of duplicated adapter routing.
- [2026-04-20] Deleted LOOP/punct-cleaner/ -- exploratory pre-holdout scaffold, no dry runs recorded; recreate via LOOP_CREATION.md if needed
- [2026-04-20] Scaffold commit db69602: CONTEXT/, CLAUDE.md, .cursor/, LOOP/ -- 19 files, 825 insertions

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
