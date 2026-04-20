# Context Memory and Loop Ratchet System -- v2

Telos: give any coding agent, in any harness, a durable memory tree and an opt-in auto-loop ratchet for scorable optimization targets, with evaluator-tampering guards and held-out verification built in.

## What this system does

Three real problems solved:

1. Cross-session context loss. LLM sessions are stateless; full dumps drown signal, summaries lose evidence. Canonical memory in `CONTEXT/*` is read at every session start.
2. Cross-harness fragmentation. Claude Code and Cursor use different adapter formats. Both are generated from one template and both point at the same `CONTEXT/*`.
3. Evaluator gaming during long-running optimization loops. Hash-verified tampering guard plus held-out partition re-scored at graduation time.

## The four prompts

| Prompt                          | When to use                                                                                               |
| ------------------------------- | --------------------------------------------------------------------------------------------------------- |
| `PROJECT_MEMORY_BOOTSTRAP.md`   | Once per project, then idempotently on re-run to upgrade schema in place. Initializes or repairs memory.  |
| `HANDOFF.md`                    | End of a normal session (no auto-loop running in this project). Default handoff.                          |
| `HANDOFF-LOOP.md`               | End of a session in a project with `LOOP/<mode>/` directories. Handles graduation and consistency checks. |
| `LOOP_CREATION.md`              | Opt-in per project, per mode. Scaffolds one auto-loop ratchet under `LOOP/<mode>/`.                       |

Supporting artifact: `contract.yml.example` -- sample evaluator contract for a loop mode.

## DAG

```
new project
  |
  v
PROJECT_MEMORY_BOOTSTRAP.md    (creates CONTEXT/* + both root adapters)
  |
  |--> normal work session
  |      |
  |      v
  |    HANDOFF.md              (sync CONTEXT/*, write one handoff, delete priors)
  |
  |--> project wants a ratchet loop
         |
         v
       LOOP_CREATION.md        (scaffold LOOP/<mode>/ with tasks, runner, tampering guard, held-out partition)
         |
         v
       meta-agent runs loop    (machine-owned; human reviews observations.md between sessions)
         |
         v
       HANDOFF-LOOP.md         (graduate ratified candidates, run audit, write handoff)
```

## Canonical memory layout

Every project gets:

```
{PROJECT_ROOT}/
  CLAUDE.md                          # Claude Code adapter (thin routing layer)
  .cursor/rules/context-system.mdc   # Cursor adapter (thin routing layer)
  CONTEXT/
    TODO.md                          # current worklist, blockers, verification
    DECISIONS.md                     # durable decisions with H/M/L confidence
    ARCHITECTURE.md                  # current structure snapshot
    LESSONS.md                       # durable preferences, pitfalls, corrections
    handoffs/                        # one current handoff at a time
    archive/                         # lazy-created on first archival
  LOOP/                              # optional; created by LOOP_CREATION.md
    <mode>/
      program.md                     # meta-agent directive
      contract.yml                   # machine-readable metric definition
      research.md                    # plateau-triggered inquiry directive
      <mutable_file>                 # the optimization surface
      results.tsv                    # experiment log (commit, metric, status)
      observations.md                # meta-agent inbox for candidates, findings
      run.sh                         # experiment runner
      run-holdout.sh                 # held-out verdict runner
      status.sh                      # one-shot loop state dashboard
      .task-hashes                   # SHA-256 baseline for normal tasks
      .holdout-task-hashes           # SHA-256 baseline for held-out tasks
      .program-checksum              # drift detector for program.md
      tasks/                         # optimization task set
        task-01/
        holdout/
          task-h01/                  # independent verdict set
      jobs/                          # per-run traces
      research/                      # plateau research artifacts
```

## `{GLOBAL_ROOT}` convention

Cross-project lessons live at `~/.context-system/CONTEXT/LESSONS.md`. Default path is `~/.context-system/`. Override by setting `CONTEXT_SYSTEM_ROOT` or by placing a `.global-root` marker file at the override directory. First-Time Global Setup in `PROJECT_MEMORY_BOOTSTRAP.md` initializes this once per machine.

## Quick start

### New project, no loop yet

1. From your project root, run `PROJECT_MEMORY_BOOTSTRAP.md`. It creates `CONTEXT/*` and both root adapters.
2. Work normally. Sync `CONTEXT/*` as you go.
3. At end of session, run `HANDOFF.md`.

### New project, want an auto-loop

1. Run `PROJECT_MEMORY_BOOTSTRAP.md` first.
2. Ensure the project is a git repo.
3. Run `LOOP_CREATION.md`. It will walk you through the Pre-Scaffold Gate (metric definition), per-question scaffold, and dry-run verification.
4. Point a coding agent at `LOOP/<mode>/program.md` as its directive. The agent runs the loop.
5. Between sessions, review `LOOP/<mode>/observations.md` (tick `- [x]` on candidates to approve, delete to reject).
6. At end of session, run `HANDOFF-LOOP.md`. It re-verifies against the held-out partition, graduates approved candidates through a transactional pending-file, and writes a handoff.

### Existing project (v1 users upgrading to v2)

1. Re-run `PROJECT_MEMORY_BOOTSTRAP.md`. It auto-detects upgrade mode, captures a snapshot, and applies schema + adapter template sync non-destructively.
2. Review the upgrade plan when prompted; approve or redirect.
3. v1 handoffs: use `HANDOFF.md` unless the project has a `LOOP/` directory, in which case use `HANDOFF-LOOP.md`.
4. v1 loops (pre-v2): re-run `LOOP_CREATION.md` on each mode. Step 2 detects existing scaffold and runs repair-mode, adding `contract.yml`, `status.sh`, the split hash files, and the 3-value status enum without touching user content.

## Design principles

- Canonical mutable memory lives in one place (`CONTEXT/*`); adapters only route.
- Telegraphic ASCII style across memory files; no Unicode math, no em-dashes.
- Schema versioning lets the bootstrap repair drift without destroying user content.
- `LOOP/*` is machine-owned. The only human-write path is ticking `- [x]` in `observations.md`.
- Graduation is always human-ratified. Evaluator tampering is blocked by hash verification. Held-out re-scoring guards against optimization drift at ratification time.

## History

- `SPEC.md` in this folder records the v1 -> v2 upgrade decisions and drafted artifacts. Read it if you need to understand why a specific section looks the way it does or how to extend further.

## Pointers

- Extend the system for a new memory file: add a schema + template in `PROJECT_MEMORY_BOOTSTRAP.md` File Header Generation.
- Tune loop rigor: adjust `{PLATEAU_N}`, `{REPETITION_COUNT}`, `cv_threshold` in `contract.yml`, or hold-out size (at least 20% of task content).
- Add cross-project lessons: affirm a `[PROJECT]` LESSONS entry across two projects, then graduate it to `~/.context-system/CONTEXT/LESSONS.md` as `[GLOBAL]`.
