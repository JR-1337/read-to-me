# TTS -- Claude Code Adapter

## Purpose

Client-side PWA that reads pasted text or URLs aloud via Google Cloud TTS. Vanilla JS, no build step, service-worker cached.

## Canonical Memory

All mutable project state lives in `CONTEXT/`:

- `CONTEXT/TODO.md` -- current worklist, blockers, verification state
- `CONTEXT/DECISIONS.md` -- durable product, architecture, and workflow decisions
- `CONTEXT/ARCHITECTURE.md` -- current structure snapshot
- `CONTEXT/LESSONS.md` -- durable preferences, corrections, pitfalls
- `CONTEXT/handoffs/` -- one current session-continuity file at a time

`.cursor/rules/context-system.mdc` is the Cursor equivalent of this adapter. Ignore it during normal work; read it only during adapter repair.

## Ownership

- Task state -> `TODO.md`
- Rationale and decisions -> `DECISIONS.md`
- Structural snapshot -> `ARCHITECTURE.md`
- Preferences and pitfalls -> `LESSONS.md`
- Session handoff -> `handoffs/`
- Code, assets, static content -> repo files (`js/`, `css/`, `icons/`, `index.html`, `sw.js`, `manifest.json`)

No overlap. If a fact fits two files, pick the one that owns the write trigger.

## Read And Write Rules

**Boot read** at session start: `TODO.md`, `DECISIONS.md`, `ARCHITECTURE.md`. Read `LESSONS.md` when preferences, corrections, or repeated pitfalls may affect the approach. Read the current handoff only when resuming continuity.

**Mid-chat re-read** when scope shifts, when a memory file changed, when a contradiction appears, or before edits that depend on the current plan, decisions, or architecture.

**Write triggers:**

- `TODO.md` -- task status, order, blockers, next steps, or verification state changes
- `DECISIONS.md` -- a durable direction is chosen or proven by implementation
- `ARCHITECTURE.md` -- structure, boundaries, flows, or integrations change
- `LESSONS.md` -- a durable preference, correction, or repeated pitfall emerges
- `handoffs/` -- only on explicit end-of-session or handoff request, after syncing the main memory files

**End-of-task sync**: update the relevant `CONTEXT/*` file before closing a task. Do not write to adapters during routine progress.

**Adapter repair** is the only reason to touch this file or the Cursor adapter during normal work. If one root adapter is repaired for drift, repair the other in the same task.

## Module Adapters

None yet. Create `{module}/CLAUDE.md` (under 100 lines) when a subtree gains its own runtime, distinct conventions, an external integration, or 3+ source files repeatedly co-edited.

## Boundaries

- In scope: text-to-speech pipeline (chunker, player, audio cache, API client, UI, service worker)
- Out of scope: server-side anything; the Google Cloud TTS API is external and owned by Google
- Tech debt to work around, not fix: `sw.js` cache version is bumped manually per release

## Loop Access Rules

If this project contains `LOOP/<mode>/` directories, they are machine-owned territory for auto-loop ratchet experiments. Routine human work does not read or write `LOOP/*` except:
- `LOOP/<mode>/observations.md` during graduation review (human ticks `- [x]` on candidates they want promoted; deletes entries to reject)

The meta-agent (the coding agent running the loop) owns `LOOP/<mode>/*` during loop runs. Graduation from `observations.md` Candidates to `CONTEXT/LESSONS.md` or `CONTEXT/DECISIONS.md` happens via the handoff flow, human-ratified only.

Do not hand-edit `program.md` during active sessions (it is the meta-agent's directive; edit only when redirecting the loop). Do not hand-edit `results.tsv`, `jobs/*`, or task files during experiments.
