# punct-cleaner research directive

Read this file when the runner emits `PLATEAU_DETECTED:` to stderr, or when the human explicitly invokes research. Do not run research proactively otherwise -- the plateau signal is the trigger.

## Purpose

The experiment ratchet optimizes inside whatever hypothesis space the meta-agent can generate from current context. A plateau means that space is exhausted or mis-framed. Research widens the space by pulling in external material: literature, adjacent projects, competing implementations, theoretical bounds.

The output is NOT a code change. The output is a research artifact that informs the next batch of experiments.

## Inputs to gather before searching

Read these in this order. Take notes but do not write the artifact yet.

1. Last 10 rows of `results.tsv`. Note the dominant failure mode -- what class of change keeps getting discarded.
2. Current `sanitize-rules.json`. Note what has survived so far (what is still in the file after many `keep` and `discard` cycles).
3. `program.md` Goal and Metric sections. Restate them in one sentence each -- this keeps the research grounded in what actually matters.
4. Last 5 entries in `observations.md` `Findings`. Note any pattern the meta-agent already flagged but has not been able to act on.
5. The 2 most recent files in `research/` if any exist. Their purpose is to prevent duplicate lines of inquiry. Read their `Questions pursued` and `Leads not yet tested` sections; treat those as already-covered ground unless a new angle suggests revisiting.

## Research questions (default set -- user edits after scaffold)

Pursue these in roughly this order. Stop early if a strong lead emerges; do not mechanically answer all six if the first two surface a clear next experiment.

1. What is the known state of the art or theoretical upper bound for `sanitize_pass_rate` in this domain? If we are far from it, the gap is the opportunity. If we are near it, the opportunity is elsewhere.
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
Plateau after <N> consecutive non-keep experiments, or manual invocation.
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

1. Append a compact summary (3 lines max) to `observations.md` `Findings`. Format: `YYYY-MM-DD research pass: <one-sentence topline>. See research/<filename>.`
2. For each lead in `Leads to test` that would make a durable `LESSONS.md` or `DECISIONS.md` entry if it proves out, append a `- [ ]` Candidate to `observations.md` with `Evidence: research/<filename>` and a short rationale. These are speculative until a subsequent experiment confirms them; the `- [ ]` state reflects that.
3. Resume experiments. Run at least 5 new experiments before the plateau check can fire again.
