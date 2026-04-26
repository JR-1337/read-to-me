# LOOP CREATION

Telos: scaffold one auto-loop ratchet mode (program, tasks, runner, tampering guard, held-out partition, contract.yml) so a coding agent can optimize a scorable target without evaluator drift.

Schema definitions for generated files live in `<!-- SCHEMA: ... -->` HTML comments inside each file. Read them before writing.

## Cannot Proceed Unless

- `{PROJECT_ROOT}/CONTEXT/` exists with current-version schemas. If not, run `PROJECT_MEMORY_BOOTSTRAP.md` first (auto-detects fresh vs upgrade).
- `{PROJECT_ROOT}` is a git repo. Run `git init` first if not.
- The user can articulate what is being optimized AND the primary metric. If not, stop and work this out before scaffolding. The Pre-Scaffold Gate below enforces this.

Use this prompt to create a new auto-loop mode in a project end-to-end: scaffold the files, author the first task, wire the runner, and verify the whole chain works with a dry run. Opt-in per project; not every project runs loops.

Environment assumption: Linux. The scripts use `sha256sum` directly. If you later run on macOS or BSD, add a `sha256sum -> shasum -a 256` shim at the top of the scripts; the v2 default ships without one.

## Default Scope

This prompt uses three placeholder conventions. They look similar but mean different things:
- `{CURLY}` = prompt scope variable. Used in this prompt's instructions and comments. Examples: `{PROJECT_ROOT}`, `{MODE}`, `{MUTABLE_FILE}`. Never appears in generated files.
- `<<<ANGLE>>>` = template substitution marker. Appears inside file templates below, gets replaced with concrete values when the file is written. Examples: `<<<MODE>>>`, `<<<PRIMARY_METRIC>>>`. Must not appear in finished files.
- `[SQUARE]` = human-fill-in-after-scaffold. Left intentionally in generated files for the user to complete (for example, the `Goal` section of `program.md`). Verification at Step 8 flags these if left unfilled.

Scope variables:
- Assume the current project by default.
- `{PROJECT_ROOT}` is the directory that owns `CONTEXT/`.
- `{GLOBAL_ROOT}` is the user's context-system directory (default `~/.context-system/`, per `PROJECT_MEMORY_BOOTSTRAP.md`).
- `{MODE}` is the name of the loop mode being scaffolded or repaired. Always ask the user; never default.
- `{MUTABLE_FILE}` is the filename of the target the meta-agent will mutate.
- `{PRIMARY_METRIC}` is the scalar being optimized.
- `{METRIC_DIRECTION}` is either `higher_is_better` or `lower_is_better`.
- `{TIME_BUDGET_MINUTES}` is the wall-clock ceiling per experiment.
- `{EXTRA_READS}` is a bulleted list of additional paths the meta-agent should read at run start, or the literal word `none`.
- `{PLATEAU_N}` is the number of consecutive `discard` rows that trigger a plateau signal and invoke the research step.

## Pre-Scaffold Gate

Before any Step 1 questions, answer these three gates. If any gate fails, stop -- the scaffold will produce a broken loop.

### Gate 1: What problem does this loop solve, in plain language?

Examples: "my prompts fail too often", "the checkout page loads slowly", "our SQL query is timing out under load". If the user cannot articulate this in one or two sentences, stop and work it out.

### Gate 2: What would "better" look like, concretely?

Examples: "prompts complete tasks more reliably", "page loads in under 2 seconds", "query returns in under 100ms". The answer must point at something measurable.

### Gate 3: Does that "better" map to a single stable scalar number?

A valid primary metric is:
- A single scalar (one number per experiment, not two, not a set).
- Deterministic or near-deterministic (running the same evaluator on the same state gives the same number within tight tolerance).
- Meaningful (moving it in the chosen direction actually represents progress).

Examples of well-isolated metrics:
- `pass_rate` (0-1, higher better) -- deterministic task evaluator
- `lcp_ms` (lower better) -- Lighthouse measurement on a fixed page state
- `bundle_kb` (lower better) -- file size after a reproducible build
- `query_ms_p50` (lower better) -- median latency on a fixed query against a fixed dataset

Examples of metrics to avoid:
- "How good the prompt feels" -- subjective, not a number
- "User engagement" or "conversion rate" -- requires real traffic, days of data per experiment, non-deterministic
- Two metrics averaged or combined -- the meta-agent cannot tell which improved; split into primary + secondary instead
- Any metric that drifts between runs without state changes -- the ratchet cannot distinguish signal from noise

If the gate fails, do not scaffold. Help the user refine the metric first. The rest of this prompt assumes the gate passed.

## Step 1 -- Gather mode parameters

Ask the user these questions one at a time, in sequence. Do not batch them in a single form, summary table, or AskUserQuestion call with multiple items. Each question gets its own exchange: ask, wait for the answer, validate (re-ask if the answer is invalid per the question's rules), then move to the next. This is the default even if the user seems ready to batch-answer; batching collapses the per-question validation loop and loses the scaffold's value.

The `<<<QUESTION_k_OF_N>>>` marker in each heading is structural: if the user tries to batch-answer, you can point at the marker to justify going one-at-a-time.

Valid responses include `TODO`, `none`, or `skip` where those are called out as acceptable in the question itself.

### Q1 of 11 -- Mode name

Short kebab-case string, used as the folder name under `LOOP/`. Examples: `prompt-optimizer`, `speed-optimizer`, `bundle-optimizer`, `query-optimizer`, `copy-optimizer`. Record as `{MODE}`.

### Q2 of 11 -- Mutable file

Filename only, lives at `LOOP/{MODE}/<filename>`. Examples: `prompts.md`, `page.html`, `styles.css`, `query.sql`, `config.json`. Record as `{MUTABLE_FILE}`.

### Q3 of 11 -- Primary metric

The metric that passed the Pre-Scaffold Gate. Record as `{PRIMARY_METRIC}`.

After recording the metric name, capture two additional attributes:

- **Stability characterization**: one of `deterministic` (same input always produces same output), `bounded_variance` (variance is small and stable across runs; aggregation handles it), or `noisy` (variance not yet characterized; treat with caution). Record as `{METRIC_STABILITY}`. If `noisy`, recommend the user choose a repetition count of 3+ at Q10.

- **Adversarial / gaming examples**: one or two concrete scenarios of what it would look like if this metric were being gamed rather than legitimately improved. Examples: for `sanitize_pass_rate`, "`score.sh` was edited to always echo 1.0" or "rules silently convert `expected.md` before diffing"; for `lcp_ms`, "the page started returning a stub instead of the full content." This forces adversarial thinking at scaffold time and gives the meta-agent an anchor for self-policing. Record as `{METRIC_GAMING}` (list of strings).

### Q4 of 11 -- Metric direction

Higher or lower is better for the primary metric? Record as `{METRIC_DIRECTION}` (one of `higher_is_better`, `lower_is_better`).

### Q5 of 11 -- Optional metric range

Min and max bounds for the metric, if known. Example: for `pass_rate`, `[0.0, 1.0]`. For unbounded metrics like latency, answer `none`. Record as `{METRIC_RANGE}`. The runner treats out-of-range values as a soft-warn (stderr notice) but does not reject the row.

### Q6 of 11 -- Time budget per experiment

Wall clock minutes per experiment. Examples: 5, 10, 30. Record as `{TIME_BUDGET_MINUTES}`.

### Q7 of 11 -- Extra reads at run start

Any additional context the meta-agent should read at run start beyond `program.md`, `contract.yml`, and the mutable file? Examples: a design-doc markdown, a style guide, a reference dataset description. Record paths as `{EXTRA_READS}`. Optional; answer `none` if none.

Rendering: if the user answers `none`, the rendered `program.md` Setup step gets the literal word `none`. If the user gives one or more paths, each path renders as an indented sub-bullet under the Setup numbered step.

### Q8 of 11 -- Runner command

What command or tool runs the evaluator? The runner takes one task, applies the current mutable file to it, and produces the primary metric value. Examples: `npx lighthouse <url> --output=json` for page speed, `python judge.py <task>` for prompt scoring, `npm run build && du -sk dist/` for bundle size, `psql -c "$(cat <mutable>)" -f <task>.sql` for queries. Record the command pattern as `{RUNNER_COMMAND}`. If the user does not know yet, record `TODO`.

### Q9 of 11 -- Metric capture mechanism

How does the runner emit the metric value? Options: prints a specific line to stdout (e.g. `metric: 0.87`), writes a file at a known path (e.g. `/tmp/metric.txt`), returns a JSON field, exits with a specific code. Record as `{METRIC_CAPTURE}`. If `TODO`, the default is `stdout last line`.

### Q10 of 11 -- Plateau threshold

How many consecutive `discard` experiments should trigger the research step? The plateau signal fires when the last N data rows of `results.tsv` are all `discard` (note: `crash-infra` does NOT count because infrastructure failures are not signal about the hypothesis space). At that point the meta-agent pauses the edit-run-check cycle and runs an outward research pass per `research.md`. Examples: 3 (aggressive, good for fast domains where each experiment is cheap), 5 (default, balances responsiveness and noise tolerance), 10 (conservative, for expensive or high-variance domains). Record as `{PLATEAU_N}`. Default `5` if the user has no preference.

### Q11 of 11 -- Repetitions per experiment

For noise control. Default `1` (deterministic evaluators only). Typical values: `3` for LLM judges at low temperature, `5+` for latency benchmarks or anything network-dependent. The runner runs `score.sh` N times per task and aggregates via median; if per-task relative dispersion by median exceeds `cv_threshold` (default 10%), the task is logged as a crash and the whole-run status may flip to `crash-infra` (see Step 5 for the threshold policy). Record as `{REPETITION_COUNT}`. If the metric stability from Q3 was `noisy`, recommend at least `3`; otherwise default `1` is appropriate.

### Complexity proxy defaults

Not asked as a question in v2; defaulted at scaffold time and overridable later by editing `program.md` Constraints. Defaults:
- `{COMPLEXITY_PROXY}` = `byte_count`
- `{COMPLEXITY_GROWTH_THRESHOLD_PCT}` = 10
- `{IMPROVEMENT_REQUIRED_PCT}` = 1

## Step 2 -- Check for existing scaffold

If `{PROJECT_ROOT}/LOOP/{MODE}/` already exists, this is a repair run, not an initialization.

On repair:
- Read the existing `program.md`. Do not overwrite. Offer to patch specific sections only based on changed answers from Step 1.
- Re-verify required files exist: `program.md`, `research.md`, `contract.yml`, `{MUTABLE_FILE}`, `results.tsv`, `observations.md`, `tasks/`, `tasks/holdout/`, `jobs/`, `research/`, `run.sh`, `run-holdout.sh`, `status.sh`, `.task-hashes`, `.holdout-task-hashes`, `.program-checksum`.
- Recreate any missing file from the templates in Step 3, preserving existing content where present.
- If `research.md` and `research/` are absent (loop pre-dates the research step), offer to add them; ask Step 1 Q10 for `{PLATEAU_N}` at that point, then patch `run.sh` and the `program.md` Budget and stopping section per Step 5 and the template in Step 3.
- If `tasks/holdout/`, `run-holdout.sh`, or `.task-hashes` are absent (loop pre-dates the held-out partition), offer to add them; walk Step 4's holdout-task-authoring sub-step.
- If `.task-hashes` exists but covers `tasks/holdout/*` (v1 scaffold with unified hash file), re-generate both hash files per Step 5's split recipe: `.task-hashes` covers normal tasks only, `.holdout-task-hashes` covers holdout only. This accepts current state as the new ground truth.
- If `contract.yml`, `status.sh`, or `.program-checksum` are absent (pre-v2 scaffold), generate them per Step 5. Generating `.program-checksum` uses the current `program.md` as the baseline.
- If `observations.md` schema header shows `Version: 1`, bump to `Version: 2` (v2 enum change affects Evidence format). Content is preserved byte-for-byte.
- If `program.md` references any of the retired status values (`keep-combo`, `discard-combo`, `crash-hypothesis`), flag these sites and offer to rewrite per the v2 3-value enum.
- Report what was missing and what was recreated.

On initialization, proceed to Step 3.

## Step 3 -- Scaffold the mode directory

Create the folder structure:

```
{PROJECT_ROOT}/LOOP/{MODE}/
|-- program.md
|-- research.md
|-- contract.yml
|-- {MUTABLE_FILE}
|-- results.tsv
|-- observations.md
|-- run.sh                 (created in Step 5)
|-- run-holdout.sh         (created in Step 5)
|-- status.sh              (created in Step 5)
|-- .task-hashes           (created in Step 5; SHA-256 baseline for tasks/* excluding holdout)
|-- .holdout-task-hashes   (created in Step 5; SHA-256 baseline for tasks/holdout/*)
|-- .program-checksum      (created in Step 5; SHA-256 of program.md)
|-- .last-research-commit  (created on first plateau; absent before that)
|-- jobs/
|   `-- .gitkeep
|-- research/
|   `-- .gitkeep
`-- tasks/
    |-- task-01/           (created in Step 4)
    |   |-- instruction.md
    |   |-- expected.md
    |   `-- score.sh
    `-- holdout/           (created in Step 4)
        `-- task-h01/
            |-- instruction.md
            |-- expected.md
            `-- score.sh
```

If `{PROJECT_ROOT}/LOOP/` does not exist yet, create it first. Step 3 creates `program.md`, `research.md`, `contract.yml`, `{MUTABLE_FILE}`, `results.tsv`, `observations.md`, the empty `jobs/`, and the empty `research/`. Steps 4 and 5 create the task directories and all scripts.

### `program.md` (generated from the template below)

Write the following content to `LOOP/{MODE}/program.md`, replacing every `<<<PLACEHOLDER>>>` marker with the corresponding value from Step 1. The substitutions are:

- `<<<MODE>>>` -> `{MODE}`
- `<<<MUTABLE_FILE>>>` -> `{MUTABLE_FILE}`
- `<<<PRIMARY_METRIC>>>` -> `{PRIMARY_METRIC}`
- `<<<METRIC_DIRECTION>>>` -> `{METRIC_DIRECTION}`
- `<<<METRIC_STABILITY>>>` -> `{METRIC_STABILITY}`
- `<<<METRIC_GAMING>>>` -> the gaming examples (rendered as a sub-bulleted list)
- `<<<TIME_BUDGET_MINUTES>>>` -> the minute value
- `<<<EXTRA_READS>>>` -> bulleted list of paths (rendered as indented sub-bullets under the Setup step), or the literal word `none`
- `<<<GLOBAL_LESSONS>>>` -> `~/.context-system/CONTEXT/LESSONS.md`
- `<<<PLATEAU_N>>>` -> the integer from Step 1 Q10
- `<<<REPETITION_COUNT>>>` -> the integer from Step 1 Q11
- `<<<COMPLEXITY_PROXY>>>` -> `byte_count` (default)
- `<<<COMPLEXITY_GROWTH_THRESHOLD_PCT>>>` -> 10 (default)
- `<<<IMPROVEMENT_REQUIRED_PCT>>>` -> 1 (default)

Template content:

```markdown
# <<<MODE>>> program

This file is the meta-agent's directive. The human edits this file when redirecting the loop. The meta-agent reads this file at the start of every run and follows it.

## Goal

[ONE TO THREE SENTENCES. What is being optimized. Name the domain concretely. Human fills in after scaffold.]

## Your role

Your job is NOT to make the evaluator pass directly, produce the desired output by hand, or demonstrate the target behavior yourself. Your job is to improve the contents of `<<<MUTABLE_FILE>>>` so that, when the evaluator runs, the measured `<<<PRIMARY_METRIC>>>` moves in the desired direction (<<<METRIC_DIRECTION>>>).

If `<<<MUTABLE_FILE>>>` has any non-mutable portion, it is marked by a `FIXED REGION` comment. Do not modify anything below that marker unless the human explicitly asks. If the file has no such marker, the entire file is the optimization surface.

## Metric

Primary: `<<<PRIMARY_METRIC>>>`, <<<METRIC_DIRECTION>>>.

Stability: <<<METRIC_STABILITY>>>. Repetitions per experiment: <<<REPETITION_COUNT>>> (median-of-N aggregation; high relative dispersion by median is logged as `crash-infra`).

Machine-readable definition lives in `contract.yml` alongside this file. The runner reads `contract.yml` at every invocation; keep the two in sync if you edit either.

Gaming would look like:
<<<METRIC_GAMING>>>

Use this as your self-policing anchor: if a candidate change resembles any of these, flag in `observations.md` Open Questions even if the metric improved.

`results.tsv` also carries a `secondary` column for a second signal when informative (for example, when the primary is a count, secondary might be a pass rate; when the primary is latency, secondary might be memory). If only one metric is meaningful, leave the `secondary` column filled with a placeholder.

## Constraints

- Time budget per experiment: <<<TIME_BUDGET_MINUTES>>> minutes of wall clock, excluding setup and compilation.
- Complexity ratchet: if the mutable file's `<<<COMPLEXITY_PROXY>>>` grew more than `<<<COMPLEXITY_GROWTH_THRESHOLD_PCT>>>%` relative to the last `keep`, the experiment requires at least `<<<IMPROVEMENT_REQUIRED_PCT>>>%` metric improvement to keep. Otherwise revert. This replaces aesthetic "simpler is better" judgment with a reproducible threshold; the same edit is decided the same way across model swaps.
- Do not change `score.sh`, files under `tasks/`, or anything else outside `<<<MUTABLE_FILE>>>` unless the human explicitly asks. The runner verifies this with SHA-256 hashes against `.task-hashes` and `.holdout-task-hashes`; on mismatch it emits `EVALUATOR_TAMPERED:` to stderr and refuses to score. If you legitimately need an evaluator change, stop the loop, ask the human, and re-baseline the hash files after the human approves.

## Held-out validation

`tasks/holdout/` is the independent verdict set. The runner does NOT score it during normal experiments; ratchet decisions are made on `tasks/` only. The held-out set is scored before any Candidate graduates from `observations.md` to `CONTEXT/LESSONS.md` or `CONTEXT/DECISIONS.md` (handoff Step 2b runs `./run-holdout.sh` and blocks graduation if the held-out metric did not improve in the same direction as the primary metric).

This structure replaces the older exhortational self-check with a mechanical guard. Optimization pressure on a single task set produces evaluator gaming over many iterations (Goodhart pattern, documented in METR's RewardHackingAgents work); held-out scoring is the one structural defense.

If you catch yourself wanting to modify `tasks/holdout/` content (e.g., a holdout task seems wrong), stop. Raise it in `observations.md` Open Questions and let the human adjudicate. Do not edit.

Adding new holdout tasks is legitimate. Use the re-baseline command documented in `run-holdout.sh` comments to regenerate `.holdout-task-hashes` after adding; this does NOT touch `.task-hashes`.

## Setup (run once at the start of a new loop session)

1. Create a branch: `git checkout -b loops/<<<MODE>>>/<tag>` from the repository's default branch. The tag is a short descriptor of this session.
2. Read the in-scope files in this order:
   - This file (`program.md`)
   - `contract.yml`
   - `<<<MUTABLE_FILE>>>`
   - `results.tsv` (last 10 rows)
   - `observations.md` (all three sections)
   - <<<GLOBAL_LESSONS>>> (entries tagged [GLOBAL]; if the file does not exist, skip this read and note it in Open Questions for the human to address by running the First-Time Global Setup section of `PROJECT_MEMORY_BOOTSTRAP.md`)
   - The project's `CONTEXT/LESSONS.md` ([PROJECT] and [MODULE] entries)
   - The project's `CONTEXT/DECISIONS.md`
   - The project's `CONTEXT/ARCHITECTURE.md` if the loop touches code structure
3. Read additional context specific to this mode if any:
   <<<EXTRA_READS>>>
4. Read a representative sample of the eval set under `tasks/` (excluding `tasks/holdout/`, which you do not score during the loop). Confirm the evaluator runs cleanly before making any change.
5. If `results.tsv` has no data rows, run the baseline first and record the result. The baseline is the ratchet's zero point.
6. Confirm setup is clean. Concrete checklist: `git status` clean (no uncommitted changes); `results.tsv` exists and is readable; at least one task in `tasks/`; at least one task in `tasks/holdout/`; `score.sh` executable for each task; `.task-hashes` and `.holdout-task-hashes` match current content (run `./run.sh "verify-baseline"` once if uncertain -- the run will refuse with `EVALUATOR_TAMPERED:` if hashes drift); baseline `keep` row present in `results.tsv` (or generate it now if absent). Only proceed when every item ticks.

## Resume from crash

The loop is autonomous and may run for hours. If your session crashes (context-window limit, API outage, manual interrupt) and resumes later, the first action is recovery, not experimentation:

1. Run `git status`. If dirty, the previous session crashed mid-experiment. Run `git stash save "resume-<ISO-date>"` and log the stash SHA to `observations.md` Open Questions for human review. Never assume the in-progress edit was `keep`-worthy; the ratchet only knows committed state.
2. Read `results.tsv` last row and compare to `git rev-parse --short HEAD`. If the last row's commit SHA does not match HEAD, the previous session committed a result but crashed before the follow-up action (discard revert or next experiment). Log the discrepancy to `observations.md` Open Questions; treat current `git HEAD` as the baseline going forward.
3. Re-read the entire Setup section (step 2 above) from scratch. Do not skip the reads on the assumption that the previous session loaded them -- context did not survive.
4. Resume the experiment loop only after steps 1-3 are complete and Open Questions accurately reflect any discrepancies found.

## Experiment loop

Each experiment:

1. Propose one change. Default is a single hypothesis per experiment -- mixed changes make the ratchet uninterpretable. If you must combine hypotheses when stuck, note that fact in the description.
2. Run `./run.sh "<short noun-phrase description>"`. The runner verifies the tampering hashes, runs each task in `tasks/` (excluding `tasks/holdout/`) `<<<REPETITION_COUNT>>>` times, aggregates via median, and appends one row to `results.tsv` with status `keep` (default) or `crash-infra` (infrastructure failure).
3. Read the row. Compare the metric value against the last `keep` row's metric (or the baseline if this is the first experiment beyond baseline).
4. Act per your judgment using the status-write contract below. The runner gives you two statuses; you assign a third (`discard`) by editing the row when warranted.

**Status-write contract (v2 three-value enum):**

The runner writes `keep` (default) or `crash-infra` (infrastructure failure: non-numeric output, timeout, high dispersion). You read the row and decide:

- **Metric improved in the desired direction, or this is the first keep**: leave status as `keep`. `git commit` the mutable-file change and the results.tsv row together: `git add <mutable_file> results.tsv && git commit -m "keep: <description>"`.
- **Metric worse or unchanged**: edit the status column of the just-written row from `keep` to `discard` (sed-in-place or a simple text edit is fine; the row is the last line of `results.tsv`). Then `git add results.tsv && git commit -m "discard: <description>"` to persist the discard row for plateau detection. Then `git checkout HEAD~1 -- <mutable_file>` to revert just the mutable file to the previous commit's state. The discard row stays; the mutable-file change disappears.
- **Runner wrote `crash-infra`**: `git reset --hard`. Both the appended row and the mutable-file change revert; this run produced no signal. Retry once before moving on; if it crashes again, log in `observations.md` Open Questions and continue with a different hypothesis.

This contract makes `discard` reachable AND persistent, which is what the plateau detector needs. `crash-infra` rows do not persist (they were infrastructure noise; treating them as valid plateau signal would be wrong).

Spot-checking is a thinking aid, not a ratchet input. To explore an edit cheaply, run `./run.sh "<desc>" "<task-glob>"` to score a subset -- the runner detects a non-default glob and skips the `results.tsv` append and plateau check. Subset results print to stdout only.

## results.tsv schema

Tab-separated, not comma-separated (commas break in descriptions).

```
commit	<<<PRIMARY_METRIC>>>	secondary	status	description
```

Status values (exactly these strings): `keep` / `discard` / `crash-infra`. `crash-infra` records zeros in metric columns, not nulls.

Description format: short noun phrase stating the change. Examples: `baseline`, `add stop-token to system prompt`, `tighten regex for nested quotes`. For crashes, include cause in parens: `swap to GeLU activation (OOM)`. Do NOT describe the observed effect -- the metric column already encodes it. Durable reasoning, if any, goes in `observations.md`.

## observations.md

At the end of each batch of experiments (when you pause for any reason, or when the human interrupts), append to `observations.md`:

- `Findings`: what the batch surfaced. Keep to the last 10 entries.
- `Candidates`: patterns you think warrant graduation to the project's `CONTEXT/LESSONS.md` or `CONTEXT/DECISIONS.md`. Write each as a `- [ ]` checkbox entry per the schema header in `observations.md`. The human ticks `- [x]` to approve or deletes the entry to reject. Never write `- [x]` yourself; the unchecked state is the only state you emit.
- `Open Questions`: anything you were uncertain about that would benefit from human input before continuing.

Do not write to `CONTEXT/*` directly. Ever. That graduation path is human-only via the handoff flow.

## Plateau response

The runner emits `PLATEAU_DETECTED:` to stderr when the last <<<PLATEAU_N>>> data rows of `results.tsv` are all `discard` (note: `crash-infra` does NOT count because infrastructure failures are not signal about hypothesis space). Interpret this signal as the ratchet saying you are optimizing inside a frame that is no longer productive -- most likely because the hypothesis space you have been exploring is exhausted, the current framing is wrong, or a structural constraint outside the mutable file is bounding the metric.

On plateau, stop the edit-run-check cycle and run a research pass:

1. Read `research.md`. It defines the inputs to gather, the questions to pose, and the output format.
2. Execute the research pass. Use whatever web-search or literature tools are available to you. If none are available, tell the human -- do not simulate research from memory.
3. Write the research artifact to `research/<ISO-date>-<counter>.md` per the format in `research.md`.
4. Write the current git HEAD SHA to `.last-research-commit`: `git rev-parse HEAD > .last-research-commit`. This is the commit that includes the research artifact. The runner uses this SHA to enforce the cooldown.
5. Append a compact summary to `observations.md` `Findings`. If the research surfaced durable patterns worth graduating, append `- [ ]` entries to `Candidates` with `Evidence:` pointing to the research artifact filename.
6. Resume the experiment loop with hypotheses informed by the research. The runner enforces a cooldown: `PLATEAU_DETECTED:` will not re-fire until at least <<<PLATEAU_N>>> new rows have been appended since the research commit. If the research commit's SHA is no longer in `results.tsv` (e.g., rows were lost to a reset past that point), the runner emits `COOLDOWN_RESET:` to stderr and falls back to counting all data rows; this is informational, not actionable.

If the research pass concludes that a different `LOOP/<mode>/` would be more productive than continuing this one, record that as a `- [ ]` Candidate with `Target: DECISIONS.md` and `Scope: [PROJECT]`. Do not abandon the current loop unilaterally; the human ratifies new-mode proposals at the next handoff.

**On population-style search.** This system deliberately substitutes episodic plateau-triggered research for the continuous population-style diversity that AlphaEvolve / FunSearch / OpenEvolve maintain (MAP-Elites bins, island migration, multi-parent sampling). The substitution is intentional: it trades continuous exploration for deeper, web-grounded research passes that fit a single-developer single-pointer workflow. Do not attempt to invent your own population mechanic on top of this scaffold. If the plateau response feels structurally insufficient for a particular mode, surface that in `observations.md` Open Questions for the human to evaluate -- do not branch off into ad-hoc parallel exploration.

## Budget and stopping

Once the experiment loop has begun, do NOT pause to ask the human if you should continue. The human might be asleep or away from the keyboard and expects you to keep working until manually stopped.

If you run out of ideas:
- Re-read this file and the most recent `research/*.md` artifact for angles you missed
- Try extending from a `keep` row older than the latest one. Local optima form around recent keeps; an earlier fork can surface an angle the current trunk has closed off (record the parent commit in the description, e.g. `from-keep abc1234: <change>`)
- Try more radical changes, not just variations of what has already been tried
- Examine `discard` rows for patterns -- what class of change consistently fails, and is there a deeper cause?

Running out of ideas is not the same as the plateau signal. Plateau is a mechanical trigger defined by the last <<<PLATEAU_N>>> rows; running out of ideas is a judgment call. If both are true at once, let the plateau-response section drive -- it is the more structured path.

The loop runs until the human interrupts you. Do not self-terminate.
```

### `research.md` (generated from the template below)

Write the following content to `LOOP/{MODE}/research.md`. Substitutions are the same as `program.md`.

The user edits the `Research questions` section after scaffold to tune the inquiry to their domain. The default questions are a generalist set -- they work as a starting point but almost every domain has at least one more specific question worth adding.

Template content:

```markdown
# <<<MODE>>> research directive

Read this file when the runner emits `PLATEAU_DETECTED:` to stderr, or when the human explicitly invokes research. Do not run research proactively otherwise -- the plateau signal is the trigger.

## Purpose

The experiment ratchet optimizes inside whatever hypothesis space the meta-agent can generate from current context. A plateau means that space is exhausted or mis-framed. Research widens the space by pulling in external material: literature, adjacent projects, competing implementations, theoretical bounds.

The output is NOT a code change. The output is a research artifact that informs the next batch of experiments.

## Inputs to gather before searching

Read these in this order. Take notes but do not write the artifact yet.

1. Last 10 rows of `results.tsv`. Note the dominant failure mode -- what class of change keeps getting discarded.
2. Current `<<<MUTABLE_FILE>>>`. Note what has survived so far (what is still in the file after many `keep` and `discard` cycles).
3. `program.md` Goal and Metric sections and `contract.yml`. Restate the goal in one sentence -- this keeps the research grounded in what actually matters.
4. Last 5 entries in `observations.md` `Findings`. Note any pattern the meta-agent already flagged but has not been able to act on.
5. The 2 most recent files in `research/` if any exist. Their purpose is to prevent duplicate lines of inquiry. Read their `Questions pursued` and `Leads not yet tested` sections; treat those as already-covered ground unless a new angle suggests revisiting.

## Research questions (default set -- user edits after scaffold)

Pursue these in roughly this order. Stop early if a strong lead emerges; do not mechanically answer all six if the first two surface a clear next experiment.

1. What is the known state of the art or theoretical upper bound for `<<<PRIMARY_METRIC>>>` in this domain? If we are far from it, the gap is the opportunity. If we are near it, the opportunity is elsewhere.
2. What approaches appear in adjacent work, competing projects, or published literature that do NOT appear in our `results.tsv`? Name specific techniques, papers, or repositories.
3. Is the metric saturating because it is a proxy that caps before the true goal does? If so, what would a better proxy measure?
4. Do recent `discard` failure modes point to a structural blind spot -- not a tuning problem but a framing problem? Name the frame.
5. Are there techniques from nearby domains that transfer? Be concrete about the mechanism of transfer.
6. Does this plateau suggest a different `LOOP/<mode>/` would be more productive than continuing this one? If so, name the proposed mode, its mutable file, and its primary metric.

## Tools

Use whatever web-search or literature-retrieval tools your harness provides. If none are available, stop and tell the human before writing any artifact. Do not fabricate sources or simulate research from training-data memory -- unverifiable findings pollute the ratchet worse than an unresolved plateau.

## Output format

Write the artifact to `research/<ISO-date>-<counter>.md` where `<counter>` is a two-digit sequence starting at `01` for the first artifact on a given date, incrementing for each subsequent artifact that day. Example: `research/2026-04-21-01.md`.

The artifact must contain these sections in this order. Keep each section tight -- one paragraph or a short list, not an essay.

```
# Research pass -- <ISO-date> #<counter>

## Trigger
Plateau after <N> consecutive discard experiments, or manual invocation.
Last keep: <commit sha> (<metric value>). Last N statuses: <list>.

## Dominant failure mode
<one sentence describing what keeps being discarded and why>

## Questions pursued
- <question>: <one-sentence finding with source>
- <question>: <one-sentence finding with source>
(Omit questions you did not actually research.)

## Leads to test
Ordered by expected information gain, not by ease of implementation.
1. <specific hypothesis> -- mechanism: <why it might work> -- source: <where this came from>
2. <specific hypothesis> -- mechanism: <...> -- source: <...>

## Leads not yet tested
<Leads that seem plausible but lower-priority than the above. Next research pass should read this section to avoid re-deriving them.>

## New-mode proposals (optional)
<If research surfaced that a different optimization target would be more productive. Format: proposed mode name, mutable file, primary metric, one-sentence rationale.>

## Sources
<List of URLs, paper titles, or repo links. Every finding above traces to one of these.>
```

## After writing the artifact

1. Record the research commit SHA: `git rev-parse HEAD > .last-research-commit`. This tells the runner's cooldown mechanism where "since last research" starts.
2. Append a compact summary (3 lines max) to `observations.md` `Findings`. Format: `YYYY-MM-DD research pass: <one-sentence topline>. See research/<filename>.`
3. For each lead in `Leads to test` that would make a durable `LESSONS.md` or `DECISIONS.md` entry if it proves out, append a `- [ ]` Candidate to `observations.md` with `Evidence: research/<filename>` and a short rationale. These are speculative until a subsequent experiment confirms them; the `- [ ]` state reflects that.
4. Resume experiments. Run at least <<<PLATEAU_N>>> new experiments before the plateau check can fire again.
```

### `contract.yml` (generated from Step 1 answers)

Write the following content to `LOOP/{MODE}/contract.yml`. Substitute `<<<PLACEHOLDERS>>>` from Step 1.

```yaml
# contract.yml -- evaluator contract for LOOP/<<<MODE>>>/
# Machine-readable metric definition. Read by run.sh at every invocation.
# The meta-agent reads this during Setup and treats it as authoritative alongside program.md.
# Human edits this file to redirect the loop. Keep program.md Metric section in sync.

metric: <<<PRIMARY_METRIC>>>
direction: <<<METRIC_DIRECTION>>>
stability: <<<METRIC_STABILITY>>>

repetitions: <<<REPETITION_COUNT>>>
cv_threshold: 0.10

# Optional [min, max] bounds. Soft-warn only: run.sh emits METRIC_OUT_OF_RANGE: to
# stderr if the aggregated metric falls outside. The row is still logged; the
# meta-agent's keep/discard judgment is unchanged. Set to `null` for unbounded metrics.
range: <<<METRIC_RANGE>>>

# Concrete gaming scenarios for THIS metric. The meta-agent uses these as a
# self-policing anchor: candidate changes resembling any scenario warrant a flag in
# observations.md Open Questions even if the metric improved.
gaming_scenarios:
<<<METRIC_GAMING_YAML_LIST>>>
```

`<<<METRIC_RANGE>>>` is either `[<min>, <max>]` (e.g. `[0.0, 1.0]`) or the literal `null` when Q5 returned `none`. `<<<METRIC_GAMING_YAML_LIST>>>` renders each gaming scenario as a `- "<scenario>"` YAML list item, one per line, indented two spaces.

A ready-made example of this file ships at `prompts/v2/contract.yml.example` in the v2 prompts folder.

### `{MUTABLE_FILE}`

Create as a minimal stub. Exact content depends on the mode's target:

**If the mutable file has any non-mutable portion** (code that interfaces with a runner, a required header, a fixed contract with an evaluator): mark the boundary with explicit comments.
- Top of mutable region: `MUTABLE REGION -- meta-agent modifies this section`
- Start of fixed region: `FIXED REGION -- do not modify below this line`

**If the entire file is mutable** (a pure prompt markdown, a CSS/HTML file, a config with no fixed contract): no boundary markers needed. The whole file is the optimization surface.

If the user is unsure whether a fixed portion exists, default to no boundary and add one later only if the meta-agent starts breaking the runner contract during experiments.

### `results.tsv`

Create with header row only. Tab-separated. Columns:

```
commit	{PRIMARY_METRIC}	secondary	status	description
```

`secondary` is a placeholder for a second metric the user may or may not add. Leaving the column is cheap; removing it later if unused is cheaper than adding it later if needed.

Status values (exactly these strings): `keep` / `discard` / `crash-infra`. See the program.md Experiment loop section for the status-write contract.

### `observations.md`

Write the following content to `LOOP/{MODE}/observations.md`:

```
<!-- SCHEMA: observations.md
Version: 2
Purpose: meta-agent inbox for candidate lessons, findings, and open questions.
Write mode: meta-agent appends at end of each batch. Human reviews and marks
graduations via checkboxes; HANDOFF-LOOP.md Step 2b processes marks.

Sections (in order):
- Findings: what recent batches surfaced. Retention: last 10.
- Candidates: staged for graduation to CONTEXT/LESSONS.md or CONTEXT/DECISIONS.md.
  Each candidate is a checkbox entry.
  - `- [ ]` = pending human review (default state written by meta-agent)
  - `- [x]` = affirmed by human; HANDOFF-LOOP.md Step 2b will graduate via transactional
    pending-file flow and delete this entry
  - entry deleted entirely = rejected by human
  Unchanged `- [ ]` entries remain across sessions until affirmed or rejected.
- Open Questions: meta-agent uncertainty. Retention: until resolved or superseded.

Rules:
- Telegraphic ASCII per CONTEXT/* style. No LaTeX, no Unicode math, no em-dashes.
- Each entry carries enough reference to reconstruct the finding (mode, tag, metric).
- Candidate format:
  `- [ ] <short title>`
  `  Target: LESSONS.md` or `Target: DECISIONS.md`
  `  Scope: [GLOBAL] | [PROJECT] | [MODULE: <name>]` (LESSONS candidates only)
  `  Evidence: <mode>/<tag> (<metric>: <value>)`
  `  Rationale: <one telegraphic line>`
- Evidence references the current 3-value status enum (keep, discard, crash-infra).
  Older entries referencing retired values (keep-combo, discard-combo, crash-hypothesis)
  are treated as historical; do not rewrite them.
- Do not duplicate results.tsv rows here. Reference the commit tag instead.

Version history:
- Version 1: original 6-value status enum. Evidence format could reference any.
- Version 2: status enum simplified to keep/discard/crash-infra. New Evidence
  references use the 3-value vocabulary.
-->

## Findings
(none yet)

## Candidates
(none yet. Meta-agent appends `- [ ]` checkbox entries. Change to `- [x]` to affirm for graduation at next handoff; delete the entry entirely to reject.)

## Open Questions
(none yet)
```

### `tasks/`, `jobs/`, and `research/`

Empty directories with `.gitkeep` placeholders. Tasks must be authored by the human before the first run. Jobs populate automatically per run. Research populates on plateau or manual invocation per the `research.md` directive.

## Step 4 -- Author the first task and held-out task (guided)

The loop cannot run without at least one normal task and at least one held-out task. Walk the user through authoring both, one question at a time (same enforcement rule as Step 1: do not batch the questions in a single form or AskUserQuestion call; each question gets its own exchange). The user knows their domain; your job is asking the right questions and assembling the task directory structure from their answers. Do not invent content.

### 4a. Normal task (`tasks/task-01/`)

Create `LOOP/{MODE}/tasks/task-01/` with these files, asking the user to fill each:

1. `instruction.md` -- ask: "What is the single concrete task you want the current mutable file to handle? Describe it as if instructing a worker." Write the user's answer verbatim into `instruction.md`.

2. `input/` (optional directory) -- ask: "Does this task need input files, data, or fixtures? If yes, what are they?" Create `input/` and either copy the files the user names or leave placeholder filenames with a `TODO` comment in `instruction.md` pointing to them.

3. `expected.md` -- ask: "What does a successful result look like? Be concrete: exact output, a property that must hold, or judging criteria if the grader is an LLM." Write the answer into `expected.md`.

4. `score.sh` -- a small executable script that produces the scalar metric for THIS task. Generate a template (substitute `<<<PRIMARY_METRIC>>>` with the actual metric name):

```bash
#!/usr/bin/env bash
# score.sh -- grades task-01 and emits <<<PRIMARY_METRIC>>> to stdout last line
# TODO: replace the placeholder logic below with your actual grading.
# Options:
#   - diff output against expected.md
#   - run a test harness
#   - call an LLM judge with a fixed prompt and temperature 0
#   - regex check on produced artifacts

set -euo pipefail

# Fail loudly until the user replaces this. A silent "0.0" would pollute
# results.tsv with a fake baseline.
echo "UNIMPLEMENTED: replace this script with real grading logic" >&2
exit 2
```

Mark the script executable. Remind the user this is a TEMPLATE -- the first real run will fail loudly (exit 2) until the placeholder is replaced with actual grading. That loud failure is intentional; a silent `0.0` would produce a fake baseline.

### 4b. Held-out task (`tasks/holdout/task-h01/`)

The held-out partition is the independent verdict set. The runner does NOT score it during normal experiments; ratchet decisions are made on `tasks/` only. The held-out set is scored before any Candidate graduates from `observations.md` -- without it, the loop optimizes the same set it verdicts on, which is the textbook Goodhart setup that produces evaluator gaming over many iterations.

Walk the user through authoring at least one held-out task with the same structure as 4a. Create `LOOP/{MODE}/tasks/holdout/task-h01/` with `instruction.md`, `expected.md`, and `score.sh` (same template as above; user fills with grading logic).

Explain to the user: "This task should test the same general capability as your normal tasks, but with different specific content the meta-agent will not see during the loop. If `task-01` tests sanitizing a markdown article, `task-h01` should test sanitizing a different markdown article -- same skill, different instance. The held-out set is your defense against the loop tuning to the optimization tasks specifically rather than the underlying capability."

**Sizing guidance (v2):** start with at least one held-out task (minimum viable). For reliable graduation gating, hold out at least 20% of your task content with a floor of 3 tasks. As the experiment count grows, expand the holdout further -- optimization pressure scales with experiments, so fixed-size holdouts become under-powered. Rough guide: for loops exceeding 100 experiments, aim for 30-40% of total task content in `tasks/holdout/`. The user can add more held-out tasks at any time without re-scaffolding; after adding, re-baseline `.holdout-task-hashes` only (the normal `.task-hashes` baseline is unaffected).

### 4c. Deferred-task-authoring branch

If the user wants the scaffold completed in this session but is not ready to author task content (still thinking through the domain, evaluator design, or test cases), accept the deferral. Write `instruction.md` and `expected.md` for both `task-01` and `task-h01` as TODO stubs with clear inline markers ("TODO: replace with actual task content per Step 4 of LOOP_CREATION.md"). Leave both `score.sh` files as the loud-fail template. Flag the deferral explicitly in Step 9 deliverable: "task-01 and/or task-h01 content deferred -- the loop cannot dry-run (Step 6) or graduate Candidates (HANDOFF-LOOP.md Step 2b held-out check) until the TODO stubs are replaced."

Deferred authoring is a real-use accommodation -- task design takes thinking time. Do not refuse to scaffold; do clearly mark what remains incomplete.

## Step 5 -- Wire the runners and supporting files

Generate these artifacts:

- `LOOP/{MODE}/run.sh` -- normal experiment runner. Iterates `tasks/` excluding `tasks/holdout/`, aggregates over `{REPETITION_COUNT}` repetitions per task, classifies per-task status, writes one row to `results.tsv` (unless subset glob), enforces the plateau cooldown, and emits drift signals to stderr.
- `LOOP/{MODE}/run-holdout.sh` -- held-out verdict runner. Iterates `tasks/holdout/` only. Writes its latest metric value to `.holdout-last` for HANDOFF-LOOP Step 2b to read. Does NOT append to `results.tsv`.
- `LOOP/{MODE}/status.sh` -- one-shot loop state dashboard. Read-only; safe to run anytime.
- `LOOP/{MODE}/.task-hashes` -- SHA-256 baseline for `tasks/*/` excluding `tasks/holdout/`.
- `LOOP/{MODE}/.holdout-task-hashes` -- SHA-256 baseline for `tasks/holdout/*/`.
- `LOOP/{MODE}/.program-checksum` -- SHA-256 of `program.md`. Drift indicator (soft-warn only).

Use `{RUNNER_COMMAND}` from Step 1 Q8 as the core command. Before writing, replace every `<<<PLACEHOLDER>>>`:
- `<<<MODE>>>` -> `{MODE}`
- `<<<MUTABLE_FILE>>>` -> `{MUTABLE_FILE}`
- `<<<TIME_BUDGET_MINUTES>>>` -> the minute value
- `<<<METRIC_CAPTURE>>>` -> the capture description from Q9
- `<<<PLATEAU_N>>>` -> the integer from Q10
- `<<<REPETITION_COUNT>>>` -> the integer from Q11

`{RUNNER_COMMAND}` is NOT substituted; it stays as a literal TODO comment inside the script for the user to fill in.

### `run.sh`

```bash
#!/usr/bin/env bash
# run.sh -- executes one batch of <<<MODE>>> experiments
# Usage: ./run.sh "<description of change>" [task-glob]
#   task-glob is optional. If given and != "*", subset mode: run only matching
#   tasks, print metric to stdout, do NOT append to results.tsv, skip plateau check.
#   If omitted or "*", full-suite mode: all tasks under tasks/ (excluding holdout/).
#
# Linux-only in v2. If you later run on macOS or BSD, add a sha256sum shim.

set -euo pipefail

DESC="${1:-(no description)}"
FILTER="${2:-*}"
SUBSET_MODE="no"
if [ "$FILTER" != "*" ]; then SUBSET_MODE="yes"; fi

MODE_DIR="$(cd "$(dirname "${BASH_SOURCE[0]}")" && pwd)"
cd "$MODE_DIR"

# ---- Tampering guard (both hash files) ----
# Normal tasks and held-out tasks have separate baselines so adding held-out
# tasks does not trip a false-positive tampering alarm.
if [ ! -f .task-hashes ] || [ ! -f .holdout-task-hashes ]; then
  echo "EVALUATOR_TAMPERED: hash baselines missing (.task-hashes or .holdout-task-hashes). Cannot verify evaluator integrity. Refusing to run." >&2
  exit 3
fi

CURRENT_TASK_HASHES=$(find tasks -mindepth 2 -maxdepth 3 -type f \
  \( -name 'instruction.md' -o -name 'expected.md' -o -name 'score.sh' \) \
  -not -path 'tasks/holdout/*' \
  -exec sha256sum {} + | sort)
BASELINE_TASK_HASHES=$(sort .task-hashes)
if [ "$CURRENT_TASK_HASHES" != "$BASELINE_TASK_HASHES" ]; then
  echo "EVALUATOR_TAMPERED: tasks/ content does not match .task-hashes baseline." >&2
  echo "Legitimate evaluator change requires human approval AND re-baselining .task-hashes." >&2
  exit 3
fi

CURRENT_HOLDOUT_HASHES=$(find tasks/holdout -type f \
  \( -name 'instruction.md' -o -name 'expected.md' -o -name 'score.sh' \) \
  -exec sha256sum {} + | sort)
BASELINE_HOLDOUT_HASHES=$(sort .holdout-task-hashes)
if [ "$CURRENT_HOLDOUT_HASHES" != "$BASELINE_HOLDOUT_HASHES" ]; then
  echo "EVALUATOR_TAMPERED: tasks/holdout/ content does not match .holdout-task-hashes baseline." >&2
  echo "Adding holdout tasks is legitimate -- re-baseline .holdout-task-hashes (not .task-hashes) via:" >&2
  echo "  find tasks/holdout -type f \\( -name 'instruction.md' -o -name 'expected.md' -o -name 'score.sh' \\) -exec sha256sum {} + | sort > .holdout-task-hashes" >&2
  exit 3
fi

# ---- program.md drift check (soft-warn) ----
if [ -f program.md ]; then
  CURRENT_PROGRAM_SHA=$(sha256sum program.md | awk '{print $1}')
  if [ -f .program-checksum ]; then
    EXPECTED_PROGRAM_SHA=$(cat .program-checksum)
    if [ "$CURRENT_PROGRAM_SHA" != "$EXPECTED_PROGRAM_SHA" ]; then
      echo "PROGRAM_CHANGED: program.md differs from last run.sh invocation; re-read before proceeding." >&2
      echo "$CURRENT_PROGRAM_SHA" > .program-checksum
    fi
  else
    # First run; create baseline.
    echo "$CURRENT_PROGRAM_SHA" > .program-checksum
  fi
fi

# ---- contract.yml read (metric, thresholds, range) ----
# contract.yml is intentionally flat; a yq dependency is avoided.
# Simple grep/awk extraction is sufficient.
CV_THRESHOLD=$(awk -F': *' '/^cv_threshold:/ {print $2; exit}' contract.yml 2>/dev/null || echo "0.10")
RANGE_MIN=""
RANGE_MAX=""
RANGE_LINE=$(awk -F': *' '/^range:/ {print $2; exit}' contract.yml 2>/dev/null || echo "null")
if [ "$RANGE_LINE" != "null" ] && [ -n "$RANGE_LINE" ]; then
  # Parse `[min, max]` format.
  RANGE_MIN=$(echo "$RANGE_LINE" | sed 's/[][]//g' | awk -F', *' '{print $1}')
  RANGE_MAX=$(echo "$RANGE_LINE" | sed 's/[][]//g' | awk -F', *' '{print $2}')
fi

# ---- Experiment run ----
START=$(date +%s)
TIMEOUT_SEC=$(( <<<TIME_BUDGET_MINUTES>>> * 60 ))

REPETITION_COUNT=<<<REPETITION_COUNT>>>

declare -a TASK_MEDIANS
declare -a TASK_STATUSES
TASK_COUNT=0
CRASH_COUNT=0
CRASH_REASONS=""

for TASK_DIR in tasks/$FILTER/; do
  [ -d "$TASK_DIR" ] || continue
  case "$TASK_DIR" in
    tasks/holdout/*|tasks/holdout/) continue ;;
  esac

  TASK_COUNT=$((TASK_COUNT+1))
  TASK_STATUS="keep"

  # Run score.sh REPETITION_COUNT times and collect numeric outputs
  declare -a REPS
  REPS=()
  REP_CRASHED=0
  for ((r=1; r<=REPETITION_COUNT; r++)); do
    # TODO: replace the next line with the real <<<RUNNER_COMMAND>>> if your
    # scorer needs to be invoked differently from score.sh directly.
    # Example: `python judge.py "$TASK_DIR" --harness <<<MUTABLE_FILE>>>`
    RAW=$("$TASK_DIR/score.sh" 2>&1) || { REP_CRASHED=1; break; }
    VAL=$(echo "$RAW" | tail -n 1)
    if ! [[ "$VAL" =~ ^-?[0-9]+(\.[0-9]+)?$ ]]; then
      REP_CRASHED=1
      CRASH_REASONS="${CRASH_REASONS} non-numeric on $TASK_DIR;"
      break
    fi
    REPS+=("$VAL")
  done

  if [ "$REP_CRASHED" = "1" ]; then
    # Retry once before calling crash-infra for this task
    RETRY_RAW=$("$TASK_DIR/score.sh" 2>&1) || true
    RETRY_VAL=$(echo "$RETRY_RAW" | tail -n 1)
    if [[ "$RETRY_VAL" =~ ^-?[0-9]+(\.[0-9]+)?$ ]]; then
      TASK_MEDIANS+=("$RETRY_VAL")
      TASK_STATUSES+=("keep")
      continue
    fi
    CRASH_COUNT=$((CRASH_COUNT+1))
    TASK_STATUSES+=("crash-infra")
    CRASH_REASONS="${CRASH_REASONS} score.sh failed twice on $TASK_DIR;"
    continue
  fi

  # Compute median of REPS
  MEDIAN=$(printf '%s\n' "${REPS[@]}" | sort -n | awk '
    { a[NR]=$1 }
    END {
      if (NR == 0) { print "0.0"; exit }
      if (NR % 2 == 1) print a[(NR+1)/2]
      else printf "%.6f", (a[NR/2] + a[NR/2+1]) / 2
    }
  ')

  # Relative dispersion by median (RDM). Robust-statistics alternative to CV.
  # cv_threshold from contract.yml is the trigger.
  if [ "$REPETITION_COUNT" -gt 1 ]; then
    RDM_EXCEEDED=$(printf '%s\n' "${REPS[@]}" | awk -v med="$MEDIAN" -v thr="$CV_THRESHOLD" '
      { sum+=$1; vals[NR]=$1; n++ }
      END {
        if (med == 0 || n < 2) { print 0; exit }
        mean = sum/n
        ssq = 0
        for (i=1; i<=n; i++) ssq += (vals[i]-mean)^2
        rdm = sqrt(ssq/(n-1)) / (med < 0 ? -med : med)
        print (rdm > thr) ? 1 : 0
      }
    ')
    if [ "$RDM_EXCEEDED" = "1" ]; then
      echo "WARN: high relative dispersion by median on $TASK_DIR (RDM > threshold $CV_THRESHOLD from contract.yml)" >&2
      CRASH_COUNT=$((CRASH_COUNT+1))
      TASK_STATUSES+=("crash-infra")
      CRASH_REASONS="${CRASH_REASONS} high RDM on $TASK_DIR;"
      continue
    fi
  fi

  TASK_MEDIANS+=("$MEDIAN")
  TASK_STATUSES+=("keep")

  NOW=$(date +%s)
  if [ $((NOW - START)) -gt "$TIMEOUT_SEC" ]; then
    echo "Budget exceeded after $TASK_COUNT tasks." >&2
    break
  fi
done

# ---- Aggregate across tasks with crash-threshold policy ----
# Whole-run status = crash-infra ONLY if crash_count > 50% of tasks.
# Otherwise, score the surviving tasks and note partial in description if any crashed.
STATUS="keep"
if [ "$TASK_COUNT" -gt 0 ]; then
  CRASH_MAJORITY=$(awk -v c="$CRASH_COUNT" -v t="$TASK_COUNT" 'BEGIN { print (c * 2 > t) ? 1 : 0 }')
  if [ "$CRASH_MAJORITY" = "1" ]; then
    STATUS="crash-infra"
  fi
else
  STATUS="crash-infra"
  CRASH_REASONS="${CRASH_REASONS} no tasks found;"
fi

if [ ${#TASK_MEDIANS[@]} -gt 0 ] && [ "$STATUS" != "crash-infra" ]; then
  METRIC=$(printf '%s\n' "${TASK_MEDIANS[@]}" | awk 'BEGIN{s=0;n=0} {s+=$1;n++} END{printf "%.6f", s/n}')
else
  METRIC="0.0"
  STATUS="crash-infra"
fi

# ---- Range check (soft-warn only) ----
if [ -n "$RANGE_MIN" ] && [ -n "$RANGE_MAX" ] && [ "$STATUS" != "crash-infra" ]; then
  OUT_OF_RANGE=$(awk -v m="$METRIC" -v lo="$RANGE_MIN" -v hi="$RANGE_MAX" \
    'BEGIN { print (m < lo || m > hi) ? 1 : 0 }')
  if [ "$OUT_OF_RANGE" = "1" ]; then
    echo "METRIC_OUT_OF_RANGE: $METRIC outside [$RANGE_MIN, $RANGE_MAX] (soft warn; row still logged)" >&2
  fi
fi

# ---- Subset mode: print and exit, do NOT touch results.tsv ----
if [ "$SUBSET_MODE" = "yes" ]; then
  echo "=== subset run: $METRIC ($STATUS) across $TASK_COUNT tasks (filter: $FILTER) ==="
  echo "SUBSET: results.tsv not modified, plateau check skipped."
  exit 0
fi

# ---- Log to results.tsv (full-suite only) ----
SHA=$(git rev-parse --short HEAD)
SECONDARY="$TASK_COUNT"
LOG_DESC="$DESC"
if [ "$CRASH_COUNT" -gt 0 ] && [ "$STATUS" = "keep" ]; then
  LOG_DESC="$DESC (partial: $CRASH_COUNT/$TASK_COUNT crashed;${CRASH_REASONS})"
elif [ -n "$CRASH_REASONS" ]; then
  LOG_DESC="$DESC (${CRASH_REASONS})"
fi
printf "%s\t%s\t%s\t%s\t%s\n" "$SHA" "$METRIC" "$SECONDARY" "$STATUS" "$LOG_DESC" >> results.tsv

# ---- Plateau detection with cooldown ----
# Plateau fires when last PLATEAU_N data rows are all `discard`.
# `crash-infra` does NOT count (infrastructure failure, not hypothesis signal).
# Cooldown: after a research artifact is written, re-firing requires PLATEAU_N new
# rows since the research commit. If the research SHA is no longer in results.tsv
# (e.g., rows were reset away), fall back to counting all data rows.
PLATEAU_N=<<<PLATEAU_N>>>
DATA_ROWS=$(tail -n +2 results.tsv | wc -l | tr -d ' ')

ROWS_SINCE_RESEARCH="$DATA_ROWS"
if [ -f .last-research-commit ]; then
  LAST_RES_SHA=$(cat .last-research-commit)
  # Count rows appearing AFTER the research SHA
  COUNT_AFTER=$(tail -n +2 results.tsv | awk -F'\t' -v sha="$LAST_RES_SHA" '
    BEGIN { found=0; c=0 }
    found==1 { c++ }
    # Match either full SHA or short SHA (first column varies)
    ($1 == sha) || (length(sha) >= 7 && index(sha, $1) == 1) || (index($1, sha) == 1) { found=1 }
    END { print c; exit (found == 0) ? 99 : 0 }
  ') || true
  FOUND=$?
  if [ "$FOUND" = "99" ] || [ -z "$COUNT_AFTER" ]; then
    echo "COOLDOWN_RESET: research commit ($LAST_RES_SHA) not found in results.tsv; treating as no active cooldown." >&2
    ROWS_SINCE_RESEARCH="$DATA_ROWS"
  else
    ROWS_SINCE_RESEARCH="$COUNT_AFTER"
  fi
fi

if [ "$ROWS_SINCE_RESEARCH" -ge "$PLATEAU_N" ] && [ "$DATA_ROWS" -ge "$PLATEAU_N" ]; then
  NONKEEP=$(tail -n +2 results.tsv | tail -n "$PLATEAU_N" \
    | awk -F'\t' '$4 == "discard" {c++} END{print c+0}')
  if [ "$NONKEEP" -ge "$PLATEAU_N" ]; then
    echo "PLATEAU_DETECTED: last $PLATEAU_N rows all discard. Consult research.md before next experiment." >&2
  fi
fi

echo "=== run complete: $METRIC ($STATUS) across $TASK_COUNT tasks ==="
```

### `run-holdout.sh`

```bash
#!/usr/bin/env bash
# run-holdout.sh -- scores the held-out task partition
# Usage: ./run-holdout.sh
# Writes aggregate metric to .holdout-last and prints to stdout.
# Does NOT append to results.tsv (held-out runs are verdict-only).
#
# Linux-only in v2. See run.sh for shim note if porting to macOS/BSD.
#
# Re-baselining after adding new holdout tasks:
#   find tasks/holdout -type f \( -name 'instruction.md' -o -name 'expected.md' -o -name 'score.sh' \) \
#     -exec sha256sum {} + | sort > .holdout-task-hashes
# This does NOT require re-baselining .task-hashes (normal tasks).

set -euo pipefail

MODE_DIR="$(cd "$(dirname "${BASH_SOURCE[0]}")" && pwd)"
cd "$MODE_DIR"

# Tampering guard (both baselines must pass)
if [ ! -f .task-hashes ] || [ ! -f .holdout-task-hashes ]; then
  echo "EVALUATOR_TAMPERED: hash baselines missing. Refusing to run." >&2
  exit 3
fi

CURRENT_TASK_HASHES=$(find tasks -mindepth 2 -maxdepth 3 -type f \
  \( -name 'instruction.md' -o -name 'expected.md' -o -name 'score.sh' \) \
  -not -path 'tasks/holdout/*' \
  -exec sha256sum {} + | sort)
BASELINE_TASK_HASHES=$(sort .task-hashes)
if [ "$CURRENT_TASK_HASHES" != "$BASELINE_TASK_HASHES" ]; then
  echo "EVALUATOR_TAMPERED: tasks/ content does not match .task-hashes baseline." >&2
  exit 3
fi

CURRENT_HOLDOUT_HASHES=$(find tasks/holdout -type f \
  \( -name 'instruction.md' -o -name 'expected.md' -o -name 'score.sh' \) \
  -exec sha256sum {} + | sort)
BASELINE_HOLDOUT_HASHES=$(sort .holdout-task-hashes)
if [ "$CURRENT_HOLDOUT_HASHES" != "$BASELINE_HOLDOUT_HASHES" ]; then
  echo "EVALUATOR_TAMPERED: tasks/holdout/ content does not match .holdout-task-hashes baseline." >&2
  exit 3
fi

declare -a HOLDOUT_VALS
HOLDOUT_VALS=()
for TASK_DIR in tasks/holdout/*/; do
  [ -d "$TASK_DIR" ] || continue
  RAW=$("$TASK_DIR/score.sh" 2>&1) || { echo "HOLDOUT_CRASH: $TASK_DIR" >&2; exit 4; }
  VAL=$(echo "$RAW" | tail -n 1)
  if ! [[ "$VAL" =~ ^-?[0-9]+(\.[0-9]+)?$ ]]; then
    echo "HOLDOUT_CRASH: non-numeric output from $TASK_DIR: $VAL" >&2
    exit 4
  fi
  HOLDOUT_VALS+=("$VAL")
done

if [ ${#HOLDOUT_VALS[@]} -eq 0 ]; then
  echo "HOLDOUT_EMPTY: no held-out tasks found. Author at least one under tasks/holdout/." >&2
  exit 5
fi

METRIC=$(printf '%s\n' "${HOLDOUT_VALS[@]}" | awk 'BEGIN{s=0;n=0} {s+=$1;n++} END{printf "%.6f", s/n}')
echo "$METRIC" > .holdout-last
echo "HOLDOUT_METRIC: $METRIC across ${#HOLDOUT_VALS[@]} tasks"
```

### `status.sh`

```bash
#!/usr/bin/env bash
# status.sh -- one-shot summary of <<<MODE>>> loop state
# Usage: ./status.sh
# Read-only; safe to run anytime.

set -euo pipefail

MODE_DIR="$(cd "$(dirname "${BASH_SOURCE[0]}")" && pwd)"
cd "$MODE_DIR"

MODE_NAME="$(basename "$MODE_DIR")"
echo "=== LOOP status: $MODE_NAME ==="

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
    SINCE_KEEP=$(tail -n +2 results.tsv | awk -F'\t' -v sha="$LK_SHA" '
      found==1 { c++ }
      $1 == sha { found=1 }
      END { print c+0 }
    ')
    echo "rows since last keep: $SINCE_KEEP"
  else
    echo "last keep: none"
  fi
fi

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

LAST_RESEARCH=$(ls -t research/*.md 2>/dev/null | head -n 1 || true)
if [ -n "$LAST_RESEARCH" ]; then
  RES_DATE=$(basename "$LAST_RESEARCH" | cut -c 1-10)
  echo "last research: $RES_DATE ($(basename "$LAST_RESEARCH"))"
else
  echo "last research: none"
fi

if [ -f observations.md ]; then
  PENDING=$(grep -c '^- \[ \]' observations.md || true)
  AFFIRMED=$(grep -c '^- \[x\]' observations.md || true)
  echo "candidates: $PENDING pending, $AFFIRMED affirmed (awaiting handoff)"
fi

if [ -f .holdout-last ]; then
  echo "holdout last: $(cat .holdout-last)"
else
  echo "holdout last: never scored"
fi

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

### `.task-hashes` and `.holdout-task-hashes`

Generate at scaffold time from the current `tasks/` content:

```bash
# Normal tasks baseline (excludes holdout)
find tasks -mindepth 2 -maxdepth 3 -type f \
  \( -name 'instruction.md' -o -name 'expected.md' -o -name 'score.sh' \) \
  -not -path 'tasks/holdout/*' \
  -exec sha256sum {} + | sort > .task-hashes

# Held-out baseline (only holdout)
find tasks/holdout -type f \
  \( -name 'instruction.md' -o -name 'expected.md' -o -name 'score.sh' \) \
  -exec sha256sum {} + | sort > .holdout-task-hashes
```

Re-baseline `.task-hashes` only when the human explicitly authorizes an evaluator change to normal tasks. Re-baseline `.holdout-task-hashes` freely when adding new held-out tasks (legitimate growth).

### `.program-checksum`

Generate at scaffold time with:

```bash
sha256sum program.md | awk '{print $1}' > .program-checksum
```

The runner updates this file on mismatch and emits `PROGRAM_CHANGED:` to stderr so the meta-agent is nudged to re-read `program.md` when it has been edited between runs.

### After generating the scripts

Mark `run.sh`, `run-holdout.sh`, and `status.sh` executable (`chmod +x`).

Tell the user explicitly: these are TEMPLATES. Before the first real run they must:
- Replace the `TODO` line in `run.sh` with the actual `{RUNNER_COMMAND}` substitution if `score.sh` alone is not sufficient.
- Verify the metric extraction matches `{METRIC_CAPTURE}`.
- Adjust the cross-task aggregation (mean of medians) in `run.sh` if mean is not the right rollup for their metric (e.g., change to sum for per-run-counts).
- Fill the `score.sh` for both `tasks/task-01/` and `tasks/holdout/task-h01/` with real grading logic (templates currently exit 2).

The tampering guards, plateau detection, cooldown mechanism, RDM dispersion check, contract.yml reader, and status-write-contract compatibility are all pre-wired in v2.

## Step 6 -- Dry run

Before leaving the user alone with the loop, verify the whole chain works.

1. Confirm the user has filled in `score.sh` for `tasks/task-01/` AND `tasks/holdout/task-h01/` with real grading logic (not the placeholder `exit 2` template).
2. Confirm the user has replaced the `TODO` in `run.sh` with the actual runner command (if `score.sh` alone is not sufficient).
3. Generate both hash baselines and the program checksum per Step 5 recipes.
4. Execute `./run.sh "baseline"` from `LOOP/{MODE}/`.
5. Verify that:
   - `results.tsv` now has exactly one data row with the baseline commit SHA, status `keep`.
   - The metric value is numeric (not a NaN, not empty).
   - No `EVALUATOR_TAMPERED:` line on stderr (would indicate a hash file was generated against different content than what the run scored).
   - `PLATEAU_DETECTED:` must NOT fire on the baseline run -- the detector requires `{PLATEAU_N}` data rows before it can trigger, so a single baseline row is below threshold.
   - `PROGRAM_CHANGED:` should NOT fire (first run writes the checksum without warning).
   - No `METRIC_OUT_OF_RANGE:` unless you set an intentionally narrow range for testing.
6. Execute `./run-holdout.sh` from `LOOP/{MODE}/`.
7. Verify that:
   - `.holdout-last` exists and contains a numeric value.
   - `HOLDOUT_METRIC:` line printed to stdout.
   - No `HOLDOUT_CRASH:` or `HOLDOUT_EMPTY:` lines on stderr.
   - `results.tsv` was NOT modified (held-out runs are verdict-only).
8. Execute `./status.sh` from `LOOP/{MODE}/`.
9. Verify that the output shows the baseline row, the held-out last metric, no plateau, no pending candidates, and `program.md: unchanged`.
10. Test subset mode: `./run.sh "subset-test" "task-01"` -- confirm metric prints to stdout, `SUBSET: results.tsv not modified, plateau check skipped.` appears, and `results.tsv` still has exactly one data row.
11. If any dry run step fails, diagnose with the user. Common failures:
   - `score.sh` not executable (`chmod +x`)
   - `run.sh` has an unreplaced TODO
   - Metric extraction pulled a non-numeric string
   - `tasks/holdout/` is empty (Step 4b authored TODO stubs but user has not filled them)
   - Hash files not generated, or generated against pre-fill stub content
   - Plateau detection block has `<<<PLATEAU_N>>>` unsubstituted (shell will fail to parse)
   - contract.yml has unsubstituted `<<<METRIC_GAMING_YAML_LIST>>>` (awk will still parse but the YAML is malformed; re-generate from Step 1 answers)
12. Only proceed to Step 7 once all dry runs produce clean output.

If the user is not ready to do the dry run in this session, record that fact in the deliverable at Step 9 and skip to Step 7. The loop is NOT verified until all dry runs pass.

## Step 7 -- Initial commit

Stage the new `LOOP/{MODE}/` directory and commit with message `LOOP: scaffold {MODE} mode`. If a clean dry run baseline row was written in Step 6, include it in this commit. This commit becomes the baseline for the ratchet.

## Step 8 -- Verification

Pass only if:
- `{PROJECT_ROOT}/LOOP/{MODE}/` exists with: `program.md`, `research.md`, `contract.yml`, `{MUTABLE_FILE}`, `results.tsv`, `observations.md`, `run.sh`, `run-holdout.sh`, `status.sh`, `.task-hashes`, `.holdout-task-hashes`, `.program-checksum`, `tasks/task-01/`, `tasks/holdout/task-h01/`, `jobs/`, `research/`.
- `program.md` contains no unfilled `<<<...>>>` placeholder markers. In particular: `<<<PLATEAU_N>>>` in the Plateau response section; `<<<REPETITION_COUNT>>>` in the Metric section; `<<<COMPLEXITY_PROXY>>>` / `<<<COMPLEXITY_GROWTH_THRESHOLD_PCT>>>` / `<<<IMPROVEMENT_REQUIRED_PCT>>>` in the Constraints section; `<<<METRIC_STABILITY>>>` and `<<<METRIC_GAMING>>>` in the Metric section; `<<<EXTRA_READS>>>` rendered as sub-bullets or `none`.
- `program.md` Goal section contains actual content, not the literal `[ONE TO THREE SENTENCES...]` square-bracket placeholder.
- `research.md` contains no unfilled `<<<...>>>` placeholder markers.
- `contract.yml` contains no unfilled `<<<...>>>` markers; `metric`, `direction`, `stability`, `repetitions`, `cv_threshold` are populated; `range` is either `[min, max]` or `null`.
- `{MUTABLE_FILE}` exists. If it has any non-mutable portion, both boundary markers are present (`MUTABLE REGION` and `FIXED REGION`). If the whole file is mutable, no markers required.
- `tasks/task-01/` contains `instruction.md`, `expected.md`, and an executable `score.sh`.
- `tasks/holdout/task-h01/` contains `instruction.md`, `expected.md`, and an executable `score.sh`. (If Step 4c deferral was accepted, the files exist as TODO stubs and the deferral is flagged in Step 9; verification still passes the file-existence check but the loop cannot dry-run until they are filled.)
- `research/` exists as an empty directory.
- `run.sh`, `run-holdout.sh`, `status.sh` exist, are executable, and contain no unfilled `<<<...>>>` markers. `<<<PLATEAU_N>>>` and `<<<REPETITION_COUNT>>>` must be substituted in `run.sh`; `<<<PLATEAU_N>>>` substituted in `status.sh`; `<<<TIME_BUDGET_MINUTES>>>` substituted in `run.sh`; `<<<MODE>>>` substituted in all three.
- `.task-hashes` and `.holdout-task-hashes` exist and contain valid SHA-256 hash lines.
- `.program-checksum` exists and is a single SHA-256 hex string.
- `results.tsv` has its header row. If Step 6 dry run completed, one baseline data row is present with status `keep`.
- `observations.md` has its schema header (Version: 2) and three empty sections.
- The scaffold commit exists in git history.
- The status enum in all documentation comments matches the v2 spec: `keep` / `discard` / `crash-infra` only. No `keep-combo`, `discard-combo`, `crash-hypothesis` references remain.

If any of the above fail, report which items are incomplete and what the user needs to do to finish.

## Step 9 -- Deliver output

Return:
- Tree listing of what was created under `LOOP/{MODE}/`.
- Path to `program.md` and reminder that the `Goal` section still needs the user's one-paragraph fill-in.
- Path to `contract.yml` and reminder to review it; the user can edit metric bounds, repetition count, or gaming scenarios without re-running this prompt.
- Path to `research.md` and note that the default `Research questions` section is generalist; the user can edit now or tune later once the first plateau surfaces what is actually needed.
- Paths to `tasks/task-01/score.sh` AND `tasks/holdout/task-h01/score.sh` and reminder that BOTH must be filled with real grading logic before the first real run. If Step 4c deferral was used, also flag that `instruction.md` / `expected.md` for the deferred task(s) are TODO stubs.
- Path to `run.sh` and reminder that the `TODO` line with `{RUNNER_COMMAND}` must be filled in (if `score.sh` alone is not sufficient and not already done in Step 6).
- Path to `run-holdout.sh` and one-line note that `HANDOFF-LOOP.md` Step 2b invokes it before any Candidate graduates; the human does not normally run it manually.
- Path to `status.sh` and one-line note: run anytime for a read-only state snapshot.
- Paths to `.task-hashes`, `.holdout-task-hashes`, `.program-checksum`. Note: these are integrity baselines; do not edit by hand. `.task-hashes` re-baselines only with explicit human approval; `.holdout-task-hashes` re-baselines freely when adding holdout tasks; `.program-checksum` auto-updates in `run.sh` when `program.md` changes.
- Status of the dry runs: `./run.sh "baseline"`, `./run-holdout.sh`, `./status.sh`, and subset-mode test all passed cleanly, or one/more not attempted yet and what the user needs to do to attempt them.
- One-line note on plateau+research flow: `run.sh` emits `PLATEAU_DETECTED:` after `{PLATEAU_N}` consecutive `discard` rows (excluding `crash-infra`); meta-agent consults `research.md`, writes artifact to `research/`, records SHA in `.last-research-commit`, resumes. Cooldown suppresses re-fire until `{PLATEAU_N}` new rows; if research SHA is lost to a reset, `COOLDOWN_RESET:` fires and the runner falls back safely.
- One-line note on the held-out partition: `tasks/holdout/` is never scored during normal experiments; it is the independent verdict run before any Candidate graduates. `HANDOFF-LOOP.md` Step 2b runs `./run-holdout.sh` automatically and blocks graduation if the held-out metric did not improve in the same direction as the primary metric.
- Next concrete action: fill remaining TODOs (both `score.sh` files, optional `run.sh` runner command), run `./run.sh "baseline"` from `LOOP/{MODE}/`, then `./run-holdout.sh` to record an initial held-out baseline, then add more tasks under `tasks/` and `tasks/holdout/` and begin mutating `{MUTABLE_FILE}`.

## How to run a loop once it's created

Once `LOOP/{MODE}/` is scaffolded and verified:

1. Point a coding agent at `LOOP/{MODE}/program.md` as its directive. For Claude Code: open the project and reference `@LOOP/{MODE}/program.md` in your first message, instructing it to begin the loop. For Codex or similar: feed `program.md` as the system directive and tell it to run the setup then enter the experiment loop.

2. The meta-agent reads `program.md` and `contract.yml`, follows the Setup section, then runs `./run.sh "<description>"` per experiment. It commits or resets per the Experiment Loop status-write contract.

3. The human's only in-loop action is stopping the meta-agent when ready. Between sessions, the human runs `./status.sh` to check state, reviews `observations.md` Candidates (ticks `- [x]` to affirm, deletes to reject), runs `HANDOFF-LOOP.md` to finalize, and graduation happens there.

This prompt does not invoke the meta-agent itself. Scaffolding and running are separate concerns.

## Interaction With Other Prompts

This prompt:
- Does not modify `CONTEXT/*`. Memory changes happen through `PROJECT_MEMORY_BOOTSTRAP.md` (structure) or `HANDOFF-LOOP.md` Step 2b (graduation from `observations.md` to `CONTEXT/*`).
- Does not touch root adapters (`CLAUDE.md`, `.cursor/rules/`). Those are maintained by `PROJECT_MEMORY_BOOTSTRAP.md`.
- Assumes `PROJECT_MEMORY_BOOTSTRAP.md` has already run. If not, fail loudly.

Running this prompt multiple times in one project is expected and supported -- each run scaffolds a new `{MODE}` subfolder. Repair runs on an existing `{MODE}` are handled in Step 2.

## Model Self-Check

Before delivering output, confirm:
1. Did the Pre-Scaffold Gate pass (primary metric is a single, stable scalar with direction and a valid use case)?
2. Are `{PLATEAU_N}`, `{REPETITION_COUNT}`, and all other `<<<PLACEHOLDER>>>` values substituted in `program.md`, `research.md`, `contract.yml`, `run.sh`, `run-holdout.sh`, and `status.sh`?
3. Did I generate both `.task-hashes` (tasks only) and `.holdout-task-hashes` (holdout only), plus `.program-checksum`?
4. Does `contract.yml` exist, does `run.sh` read `cv_threshold` and `range` from it, and is the range check wired as a soft-warn only?
5. Did I flag any deferred task authoring explicitly in the Step 9 deliverable?
6. Does the scaffolded `program.md` use the v2 3-value status enum (keep, discard, crash-infra) with the explicit status-write contract, and not the retired v1 values?
