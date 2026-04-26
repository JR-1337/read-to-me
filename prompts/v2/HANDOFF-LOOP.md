# PROJECT HANDOFF PROMPT -- LOOP variant

Telos: end a LOOP-running session by syncing canonical memory, integrating auto-loop state (graduation and consistency checks), auditing drift, and writing one self-contained handoff note.

If this project has no `LOOP/` directory, `HANDOFF.md` is a simpler fit. Use this prompt when the project has one or more `LOOP/<mode>/` directories that need graduation review and consistency checking.

Schema definitions for canonical files live in `<!-- SCHEMA: ... -->` HTML comments inside each file. Read them before writing.

## Cannot Proceed Unless

- `{CONTEXT_ROOT}/` exists. If it does not, run `PROJECT_MEMORY_BOOTSTRAP.md` first.
- `LOOP/` exists in the project. If not, use `HANDOFF.md` instead.
- `./LOOP/<mode>/run-holdout.sh` is executable for any mode that has `- [x]` candidates pending graduation.
- You can write a `.tmp` file and `mv` it in one step (atomic handoff write).

Run this prompt when ending a session for the current project. In Cursor this is typically invoked with `@HANDOFF-LOOP.md`; in Claude Code with a direct file reference; other harnesses use their own file-attach convention. The prompt contents are harness-neutral.

## Default Scope

- Assume the current project by default.
- Prefer the active repo or active project directory that owns `CONTEXT/`.
- `{PROJECT_ROOT}` is the directory that owns `CONTEXT/`.
- If this prompt file lives outside the project, do not treat the prompt file's directory as `{PROJECT_ROOT}`.
- Use `{CONTEXT_ROOT}={PROJECT_ROOT}/CONTEXT`.
- Only ask for scope if multiple project roots are equally plausible or the user redirects you elsewhere.

## Terminology

- `prior handoff` = the existing handoff file in `{CONTEXT_ROOT}/handoffs/` from a previous session, if any. If multiple handoff files exist (which violates the retention rule but can happen from crashes or manual copies), treat the most recently modified file as the prior handoff for reading purposes. Step 6 will then delete all prior handoffs (not just one) after the new handoff is written.
- `new handoff` = the file written during Step 5 of this run.
- `pending graduations` = entries staged in `{CONTEXT_ROOT}/observations.pending.md`. If this file exists at the start of the session, a prior HANDOFF-LOOP crashed mid-graduation; Step 2b's first action is reconciliation.
- After Step 5 completes, only the new handoff exists; all prior handoffs have been deleted; `observations.pending.md` does not exist (graduation either applied successfully or flagged as failed).

## ASCII Operator Legend

Use only these operators in `CONTEXT/*` writes. Authoritative source: `PROJECT_MEMORY_BOOTSTRAP.md`.

- `!=` not equal
- `==` equal
- `->` leads to / transforms into
- `=>` therefore / implies
- `in` member of set
- `not` negation
- `and` intersection / both
- `or` union / either
- `blocked by` dependency
- `TODO:` open item inline
- `RISK:` known risk inline

Do not use LaTeX math symbols, Unicode math symbols, box-drawing characters, fancy quotes, em-dashes, or en-dashes. Use ASCII hyphen `-` or double-hyphen `--`.

## Confidence Scoring

Use the H/M/L grammar from `PROJECT_MEMORY_BOOTSTRAP.md`:

```
Confidence: H(-holdout)? -- <source>, verified YYYY-MM-DD
Confidence: M( -- <verification hint>)?
Confidence: L -- <what would verify>
```

`H-holdout` is reserved for DECISIONS entries ratified via Step 2b's held-out re-scoring.

In `DECISIONS.md`, confidence is mandatory on every entry. In `LESSONS.md`, include confidence only when the lesson is inferred rather than explicitly stated by the user.

## Step 1 -- Read current memory

Read:
1. `{CONTEXT_ROOT}/TODO.md`
2. `{CONTEXT_ROOT}/DECISIONS.md`
3. `{CONTEXT_ROOT}/ARCHITECTURE.md`
4. `{CONTEXT_ROOT}/LESSONS.md` if workflow corrections or preferences matter
5. the prior handoff (if any) only if it helps resume continuity
6. **`{CONTEXT_ROOT}/observations.pending.md` if it exists.** This file means a prior HANDOFF-LOOP crashed mid-graduation; Step 2b's first action will be reconciliation.
7. if `{PROJECT_ROOT}/LOOP/` exists, for each `<mode>/`:
   - `observations.md` (for any pending graduation candidates)
   - last row of `results.tsv` (for the Auto-loop state section in Step 5)
   - `program.md` for this mode's `{PLATEAU_N}` value -- the integer stored in the Plateau response section at scaffold time, needed for the plateau consistency check in Step 2b
   - `contract.yml` for the mode's metric definition if any consistency check needs it
   - the 2 most recent files in `research/` if the directory is non-empty (for the Auto-loop state `Last research:` line in Step 5 and the plateau consistency check in Step 2b). If `research/` is absent or empty, the mode pre-dates the research step or has never hit a plateau; note which it is.

Do not read adapter files by default. Read an adapter only if harness-switch context or adapter drift actually matters, or if the bloat/drift audit in Step 3 requires it.

If `{PROJECT_ROOT}` is a git repo, also inspect the current branch and clean/dirty/ahead/behind state.

If the project uses module adapters, read the ones that mattered in this session or are likely to matter next.

## Step 2 -- Sync memory first

Before writing the new handoff:
- for each canonical file you intend to write, read its SCHEMA header first. The schema defines the file's rules. Follow it when writing.
- update `{CONTEXT_ROOT}/TODO.md` for current active work, blockers, verification state, and completed items
- update `{CONTEXT_ROOT}/DECISIONS.md` for any durable direction changes, using the H/M/L confidence grammar
- update `{CONTEXT_ROOT}/ARCHITECTURE.md` only if structure or flows changed
- update `{CONTEXT_ROOT}/LESSONS.md` only for durable preferences, corrections, or repeated pitfalls. If the session restated or recurred an existing lesson, increment its `Affirmations:` counter. Propose graduation if the counter reaches 2.
- sync shared `CONTEXT/*` first
- use ASCII-only operators in `CONTEXT/*` writes (no LaTeX, no Unicode math, no em-dashes, no en-dashes)
- do not touch adapters during routine handoff writing
- update adapters only if routing, ownership, or read/write behavior changed
- update or retire module adapters only if local conventions or boundaries materially changed

If you catch yourself turning temporary exploration notes into permanent memory, stop. Those belong in the handoff's `State` or `This Session`, not in `CONTEXT/*`.

## Step 2a -- Decanting check

Plan-time context does not survive to execution time. Before Step 2b, scan for three categories that do not naturally route into canonical memory. Answer each, even if the answer is "none".

- **Working assumptions**: mental model of the system the session operated under that is not in `ARCHITECTURE.md` or `DECISIONS.md`. Record in the new handoff's `State` section. If durable, promote to `ARCHITECTURE.md`.
- **Near-misses**: approaches tried or seriously considered that did not rise to a logged DECISION but would re-tempt the next session. Record in the new handoff's `Anti-Patterns (Don't Retry)`.
- **Naive next move**: what the obvious first action looks like from outside the session's reasoning, and why it is wrong. Record in the new handoff's `Anti-Patterns (Don't Retry)` or as a caution on `Next Step Prompt`.

If all three return "none", record `Decanting: clean` in `This Session`. Other categories (failed approaches with lessons, rejected alternatives, discovered constraints) are handled by DECISIONS.md and LESSONS.md in Step 2 and do not need to be re-audited here.

## Step 2b -- LOOP integration

Run this step only if `{PROJECT_ROOT}/LOOP/` exists. (If not, you should be using `HANDOFF.md` instead -- stop and switch.)

### 2b.0 -- Pending-file reconciliation

If `{CONTEXT_ROOT}/observations.pending.md` exists from Step 1 read, reconcile first:

1. Parse each section in the pending file (each has a `Target:` directive and content).
2. For each section, check whether the target file (`CONTEXT/LESSONS.md` or `CONTEXT/DECISIONS.md`) already contains the matching entry (by title match).
   - **Present in target**: the prior run applied this section successfully; check whether the corresponding source candidate was deleted from `observations.md`. If not, delete it now.
   - **Absent from target**: the prior run failed before applying. Apply now per Step 2b.3 rules.
3. Once all sections are reconciled, delete `observations.pending.md`.
4. Record the reconciliation in the new handoff's `This Session`: `Pending graduation reconciled: N sections, M applied, K already-present, no drift.`

If reconciliation itself fails (e.g., target file write error), do NOT delete the pending file. Flag in `This Session` and stop before proceeding to fresh graduation. The next session will retry.

### 2b.1 -- Collect candidates (mode-ordered)

Process `LOOP/<mode>/` directories in alphabetical order by mode name. Within each mode, process `observations.md` Candidates top-to-bottom. This yields a deterministic ordering.

For each `- [x]` Candidate found:
1. Record its title, target file, scope, evidence, rationale, and mode of origin.
2. Queue it for held-out verification (2b.2) and title-collision check (2b.3).

### 2b.2 -- Held-out verification (per Candidate)

For each queued Candidate:

1. If the Candidate's mode has a `tasks/holdout/` partition, run `./LOOP/<mode>/run-holdout.sh` and compare the held-out metric to the value recorded at baseline.
2. **If held-out metric did NOT improve in the same direction as the primary metric**: DO NOT graduate this Candidate. Leave it `- [x]` in `observations.md` and record `graduation blocked: <title> failed held-out verification (primary <direction>, holdout <direction>)` in the new handoff's `This Session`. Held-out regression indicates the Candidate overfits the optimization task set; human review is required before a forced graduation.
3. **If held-out passes (or no holdout exists for this mode)**: keep the Candidate in the graduation queue.

### 2b.3 -- Title-collision check (cross-mode)

Across the full graduation queue (all modes, all surviving Candidates), normalize titles (case-insensitive, whitespace-stripped, punctuation-stripped). If any two Candidates have matching normalized titles but differ in source mode or content:

1. Record `graduation blocked: title collision between <mode-A>::<title> and <mode-B>::<title>; manual adjudication required` in `This Session`.
2. Graduate neither colliding Candidate. Both stay `- [x]` in their respective `observations.md` for the user to adjudicate next session.
3. Non-colliding Candidates proceed to 2b.4.

### 2b.4 -- Transactional graduation via staging file

For the Candidates that survived 2b.2 and 2b.3, write them to a staging file BEFORE touching canonical memory. This makes graduation crash-safe.

1. Write `{CONTEXT_ROOT}/observations.pending.md` with this structure:

   ```
   <!-- STAGING: observations.pending.md
   Purpose: transactional graduation staging. Written during HANDOFF-LOOP Step 2b.
   Applied in one batch at Step 2b-apply. Deleted after successful apply.
   If this file exists at the start of a session, it means a prior handoff crashed
   mid-graduation; Step 2b.0 reconciles it.
   -->

   # Pending graduations (batch written YYYY-MM-DDTHH:MM:SSZ)

   ## Target: CONTEXT/DECISIONS.md -- prepend
   ## YYYY-MM-DD -- <Candidate Title>
   Decision: <title restated as a statement>
   Rationale: <Candidate Rationale verbatim>
   Confidence: H-holdout -- ratified from <mode>/<tag>, verified YYYY-MM-DD
       (or plain H -- ratified from <mode>/<tag>, verified YYYY-MM-DD if the mode has no holdout partition)
   Source: meta-agent-ratified
   Evidence: <Candidate Evidence verbatim>

   ## Target: CONTEXT/LESSONS.md -- append
   ## <Scope> -- <Candidate Title>
   Lesson: <Candidate Rationale verbatim>
   Context: Auto-loop run <mode>/<tag>
   Affirmations: 0
   Source: meta-agent-ratified
   Evidence: <Candidate Evidence verbatim>

   ## Source candidates to delete after apply
   - <mode>/observations.md :: "<candidate title>"
   - <mode>/observations.md :: "<candidate title>"
   ```

2. Verify the staging file parses: every section has a `Target:` directive, content, and at least one source candidate in the "delete after apply" list.

3. **Apply in strict order:**
   a. Append each `Target: CONTEXT/LESSONS.md` block to `CONTEXT/LESSONS.md` (append-order).
   b. Prepend each `Target: CONTEXT/DECISIONS.md` block to `CONTEXT/DECISIONS.md` (reverse-chronological, newest at top).
   c. For each source candidate in the delete list, remove the matching `- [x]` entry from the relevant `observations.md`.
   d. Delete `{CONTEXT_ROOT}/observations.pending.md`.

4. If any step in (3) fails, do NOT delete the pending file. Emit an error with the partial state and flag it in `This Session` as `graduation partial: <last successful step>`. The next session's 2b.0 reconciliation will pick up from here.

### 2b.5 -- Unchecked and rejected entries

- `- [ ]` entries: leave in place; the human has not yet reviewed them.
- Entries deleted from `Candidates` entirely (not present): treated as rejected. No action.

### 2b.6 -- Consistency check (flag-only, never block)

The mode's mutable file is declared in `LOOP/<mode>/program.md` (varies per mode: could be a code file, a prompt file, markup, a config, or any other scorable target).

- If `{PROJECT_ROOT}` is a git repo: compare the last row of `results.tsv` against git HEAD. A `keep` row should have a matching commit SHA. A `discard` or `crash-infra` row should have no uncommitted changes in the mode's mutable file. If not a git repo, note `Consistency check: git N/A` and skip this bullet.
- If the prior handoff's `Auto-loop state` section exists, compare its `Last commit` to the current `results.tsv` last-row commit. If they differ, record the delta: number of new `keep` rows added since the prior handoff's commit, and the short SHA range (`<prior-sha>..<current-sha>`). Differences are expected when the loop ran between sessions; the delta is informational.
- Compare `observations.md` last-modified time to the git commit timestamp of the last row's commit (`git log -1 --format=%ct <sha>`). If `observations.md` is older than the last commit, the meta-agent stopped before digesting; flag as "pending digest".
- Check for uncommitted changes in the mutable file (if git-tracked). Any dirty state means either a manual edit or a crashed experiment that never reset.
- Plateau check: read `{PLATEAU_N}` from the mode's `program.md`. Examine the last `{PLATEAU_N}` data rows of `results.tsv`. If every row is `discard` (a plateau is active; note `crash-infra` does NOT count toward plateau per the run.sh detector), a research artifact in `LOOP/<mode>/research/` must exist with a modification time newer than the git commit timestamp of the first non-keep row in the streak. If no such artifact exists, flag as "plateau unaddressed -- research artifact missing." If the mode's `program.md` has no `{PLATEAU_N}` value (pre-research loop not yet retrofitted via `LOOP_CREATION.md` Step 2 repair), note `Plateau check: mode pre-research, skip` and skip this bullet.
- Tampering check: if `LOOP/<mode>/.task-hashes` OR `LOOP/<mode>/.holdout-task-hashes` is missing, OR if a recent `run.sh` invocation emitted `EVALUATOR_TAMPERED:` to stderr (look for it in any log the user surfaces), flag as "evaluator tampered or hashes missing -- ratchet integrity in question." If one or both hash files are missing because the mode pre-dates the current scaffold (legacy loop not yet retrofitted via `LOOP_CREATION.md` Step 2 repair), note `Tampering check: mode pre-v2, skip`.
- program.md drift: if `LOOP/<mode>/.program-checksum` shows mismatch (the last run's stderr would have carried `PROGRAM_CHANGED:`), record `program.md drift: mode changed since last run.sh` -- this is informational; intentional `program.md` edits are allowed but warrant human awareness.
- Cooldown state: if the last `run.sh` stderr carried `COOLDOWN_RESET:`, record `cooldown reset: research commit was lost from results.tsv` -- indicates a reset past the last research commit and is informational, not actionable.

### 2b.7 -- Record findings

- Any inconsistency lands in the new handoff's `This Session` section as a short flag. Do not auto-resolve.
- If everything is clean for a mode, record `LOOP: clean (<mode>: commit <sha>, status <keep|discard|crash-infra>, research <date|none>, holdout <date|none>)` in `This Session`.

## Step 3 -- Bloat and drift audit pass

Before writing the new handoff, evaluate whether the audit needs to run.

Skip the audit if ALL of these are true:
- no adapter files were modified during the session
- no `CONTEXT/*` files were written to during the session before Step 2 (i.e., Step 2 is the first write)
- Step 2b did not graduate any candidates (no graduation writes to `CONTEXT/LESSONS.md` or `CONTEXT/DECISIONS.md`)

If the audit is skipped, record `Audit: skipped (no adapter or pre-Step-2 CONTEXT writes, no graduations)` and proceed to Step 4.

Otherwise, perform a filtering pass on both root adapters and `CONTEXT/*`.

**Schema-level (hard-fail) checks** -- these block progress:
- Missing schema header on any `CONTEXT/*` file.
- Missing `<!-- ADAPTER_SCHEMA_V1 -->` or `<!-- LOOP_ACCESS_RULES_V1 -->` on either adapter.
- Schema version below current (should have been caught by Upgrade Mode; surface if missed).

**Style-level (soft-warn) checks** -- these annotate but do not block:
- Any bullet over 15 words or sentence over 25 words in `CONTEXT/*`.
- Any LaTeX, Unicode math, em-dash, or en-dash in `CONTEXT/*`.

**Drift audit (relocation actions)**:

Adapter bloat audit (run if either root adapter exceeds 160 lines, or if the session touched adapter content):
- code style rules in the adapter -> relocate to `ARCHITECTURE.md` or project conventions
- project conventions in the adapter -> relocate to `LESSONS.md` scoped as `[PROJECT]`
- live state (task items, decisions, handoff content) in the adapter -> relocate to the appropriate `CONTEXT/*` file
- routing rules that restate `CONTEXT/*` contents -> compress to a pointer

Module adapter audit (run if any module adapter exceeds 100 lines):
- same rules as root adapter, but relocate to the module's own `CONTEXT/*` entries or up to root if cross-cutting

CONTEXT drift audit:
- `TODO.md` containing rationale or architecture notes -> move rationale to `DECISIONS.md`, architecture to `ARCHITECTURE.md`
- `DECISIONS.md` containing task checklists or unresolved questions -> move tasks to `TODO.md`
- `ARCHITECTURE.md` containing task state or user preferences -> move tasks to `TODO.md`, preferences to `LESSONS.md`
- `LESSONS.md` containing one-off trivia or duplicated project state -> delete trivia, remove duplicates
- any file containing LaTeX, Unicode math, em-dashes, or en-dashes -> convert to ASCII operators per the operator legend (soft-warn; fix on touch)

Report audit findings both in the new handoff's `This Session` section and in the Step 7 delivered output. If nothing was relocated, record `Audit: clean` in both places. If only style soft-warns fired, record `Audit: clean (N style soft-warns)`.

## Step 4 -- Git check

If `{PROJECT_ROOT}` is a git repo:
- report clean or dirty state
- report ahead, behind, or diverged status versus upstream
- never push without explicit user intent

If not a git repo, record `Git sync: N/A`.

## Step 5 -- Write new handoff

Write the new handoff file to:
- `{CONTEXT_ROOT}/handoffs/YYYY-MM-DD-{short-slug}.md.tmp` (write to temp name first)
- then `mv {CONTEXT_ROOT}/handoffs/YYYY-MM-DD-{short-slug}.md.tmp {CONTEXT_ROOT}/handoffs/YYYY-MM-DD-{short-slug}.md` (atomic rename)

The atomic rename pattern prevents a crash-mid-write from leaving a truncated handoff that the next session would treat as authoritative.

Naming matches the bootstrap handoff convention: ISO date prefix plus a short descriptive slug. No session numbers -- retention is "current only", so sequence numbering adds no value.

Rules:
- keep all required sections
- keep content concise, telegraphic, and state-oriented
- use ASCII-only operators; no LaTeX, no Unicode math, no em-dashes, no en-dashes
- reference `CONTEXT/*` instead of duplicating it
- adapters stay undated; dates belong in the handoff, decisions, completed work, and git state
- keep the handoff harness-agnostic by default
- do not restate `CLAUDE.md` or Cursor rule content
- do not turn the handoff into another adapter layer
- make the `Session Greeting` self-contained so a pasted handoff tells the next model exactly how to respond first
- if a harness-switch note is needed, keep it to one short line

Section intent:
- `Session Greeting`: tell the next chat what to read first and how to answer after reading; require a brief resume reply only
- `State`: project path, git state, active focus, and major constraints
- `Auto-loop state`: one block per mode. Five lines max each: `Mode:`, `Last commit:` with metric value, `Last status:` (keep|discard|crash-infra), `Dominant failure mode:` (short phrase or "none observed"), `Last research:` (ISO date + one-line topline finding drawn from the most recent `research/*.md`, or `none` if `research/` is empty or absent). Pull the first three values from `results.tsv` last row; pull failure mode from recent `observations.md` Findings entries (the meta-agent digests this; do not re-read raw `jobs/` traces); pull research from the most recent file in `research/` -- read its `## Trigger` and topline of `## Leads to test` and compress to one line.
- `This Session`: important changes, decisions, validation performed or not performed, audit findings from Step 3, and LOOP findings from Step 2b (including any graduation blocks, title collisions, consistency-check flags, or reconciliation outcomes)
- `Hot Files`: files most likely to matter next
- `Anti-Patterns (Don't Retry)`: things not to retry, near-misses from Step 2a, and naive-next-move cautions. Default to "none this session" explicitly; empty is different from unchecked.
- `Blocked`: current blockers only
- `Key Context`: brief cross-links to durable memory when helpful; include a cross-harness note only when relevant
- `Verify On Start`: what to read or check first, including repo state when relevant; include an adapter-check note only when relevant; include a line telling the next session to verify loop state before resuming loop work (compare `results.tsv` last row to git HEAD; check that `observations.md` is newer than the last experiment's git commit timestamp; check for uncommitted changes in the mutable file; if a plateau is active per the last `{PLATEAU_N}` rows, confirm a research artifact in `research/` is newer than the first plateau commit). If Step 2b flagged any loop inconsistency in `This Session` -- including "plateau unaddressed" or "graduation blocked" or "graduation partial" -- the next session must diagnose and resolve before running further experiments. Do not resume the loop while flags are open.
- `Next Step Prompt`: the most natural continuation. Check in this order: (a) shipped-but-unverified work from this session that needs smoke or validation; (b) external gates (awaiting user input, repro, third-party response, discovery); (c) top active TODO item. Default falls through (a) -> (b) -> (c). Do not default to (c) when (a) or (b) applies.

Preferred harness-switch note:
- `If switching harnesses, read shared CONTEXT first; repair adapters only if stale.`

Required `Session Greeting` shape:
- Tell the next model to read `CONTEXT/*`, then resume from `State` and `Next Step Prompt`.
- Tell the next model that its first reply should stay brief: 1-2 short sentences, a `Pass-forward:` line, and exactly 1 direct question about how to proceed.

`Pass-forward:` is defined as a one-line label (under 15 words) of the single most important piece of state the next session must carry forward from this one. Not a summary, not a task list -- one sentence of the form "we are in the middle of X, the next decision point is Y." If nothing critical carries forward, write `Pass-forward: none`.

Required sections:
1. Session Greeting
2. State
3. Auto-loop state
4. This Session
5. Hot Files
6. Anti-Patterns (Don't Retry)
7. Blocked
8. Key Context
9. Verify On Start
10. Next Step Prompt

## Step 6 -- Delete prior handoff

After the atomic rename in Step 5 succeeds:
- delete ALL handoff files in `{CONTEXT_ROOT}/handoffs/` except the new one just written (handles the edge case where multiple prior handoffs exist from crashes or manual copies)
- verify that only the new handoff remains

Do not proceed to Step 6 if Step 5's `mv` did not complete. A failed atomic rename means the new handoff was not successfully written; prior handoffs must remain so the user can recover.

If a routing or integration doc was made redundant by adapters or canonical memory this session:
- archive it to `{CONTEXT_ROOT}/archive/YYYY-MM-{short-slug}.md` if it still has historical value
- delete it if it is pure redundancy
- if this is the first archival ever, also write `archive/README.md` from the schema in `PROJECT_MEMORY_BOOTSTRAP.md`

## Step 7 -- Deliver output

Return:
- a markdown link to the new handoff file
- a 3-5 line state summary
- the audit result from Step 3 (`clean`, `clean (N style soft-warns)`, or a short list of relocations)
- the LOOP result from Step 2b (`LOOP: clean` per-mode lines, or any flags raised)
- the most natural next step, defaulting to the top active TODO when relevant

## Model Self-Check

Before delivering output, confirm:
1. Did I write the new handoff using a `.tmp` + `mv` atomic pattern?
2. Did I delete ALL prior handoff files after the new one was successfully written?
3. Does the handoff include a `Pass-forward:` line (one sentence or `none`)?
4. Did I run the Decanting check (Step 2a) with all three categories answered?
5. Did Step 2b process modes alphabetically and candidates top-to-bottom within each mode?
6. For any `- [x]` candidate: did held-out re-verification pass, did the title-collision check run across modes, and was the transactional pending-file used?
7. Did I record LOOP findings in `This Session` if any inconsistency was flagged, or `LOOP: clean` lines if not?
