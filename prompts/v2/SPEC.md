# v2 Prompt System - Execution Specification

This file resolves every cross-cutting decision, drafts every new artifact in full, and enumerates every cross-reference update required for the v1 -> v2 upgrade. It is the source of truth during execution. Delete or archive after the v2 files are written and reviewed.

Version: 1 (spec itself)
Scope: `prompts/v2/*` produced from the three v1 prompt files plus audit picks.

---

## Part A - Cross-cutting decisions resolved

### A1. Schema version bumps

Per BOOTSTRAP rule, a `Version:` number bumps only on field-level schema changes.

- `TODO.md` - no change - stays Version: 1.
- `DECISIONS.md` - no change - stays Version: 1. (Source/Evidence were already optional fields in v1; `H-holdout` was already present.)
- `ARCHITECTURE.md` - no change - stays Version: 1.
- `LESSONS.md` - no change - stays Version: 1.
- `handoff` - no change - stays Version: 1.
- `archive/` - no change - stays Version: 1.
- `observations.md` - **bump to Version: 2**. Rationale: Candidate Evidence format references the status-enum transition (v1 used 6-value enum, v2 uses 3-value; any Evidence field mentioning `keep-combo`/`discard-combo`/`crash-hypothesis` is now invalid). Field-level change.

Upgrade-mode handling for `observations.md` Version 1 -> 2: BOOTSTRAP's existing non-destructive upgrade flow (schema header replace, content preserved) covers this. No special data migration required; stale Evidence strings referencing retired status values are treated as historical and left alone.

### A2. `contract.yml` content

With `P-H3 option A` (three-value enum, no `crash-hypothesis`), the `range:` field is decorative at the runner level. Decision: **keep `range:` as an optional field**. The runner does not hard-fail on out-of-range values in v2 (because the enum has no state to flag them into), but the contract documents the metric's bounds for human reference and for future reintroduction if needed. Soft-warn only in `run.sh` if metric is out of range: one-line stderr notice, row still logged as `keep` or `crash-infra` per normal path.

Final `contract.yml.example` fields (all optional except the first three):

- `metric` (required): string, metric name
- `direction` (required): `higher_is_better` | `lower_is_better`
- `stability` (required): `deterministic` | `bounded_variance` | `noisy`
- `repetitions`: int (default 1)
- `cv_threshold`: float (default 0.10; retained for backward compatibility with RDM calc; name kept as `cv_threshold` since "threshold" is accurate even under RDM)
- `range`: `[min, max]` - soft warn only
- `gaming_scenarios`: list of strings

### A3. Em-dash sweep scope

User direction: "uses hyphens when reaching for em-dashes. all three files."

Interpretation: **convert all em-dashes (U+2014) and en-dashes (U+2013) to ASCII double-hyphen `--` or single hyphen `-`.** Apply across all four v2 prompts + README + SPEC. No exceptions for "real parenthetical" em-dashes; the rule is now absolute.

Replacement convention:
- Em-dash used parenthetically (with surrounding spaces): ` -- `
- Em-dash used without spaces (rare): `--`
- En-dash in ranges: `-`

### A4. `program.md` tampering coverage

User direction: P-M3 yes (hash `program.md` into `.program-checksum`).

Decision: **soft-warn only**. `run.sh` checks `.program-checksum` at start; mismatch prints `PROGRAM_CHANGED: program.md differs from last run; re-read before proceeding.` to stderr but does not refuse to run. Rationale: `program.md` edits are legitimate redirections and happen more often than task edits. Combining a hard tampering block with the `.task-hashes` hard block would fire too often.

After detection, the runner updates `.program-checksum` to the new hash so the warning fires once per program-change, not every run.

### A5. P-H3 status enum propagation sites

The enum change (6 -> 3 values: `keep`, `discard`, `crash-infra`) must propagate to every site. Full list:

- `LOOP_CREATION.md`:
  - Step 3 `program.md` Experiment loop section (Act per status list)
  - Step 3 `program.md` results.tsv schema description
  - Step 3 `program.md` Plateau response description
  - Step 3 `observations.md` schema header (Candidate Evidence format)
  - Step 3 `results.tsv` description under "Status values"
  - Step 5 `run.sh` plateau-detection awk (`$4 == "discard"` only now)
  - Step 5 `run.sh` initial STATUS default stays `keep`; new `discard` path added via meta-agent post-edit convention
  - Step 8 verification line listing status enum
  - Step 1 Q10 `{PLATEAU_N}` description
  - Any other reference

- `HANDOFF-LOOP.md` (renamed from HANDOFF_PROMPT.md):
  - Step 2b "Consistency check" bullet listing status strings
  - Step 5 `Auto-loop state` section listing `Last status:` valid values

- Top-level docs (README, SPEC): no status strings.

Additionally, `program.md` must document the new status-write contract:

> The runner writes `keep` (default) or `crash-infra` (infrastructure failure). The meta-agent reads the row, compares the metric against the last committed `keep` row (or baseline if none), and acts:
> - If metric is better in the chosen direction (or first keep): leave status as `keep`, `git commit` the change (mutable file + results.tsv row).
> - If metric is worse or no improvement: edit the status column of the just-written row from `keep` to `discard`, `git commit` the results.tsv change only, then `git checkout HEAD -- <mutable_file>` to revert the mutable file. The discard row persists for plateau detection; the mutable-file change is reverted.
> - If status is `crash-infra`: `git reset --hard` (both the row and the mutable file revert; the run failed to produce signal).

This makes `discard` reachable AND persistent, fixing the silent reset-rollback-of-discards problem uncovered during validation.

### A6. File rename cross-reference updates

Renames:
- `HANDOFF_PROMPT.md` -> `HANDOFF-LOOP.md` (full LOOP variant)
- New: `HANDOFF.md` (lite, no LOOP steps)

Every `HANDOFF_PROMPT.md` reference in v2 source files updates to one of the two new names. Enumeration:

In `PROJECT_MEMORY_BOOTSTRAP.md` v1:
- Line 45 (First-Time Global Setup intro): `HANDOFF_PROMPT.md Step 2b` -> `HANDOFF-LOOP.md Step 2b`
- Line 61 (Read mode table): add entry explaining HANDOFF vs HANDOFF-LOOP.
- Line 214 (Upgrade Mode does NOT list): `HANDOFF_PROMPT.md Step 3's drift audit` -> `HANDOFF.md / HANDOFF-LOOP.md Step 3's drift audit`
- Line 866-868 (Interaction With Other Prompts in LOOP_CREATION, not BOOTSTRAP - noted here for tracking).

In `LOOP_CREATION.md` v1:
- Line 848 (Step 9 deliverable): `HANDOFF_PROMPT.md Step 2b` -> `HANDOFF-LOOP.md Step 2b`
- Line 858-859 (How to run a loop): `HANDOFF_PROMPT.md` -> `HANDOFF-LOOP.md`
- Line 866-867 (Interaction With Other Prompts): `HANDOFF_PROMPT.md Step 2b` -> `HANDOFF-LOOP.md Step 2b`

In new `HANDOFF.md` and `HANDOFF-LOOP.md`:
- Cross-link each other explicitly. `HANDOFF.md` top-pointer: "If this project has a `LOOP/` directory, use `HANDOFF-LOOP.md` instead." `HANDOFF-LOOP.md` top-pointer: "If this project has no `LOOP/` directory, `HANDOFF.md` is a simpler fit."

---

## Part B - Drafted artifacts

### B1. Root adapter templates (for BOOTSTRAP File Header Generation section)

#### B1.1 `CLAUDE.md` template

Target length: ~80-110 lines to stay well under the 160-line cap.

```markdown
# {project-name} -- Claude Code Adapter

<!-- LOOP_ACCESS_RULES_V1 -->
<!-- ADAPTER_SCHEMA_V1 -->

## Purpose

Thin routing layer for Claude Code working in this project. Canonical mutable memory lives in `CONTEXT/*`. This file is intentionally stable; update only when routing, ownership, or read/write behavior changes.

## Canonical Memory

All durable project state lives under `CONTEXT/`:
- `CONTEXT/TODO.md` -- current worklist, blockers, verification, recent completions
- `CONTEXT/DECISIONS.md` -- durable decisions with confidence and rationale
- `CONTEXT/ARCHITECTURE.md` -- current structure snapshot
- `CONTEXT/LESSONS.md` -- durable preferences, pitfalls, corrections
- `CONTEXT/handoffs/*.md` -- one current handoff, deleted on next session's end

Cross-project lessons live in `~/.context-system/CONTEXT/LESSONS.md` and are read only when `[GLOBAL]`-scoped context is relevant.

## Ownership

Non-overlapping by design. If you catch yourself writing rationale in TODO, stop and move it to DECISIONS. If you catch yourself writing task state in ARCHITECTURE, stop and move it to TODO. If you catch yourself writing preferences in DECISIONS, stop and move them to LESSONS.

## Read And Write Rules

At session start: read `TODO.md`, `DECISIONS.md`, `ARCHITECTURE.md`. Read `LESSONS.md` when preferences may affect approach. Read the current handoff only when resuming continuity.

Re-read any memory file when it changed, when scope shifts, when a contradiction surfaces, or before edits that depend on current plan/decisions/architecture.

Write `CONTEXT/*` during normal work. Update `TODO.md` on status change. Update `DECISIONS.md` on durable direction change. Update `ARCHITECTURE.md` on structural change. Update `LESSONS.md` on durable preference or repeated pitfall. Write handoffs only on end-of-session request.

Confidence format on DECISIONS and inferred LESSONS entries:
`Confidence: H(-holdout)? -- <source>, verified YYYY-MM-DD` or `Confidence: M` or `Confidence: L -- <what would verify>`.

## Module Adapters

Create `{module-name}/CLAUDE.md` only when the subtree has distinct runtime, conventions, or an external integration. Keep module adapters under 100 lines. Module adapters own local purpose, key files, conventions, boundaries -- nothing project-wide.

## Boundaries

In scope: routing between the coding agent and `CONTEXT/*`.

Out of scope: storing live task state, handoff text, decision history, dated session notes, or anything this adapter's sibling `context-system.mdc` (Cursor adapter) should also see. If one adapter is repaired, repair both.

## Loop Access Rules

If this project contains `LOOP/<mode>/` directories, they are machine-owned territory for auto-loop ratchet experiments. Routine human work does not read or write `LOOP/*` except:
- `LOOP/<mode>/observations.md` during graduation review (tick `- [x]` to approve, delete entry to reject)

The meta-agent (the coding agent running the loop) owns `LOOP/<mode>/*` during loop runs. Graduation from `observations.md` Candidates to `CONTEXT/LESSONS.md` or `CONTEXT/DECISIONS.md` happens via the handoff flow, human-ratified only.

Do not hand-edit `program.md` during active sessions (it is the meta-agent's directive; edit only when redirecting the loop). Do not hand-edit `results.tsv`, `jobs/*`, or task files during experiments.
```

#### B1.2 `.cursor/rules/context-system.mdc` template

Target length: ~90-120 lines.

```markdown
---
description: Canonical project memory routing for Cursor. Always applied.
alwaysApply: true
---

<!-- LOOP_ACCESS_RULES_V1 -->
<!-- ADAPTER_SCHEMA_V1 -->

# SYSTEM_DIRECTIVE: CONTEXT_SYSTEM

Thin routing layer. Canonical mutable memory is `CONTEXT/*`. This rule is stable; edit only when routing or ownership changes.

## Memory Ownership

- `CONTEXT/TODO.md` -- current worklist, blockers, verification, recent completions
- `CONTEXT/DECISIONS.md` -- durable decisions with confidence and rationale
- `CONTEXT/ARCHITECTURE.md` -- current structure snapshot
- `CONTEXT/LESSONS.md` -- durable preferences, pitfalls, corrections
- `CONTEXT/handoffs/*.md` -- one current handoff

Cross-project: `~/.context-system/CONTEXT/LESSONS.md` read when `[GLOBAL]` scope is relevant.

## Memory Style

Telegraphic ASCII. Bullets aim under 12 words. Sentences under 20. ASCII operators only (`!=`, `==`, `->`, `=>`, `in`, `not`, `and`, `or`, `blocked by`, `TODO:`, `RISK:`). No LaTeX, no Unicode math, no em-dashes.

## Boot Read

Start each session by reading `TODO.md`, `DECISIONS.md`, `ARCHITECTURE.md`. Add `LESSONS.md` when preferences may apply. Add the current handoff only if resuming.

## Module Adapters

Module adapters live at `.cursor/rules/module-{module-name}.mdc` with `alwaysApply: false` and scoped `globs`. Create only when the subtree has distinct runtime, conventions, or an external integration. Keep under 100 lines.

## Mid-Chat Re-Read

Re-read a memory file when it changed, scope shifted, a contradiction surfaced, or before edits that depend on current plan/decisions/architecture.

## Write Triggers

- `TODO.md`: on status/order/blocker/next-step/verification change.
- `DECISIONS.md`: on durable direction change or proof by implementation.
- `ARCHITECTURE.md`: on structural change.
- `LESSONS.md`: on durable preference or repeated pitfall.
- Handoffs: end-of-session only.

If you catch yourself writing rationale in TODO, move it to DECISIONS. If you catch yourself writing task state in ARCHITECTURE, move it to TODO. If you catch yourself writing preferences in DECISIONS, move them to LESSONS.

## End-Of-Task Sync

`CONTEXT/*` is the default write target during normal work. Do not edit this adapter or `CLAUDE.md` during routine progress. If routing behavior changed, repair both adapters in the same task.

## Do Not Write

- Live task state, handoff text, or decision history in this file.
- Dates (dates belong in handoffs, DECISIONS, completed items, git history).
- Cross-references that restate `CONTEXT/*` content.

## Loop Access Rules

If this project contains `LOOP/<mode>/` directories, they are machine-owned territory for auto-loop ratchet experiments. Routine human work does not read or write `LOOP/*` except:
- `LOOP/<mode>/observations.md` during graduation review (tick `- [x]` to approve, delete entry to reject)

The meta-agent owns `LOOP/<mode>/*` during loop runs. Graduation happens only via the handoff flow on human ratification. Do not hand-edit `program.md` during active sessions, `results.tsv`, `jobs/*`, or task files during experiments.
```

Both templates include `<!-- LOOP_ACCESS_RULES_V1 -->` as a marker on line 2 after the title/frontmatter. Step 10 detection: look for that literal marker, not substring `LOOP/`.

### B2. Per-prompt self-check blocks (P-PV4)

Placed at the end of each prompt under heading `## Model Self-Check`.

#### B2.1 PROJECT_MEMORY_BOOTSTRAP.md self-check
```
Before delivering output, confirm:
1. Is `{PROJECT_ROOT}` correctly resolved (not the prompt file's directory)?
2. Did I pick the right mode (fresh / upgrade / no-op) based on Step 0's state check?
3. If Upgrade Mode: did I capture the snapshot before any write, and did the Step 13 diff-vs-snapshot pass for every modified file?
4. Are both root adapters under 160 lines and do they contain the `<!-- LOOP_ACCESS_RULES_V1 -->` marker?
5. Did I avoid touching handoffs, archive, and `LOOP/*`?
```

#### B2.2 HANDOFF.md self-check
```
Before delivering output, confirm:
1. Did I write the new handoff using a `.tmp` + `mv` atomic pattern?
2. Did I delete ALL prior handoff files after the new one was written?
3. Does the handoff include a `Pass-forward:` line (one sentence or `none`)?
4. Did I run the Decanting check (Step 2a) with all three categories answered?
5. Did I avoid touching adapters during this routine handoff?
```

#### B2.3 HANDOFF-LOOP.md self-check
```
Before delivering output, confirm:
1. All five items from HANDOFF.md self-check.
2. Did Step 2b process modes alphabetically and candidates top-to-bottom within each mode?
3. For any `- [x]` candidate: did held-out re-verification pass, and did the title-collision check run across modes?
4. Did transactional graduation write to `observations.pending.md` first, verify, then apply?
5. Did I record LOOP findings in `This Session` if any inconsistency was flagged?
```

#### B2.4 LOOP_CREATION.md self-check
```
Before delivering output, confirm:
1. Did the pre-scaffold metric gate pass (primary metric is a single stable scalar)?
2. Are `{PLATEAU_N}`, `{REPETITION_COUNT}`, and all other `<<<PLACEHOLDER>>>` values substituted in program.md, research.md, and run.sh?
3. Did I generate two hash files (`.task-hashes` for normal, `.holdout-task-hashes` for holdout)?
4. Does contract.yml exist and does run.sh reference it?
5. Did I flag any deferred task authoring explicitly in the Step 9 deliverable?
```

### B3. Per-prompt telos lines (P-PV1)

Placed immediately after the `# Title` line, before the first `##` heading.

- BOOTSTRAP: `Telos: initialize or upgrade a project's memory system (CONTEXT/* + both root adapters) so any coding agent in any harness can pick up the thread.`
- HANDOFF: `Telos: end a session by syncing canonical memory, auditing drift, and writing one self-contained handoff note for the next session.`
- HANDOFF-LOOP: `Telos: end a LOOP-running session by syncing canonical memory, integrating auto-loop state (graduation and consistency checks), auditing drift, and writing one self-contained handoff note.`
- LOOP_CREATION: `Telos: scaffold one auto-loop ratchet mode (program, tasks, runner, tampering guard, held-out partition) so a coding agent can optimize a scorable target without evaluator drift.`

### B4. Per-prompt precondition blocks (P-PV3)

Placed immediately after the Telos line, before anything else. Format:

```
## Cannot Proceed Unless

- [condition 1]
- [condition 2]
- ...
```

#### B4.1 BOOTSTRAP preconditions
```
- `{PROJECT_ROOT}` is unambiguous (the directory that owns or will own `CONTEXT/`, not this prompt's directory).
- If Upgrade Mode is detected: you can capture a snapshot under `{PROJECT_ROOT}/CONTEXT/.upgrade-snapshot/` before any modification.
- User has confirmed the upgrade plan (Step 8) before any Step 9 write.
```

#### B4.2 HANDOFF preconditions
```
- `{CONTEXT_ROOT}/` exists. If it does not, run `PROJECT_MEMORY_BOOTSTRAP.md` first.
- You can write a `.tmp` file and `mv` it in one step (atomic handoff write).
- No `LOOP/` directory exists for this project. If one does, use `HANDOFF-LOOP.md` instead.
```

#### B4.3 HANDOFF-LOOP preconditions
```
- `{CONTEXT_ROOT}/` exists. If it does not, run `PROJECT_MEMORY_BOOTSTRAP.md` first.
- `LOOP/` exists in the project. If not, use `HANDOFF.md` instead.
- `./LOOP/<mode>/run-holdout.sh` is executable for any mode that has `- [x]` candidates pending graduation.
- You can write a `.tmp` file and `mv` it in one step.
```

#### B4.4 LOOP_CREATION preconditions
```
- `{PROJECT_ROOT}/CONTEXT/` exists with current-version schemas. If not, run `PROJECT_MEMORY_BOOTSTRAP.md` first (auto-detects fresh vs upgrade).
- `{PROJECT_ROOT}` is a git repo (`git init` first if not).
- The user can articulate what is being optimized AND the primary metric. If not, stop and work this out before scaffolding -- the Pre-Scaffold Gate enforces this.
```

### B5. `contract.yml.example`

Full content, shipped at `prompts/v2/contract.yml.example`:

```yaml
# contract.yml -- evaluator contract for LOOP/<mode>/
# Written once at scaffold time. Read by run.sh at the start of every run.
# The meta-agent reads this file during the Setup phase and treats it as the
# authoritative metric definition. Human edits this file to redirect the loop.

metric: sanitize_pass_rate     # name of the primary metric; matches program.md
direction: higher_is_better    # higher_is_better | lower_is_better
stability: bounded_variance    # deterministic | bounded_variance | noisy

# Number of times score.sh is invoked per task. Median aggregation.
repetitions: 3

# Relative-dispersion-by-median threshold. Runs where per-task dispersion
# exceeds this value are logged as crash-infra. Default 0.10 (10% of median).
cv_threshold: 0.10

# Optional [min, max] metric bounds. Soft-warn only: run.sh emits a stderr
# notice if the aggregated metric falls outside the range, but the row is
# still logged (status determined by the normal keep/discard logic).
range: [0.0, 1.0]

# Concrete scenarios of what evaluator gaming would look like for THIS metric.
# The meta-agent reads these and uses them as a self-policing anchor: if a
# candidate change resembles any of these, flag it in observations.md Open
# Questions even if the metric improved.
gaming_scenarios:
  - "score.sh edited to always echo 1.0"
  - "rules silently convert expected.md before diffing"
  - "meta-agent adds conditional logic checking the task name"
```

### B6. `status.sh` (P-S9)

Generated at scaffold time by LOOP_CREATION.md Step 5. Full content, substitutions as noted:

```bash
#!/usr/bin/env bash
# status.sh -- one-shot summary of <<<MODE>>> loop state
# Usage: ./status.sh
# Prints a compact state report to stdout. Read-only; safe to run anytime.

set -euo pipefail

MODE_DIR="$(cd "$(dirname "${BASH_SOURCE[0]}")" && pwd)"
cd "$MODE_DIR"

MODE_NAME="$(basename "$MODE_DIR")"
echo "=== LOOP status: $MODE_NAME ==="

# --- results.tsv summary ---
if [ ! -f results.tsv ]; then
  echo "results.tsv: missing"
else
  TOTAL_ROWS=$(tail -n +2 results.tsv | wc -l | tr -d ' ')
  KEEPS=$(tail -n +2 results.tsv | awk -F'\t' '$4 == "keep" {c++} END{print c+0}')
  DISCARDS=$(tail -n +2 results.tsv | awk -F'\t' '$4 == "discard" {c++} END{print c+0}')
  CRASHES=$(tail -n +2 results.tsv | awk -F'\t' '$4 == "crash-infra" {c++} END{print c+0}')
  echo "experiments: $TOTAL_ROWS (keep $KEEPS, discard $DISCARDS, crash-infra $CRASHES)"

  LAST_KEEP=$(tail -n +2 results.tsv | awk -F'\t' '$4 == "keep"' | tail -n 1)
  if [ -n "$LAST_KEEP" ]; then
    LK_SHA=$(echo "$LAST_KEEP" | awk -F'\t' '{print $1}')
    LK_METRIC=$(echo "$LAST_KEEP" | awk -F'\t' '{print $2}')
    LK_DESC=$(echo "$LAST_KEEP" | awk -F'\t' '{print $5}')
    echo "last keep: $LK_SHA metric=$LK_METRIC ($LK_DESC)"
  else
    echo "last keep: none"
  fi

  # Rows since last keep
  if [ -n "$LAST_KEEP" ]; then
    SINCE_KEEP=$(tail -n +2 results.tsv | awk -F'\t' -v sha="$LK_SHA" '
      found==1 { c++ }
      $1 == sha { found=1 }
      END { print c+0 }
    ')
    echo "rows since last keep: $SINCE_KEEP"
  fi
fi

# --- plateau state ---
if [ -f results.tsv ]; then
  PLATEAU_N=<<<PLATEAU_N>>>
  DATA_ROWS=$(tail -n +2 results.tsv | wc -l | tr -d ' ')
  if [ "$DATA_ROWS" -ge "$PLATEAU_N" ]; then
    RECENT_NONKEEP=$(tail -n +2 results.tsv | tail -n "$PLATEAU_N" \
      | awk -F'\t' '$4 == "discard" {c++} END{print c+0}')
    if [ "$RECENT_NONKEEP" -ge "$PLATEAU_N" ]; then
      echo "plateau state: active (last $PLATEAU_N rows all discard)"
    else
      echo "plateau state: not active"
    fi
  else
    echo "plateau state: insufficient data (need $PLATEAU_N rows, have $DATA_ROWS)"
  fi
fi

# --- last research ---
LAST_RESEARCH=$(ls -t research/*.md 2>/dev/null | head -n 1 || true)
if [ -n "$LAST_RESEARCH" ]; then
  RES_DATE=$(basename "$LAST_RESEARCH" | cut -c 1-10)
  echo "last research: $RES_DATE ($(basename "$LAST_RESEARCH"))"
else
  echo "last research: none"
fi

# --- pending candidates ---
if [ -f observations.md ]; then
  PENDING=$(grep -c '^- \[ \]' observations.md || true)
  AFFIRMED=$(grep -c '^- \[x\]' observations.md || true)
  echo "candidates: $PENDING pending, $AFFIRMED affirmed (awaiting handoff)"
fi

# --- held-out last ---
if [ -f .holdout-last ]; then
  echo "holdout last: $(cat .holdout-last)"
else
  echo "holdout last: never scored"
fi

# --- program.md drift ---
if [ -f .program-checksum ] && [ -f program.md ]; then
  EXPECTED=$(cat .program-checksum)
  ACTUAL=$(sha256sum program.md | awk '{print $1}')
  if [ "$EXPECTED" != "$ACTUAL" ]; then
    echo "program.md: CHANGED since last run.sh invocation"
  else
    echo "program.md: unchanged"
  fi
fi

echo "==="
```

### B7. Transactional graduation flow (P-S6)

Replaces HANDOFF-LOOP Step 2b "Write and delete" step. New flow:

1. For each `- [x]` candidate that passed held-out re-verification and title-collision check, do NOT write directly to `CONTEXT/DECISIONS.md` or `CONTEXT/LESSONS.md`.
2. Instead, write the intended mutation(s) to `CONTEXT/observations.pending.md` as a staging file. Format:

```
<!-- STAGING: observations.pending.md
Purpose: transactional graduation staging. Written during HANDOFF-LOOP Step 2b.
Applied in one batch at Step 2b-apply. Deleted after successful apply.
If this file exists at the start of a session, it means a prior handoff crashed
mid-graduation; read it, compare to current CONTEXT/* state, and either
complete the apply manually or delete if already applied.
-->

# Pending graduations (batch written YYYY-MM-DDTHH:MM:SSZ)

## Target: CONTEXT/DECISIONS.md -- prepend
## YYYY-MM-DD -- <title>
Decision: ...
Rationale: ...
Confidence: H-holdout -- ratified from <mode>/<tag> on YYYY-MM-DD, held-out passed
Source: meta-agent-ratified
Evidence: <mode>/<tag> (<metric>: <value>)

## Target: CONTEXT/LESSONS.md -- append
...

## Source candidates to delete after apply
- <mode>/observations.md :: "<candidate title>"
- <mode>/observations.md :: "<candidate title>"
```

3. Verify the staging file parses (each section has Target, content, and source candidate mapping).
4. Apply in this strict order:
   a. Append each `Target: CONTEXT/LESSONS.md` block to `CONTEXT/LESSONS.md`.
   b. Prepend each `Target: CONTEXT/DECISIONS.md` block to `CONTEXT/DECISIONS.md` (reverse-chronological).
   c. For each source candidate in `Source candidates to delete after apply`, remove the matching `- [x]` entry from the relevant `observations.md`.
   d. Delete `CONTEXT/observations.pending.md`.
5. If any step in (4) fails, do NOT delete the pending file. Emit a clear error with the partial state so the user or next session can finish manually.

Recovery: if `CONTEXT/observations.pending.md` exists at the start of HANDOFF-LOOP, Step 1 reads it and Step 2b's first action is to reconcile (either apply missing steps if partial, or delete if already fully applied). This makes graduation crash-safe.

### B8. `README.md` for prompts/v2/ (P-S1)

Full content drafted as its own file during execution. Covers:
- Telos of the whole system (2-3 sentences)
- The four prompts and which to use when
- The DAG: BOOTSTRAP once per project -> HANDOFF or HANDOFF-LOOP per session -> LOOP_CREATION per opt-in mode
- What each prompt reads and writes
- `{GLOBAL_ROOT}` convention: `~/.context-system/`
- Quick-start: "new project" path and "existing project" path
- Pointer to SPEC.md for upgrade history

Target length: under 120 lines.

### B9. Session Vocabulary block (P-L2)

Added to BOOTSTRAP as a short new section near "Goal":

```
## Session Vocabulary

- `Pass-forward`: one-line label of the single most important piece of state the next session must carry forward. Not a summary, not a task list. Under 15 words. Form: "we are in the middle of X, the next decision point is Y." If nothing critical carries forward, `Pass-forward: none`. Used in handoff output.
- `Decanting check`: plan-time review of three categories that do not naturally route into canonical memory (working assumptions, near-misses, naive-next-move). Performed in HANDOFF Step 2a.
- `Graduation`: promotion of a `LOOP/<mode>/observations.md` Candidate marked `- [x]` by the human into `CONTEXT/DECISIONS.md` or `CONTEXT/LESSONS.md`. Performed in HANDOFF-LOOP Step 2b via transactional write through `CONTEXT/observations.pending.md`.
- `Plateau`: mechanical signal emitted by a loop's `run.sh` when the last `{PLATEAU_N}` data rows of `results.tsv` are all `discard`. Triggers a research pass per the mode's `research.md`.
- `H-holdout`: confidence level reserved for DECISIONS entries ratified via auto-loop held-out task re-scoring at graduation.
```

---

## Part C - Per-file execution spec

### C1. `prompts/v2/README.md` (new)

Full content drafted in B8 intent. Write order: 1st file written.

### C2. `prompts/v2/PROJECT_MEMORY_BOOTSTRAP.md`

Start from v1; apply these changes:

1. Add telos line (B3) after the `# PROJECT MEMORY BOOTSTRAP` title.
2. Add "Cannot Proceed Unless" block (B4.1) after telos.
3. Add "Session Vocabulary" section (B9) after Goal.
4. In "Default Scope": change `{GLOBAL_ROOT}` definition to mandate `~/.context-system/` as default. Add a clause allowing override via environment variable `CONTEXT_SYSTEM_ROOT` or a `.global-root` marker file.
5. In "First-Time Global Setup": all paths now `~/.context-system/CONTEXT/`. The existence check and schema match are unchanged.
6. In "File Header Generation": add subsection "Root adapter templates" after "archive/README.md header" with both B1.1 (`CLAUDE.md`) and B1.2 (`.cursor/rules/context-system.mdc`) templates in full.
7. In "Upgrade-Mode Step 10": replace the substring detection rule with marker detection:
   > Check for existing loop-awareness: search for the literal marker `<!-- LOOP_ACCESS_RULES_V1 -->`. If present, skip this file entirely (adapter is loop-aware). If absent, perform the following:
   > (a) If the file is empty or lacks any `<!-- ADAPTER_SCHEMA_V1 -->` marker, the adapter predates v2. Replace the whole file with the current template from File Header Generation. Record "adapter replaced (v1 -> v2 shape)".
   > (b) If the file has `<!-- ADAPTER_SCHEMA_V1 -->` but not `<!-- LOOP_ACCESS_RULES_V1 -->`, append the Loop Access Rules section and the marker line at the end.
8. In "Upgrade-Mode Steps": add "Step 10a -- Adapter template sync". If an adapter exists and has `<!-- ADAPTER_SCHEMA_V1 -->`, compare against the current template; flag differences for user confirmation (do not auto-replace beyond the Loop Access Rules append).
9. Ongoing Write Rules: add bullet "On first write to `CONTEXT/archive/`, also write `CONTEXT/archive/README.md` from the schema template if absent."
10. HANDOFF_PROMPT.md references: update to "HANDOFF.md / HANDOFF-LOOP.md" depending on context (see A6).
11. In "Bloat Audit" guidance (shared with HANDOFFs' Step 3, but BOOTSTRAP's Verification section also references): add P-S10 language distinguishing schema-mismatch (hard-fail) from style-violations (soft-warn).
12. Em-dash sweep (A3) across the entire file.
13. Model self-check block (B2.1) at the very end.
14. Visible schema-pointer line (P-PV2) near the top: "Schema definitions live in `<!-- SCHEMA: ... -->` HTML comments within the generated files. Read them before writing."
15. Reframe "Do not" language as "instead do" / "if you catch yourself" where natural (P-PV6). Apply to Ongoing Write Rules and Canonical File Contracts sections only; do not rewrite every negation.
16. Confidence format pin (P-PV7): replace the existing format examples with the regex-enforceable grammar.

### C3. `prompts/v2/HANDOFF-LOOP.md`

Start from v1 `HANDOFF_PROMPT.md`; apply:

1. Rename all internal self-references from `HANDOFF_PROMPT.md` to `HANDOFF-LOOP.md`.
2. Add telos (B3) + preconditions (B4.3) + top-pointer directing no-LOOP users to `HANDOFF.md`.
3. Step 2b: replace iteration order with "process modes alphabetically by directory name; within a mode, process Candidates top-to-bottom of `observations.md`."
4. Step 2b: add title-collision detection sub-step. Before writing, collect all pending `- [x]` candidate titles across all modes. If any two share a normalized title (case-insensitive, whitespace-stripped), flag both in `This Session`, graduate neither, require human adjudication next session.
5. Step 2b: replace the "Write and delete" step with transactional graduation flow per B7 (writes to `CONTEXT/observations.pending.md` first, verifies, applies, then deletes source entries and the staging file).
6. Step 1: add bullet "If `CONTEXT/observations.pending.md` exists, a prior handoff crashed mid-graduation. First action is reconciliation per Step 2b recovery clause."
7. Step 2b consistency check: status-enum strings update (A5) -- `keep`, `discard`, `crash-infra` only.
8. Step 3 (Bloat Audit): add soft-warn for bullets over 15 words or sentences over 25 words. Add P-S10 split between style-soft-warn and schema-hard-fail.
9. Step 5: atomic write -- write to `YYYY-MM-DD-{slug}.md.tmp`, then `mv` to final name.
10. Step 6: prior-delete runs only if Step 5 `mv` succeeded.
11. Em-dash sweep (A3).
12. Confidence format pin (P-PV7).
13. Reframe "Do not" language as "instead do" where natural (P-PV6).
14. Visible schema-pointer line (P-PV2).
15. Model self-check block (B2.3) at the end.

### C4. `prompts/v2/HANDOFF.md` (new lite)

Build from the final HANDOFF-LOOP draft by removing LOOP-specific content:

1. Remove Step 2b entirely.
2. Remove "Auto-loop state" from the required sections list in Step 5 and from the sample section.
3. Remove LOOP-related audit triggers in Step 3 (skip-conditions adjust).
4. Remove LOOP-related self-check items (B2.2 not B2.3).
5. Adjust telos (B3 HANDOFF variant) and preconditions (B4.2 - includes "if LOOP exists, use HANDOFF-LOOP instead").
6. Step numbering: since Step 2b is gone, Step 3 stays as Step 3 (no renumbering). Rationale: the step numbers are referenced in self-check and verification; keeping them stable prevents confusion between HANDOFF and HANDOFF-LOOP.
7. Top-pointer: "If this project has a `LOOP/` directory, use `HANDOFF-LOOP.md` instead for auto-loop state integration and graduation handling."

### C5. `prompts/v2/LOOP_CREATION.md`

Start from v1; apply:

1. Add telos (B3 LOOP_CREATION variant) and preconditions (B4.4) after the title.
2. Hoist metric-quality sub-dialogue (v1 Q3a-d) into a new section "Pre-Scaffold Gate" before Step 1 (P-PV8). Restructure as: pre-gate determines whether to proceed at all; if the metric doesn't pass the gate, abort scaffold.
3. Step 1: remove Q6 `{META_AGENT_MODEL}` (P-L5). Renumber subsequent questions.
4. Step 1: tag each remaining question with `<<<QUESTION_k_OF_N>>>` markers inline in the heading (P-PV5). E.g., `1. [Q1/11] What is the mode name?` Do not change the one-question-at-a-time enforcement prose; add the structural tags as supplement.
5. Step 1 Q7 (`{EXTRA_READS}`): specify rendering as newline-delimited indented sub-bullets; literal `none` if empty (P-L3).
6. Step 3 `program.md` template: drop `<<<META_AGENT_MODEL>>>` line from Constraints (P-L5).
7. Step 3 `program.md` Experiment loop section: rewrite status enum to 3 values per A5 contract. Include the explicit status-write contract prose:
   > The runner writes `keep` (default) or `crash-infra` (infra failure).
   > You read the row and decide:
   > - Metric improved (or this is the first keep): leave status `keep`, `git commit` the mutable-file change and the results.tsv row together with a one-line message.
   > - Metric worse or unchanged: edit the status column of the just-written row from `keep` to `discard`, `git commit` the results.tsv change with message `discard: <desc>`, then `git checkout HEAD~1 -- <mutable_file>` to revert the mutable file. The discard row persists for plateau detection.
   > - Status `crash-infra`: `git reset --hard`. Both the row and the mutable file revert; the run failed to produce signal.
8. Step 3 `program.md` Plateau response: update N description (only counts `discard`; `crash-infra` excluded as before).
9. Step 3 `program.md` Metric section: add line "See `contract.yml` for the machine-readable metric definition. Runner reads it at every invocation."
10. Step 3 `program.md`: move `<<<EXTRA_READS>>>` rendering into explicit sub-bullet format per P-L3.
11. Step 3 scaffold tree: add `contract.yml` and `status.sh` to the tree.
12. Step 3: add "`contract.yml` generation" subsection after `observations.md`. Content: write `contract.yml` at scaffold time with all fields substituted from Step 1 answers plus Pre-Scaffold Gate answers. Ship `contract.yml.example` at the v2 folder as a reference.
13. Step 3: add "`status.sh` generation" subsection. Write content from B6 with `<<<PLATEAU_N>>>` substituted.
14. Step 3 `observations.md` schema header: bump `Version: 2`. Update Candidate Evidence format description to reference the 3-value status enum.
15. Step 3 `results.tsv` subsection: update status enum.
16. Step 5 `.task-hashes`: split into two hash files (`.task-hashes` excluding holdout; `.holdout-task-hashes` for holdout only). Document the split in the generation recipe. Both runners verify both.
17. Step 5 `run.sh`:
    a. Portability: this is Linux-only per user direction; no shim needed. Add a one-line comment "Tested on Linux; shasum shim not included."
    b. Per-task status tracking: declare `declare -a TASK_STATUS`. Each task iteration writes its own entry. At end, aggregate: count crashes; if crashes > 50% of tasks, whole-run status = `crash-infra`; else whole-run status = `keep` (meta-agent judges discard).
    c. CV-exceeded branch: add `continue` after STATUS write. Rename variable: `CV_EXCEEDED` -> `RDM_EXCEEDED`. WARN text update: "high relative dispersion by median on $TASK_DIR (RDM > threshold from contract.yml)".
    d. Read `contract.yml` at start for `cv_threshold`, `repetitions`, `range`. Use `awk`-based YAML extraction (simple line-grep; contract.yml is intentionally flat). No `yq` dependency.
    e. Soft-warn range check: if aggregated metric outside `range`, print `METRIC_OUT_OF_RANGE: <metric> outside [<min>, <max>]` to stderr. Row is still logged.
    f. Plateau cooldown fallback: if `LAST_RES_SHA` not found in `results.tsv`, print `COOLDOWN_RESET: research commit not found in results.tsv, treating as no active cooldown` to stderr and set `ROWS_SINCE_RESEARCH=$DATA_ROWS`.
    g. program.md hash check: at start, compute `sha256sum program.md`. Compare against `.program-checksum`. If different: print `PROGRAM_CHANGED: program.md differs from last run.sh invocation; re-read before proceeding` to stderr and update the checksum file. If `.program-checksum` absent, create it (first run).
    h. Subset runs (when `$2` task-glob is not `*`): skip `results.tsv` append and plateau block. Print metric to stdout and exit.
    i. Plateau detector awk: `$4 == "discard"` only (per A5).
18. Step 5 `run-holdout.sh`: also verify both hash files. Same structure, same Linux-only.
19. Step 6 dry-run: update to reflect the two hash files, contract.yml presence, and status.sh test-run.
20. Step 7 initial commit: no change.
21. Step 8 verification: update to list new files (`contract.yml`, `status.sh`, both hash files), updated status enum, the `<!-- LOOP_ACCESS_RULES_V1 -->` marker check in downstream adapter work (out of scope for LOOP_CREATION, noted).
22. Step 9 deliverable: update to mention `status.sh` and `contract.yml`.
23. "How to run a loop once it's created" and "Interaction With Other Prompts": update `HANDOFF_PROMPT.md` references to `HANDOFF-LOOP.md`.
24. Step 4b holdout guidance: replace "3-5 held-out tasks" with "at least 20% of your task content (minimum 3). Expand as experiment count grows; for loops exceeding 100 experiments, aim for 30-40%."
25. Em-dash sweep (A3).
26. Confidence format pin (P-PV7) -- applies only where Confidence is referenced (Candidate Evidence field).
27. Reframe "Do not" in program.md template as "if you catch yourself" where natural (P-PV6).
28. Visible schema-pointer line (P-PV2): one sentence in program.md noting where the observations.md schema lives.
29. Model self-check block (B2.4) at the end of LOOP_CREATION.md.

### C6. `prompts/v2/contract.yml.example`

Write content from B5 directly. No modifications.

---

## Part D - Verification criteria (post-write)

After all files written, run these checks before committing:

1. **No stale filenames**: `rg "HANDOFF_PROMPT.md" prompts/v2/` returns zero matches.
2. **No leftover unsubstituted placeholders**: `rg "<<<[A-Z_]+>>>" prompts/v2/` returns matches only inside template blocks (within `<!-- TEMPLATE -->` or fenced template code blocks that are intentional). Manually confirm all such matches are inside templates.
3. **No retired status strings**: `rg "crash-hypothesis|keep-combo|discard-combo" prompts/v2/` returns zero matches.
4. **Em-dash sweep clean**: `rg "[\u2013\u2014]" prompts/v2/` returns zero matches. Alternative ASCII-only grep: `rg $'\xE2\x80\x94|\xE2\x80\x93' prompts/v2/`.
5. **Telos line present**: every prompt file has a `Telos:` line in its first 10 lines.
6. **Self-check present**: every prompt has `## Model Self-Check` as the final major section.
7. **Precondition block present**: every prompt has `## Cannot Proceed Unless` in its first 30 lines.
8. **Adapter marker present**: both adapter templates in BOOTSTRAP contain `<!-- LOOP_ACCESS_RULES_V1 -->` and `<!-- ADAPTER_SCHEMA_V1 -->`.
9. **Adapter length under cap**: both adapter templates render to under 160 lines (count lines between template start and end).
10. **Cross-links resolved**: HANDOFF.md mentions HANDOFF-LOOP.md; HANDOFF-LOOP.md mentions HANDOFF.md; README.md mentions all four prompts.
11. **No references to dropped fields**: `rg "META_AGENT_MODEL" prompts/v2/` returns zero matches.
12. **SPEC kept**: SPEC.md remains at `prompts/v2/SPEC.md` as the decisions ledger. Mark it clearly as the v2 execution record.

Any failure: fix before committing.

---

## Part E - Commit sequence

One commit per logical change. In order:

1. `prompts/v2: add SPEC.md execution record` (this file committed first for audit trail)
2. `prompts/v2: add README.md entry point`
3. `prompts/v2: upgrade PROJECT_MEMORY_BOOTSTRAP.md (adapter templates, GLOBAL_ROOT, marker-based Loop Access detection, archive lazy-create, PV sweep)`
4. `prompts/v2: add HANDOFF-LOOP.md (renamed full variant with transactional graduation, atomic write, mode ordering, audit split)`
5. `prompts/v2: add HANDOFF.md lite variant for no-LOOP sessions`
6. `prompts/v2: upgrade LOOP_CREATION.md (hash split, 3-value enum, per-task status, RDM rename, plateau fallback, contract.yml, status.sh, Pre-Scaffold Gate, PV sweep)`
7. `prompts/v2: add contract.yml.example`

After commit 7, push branch and open draft PR against main.
