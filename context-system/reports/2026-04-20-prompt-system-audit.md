# Audit Report: HANDOFF_PROMPT.md, PROJECT_MEMORY_BOOTSTRAP.md, LOOP_CREATION.md

Date: 2026-04-20
Scope: three prompt files constituting a cross-harness project-memory and
auto-loop ratchet system. Read-only audit.

---

## 1. What these files are

The three files form a single coherent system, not three independent prompts:

- **PROJECT_MEMORY_BOOTSTRAP.md** — structural initializer / upgrader. Creates
  or repairs `CONTEXT/*` (TODO, DECISIONS, ARCHITECTURE, LESSONS, handoffs) and
  two root adapters (`CLAUDE.md`, `.cursor/rules/context-system.mdc`). Defines
  schemas, versioning, telegraphic-ASCII style, confidence scoring, graduation
  rules, and a non-destructive Upgrade Mode with snapshot-verified byte
  preservation. Runs once per project then idempotently on re-run.
- **HANDOFF_PROMPT.md** — session-end routine. Reads canonical memory, syncs
  it, runs a drift/bloat audit, integrates auto-loop state (Step 2b: held-out
  re-verification before graduating Candidates, plateau/tampering consistency
  checks), writes one new handoff file, deletes priors. Glue between sessions
  and harnesses.
- **LOOP_CREATION.md** — opt-in scaffolder for auto-loop ratchet modes under
  `LOOP/<mode>/`. Generates `program.md` (meta-agent directive), `research.md`
  (plateau-triggered inquiry), task dirs with a held-out partition, runner
  scripts (`run.sh`, `run-holdout.sh`), an evaluator-tampering hash baseline,
  and verification/dry-run gating. Codifies Goodhart-resistance into the
  scaffold itself.

They compose: BOOTSTRAP lays structure; HANDOFF maintains continuity and
routes auto-loop output into canonical memory; LOOP_CREATION is the only path
that writes a `LOOP/` tree, and its outputs are consumed (but never modified)
by HANDOFF.

### What problem they actually solve

Three real, unsolved-by-default problems:

1. **Cross-session context loss.** LLM sessions are stateless; summaries lose
   evidence, full dumps drown signal (the "Lost in the Middle" pattern
   documented in the agent-handoff literature).
2. **Cross-harness fragmentation.** Claude Code vs Cursor vs other coding
   agents each have their own adapter formats (`CLAUDE.md`,
   `.cursor/rules/*.mdc`). Teams mirror state twice and adapters drift.
3. **Evaluator gaming under long-running optimization loops.** METR's
   RewardHackingAgents work demonstrates that unrestricted LLM-driven
   optimization agents tamper with evaluators in ~50% of episodes when
   structurally free to do so.

The system's answer: one canonical memory tree (`CONTEXT/*`) both harnesses
read; thin adapters that only route; a hash-verified evaluator-tampering
guard and a held-out partition re-scored at graduation time.

---

## 2. Validity and value

### What is genuinely strong

- **Architectural separation.** `CONTEXT/*` as the only mutable truth, thin
  adapters as routing-only, LOOP as machine-owned territory with graduation
  as the only cross-boundary path. This mirrors and slightly improves on the
  2026 Claude Code three-layer pattern (session / project memory / auto memory)
  by making the project-memory tier harness-agnostic.
- **Schema versioning with byte-preservation in Upgrade Mode.** Version
  numbers on schema headers plus a mandatory `.upgrade-snapshot` and awk-based
  diff filter (Step 13) is better than almost any comparable hand-rolled
  system. The upgrade is reversible at every point.
- **ASCII-only operator mandate in `CONTEXT/*`.** Backed by BPE tokenization
  behavior: UTF-8 math symbols and fancy quotes routinely expand into 2-4
  tokens each vs 1 for their ASCII equivalents, and tiktoken explicitly does
  not guarantee single-token Unicode codepoints. The claim holds.
- **Held-out partition + hash-based tampering guard.** Directly aligned with
  METR's published finding: single-mechanism defenses block one attack vector;
  the combined regime (evaluator locking + held-out scoring) is what actually
  works. `LOOP_CREATION.md` implements exactly that combined regime.
- **Confidence scoring with `H-holdout`.** The distinction between "human said
  yes" (`H`) and "held-out verification passed" (`H-holdout`) is a real
  epistemic refinement, not vocabulary theater.
- **Plateau-triggered research with cooldown via `.last-research-commit`.** A
  disciplined substitute for continuous population diversity (MAP-Elites /
  islands / FunSearch) that explicitly acknowledges the trade-off. The
  acknowledgment is worth more than the mechanism itself — it keeps future
  readers from re-litigating the choice.
- **Plan-time "Decanting check" (HANDOFF Step 2a).** Forces the ephemeral
  working model of the system (assumptions, near-misses, naive-next-move) to
  land somewhere before the session ends. This is the single most
  underappreciated feature; most handoff templates lose exactly this tier.
- **Default-deny on graduation.** The meta-agent only emits `- [ ]`; the
  human's `- [x]` is the promotion trigger. This preserves oversight at
  the one place where cumulative optimization pressure leaks into durable
  memory.

### What is legitimately valuable but friction-heavy

- **Extreme prescriptiveness.** HANDOFF is 269 lines of procedure for what is
  ultimately a "write a resumable note" task. The procedural density is
  justified (it's what prevents drift) but creates a steep adoption curve
  and a real risk that a model executing it in a long context will silently
  drop steps.
- **Multi-step LOOP_CREATION ask-one-at-a-time enforcement.** Good for
  quality; bad for the common case where the user already knows all answers.
  There is no "expert fast-path."

---

## 3. Gaps, failure modes, bugs

Ordered by severity.

### HIGH — real correctness or safety issues

**H1. `LOOP_CREATION.md` `.task-hashes` scope is inconsistent, causing
false-positive tampering alarms.**
The baseline recipe hashes *everything* under `tasks/` including
`tasks/holdout/*/*` (via the single `find tasks -type f ...` command). But
the held-out partition is explicitly designed to be expanded over time — the
prompt says "The user can add more held-out tasks at any time without
re-scaffolding." The moment the user adds `tasks/holdout/task-h02/`, every
subsequent `./run.sh` aborts with `EVALUATOR_TAMPERED:` until they
manually re-baseline. Legitimate held-out expansion is indistinguishable from
tampering.

Fix: either (a) hash normal and held-out partitions to two separate baselines
(`.task-hashes` and `.holdout-task-hashes`), and treat adding holdout tasks
as an auto-append operation, or (b) scope `.task-hashes` to `tasks/*/` (one
level, excluding `tasks/holdout/`) and hash held-out separately.

**H2. `run.sh` global variable `STATUS` is set inside a loop but never
reset per task, so one `crash-infra` contaminates the whole batch.**

~~~
for TASK_DIR in tasks/$FILTER/; do
  ...
  STATUS="crash-infra"  # sticky; never cleared for subsequent tasks
  ...
done
~~~

Once any task flips `STATUS` to `crash-infra`, even a later successful task
cannot rescue the run. Worse, at the aggregation step:

~~~
if [ ${#TASK_MEDIANS[@]} -gt 0 ] && [ "$STATUS" != "crash-infra" ]; then
  METRIC=$(...)
else
  METRIC="0.0"
  if [ "$STATUS" = "keep" ]; then STATUS="crash-infra"; fi
fi
~~~

A batch where 9 of 10 tasks scored fine and one had high variance produces
`METRIC=0.0` and `status=crash-infra`, masking real signal. This is a silent
data-quality bug in the ratchet. Recommendation: per-task status, aggregate
with a policy (e.g., crash-infra only if >X% of tasks crash; otherwise score
the rest and log partial).

**H3. Status column never emits `crash-hypothesis` from `run.sh`.**
`program.md` defines `crash-hypothesis` as "the scored run completed but
produced something invalid per the metric contract (e.g., out-of-range
value, evaluator rejected the output)." But `run.sh` has no out-of-range
or metric-contract check — it only distinguishes "numeric" from "non-numeric"
(`crash-infra`). So `crash-hypothesis` is documented but unreachable by the
runner as written. Either remove the status value or add a contract check
(e.g., `METRIC_MIN`/`METRIC_MAX` fields captured at scaffold time).

**H4. Portability: `sha256sum` and GNU-specific `find -print0 | xargs -0`.**
Neither exists on macOS/BSD by default. `sha256sum` is Linux-only; macOS ships
`shasum -a 256`. `xargs -0` behavior differs on BSD. A user running this on
macOS (realistic given the 2026 dev population) gets `command not found` on
the first `./run.sh`. The Upgrade-Mode Step 7 snapshot block has the same
issue. Fix: define a portable shim at the top of `run.sh` and in the Step 7
block (`sha256sum() { shasum -a 256 "$@"; }` guard; `find -exec ... {} +`
instead of `-print0 | xargs -0`).

**H5. The CV-outlier rule in `run.sh` is miscomputed.**
The awk block:

~~~
cv = sqrt(ssq/(n-1)) / (med < 0 ? -med : med)
~~~

This is standard-deviation-over-median, not the textbook coefficient of
variation (std / mean). The published reliability threshold of CV < 10% is
defined against mean, not median. Either rename the variable (this is a
"relative-dispersion-by-median" metric, which is a valid robust alternative
but not CV) and cite the quantile-based-CV literature, OR compute the real
CV. Current state is a naming-vs-math mismatch that will confuse anyone who
tries to reason about its calibration.

**H6. Plateau cooldown can deadlock if `.last-research-commit` references a
commit no longer in `results.tsv`.**
After a `git reset --hard` that predates the last research run (e.g., a
long chain of discards reverted back past the research commit), the awk
loop:

~~~
found==1 { c++ }
$1 == sha { found=1 }
~~~

never finds the SHA, returns `c=0`, and `ROWS_SINCE_RESEARCH` stays at 0
forever. Plateau detection is effectively permanently disabled. Fix: detect
the missing-SHA case and either reset the cooldown or fall back to
`DATA_ROWS` count.

### MEDIUM — reliability, clarity, or alignment issues

**M1. Adapter examples are absent despite being mandatory outputs.**
`PROJECT_MEMORY_BOOTSTRAP.md` defines the *required shape* of both root
adapters (sections, line limits) but never shows an actual templated example
the way it does for `CONTEXT/*` files. Every model will produce a slightly
different shape. This is the single biggest cross-harness drift vector in
the whole system, and it's self-inflicted.

**M2. `{GLOBAL_ROOT}` is underdefined.**
The prompt says: "the user's context-system directory (the one that owns
this bootstrap). It has its own `CONTEXT/` sibling..." but never answers:
where? `~/.context-system/`? `~/Projects/context-system/`? A user's first
run has to guess. The first-time global setup then tries to `mkdir -p
{GLOBAL_ROOT}/CONTEXT` without the user having ever named `{GLOBAL_ROOT}`.

**M3. The "meta-agent reads `program.md` at the start of every run" promise
is not enforced by `run.sh`.**
`run.sh` is invoked by the meta-agent, not the human. Nothing in `run.sh`
re-asserts that the agent read `program.md` before invoking. On resume-from-
crash, the `program.md` "step 3" prose tells the agent to re-read, but there
is no structural enforcement. A truncated-context resume can silently skip
it. A lightweight check would be a `program.md` hash in a `.program-checksum`
file and a one-line notice in `run.sh` output if it changed since last run.

**M4. Held-out size guidance is weak.**
The scaffold recommends "at least one held-out task to start, 3-5 for
reliability." There's no statistical grounding for the numbers. The
overoptimization literature (Gao et al. 2023; OpenAI's proxy/gold-model
work) points toward holdout size scaling with optimization steps, not a
flat 3-5. For a loop running hundreds of experiments, 3-5 held-out tasks is
under-powered and will produce noisy graduation blocks. Recommend reframing
as "hold out at least 20% of your task content (min 3), and expand the
holdout as the experiment count grows."

**M5. HANDOFF Step 2b graduation path is subtly write-unsafe on concurrent
loops.**
If `LOOP/` has multiple modes and each has `- [x]` candidates, Step 2b
processes them serially but writes to the same `CONTEXT/DECISIONS.md` and
`CONTEXT/LESSONS.md`. There's no mention of ordering or conflict
resolution when two modes ratified conflicting lessons during the same
inter-session window.

**M6. `README.md` / top-level navigation is missing.**
A user who opens the three files cold has no map. Which runs first? What
calls what? The prompts cross-reference each other ("If `{CONTEXT_ROOT}/`
does not exist, stop and instruct the user to run
`PROJECT_MEMORY_BOOTSTRAP.md` first") but there's no single entry-point
document. This costs every new user 20-30 minutes of reading three full
prompts to figure out the DAG.

**M7. ADAPTER "Loop Access Rules" appending logic is string-matched on
`LOOP/` or `## Loop Access Rules`.**
Any CLAUDE.md that mentions `LOOP/` in an unrelated context (a code comment
about a for-loop, etc.) causes the Step 10 append to be skipped. False
negative. Use a structural marker like `<!-- LOOP_ACCESS_RULES_V1 -->`
before the section and detect on that, not a substring.

**M8. `archive/README.md` schema exists but never actually written.**
`PROJECT_MEMORY_BOOTSTRAP.md` File Header Generation section includes an
`archive/README.md` schema header block, but no step creates it. The file
only appears if someone independently implements archival. Either drop the
block or add a step.

**M9. Handoff retention edge case: mid-write crash.**
HANDOFF Step 5 writes new handoff, Step 6 deletes priors. If the process
dies between Step 5 write and Step 6 delete, both coexist (the prompt
acknowledges this can happen). But if Step 5 *itself* crashes mid-write, the
new handoff is partial. The prompt has no "atomic rename" strategy
(`.tmp` + `mv`). The current algorithm can produce a truncated file that
next session treats as authoritative.

**M10. "Bullets under 12 words, sentences under 20 words" is asserted but
unenforced.**
The Bloat Audit step (HANDOFF Step 3) looks for file-level drift (rationale
in TODO, tasks in DECISIONS) but never checks the per-bullet word limit.
Over dozens of sessions, entries inflate. A trivial word-count check in
Step 3 would keep the style rule real.

### LOW — polish, wording, consistency

**L1. LaTeX/Unicode ban wording is inconsistent.**
`PROJECT_MEMORY_BOOTSTRAP.md` says "box-drawing characters, fancy quotes, or
em-dashes." The operator legend and CONTEXT schema headers say the same
thing. But the File Header templates themselves contain em-dashes in
"one to three sentences on why" (ASCII hyphens in the actual templates,
but em-dash wording in prose); HANDOFF section dividers use a single hyphen
while BOOTSTRAP uses em-dash-like hyphens. Pick one, enforce in all three
files.

**L2. "Pass-forward" defined in HANDOFF but not in BOOTSTRAP.**
It's a crisp concept (one-line label of the single most important state to
carry forward) but only introduced at HANDOFF. BOOTSTRAP never mentions it.
A newly-bootstrapped project doesn't know about it until first handoff.
Surface it in BOOTSTRAP's "Cross-Harness Rules" or introduce a "Session
Vocabulary" section.

**L3. `<<<EXTRA_READS>>>` expansion format unclear.**
`program.md` template embeds `<<<EXTRA_READS>>>` inline in a numbered list.
If the user provides "none", the rendered output says `none` which is fine.
If they provide multiple paths, the template doesn't specify whether they
render as a nested bullet list, comma-separated, or on separate lines.
Result: every scaffold renders differently.

**L4. `HANDOFF_PROMPT.md` "Step 2a Decanting check" requires three fields
be answered "even if none" — good — but provides no example of a populated
one.**
Without a concrete example, models produce wildly varying structures.

**L5. `{META_AGENT_MODEL}` never actually changes behavior.**
Captured at Step 1 Q6, rendered into `program.md`, but nowhere is there a
conditional clause like "if {META_AGENT_MODEL} is Claude Code, do X; if
Codex, do Y." It's a vestigial field. Either use it or drop it.

**L6. The "spot-check subset" mechanic in `run.sh` (second arg = task glob)
doesn't actually prevent logging.**
The script still writes to `results.tsv` for subset runs — the "Subset rows
are not appended to `results.tsv`" rule in `program.md` is enforced by the
agent's discipline, not by the runner. Easy fix: if `$2` was passed,
`results.tsv` write is skipped.

---

## 4. Alignment check across the three files

Good alignment:
- Status enum is consistently 6-valued across all three files.
- Held-out graduation gate (HANDOFF 2b) correctly consumes the
  `run-holdout.sh` output contract that LOOP_CREATION defines.
- Schema versioning is a BOOTSTRAP concept but HANDOFF respects it (reads
  SCHEMA headers before writing).
- ASCII operator legend is identical across HANDOFF and BOOTSTRAP.

Misalignments:
- BOOTSTRAP's adapter-bloat threshold is 160 lines; HANDOFF's Step 3 also
  says 160, but the module-adapter threshold is 100 in both — consistent.
- HANDOFF Step 2 says "read its SCHEMA header first. The schema defines the
  file's rules. Follow it when writing." BOOTSTRAP puts the schema inside
  an HTML comment. Models routinely skip HTML comments when "reading for
  rules." This is a real-world alignment bug: the rule exists but the
  format hides it from the reader.
- LOOP_CREATION references "the First-Time Global Setup section of
  `PROJECT_MEMORY_BOOTSTRAP.md`" three times, but BOOTSTRAP's Step 0 routes
  to Fresh Init or Upgrade; there's no direct "just run First-Time Global
  Setup" entrypoint. A user can't ergonomically get there without reading
  all of BOOTSTRAP.

---

## 5. Prompting / verbiage improvements

Concrete edits that would raise model-execution fidelity:

1. **Lead every multi-step prompt with a one-sentence telos.** Example for
   HANDOFF: "This prompt ends a session by syncing memory, auditing drift,
   and writing one self-contained handoff note." Models that hit a context
   limit mid-execution will still keep the goal; step-only prompts lose it.

2. **Replace HTML-comment schemas with fenced-code-block "spec" sections
   named explicitly in the file body.** HTML comments are invisible in
   rendered markdown (good for humans) and routinely skipped by LLMs when
   the file is pasted without comment preservation (bad for the read-for-
   rules step). A fenced `schema` block on top with a one-line
   "READ THIS FIRST" is more reliable.

3. **Add a "cannot proceed unless" precondition block at the top of each
   file.** Currently buried in section 2 or 3. Makes refusal paths
   deterministic.

4. **Introduce an explicit "MODEL SELF-CHECK" section near the end of each
   prompt.** 3-5 yes/no questions the agent answers internally before
   delivering output. Example for HANDOFF: "Did I delete all prior handoff
   files? Did I include a Pass-forward line? Did I avoid touching
   adapters?" This is the cheapest known intervention for procedure
   drift in long prompts.

5. **Shift the one-question-at-a-time enforcement from "do not batch" prose
   to a structural marker.** Models routinely violate the "do not batch"
   rule under user pressure. A tagged section `<<<QUESTION_1_OF_12>>>` that
   the scaffolder can refuse to advance past unless explicitly ack'd is
   harder to bypass.

6. **Replace "do not" lists with "instead do" reframes where possible.**
   E.g., "Do not store rationale in TODO.md" is less sticky than "If you
   catch yourself writing 'because' in TODO.md, stop and move the sentence
   to DECISIONS.md."

7. **Tighten "confidence = H requires a note" into a regex-verifiable
   pattern.** Current prose is "Confidence: H - tests pass 2026-04-16".
   The hyphen vs em-dash issue plus the date format floats. A grammar like
   `Confidence: H(-holdout)? -- <source>, verified YYYY-MM-DD` is enforceable.

8. **LOOP_CREATION Step 1's metric-quality sub-dialogue (3a-3d) is
   excellent but buried.** Surface it as "Pre-scaffold gate" at the top;
   everything else fails if this is wrong.

---

## 6. Structural changes that would be significantly more effective

Ordered by expected leverage.

### S1. Add a thin `SYSTEM.md` or `README.md` that is the single entry point.

One page. Names the three prompts, the order they run, the division of
labor, the files each writes and reads. Right now a new user must read
three ~300-line prompts to derive the DAG. This is the highest-leverage
single change — it doesn't alter any behavior, it removes the onramp.

### S2. Factor the shared style/contract language into a fourth file.

Three files repeat:
- ASCII operator legend (BOOTSTRAP + HANDOFF)
- Confidence scoring H/M/L/H-holdout (BOOTSTRAP + HANDOFF)
- Status enum (LOOP_CREATION + HANDOFF)
- Telegraphic style rules (BOOTSTRAP + HANDOFF)

Extract into `MEMORY_STYLE.md` or `CONTRACT.md`. The three operational
prompts reference it rather than restating. Cuts ~60 lines across the
three and eliminates the risk of the legends drifting apart on future
edits.

### S3. Move executable logic out of markdown prompts and into checked-in scripts.

The `run.sh`, `run-holdout.sh`, and `.task-hashes` generation recipes are
currently 150+ lines of bash *inside* the LOOP_CREATION prompt. Every time
the user scaffolds a new mode, the agent copy-pastes that bash. Bugs
(H1-H6 above) then propagate on every scaffold. Ship the scripts as
versioned templates in a `LOOP/_templates/` directory (or as a pip/npm
package) and have LOOP_CREATION copy them in, not regenerate. Then fix
them once.

### S4. Introduce a loop-level "evaluator contract" artifact.

Currently the metric stability, gaming examples, and capture mechanism
are narrative prose in `program.md`. Make them a structured file,
`contract.yml`:

~~~yaml
metric: sanitize_pass_rate
direction: higher_is_better
stability: bounded_variance
repetitions: 3
cv_threshold: 0.10
range: [0.0, 1.0]     # enables crash-hypothesis detection
gaming_scenarios:
  - "score.sh edited to always echo 1.0"
  - "rules silently convert expected.md before diffing"
~~~

Then `run.sh` reads it, enforces the range check (fixing H3), and the
meta-agent is forced to look at it on every run. Contract-as-data is
more enforceable than contract-as-prose.

### S5. Split HANDOFF into "minimal" and "full" variants.

HANDOFF as written is the "full" case (LOOP exists, audit due, maybe
graduation, decanting check, cross-harness note). The common case
(solo project, no LOOP, mid-feature, routine end-of-day) doesn't need
70% of those steps. A `HANDOFF_PROMPT_LITE.md` (10 steps) for common
sessions; the full version reserved for sessions that touched adapters
or ran loops. Covers the 80/20 without losing the rigorous path.

### S6. Make the Candidate-graduation loop atomic via a single "digest" step.

Currently: meta-agent writes `- [ ]`; human ticks `- [x]`; next HANDOFF
runs 2b which re-reads, re-runs holdout, writes to `CONTEXT/*`, deletes.
The chain is fragile — a crashed 2b can leave observations and
CONTEXT half-synced (M5 above). Rewrite as a transactional digest:
write the intended CONTEXT mutation to a staging file
(`observations.pending.md`), verify, then apply in a single file-write
+ delete. Easier to reason about, easier to recover.

### S7. Promote the Decanting check (Step 2a) into its own file or explicit hook.

It's the most novel idea in the system and the one most likely to be
skipped under time pressure (it's optional-feeling compared to
"sync CONTEXT"). Make it a required output with a named format. Could be
as simple as `handoffs/YYYY-MM-DD-decanting.md` that dies with the
session handoff.

### S8. Consider adopting a lightweight population/diversity mechanism for LOOP.

The prompt deliberately rejects MAP-Elites / islands with a fair
argument (single-dev, single-pointer, plateau-triggered research
substitute). But the research substitute depends heavily on the meta-
agent being willing and able to web-search, which real harnesses gate
or disable. The "from-keep `<older-sha>`" branching hint in
`program.md` "If you run out of ideas" is already a degenerate population
mechanic; formalizing it (keep a list of the N most recent keeps, try
branching off non-head keeps on a schedule) would give a meaningful
exploration boost at almost zero scaffold cost — and doesn't require
web tools at all.

### S9. Add a built-in dashboard / summary generator.

Currently the user has to read `results.tsv`, `observations.md`, and the
latest handoff separately to know what the loop is doing. A 20-line
`status.sh` that prints "N experiments, K keeps (last keep: <desc>, <metric>),
M discards since last keep, plateau state: <yes/no>, pending candidates: N"
makes the loop interpretable without opening files. Low code cost, high
hygiene payoff.

### S10. Decouple the "telegraphic ASCII" style from the "schema correctness" rule.

Right now a file with one em-dash technically violates the contract and
in principle could fail an audit. The style rule is real but the
enforcement penalty is disproportionate. Make style a soft warning in
the audit, schema version/shape a hard failure. Current ambiguity means
agents get told "fix any file with an em-dash" which inflates edit
sessions over trivia.

---

## 7. Research notes that informed the above

- **Claude Code memory hierarchy (2026).** Managed policy -> user global ->
  project -> local. Hard 200-line cap on loaded CLAUDE.md; content past
  that is silently dropped. The system's 160-line adapter cap sits below
  this, which is correct.
- **Cursor `.mdc` rules (2026).** `.cursorrules` is deprecated; agent mode
  ignores it. `alwaysApply: true` is loaded in every session; the
  description field drives AI-based activation decisions more than the
  glob does. Frontmatter YAML parsing is fragile — unquoted colons crash
  Claude Code, invalid YAML silently degrades in Cursor. The Cursor root
  rule frontmatter in BOOTSTRAP uses `alwaysApply: true` which is correct
  for root-adapter behavior.
- **BPE tokenization.** tiktoken does not guarantee 1-token-per-codepoint
  for Unicode. Math symbols and fancy quotes typically cost 2-4 tokens vs
  1 for ASCII. The "ASCII operators only" rule is valid; the additional
  style reasoning (audit compatibility) is also valid.
- **METR RewardHackingAgents.** Natural-agent runs tamper with evaluators
  in ~50% of episodes when unrestricted. Evaluator locking eliminated
  tampering at ~25-31% median runtime overhead. Combined regime
  (evaluator lock + held-out scoring) is the only defense that blocked
  both attack vectors. The `.task-hashes` guard plus `tasks/holdout/` is
  a direct implementation.
- **Goodhart's law / reward overoptimization (Gao et al. 2023).** Proxy-
  objective optimization follows predictable functional forms; hold-out
  size should scale with optimization pressure, not sit at a fixed
  3-5. The scaffold's minimum-one, recommend-3-5 is underpowered for
  long loops.
- **Benchmark CV thresholds.** Published guideline: CV < 10% excellent,
  10-20% good, 20-50% directional only, >50% unreliable. The 10%
  threshold in `run.sh` is appropriate but the implementation computes
  std/median rather than std/mean; the reliability calibration is
  against mean.
- **AlphaEvolve / FunSearch / OpenEvolve.** Real population-based systems
  use MAP-Elites grids and island migration. The single-pointer
  plateau-triggered research substitute is a genuine design choice; the
  trade-off is acknowledged in-prompt.
- **Agent handoff literature.** "Lost in the Middle" on full dumps;
  hallucinated reasoning on pure summaries; checkpoint-based summaries
  with evidence carry-forward (RelentlessAgent pattern) are
  state-of-the-art. The handoff sections (Session Greeting, State,
  Pass-forward) fit this pattern well.
- **2026 memory-system research.** SimpleMem, TA-Mem, SYNAPSE, Mnemis.
  Trend is toward structured compression + intent-aware retrieval.
  `CONTEXT/*` is deliberately non-RAG (model re-reads the whole tree),
  which is correct for a tree that should fit in-context; but if project
  memory ever outgrows ~10-20k tokens of canonical files, a retrieval
  layer becomes necessary. No sign the current design has hit that.

---

## 8. Bottom line

The system is well-architected and empirically-grounded — it explicitly
cites and implements the right defenses against the right real-world
failure modes (Goodhart, evaluator gaming, cross-session context loss,
cross-harness drift). It is not vaporware-prompt-engineering.

The biggest issues are:
- a cluster of concrete bash bugs in the LOOP runner that will produce
  false positives and lost signal on real use (H1-H6),
- missing entry-point documentation that makes adoption artificially
  expensive (S1, M6),
- and a few places where the stated enforcement mechanism relies on
  model discipline when it could be structural (M3, H3, L6).

Fixing the HIGH items is mechanical and contained. Adopting S1-S3 as
structural changes would pay back the implementation cost within the
first cross-project use.

The one genuinely risky bet in the system is S8's deliberate substitution
of plateau-triggered research for population search. That bet is defensible
in isolation but gets weaker as harnesses move to restricted web access
and as loops get longer. A minimal "branch from older keep" population
nudge, as described, would hedge it cheaply.
