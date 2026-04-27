# TTS -- Agent Adapter (canonical)

<!-- AGENTS_SCHEMA_V1 -->
<!-- LOOP_ACCESS_RULES_V1 -->

## Purpose

Thin routing layer for any coding agent (Claude Code, Cursor, Codex, Aider, Windsurf, Copilot, Amp, RooCode, etc.) working in this project. Canonical mutable memory lives in `CONTEXT/*`. This file is intentionally stable; update only when routing, ownership, or read/write behavior changes.

## Canonical Memory

All durable project state lives under `CONTEXT/`:
- `CONTEXT/TODO.md` -- current worklist, blockers, verification, recent completions
- `CONTEXT/DECISIONS.md` -- durable decisions with confidence and rationale
- `CONTEXT/ARCHITECTURE.md` -- current structure snapshot
- `CONTEXT/LESSONS.md` -- durable preferences, pitfalls, corrections
- `CONTEXT/handoffs/*.md` -- up to 3 recent handoffs; older archived per HANDOFF.md Step 6

Cross-project lessons live in `~/.context-system/CONTEXT/LESSONS.md` and are read only when `[GLOBAL]`-scoped context is relevant.

Optional project data plane: `DATA/catalog.md` lists fixtures under `DATA/`. Required before any `LOOP/<mode>/` unless cold-start opt-out per `LOOP_CREATION.md`. Read `DATA/*` only for LOOP work, `DATA_CAPTURE_BOOTSTRAP.md`, or explicit `CONTEXT/TODO`.

## Ownership

Non-overlapping by design. If you catch yourself writing rationale in TODO, stop and move it to DECISIONS. If you catch yourself writing task state in ARCHITECTURE, stop and move it to TODO. If you catch yourself writing preferences in DECISIONS, stop and move them to LESSONS.

## Read And Write Rules

At session start: read `CONTEXT/TODO.md`, `CONTEXT/DECISIONS.md`, `CONTEXT/ARCHITECTURE.md`. Read `CONTEXT/LESSONS.md` when preferences may affect approach. Read the latest handoff in `CONTEXT/handoffs/` only when resuming continuity.

Re-read any memory file when it changed, when scope shifts, when a contradiction surfaces, or before edits that depend on current plan / decisions / architecture.

Write `CONTEXT/*` during normal work. Update `TODO.md` on status change. Update `DECISIONS.md` on durable direction change. Update `ARCHITECTURE.md` on structural change. Update `LESSONS.md` on durable preference or repeated pitfall. Write handoffs only on end-of-session request, atomically (`.tmp` then `mv`).

Confidence format on DECISIONS and inferred LESSONS entries:
`Confidence: H(-holdout)? -- <source>, verified YYYY-MM-DD` or `Confidence: M` or `Confidence: L -- <what would verify>`.

## Module Adapters

Create `{module-name}/AGENTS.md` only when the subtree has distinct runtime, conventions, or an external integration. Per AGENTS.md spec, nested files take precedence (nearest wins). Keep module adapters under 100 lines. Module adapters own local purpose, key files, conventions, boundaries -- nothing project-wide.

When `{module-name}/AGENTS.md` exists, BOOTSTRAP Step 10b auto-deploys two sibling shims under the same nearest-wins discipline:
- `{module-name}/CLAUDE.md` -- so Claude Code's directory walk picks up module routing
- `{module-name}/.cursor/rules/{module-name}.mdc` -- so Cursor's nested `.cursor/rules/` discovery picks up module routing

Codex reads AGENTS.md natively and needs no shim. Module shims stay under 25 lines and only point back to the module's AGENTS.md.

## Boundaries

In scope: routing between any coding agent and `CONTEXT/*`.

Out of scope: storing live task state, handoff text, decision history, dated session notes. The per-tool shim files (project-root `CLAUDE.md`, `.cursor/rules/context-system.mdc`, plus any `{module}/CLAUDE.md` and `{module}/.cursor/rules/*.mdc` deployed by Step 10b) carry only harness-specific glue and a pointer back to their canonical AGENTS.md (root or module). If you find yourself adding routing rules to a shim, the rule belongs in the AGENTS.md instead.

## Loop Access Rules

If this project contains `LOOP/<mode>/` directories, they are machine-owned territory for auto-loop ratchet experiments. Routine human work does not read or write `LOOP/*` except:
- `LOOP/<mode>/observations.md` during graduation review (tick `- [x]` to approve, delete entry to reject)

The meta-agent (the coding agent running the loop) owns `LOOP/<mode>/*` during loop runs. Graduation from `observations.md` Candidates to `CONTEXT/LESSONS.md` or `CONTEXT/DECISIONS.md` happens via the handoff flow, human-ratified only.

Do not hand-edit `program.md` during active sessions (it is the meta-agent's directive; edit only when redirecting the loop). Do not hand-edit `results.tsv`, `jobs/*`, or task files during experiments.
