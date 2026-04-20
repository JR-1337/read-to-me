# punct-cleaner program

This file is the meta-agent's directive. The human edits this file when redirecting the loop. The meta-agent reads this file at the start of every run and follows it.

## Goal

[ONE TO THREE SENTENCES. What is being optimized. Name the domain concretely. Human fills in after scaffold.]

## Your role

Your job is NOT to make the evaluator pass directly, produce the desired output by hand, or demonstrate the target behavior yourself. Your job is to improve the contents of `sanitize-rules.json` so that, when the evaluator runs, the measured `sanitize_pass_rate` moves in the desired direction (higher is better).

If `sanitize-rules.json` has any non-mutable portion, it is marked by a `FIXED REGION` comment. Do not modify anything below that marker unless the human explicitly asks. If the file has no such marker, the entire file is the optimization surface.

## Metric

Primary: `sanitize_pass_rate`, higher is better.

Record `secondary` as well when a second signal is informative (for example, when the primary is a count, secondary might be a pass rate; when the primary is latency, secondary might be memory). If only one metric is meaningful for this loop, leave the `secondary` column filled with a placeholder value per the schema in this project's `results.tsv`.

## Constraints

- Time budget per experiment: 5 minutes of wall clock, excluding setup and compilation.
- All else being equal, simpler is better. Equal performance with simpler content is a real improvement; keep it.
- Small gains that add ugly complexity should be judged cautiously. Prefer reverting and trying a different angle.
- Do not change the evaluator, the task set, or anything else outside `sanitize-rules.json` unless the human explicitly asks.
- Meta-agent model: Claude Code. You may note in your experiment descriptions when a change depends on this model's specific behavior.

## Anti-overfit self-check

Before keeping any change, ask yourself: "If this exact task set or this exact evaluator disappeared, would this still be a worthwhile change?"

If the answer is no, revert. A keep that does not generalize is worse than a discard, because it pollutes the ratchet with a false improvement that blocks real ones.

## Setup (run once at the start of a new loop session)

1. Create a branch: `git checkout -b loops/punct-cleaner/<tag>` from the repository's default branch (typically `main` or `master` -- use whichever the project uses). The tag is a short descriptor of this session.
2. Read the in-scope files in this order:
   - This file (`program.md`)
   - `sanitize-rules.json`
   - `results.tsv` (last 10 rows)
   - `observations.md` (all three sections)
   - /home/johnrichmond007/context-system/CONTEXT/LESSONS.md (entries tagged [GLOBAL])
   - The project's `CONTEXT/LESSONS.md` ([PROJECT] and [MODULE] entries)
   - The project's `CONTEXT/DECISIONS.md`
   - The project's `CONTEXT/ARCHITECTURE.md` if the loop touches code structure
3. Read additional context specific to this mode if any:
   none
4. Read a representative sample of the eval set under `tasks/` if one exists. Confirm the evaluator runs cleanly before making any change.
5. If `results.tsv` has no data rows, run the baseline first and record the result. The baseline is the ratchet's zero point.
6. Confirm setup looks good and begin.

## Experiment loop

Each experiment:

1. Propose one change. Hold yourself to a single hypothesis per experiment. Mixed changes make the ratchet uninterpretable.
2. Edit `sanitize-rules.json` with the change. Do not touch anything else.
3. Run the evaluator according to this project's run command (defined in the project's README or the task set; not duplicated here).
4. Read the resulting `sanitize_pass_rate` value.
5. Compare to the last `keep` row in `results.tsv`.
6. Keep or revert:
   - If improved (or tied with simpler content): `git commit` the change and append a `keep` row to `results.tsv`.
   - If worse or unchanged with more complexity: `git reset --hard` and append a `discard` row.
   - If the run crashed: `git reset --hard` and append a `crash` row with the failure signature in the description.
7. Repeat.

Spot-check for speed when it helps. Running a subset of tasks for a small edit is often enough to decide keep or discard. Full-suite runs are for edits that look promising on the subset.

## results.tsv schema

Tab-separated, not comma-separated (commas break in descriptions).

```
commit	sanitize_pass_rate	secondary	status	description
```

Status values: `keep`, `discard`, `crash` (exactly these three strings). Crashes record zeros in metric columns, not nulls.

Descriptions are single lines, under 120 characters, telegraphic. State the change and the observed effect, not the reasoning. The reasoning, if durable, goes in `observations.md`.

## observations.md

At the end of each batch of experiments (when you pause for any reason, or when the human interrupts), append to `observations.md`:

- `Findings`: what the batch surfaced. Keep to the last 10 entries.
- `Candidates`: patterns you think warrant graduation to the project's `CONTEXT/LESSONS.md` or `CONTEXT/DECISIONS.md`. Write each as a `- [ ]` checkbox entry per the schema header in `observations.md`. The human ticks `- [x]` to approve or deletes the entry to reject. Never write `- [x]` yourself; the unchecked state is the only state you emit.
- `Open Questions`: anything you were uncertain about that would benefit from human input before continuing.

Do not write to `CONTEXT/*` directly. Ever. That graduation path is human-only via the handoff flow.

## Plateau response

The runner emits `PLATEAU_DETECTED:` to stderr when the last 5 data rows of `results.tsv` are all `discard` or `crash`. Interpret this signal as the ratchet saying you are optimizing inside a frame that is no longer productive -- most likely because the hypothesis space you have been exploring is exhausted, the current framing is wrong, or a structural constraint outside the mutable file is bounding the metric.

On plateau, stop the edit-run-check cycle and run a research pass:

1. Read `research.md`. It defines the inputs to gather, the questions to pose, and the output format.
2. Execute the research pass. Use whatever web-search or literature tools are available to you. If none are available, tell the human -- do not simulate research from memory.
3. Write the research artifact to `research/<ISO-date>-<counter>.md` per the format in `research.md`.
4. Append a compact summary to `observations.md` `Findings`. If the research surfaced durable patterns worth graduating, append `- [ ]` entries to `Candidates` with `Evidence:` pointing to the research artifact filename.
5. Resume the experiment loop with hypotheses informed by the research. Run at least 5 new experiments before the plateau check can trigger research again -- otherwise you will thrash between research passes without gathering enough signal to evaluate them.

If the research pass concludes that a different `LOOP/<mode>/` would be more productive than continuing this one, record that as a `- [ ]` Candidate with `Target: DECISIONS.md` and `Scope: [PROJECT]`. Do not abandon the current loop unilaterally; the human ratifies new-mode proposals at the next handoff.

## Budget and stopping

Once the experiment loop has begun, do NOT pause to ask the human if you should continue. The human might be asleep or away from the keyboard and expects you to keep working until manually stopped.

If you run out of ideas:
- Re-read this file and the most recent `research/*.md` artifact for angles you missed
- Combine previous near-misses
- Try more radical changes, not just variations of what has already been tried
- Spot-check unusual combinations
- Examine `discard` rows for patterns -- what class of change consistently fails, and is there a deeper cause?

Running out of ideas is not the same as the plateau signal. Plateau is a mechanical trigger defined by the last 5 rows; running out of ideas is a judgment call. If both are true at once, let the plateau-response section drive -- it is the more structured path.

The loop runs until the human interrupts you. Do not self-terminate.
