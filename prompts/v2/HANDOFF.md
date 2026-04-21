# PROJECT HANDOFF PROMPT

Telos: end a session by syncing canonical memory, auditing drift, and writing one self-contained handoff note for the next session.

If this project has a `LOOP/` directory, use `HANDOFF-LOOP.md` instead. It adds graduation handling, held-out re-verification, and consistency checks for auto-loop state. This prompt (the default) handles the common case: a normal session with no auto-loop running.

Schema definitions for canonical files live in `<!-- SCHEMA: ... -->` HTML comments inside each file. Read them before writing.

## Cannot Proceed Unless

- `{CONTEXT_ROOT}/` exists. If it does not, run `PROJECT_MEMORY_BOOTSTRAP.md` first.
- You can write a `.tmp` file and `mv` it in one step (atomic handoff write).
- No `LOOP/` directory exists for this project. If one does, use `HANDOFF-LOOP.md` instead.

Run this prompt when ending a session for the current project. In Cursor this is typically invoked with `@HANDOFF.md`; in Claude Code with a direct file reference; other harnesses use their own file-attach convention. The prompt contents are harness-neutral.

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
- After Step 5 completes, only the new handoff exists; all prior handoffs have been deleted.

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

In `DECISIONS.md`, confidence is mandatory on every entry. In `LESSONS.md`, include confidence only when the lesson is inferred rather than explicitly stated by the user. `H-holdout` applies only to auto-loop ratified entries -- not used in this lite variant.

## Step 1 -- Read current memory

Read:
1. `{CONTEXT_ROOT}/TODO.md`
2. `{CONTEXT_ROOT}/DECISIONS.md`
3. `{CONTEXT_ROOT}/ARCHITECTURE.md`
4. `{CONTEXT_ROOT}/LESSONS.md` if workflow corrections or preferences matter
5. the prior handoff (if any) only if it helps resume continuity

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

Plan-time context does not survive to execution time. Before Step 3, scan for three categories that do not naturally route into canonical memory. Answer each, even if the answer is "none".

- **Working assumptions**: mental model of the system the session operated under that is not in `ARCHITECTURE.md` or `DECISIONS.md`. Record in the new handoff's `State` section. If durable, promote to `ARCHITECTURE.md`.
- **Near-misses**: approaches tried or seriously considered that did not rise to a logged DECISION but would re-tempt the next session. Record in the new handoff's `Anti-Patterns (Don't Retry)`.
- **Naive next move**: what the obvious first action looks like from outside the session's reasoning, and why it is wrong. Record in the new handoff's `Anti-Patterns (Don't Retry)` or as a caution on `Next Step Prompt`.

If all three return "none", record `Decanting: clean` in `This Session`. Other categories (failed approaches with lessons, rejected alternatives, discovered constraints) are handled by DECISIONS.md and LESSONS.md in Step 2 and do not need to be re-audited here.

## Step 3 -- Bloat and drift audit pass

Before writing the new handoff, evaluate whether the audit needs to run.

Skip the audit if ALL of these are true:
- no adapter files were modified during the session
- no `CONTEXT/*` files were written to during the session before Step 2 (i.e., Step 2 is the first write)

If the audit is skipped, record `Audit: skipped (no adapter or pre-Step-2 CONTEXT writes)` and proceed to Step 4.

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
- `This Session`: important changes, decisions, validation performed or not performed, audit findings from Step 3
- `Hot Files`: files most likely to matter next
- `Anti-Patterns (Don't Retry)`: things not to retry, near-misses from Step 2a, and naive-next-move cautions. Default to "none this session" explicitly; empty is different from unchecked.
- `Blocked`: current blockers only
- `Key Context`: brief cross-links to durable memory when helpful; include a cross-harness note only when relevant
- `Verify On Start`: what to read or check first, including repo state when relevant; include an adapter-check note only when relevant
- `Next Step Prompt`: the most natural continuation. Check in this order: (a) shipped-but-unverified work from this session that needs smoke or validation; (b) external gates (awaiting user input, repro, third-party response, discovery); (c) top active TODO item. Default falls through (a) -> (b) -> (c). Do not default to (c) when (a) or (b) applies.

Preferred harness-switch note:
- `If switching harnesses, read shared CONTEXT first; repair adapters only if stale.`

Required `Session Greeting` shape:
- Tell the next model to read `CONTEXT/*`, then resume from `State` and `Next Step Prompt`.
- Tell the next model that its first reply should stay brief: 1-2 short sentences, a `Pass-forward:` line, and exactly 1 direct question about how to proceed.

`Pass-forward:` is defined as a one-line label (under 15 words) of the single most important piece of state the next session must carry forward from this one. Not a summary, not a task list -- one sentence of the form "we are in the middle of X, the next decision point is Y." If nothing critical carries forward, write `Pass-forward: none`.

Required sections (no Auto-loop state in this lite variant):
1. Session Greeting
2. State
3. This Session
4. Hot Files
5. Anti-Patterns (Don't Retry)
6. Blocked
7. Key Context
8. Verify On Start
9. Next Step Prompt

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
- the most natural next step, defaulting to the top active TODO when relevant

## Model Self-Check

Before delivering output, confirm:
1. Did I write the new handoff using a `.tmp` + `mv` atomic pattern?
2. Did I delete ALL prior handoff files after the new one was successfully written?
3. Does the handoff include a `Pass-forward:` line (one sentence or `none`)?
4. Did I run the Decanting check (Step 2a) with all three categories answered?
5. Did I avoid touching adapters during this routine handoff?
