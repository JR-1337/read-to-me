# PROJECT MEMORY BOOTSTRAP

Telos: initialize or upgrade a project's memory system (`CONTEXT/*` plus both root adapters) so any coding agent in any harness can pick up the thread.

Schema definitions live in `<!-- SCHEMA: ... -->` HTML comments inside the generated files. Read them before writing. This prompt also emits `<!-- ADAPTER_SCHEMA_V1 -->` and `<!-- LOOP_ACCESS_RULES_V1 -->` markers inside adapters; Upgrade Mode detects and repairs on those markers.

## Cannot Proceed Unless

- `{PROJECT_ROOT}` is unambiguous (the directory that owns or will own `CONTEXT/`, not this prompt's directory).
- If Upgrade Mode is detected: you can capture a snapshot under `{PROJECT_ROOT}/CONTEXT/.upgrade-snapshot/` before any modification.
- User has confirmed the upgrade plan (Step 8) before any Step 9 write.

Use this prompt to initialize or repair a full project-memory system for the current project.

## Default Scope

- Assume the current project by default.
- Prefer the active repo or active project directory that owns `CONTEXT/`.
- `{PROJECT_ROOT}` is the directory that owns `CONTEXT/`.
- `{GLOBAL_ROOT}` defaults to `~/.context-system/`. Override via the `CONTEXT_SYSTEM_ROOT` environment variable, or by placing a `.global-root` marker file (empty file) at the override directory. This directory holds cross-project `[GLOBAL]` lessons at `{GLOBAL_ROOT}/CONTEXT/LESSONS.md`. The user initializes this once per machine via First-Time Global Setup below. If `{GLOBAL_ROOT}/CONTEXT/` does not exist, cross-project graduation degrades gracefully: lessons tagged `[GLOBAL]` stay in the project's `CONTEXT/LESSONS.md` until the global context directory is created. This bootstrap notes the condition if it detects `[GLOBAL]` entries with no `{GLOBAL_ROOT}/CONTEXT/` to graduate them to.
- Projects reference `{GLOBAL_ROOT}` only for cross-project reads defined in Graduation And Retirement and Ongoing Read Rules.
- Root adapters live beside that `CONTEXT/` directory:
  - `{PROJECT_ROOT}/CLAUDE.md`
  - `{PROJECT_ROOT}/.cursor/rules/context-system.mdc`
- Canonical mutable memory lives at `{PROJECT_ROOT}/CONTEXT/`.
- If this prompt file lives outside the project, do not treat the prompt file's directory as `{PROJECT_ROOT}`.
- Only ask for scope if multiple project roots are equally plausible or the user explicitly redirects you elsewhere.

## Session Vocabulary

- `Pass-forward`: one-line label of the single most important piece of state the next session must carry forward. Not a summary, not a task list. Under 15 words. Form: "we are in the middle of X, the next decision point is Y." If nothing critical carries forward, `Pass-forward: none`. Used in handoff output.
- `Decanting check`: plan-time review of three categories that do not naturally route into canonical memory (working assumptions, near-misses, naive-next-move). Performed in HANDOFF Step 2a.
- `Graduation`: promotion of a `LOOP/<mode>/observations.md` Candidate marked `- [x]` by the human into `CONTEXT/DECISIONS.md` or `CONTEXT/LESSONS.md`. Performed in HANDOFF-LOOP Step 2b via transactional write through `CONTEXT/observations.pending.md`.
- `Plateau`: mechanical signal emitted by a loop's `run.sh` when the last `{PLATEAU_N}` data rows of `results.tsv` are all `discard`. Triggers a research pass per the mode's `research.md`.
- `H-holdout`: confidence level reserved for DECISIONS entries ratified via auto-loop held-out task re-scoring at graduation.

## Bootstrap Output

Always create or refresh:
- `{CONTEXT_ROOT}/TODO.md`
- `{CONTEXT_ROOT}/DECISIONS.md`
- `{CONTEXT_ROOT}/ARCHITECTURE.md`
- `{CONTEXT_ROOT}/LESSONS.md`
- `{CONTEXT_ROOT}/handoffs/`

Always create or refresh both root adapters from the templates in File Header Generation:
- Cursor: `.cursor/rules/context-system.mdc`
- Claude Code: `CLAUDE.md`

Both adapters must point to the same `CONTEXT/*`.

Module adapters are optional at bootstrap time and should be created only when the project has grown enough to justify them:
- Cursor module adapters: `.cursor/rules/module-{module-name}.mdc`
- Claude module adapters: `{module-name}/CLAUDE.md`

This bootstrap is self-contained:
- does not depend on helper template files
- does not create extra root-level template files
- generates the output files directly from this prompt

## First-Time Global Setup (run once per machine, before first project bootstrap)

If `{GLOBAL_ROOT}/CONTEXT/LESSONS.md` does not yet exist on this machine, initialize it before any project bootstrap. This is the cross-project graduated-lessons destination that `HANDOFF-LOOP.md` Step 2b writes to and the generated `program.md` Setup reads from.

Procedure:

1. Resolve `{GLOBAL_ROOT}`: check the `CONTEXT_SYSTEM_ROOT` environment variable first; then check for a `.global-root` marker file at `~/.context-system/`; otherwise default to `~/.context-system/`.
2. Check whether `{GLOBAL_ROOT}/CONTEXT/LESSONS.md` exists. If it does AND its `<!-- SCHEMA: LESSONS.md (global)` header matches the current spec below, skip this section entirely.
3. If `{GLOBAL_ROOT}/CONTEXT/` does not exist, create it: `mkdir -p {GLOBAL_ROOT}/CONTEXT`.
4. If `{GLOBAL_ROOT}/CONTEXT/LESSONS.md` does not exist OR has a stale schema, write it with the global-variant schema below. Preserve any existing user content between the header and template blocks (same non-destructive pattern as Upgrade-Mode Step 9).

   ```
   <!-- SCHEMA: LESSONS.md (global)
   Version: 1
   Purpose: user-wide lessons graduated from per-project LESSONS.md entries
   when patterns prove true across two or more projects. Distinct from
   {HARNESS_ADAPTER} (e.g., ~/.claude/CLAUDE.md) which holds DECLARED user
   preferences; this file holds GRADUATED empirical patterns from project work.

   Write mode: append at the end of the graduation flow (HANDOFF-LOOP.md
   Step 2b for auto-loop graduations; manual append by the user for
   cross-project graduations from per-project LESSONS.md). Direct-written
   entries are discouraged -- declared preferences belong in the harness
   adapter, not here.

   Rules:
   - Each entry scoped [GLOBAL] (the only valid scope here; tag retained
     for format consistency with project LESSONS.md).
   - Each entry carries Affirmations: N starting at 0 on arrival here.
     Increment when the same pattern recurs in further project work.
   - Source field MANDATORY on every entry: graduated-from-project or
     meta-agent-ratified.
   - Origin field optional: short name(s) of the project(s) the lesson
     originated in. Used to preserve provenance across graduation.
   - Optional Evidence field: <mode>/<tag> (<metric>: <value>) for
     meta-agent-ratified entries. Reference only.
   - Confidence level only when the lesson is inferred rather than
     explicitly stated. Same H/M/L scale as project LESSONS.md.
   - Do not log one-off chat trivia.
   - Do not duplicate state that belongs in project memory or in the
     user's harness adapter.
   - Bullets under 12 words, sentences under 20 words, no paragraphs.
   - ASCII operators only.
   -->

   (no graduated lessons yet)

   <!-- TEMPLATE
   ## [GLOBAL] -- [Lesson title, graduated from cross-project pattern]
   Lesson: [what to do or avoid, in one sentence]
   Context: [when it applies]
   Affirmations: 0
   Source: graduated-from-project
   Origin: [project-a, project-b]

   ## [GLOBAL] -- [Lesson title, ratified from auto-loop]
   Lesson: [what to do or avoid]
   Context: [when it applies]
   Affirmations: 0
   Source: meta-agent-ratified
   Evidence: <mode>/<tag> (<metric>: <value>)
   -->
   ```
5. Do NOT create `{GLOBAL_ROOT}/CONTEXT/DECISIONS.md`, `ARCHITECTURE.md`, `TODO.md`, or `handoffs/`. Cross-project decisions live in the user's harness adapter (`~/.claude/CLAUDE.md`); architecture is per-project; TODO and handoffs are session-scoped. Add a global DECISIONS file later only if the harness adapter starts bloating.
6. Verification: `{GLOBAL_ROOT}/CONTEXT/LESSONS.md` exists, has the schema header and template block, file lives under `{GLOBAL_ROOT}/CONTEXT/` (not directly under `{GLOBAL_ROOT}/`).

Skipping this section means project work still functions but `[GLOBAL]`-tagged lessons stay in the project's own `LESSONS.md` until the destination is created, and any loop's Setup step that reads global lessons will hit a missing file.

## Related Prompts

Projects that run auto-loop ratchets (optimizing any scorable target: prompts, code, configs, content, markup, queries) additionally run `LOOP_CREATION.md` after this bootstrap completes. That prompt is opt-in per project and scaffolds `{PROJECT_ROOT}/LOOP/<mode>/`. It does not modify `CONTEXT/*`.

Session-end continuity runs through one of two prompts. Use `HANDOFF.md` for routine sessions in projects with no `LOOP/` directory. Use `HANDOFF-LOOP.md` when the project has one or more `LOOP/<mode>/` directories -- it integrates auto-loop graduation and consistency checks.

This prompt is state-aware. On re-run it detects whether a project is fresh (no `CONTEXT/`), needs upgrading (`CONTEXT/` exists but schema versions are stale or files are missing), or is already current (nothing to do). See Step 0 and the Upgrade-Mode Steps section. There is no separate upgrade prompt.

`LOOP/*` is machine-owned territory. Routine human work does not read or write there. The only crossover is the graduation flow defined in Graduation And Retirement.

## Non-Destructive Guarantee (Upgrade-Mode Only)

When this prompt runs in Upgrade Mode (Step 0 detected an existing `CONTEXT/` with stale or partial schema), the following guarantees apply. These do NOT apply in Fresh Init Mode, where there is no user content to preserve.

In Upgrade Mode, this prompt will NEVER:
- Delete or rewrite user content in any `CONTEXT/*` file WITHOUT explicit per-item user consent
- Modify handoff files
- Touch `archive/*`
- Create `LOOP/<mode>/` directories (that is `LOOP_CREATION.md`'s job)
- Force changes the user did not approve
- Auto-migrate data between files without asking

In Upgrade Mode, this prompt CAN:
- Replace `<!-- SCHEMA: ... -->` header blocks (which are deterministic, no user content; version-bumped per Schema Versioning)
- Replace `<!-- TEMPLATE ... -->` blocks at file bottoms (same reasoning)
- Append new sections to adapters that lack the `<!-- LOOP_ACCESS_RULES_V1 -->` marker (without touching existing sections)
- Replace an adapter entirely if it lacks `<!-- ADAPTER_SCHEMA_V1 -->` (adapter predates v2 and has no preservable structured content beyond project-specific text that the user re-approves)
- Update `.gitignore`
- WITH EXPLICIT PER-ITEM CONSENT: migrate individual `[GLOBAL]`-scoped lessons from the project's `CONTEXT/LESSONS.md` to `{GLOBAL_ROOT}/CONTEXT/LESSONS.md` (the one documented data-routing migration; see Upgrade-Mode Step 11)

User content between the schema header and template block is preserved byte-for-byte UNLESS the user explicitly consents to migrate a specific `[GLOBAL]` lesson in Step 11. Byte-preservation is mechanically verified against a pre-modification snapshot in Upgrade-Mode Step 13.

## Cross-Harness Rules

- `CONTEXT/*` is the only canonical mutable memory.
- Cursor uses `.cursor/rules/context-system.mdc` plus `CONTEXT/*` during normal work.
- Claude uses `CLAUDE.md` plus `CONTEXT/*` during normal work.
- Cursor ignores `CLAUDE.md` during normal work.
- Claude ignores `.cursor/*` during normal work.
- Neither adapter should depend on, mirror, or restate the other.
- Normal work reads and writes `CONTEXT/*`, not the other harness's adapter.
- Adapter repair is the only normal exception.
- On a harness switch, a small catch-up read from shared `CONTEXT/*` is expected before any repair.
- If both adapters exist but disagree on routing or ownership rules, the more recently modified file is treated as authoritative for conflict resolution during the same session. Repair both adapters in the same task per the sync rule.

## Goal

Build a memory system that:
- keeps canonical mutable state in `CONTEXT/*`
- keeps adapters thin and stable
- grows with the project as new modules, runtimes, and boundaries emerge
- stays portable across Cursor and Claude Code

Overwrite stale memory in place. The current codebase, repository state, and user-approved direction are the source of truth.

## Bootstrap Steps

This prompt runs in one of three modes. Step 0 detects which. Then either Fresh Init Steps (1-6) or Upgrade-Mode Steps (7-14) execute.

### Step 0 -- Detect project state

Before any file operation, determine the mode by inspecting the project.

1. Does `{PROJECT_ROOT}/CONTEXT/` exist as a directory?
   - **No** -> `mode = fresh`. Skip to Fresh Init Steps.
   - **Yes** -> continue to 2.
2. For each canonical file (`TODO.md`, `DECISIONS.md`, `ARCHITECTURE.md`, `LESSONS.md`) and the `handoffs/` directory:
   - Does the file (or directory) exist?
   - If it exists, does its `<!-- SCHEMA: -->` header include a `Version:` line, and is that version equal to the current spec version listed in this prompt's File Header Generation section?
   - A schema header with no `Version:` line is treated as `Version: 0` (pre-versioning) for upgrade comparison -- upgrade needed.
3. Classify the project:
   - **Any canonical file missing** OR **any schema below current version** OR **any adapter missing `<!-- ADAPTER_SCHEMA_V1 -->` or `<!-- LOOP_ACCESS_RULES_V1 -->`** -> `mode = upgrade`. Proceed to Upgrade-Mode Steps (7-14).
   - **All canonical files present AND all schemas at current version AND both adapters have both markers** -> `mode = no-op`. Report: `Bootstrap: no action needed. System at current spec.` Stop here.
   - **Any schema above current version** (project was bootstrapped by a newer spec than this prompt) -> stop and report the version mismatch. Do NOT downgrade; the user needs the newer spec file.

Also note for the run:
- If `{PROJECT_ROOT}` is a git repo, inspect current branch, dirty/clean state, and tracking.
- If the project uses module adapters, note them for later review.
- If a current handoff exists and helps recover state, read it (fresh mode may inherit handoff context; upgrade mode does not modify handoffs).

### Fresh Init Steps

Run these when Step 0 detected `mode = fresh`.

1. Read the current project state:
   - inspect core files
   - inspect current git status, branch, and tracking state if this project is a repository
   - inspect existing `CONTEXT/*` if present (not applicable in fresh mode by definition, but rechecking here guards against mid-run state changes)
   - inspect existing adapters if present
   - inspect the current handoff only if one exists and it helps recover state
2. Create the canonical memory files under `{CONTEXT_ROOT}/`. Each file gets its schema header at the top and template at the bottom, using the exact text from the File Header Generation section.
3. Create both root adapters (`CLAUDE.md`, `.cursor/rules/context-system.mdc`) from the templates in File Header Generation. Both get `<!-- ADAPTER_SCHEMA_V1 -->` and `<!-- LOOP_ACCESS_RULES_V1 -->` markers.
4. Create module adapters only where module growth conditions are met.
5. If `{PROJECT_ROOT}` is a git repo, ensure `.gitignore` includes `.context-migration/`, `.migration-recovery/`, and `CONTEXT/.upgrade-snapshot/`. These are scratch directories used by Upgrade-Mode snapshot and external migration tooling; adding them pre-emptively keeps working directories out of commits. Add them if missing.
6. Return a short summary of what was created, plus any open questions.

### Upgrade-Mode Steps

Run these when Step 0 detected `mode = upgrade`. See the "Non-Destructive Guarantee" section above -- those rules apply here. Step numbering continues from the Fresh Init Steps for cross-reference clarity (the human running this prompt only hits one branch).

Upgrade Mode is **idempotent**. Running it against an already-upgraded project produces `Bootstrap: no action needed. System at current spec.` at Step 0 and skips Steps 7-14 entirely. If the schema spec in this prompt changes in the future, re-running the prompt brings the project back to current without touching user content.

Upgrade Mode does NOT:

- scaffold `LOOP/` or any mode within it (use `LOOP_CREATION.md`)
- retroactively annotate existing `DECISIONS.md` or `LESSONS.md` entries with `Source:` or `Evidence:` fields (optional on prior entries; only new entries use them)
- migrate content between files EXCEPT the one documented `[GLOBAL]` LESSONS case in Step 11, which requires per-item user consent
- resolve drift between canonical files (rationale in TODO that belongs in DECISIONS, etc.) -- that's the Bloat Audit's job, handled by `HANDOFF.md` or `HANDOFF-LOOP.md` Step 3

#### Step 7 -- Inventory current state + capture snapshot

Read these files and record their current state without modifying anything:

- `{PROJECT_ROOT}/CONTEXT/TODO.md`
- `{PROJECT_ROOT}/CONTEXT/DECISIONS.md`
- `{PROJECT_ROOT}/CONTEXT/ARCHITECTURE.md`
- `{PROJECT_ROOT}/CONTEXT/LESSONS.md`
- `{PROJECT_ROOT}/CLAUDE.md` (if present)
- `{PROJECT_ROOT}/.cursor/rules/context-system.mdc` (if present)
- `{PROJECT_ROOT}/.gitignore` (if a git repo)

For each file, determine:

- Does it have a `<!-- SCHEMA: ... -->` header at the top, and does the header include a `Version:` line matching the current spec version?
- Does it have a `<!-- TEMPLATE -->` block at the bottom?
- Does its content match the current canonical spec in this prompt's File Header Generation section?
- For adapters specifically: does it contain `<!-- ADAPTER_SCHEMA_V1 -->` and `<!-- LOOP_ACCESS_RULES_V1 -->` markers?

**Additionally, scan `CONTEXT/LESSONS.md` for data-routing migration candidates:**

The old schema put `[GLOBAL]`-tagged lessons inside the project's own `LESSONS.md`. The current schema says `[GLOBAL]` entries belong in `{GLOBAL_ROOT}/CONTEXT/LESSONS.md` (after cross-project affirmation). Count and list all `[GLOBAL]`-scoped entries currently in the project's `CONTEXT/LESSONS.md`. These are migration candidates -- not auto-migrated, but flagged for user decision in Step 8 and acted on in Step 11.

Also check: does `{GLOBAL_ROOT}/CONTEXT/LESSONS.md` exist? If not, migration cannot proceed regardless of user choice (the destination does not exist; user must run the First-Time Global Setup section of this prompt first to initialize global memory). Note this as a precondition on any migration.

Record findings as a diff summary. Do not apply changes yet.

**Snapshot capture (mandatory before any Step 9 modification):**

The Non-Destructive Guarantee section above promises byte-identical preservation of user content. That promise is unverifiable without a pre-modification snapshot to diff against. Capture one now:

```
mkdir -p {PROJECT_ROOT}/CONTEXT/.upgrade-snapshot
cp {PROJECT_ROOT}/CONTEXT/TODO.md         {PROJECT_ROOT}/CONTEXT/.upgrade-snapshot/TODO.md
cp {PROJECT_ROOT}/CONTEXT/DECISIONS.md    {PROJECT_ROOT}/CONTEXT/.upgrade-snapshot/DECISIONS.md
cp {PROJECT_ROOT}/CONTEXT/ARCHITECTURE.md {PROJECT_ROOT}/CONTEXT/.upgrade-snapshot/ARCHITECTURE.md
cp {PROJECT_ROOT}/CONTEXT/LESSONS.md      {PROJECT_ROOT}/CONTEXT/.upgrade-snapshot/LESSONS.md
[ -f {PROJECT_ROOT}/CLAUDE.md ] && cp {PROJECT_ROOT}/CLAUDE.md {PROJECT_ROOT}/CONTEXT/.upgrade-snapshot/CLAUDE.md
[ -f {PROJECT_ROOT}/.cursor/rules/context-system.mdc ] && cp {PROJECT_ROOT}/.cursor/rules/context-system.mdc {PROJECT_ROOT}/CONTEXT/.upgrade-snapshot/context-system.mdc
[ -f {PROJECT_ROOT}/.gitignore ] && cp {PROJECT_ROOT}/.gitignore {PROJECT_ROOT}/CONTEXT/.upgrade-snapshot/.gitignore
sha256sum {PROJECT_ROOT}/CONTEXT/.upgrade-snapshot/* > {PROJECT_ROOT}/CONTEXT/.upgrade-snapshot/hashes.txt
```

The snapshot is the ground truth Step 13 verification compares against. Without it, "byte-identical" is an unsupported claim. Handoff files and `archive/` are deliberately not snapshotted -- Upgrade Mode does not modify them.

#### Step 8 -- Present upgrade plan

Show the user a structured plan before acting:

```
UPGRADE PLAN

Schema headers to replace (deterministic, no user content):
- [file] : [reason -- e.g., "Version: 0 -> 1", "Version: 1 -> 2 (observations.md enum change)"]
- [file] : [reason]

Template blocks to replace (at file bottoms):
- [file] : [reason]

Adapter updates:
- [file] : full replacement (pre-v2; no ADAPTER_SCHEMA_V1 marker)
- [file] : append Loop Access Rules (has ADAPTER_SCHEMA_V1 but no LOOP_ACCESS_RULES_V1)
- [file] : already current (has both markers)

Gitignore entries to add:
- [.context-migration/, .migration-recovery/, CONTEXT/.upgrade-snapshot/] : [present | missing]

Data-routing migration candidates (requires per-item user consent in Step 11):
- [GLOBAL]-scoped lessons in project LESSONS.md: [N found | none found]
  Destination: {GLOBAL_ROOT}/CONTEXT/LESSONS.md
  Destination exists: [yes | no -- user must run the First-Time Global Setup section of this prompt first if they want to migrate]

NOT changing:
- User content in any CONTEXT/* file (between header and template)
- Existing adapter sections when ADAPTER_SCHEMA_V1 marker is present
- Handoff files, archive, or any other content
- Any [GLOBAL] lesson the user does not explicitly consent to migrate
```

If the plan is empty (everything is already current, no migration candidates), say so explicitly: `Upgrade: no action needed. System is at current spec.` Stop there.

Otherwise, wait for user confirmation before proceeding. If the user says "go," proceed. If the user redirects, do only what they approve. The migration step (Step 11) will ask separately for per-item consent on each `[GLOBAL]` lesson.

#### Step 9 -- Apply schema and template replacements

For each `CONTEXT/*` file needing upgrade:

1. Read the file completely into memory.
2. Locate the existing `<!-- SCHEMA: ... -->` block (if any). It may span multiple lines; it ends at the closing `-->`.
3. Locate the existing `<!-- TEMPLATE ... -->` block (if any), also possibly multi-line.
4. Extract the content between these two blocks -- this is the user content, preserve it exactly.
5. Write the file back as: `[current schema header from File Header Generation section] + [preserved user content] + [current template block]`.

Use the exact schema and template text from the File Header Generation section of this prompt. New headers always carry the current `Version:` value from that section.

If a file has no existing schema header, add the current one at the top without altering existing content beneath it. Same for missing template blocks -- append at bottom.

**Special case -- `LESSONS.md` and `DECISIONS.md`:**
The current schemas describe the `Source:` and `Evidence:` optional fields for entries ratified from auto-loop observations. These fields are OPTIONAL on existing entries -- Upgrade Mode does not retroactively annotate prior entries. New entries going forward will use the fields per the new schema.

**Special case -- `observations.md` under `LOOP/<mode>/`:**
If any `LOOP/<mode>/observations.md` exists, its schema version bumps from 1 to 2 in v2. Replace the schema header only; preserve all Findings, Candidates, and Open Questions content byte-for-byte. The only observable change is the schema header version line.

#### Step 10 -- Upgrade adapters

For each adapter file (`CLAUDE.md`, `.cursor/rules/context-system.mdc`):

1. Read the file.
2. Detect state:
   - **Has `<!-- LOOP_ACCESS_RULES_V1 -->` marker**: already loop-aware. Skip this file. Report "adapter already v2-compliant."
   - **Has `<!-- ADAPTER_SCHEMA_V1 -->` but not `<!-- LOOP_ACCESS_RULES_V1 -->`**: append the Loop Access Rules section and the `<!-- LOOP_ACCESS_RULES_V1 -->` marker at the end of the file. Preserve everything above byte-for-byte.
   - **Neither marker present (pre-v2 adapter)**: full template replacement. Extract any project-specific customizations the user added (detect by diffing against v1 adapter shape; if too divergent, ask user before replacing). Rewrite the file using the current template from File Header Generation, re-incorporating user customizations where they fit.
   - **File does not exist**: create it from the template.

**Loop Access Rules section content** (for append case):

```markdown
## Loop Access Rules

<!-- LOOP_ACCESS_RULES_V1 -->

If this project contains `LOOP/<mode>/` directories, they are machine-owned territory for auto-loop ratchet experiments. Routine human work does not read or write `LOOP/*` except:
- `LOOP/<mode>/observations.md` during graduation review (tick `- [x]` to approve, delete entry to reject)

The meta-agent (the coding agent running the loop) owns `LOOP/<mode>/*` during loop runs. Graduation from `observations.md` Candidates to `CONTEXT/LESSONS.md` or `CONTEXT/DECISIONS.md` happens via the handoff flow, human-ratified only.

Do not hand-edit `program.md` during active sessions (it is the meta-agent's directive; edit only when redirecting the loop). Do not hand-edit `results.tsv`, `jobs/*`, or task files during experiments.
```

For `.cursor/rules/context-system.mdc`, match the file's existing heading style but include the same marker and content.

#### Step 10a -- Adapter template sync (Upgrade Mode only)

After Step 10, if either adapter has `<!-- ADAPTER_SCHEMA_V1 -->` but differs substantively from the current template in File Header Generation (sections missing, ownership rules stale), flag the differences for user confirmation. Do not auto-replace beyond the Loop Access Rules append from Step 10. Rationale: the adapter is the user's per-project routing layer; structural edits beyond the versioned marker append require user sign-off.

#### Step 11 -- Data-routing migration (per-item user consent)

This step only runs if Step 7 found `[GLOBAL]`-scoped lessons in the project's `CONTEXT/LESSONS.md` AND `{GLOBAL_ROOT}/CONTEXT/LESSONS.md` exists. Otherwise skip entirely.

The old schema co-located `[GLOBAL]` lessons inside the project's own `LESSONS.md`. The current schema puts truly-global lessons in `{GLOBAL_ROOT}/CONTEXT/LESSONS.md`. The upgrade cannot auto-decide which existing `[GLOBAL]` entries are truly global versus mis-scoped, so this step asks per-item.

For each `[GLOBAL]`-tagged entry in the project's `CONTEXT/LESSONS.md`:

1. Show the entry to the user in full (title, lesson, context, affirmations).
2. Ask: "This is currently `[GLOBAL]` in project LESSONS.md. Under the current schema, genuinely global lessons belong in `{GLOBAL_ROOT}/CONTEXT/LESSONS.md`. Options:
   - **Migrate** -- move this entry to the global file. Removes from project LESSONS.md.
   - **Keep as project** -- re-tag as `[PROJECT]` in place. The `[GLOBAL]` tag was broader than the pattern warranted.
   - **Leave as-is** -- keep `[GLOBAL]` tag in project LESSONS.md for now. Current schema will still accept this; you can decide later."
3. Apply the chosen action. Each action is idempotent and reversible:
   - **Migrate** -- append the entry to `{GLOBAL_ROOT}/CONTEXT/LESSONS.md` (preserving all fields including Affirmations), then remove from project `LESSONS.md`. If the entry already exists in the global file (by title match), skip and flag conflict.
   - **Keep as project** -- in-place edit: change `[GLOBAL]` to `[PROJECT]` on that entry's heading line. No other changes.
   - **Leave as-is** -- no action. Record in upgrade summary that the entry was reviewed and retained.

**Never migrate without explicit per-item consent.** "Migrate all" as a batch answer is acceptable if the user requests it; default is per-item review.

**Conflict handling:** If an entry in the project `LESSONS.md` has the same title as one already in `{GLOBAL_ROOT}/CONTEXT/LESSONS.md`, do not auto-merge. Show both, ask the user to choose: keep global version (delete project), keep project version (overwrite global), or keep both (append project version with disambiguating suffix).

**No mass data migration beyond `[GLOBAL]` lessons.** Upgrade Mode does not re-route `DECISIONS.md` entries, handoffs, or any other content. Only the one specific `[GLOBAL]` LESSONS case has a documented schema-level destination change.

#### Step 12 -- Update gitignore

If `{PROJECT_ROOT}` is a git repo and `.gitignore` lacks entries for `.context-migration/`, `.migration-recovery/`, or `CONTEXT/.upgrade-snapshot/`, append them with a brief comment:

```
# Scratch directories for context-system migration tooling
.context-migration/
.migration-recovery/
# Snapshot used by Upgrade-Mode byte-preservation verification (Step 13).
# Deleted on successful upgrade; persists if Step 13 detected user-content drift.
CONTEXT/.upgrade-snapshot/
```

Skip entirely if all entries already exist or if not a git repo.

#### Step 13 -- Verification

Pass only if ALL of these hold:

- Every `CONTEXT/*` file has a current schema header (matching `Version:` in File Header Generation) and template block.
- For each modified `CONTEXT/*` file and each modified adapter file, **diff-against-snapshot passes**: the only differences from the Step 7 snapshot are inside the `<!-- SCHEMA: ... -->` block, inside the `<!-- TEMPLATE ... -->` block, OR (for adapters) the appended Loop Access Rules section or full-template replacement with preserved customizations. Concrete procedure for each file:

  ```
  diff -u {PROJECT_ROOT}/CONTEXT/.upgrade-snapshot/{file} {PROJECT_ROOT}/CONTEXT/{file} \
    | awk '
        /^@@/ { in_hunk=1; hunk=""; ok=0; next }
        in_hunk && /^[+-]<!-- SCHEMA:/  { ok=1 }
        in_hunk && /^[+-]<!-- TEMPLATE/ { ok=1 }
        in_hunk && /^[+-]<!-- LOOP_ACCESS_RULES_V1/ { ok=1 }
        in_hunk && /^[+-]<!-- ADAPTER_SCHEMA_V1/ { ok=1 }
        in_hunk && /^[+-]## Loop Access Rules/ { ok=1 }
        in_hunk { hunk = hunk $0 "\n" }
        END { if (ok==0 && hunk != "") print hunk }
      '
  ```

  If the awk filter prints anything, user-content drift was detected; verification FAILS for that file.
- For any migration from Step 11: the migrated entry exists in `{GLOBAL_ROOT}/CONTEXT/LESSONS.md` AND has been removed from the project `LESSONS.md`. No entry should exist in both places (double-write is a failure).
- For any "keep as project" retag from Step 11: only the heading's `[GLOBAL]` -> `[PROJECT]` changed; no other edits to that entry. Verify by diffing the snapshot's entry block against the current entry block -- only the heading line should differ, and only in the scope tag.
- Both adapters (if they existed before or were created in Step 10) contain both `<!-- ADAPTER_SCHEMA_V1 -->` and `<!-- LOOP_ACCESS_RULES_V1 -->` markers.
- No file was deleted (compare `ls CONTEXT/` against snapshot's file list).
- If git repo: `.gitignore` contains all three migration/snapshot entries.

**On verification success:** delete the snapshot directory:

```
rm -rf {PROJECT_ROOT}/CONTEXT/.upgrade-snapshot
```

**On verification failure:** DO NOT delete the snapshot. Print its path and instruct the user: "Upgrade verification failed. Pre-upgrade snapshot preserved at `{PROJECT_ROOT}/CONTEXT/.upgrade-snapshot/`. Diff against the snapshot (`diff -u .upgrade-snapshot/<file> <file>`) to identify the unexpected change, restore manually if needed, and re-run upgrade after resolving. Do not delete the snapshot until you are satisfied the current state is correct."

If any check fails, report exactly what failed and what remains of the original file. The non-destructive guarantee means the upgrade must be reversible at every point -- a failed upgrade should leave the project in a state either identical to pre-upgrade (snapshot enables manual restoration) or recognizably partial. For Step 11 migrations specifically: if a migration fails mid-operation (entry copied to global but not yet removed from project, or vice versa), report the intermediate state so the user can manually resolve.

#### Step 14 -- Deliver summary

Return:

- List of files touched with the specific change type (schema replaced with version N -> M / template replaced / section appended / adapter fully replaced / no change)
- Confirmation that user content was preserved (cite a count: "preserved N lines of user content across M files")
- Migration summary from Step 11:
  - Count migrated to `{GLOBAL_ROOT}/CONTEXT/LESSONS.md`
  - Count re-tagged as `[PROJECT]` in place
  - Count left as-is with user review
  - Count of conflicts surfaced
- If adapters were already loop-aware: say so explicitly
- Next suggested action: run `LOOP_CREATION.md` to scaffold a specific mode under `LOOP/<mode>/`, OR resume normal work if no loop is planned yet

## Telegraphic Memory Style

Use compact ASCII writing in mutable memory files:
- short bullets: aim under 12 words each
- sentences under 20 words; no paragraphs
- state first, explanation second: first clause is the fact, any second clause is the why
- low-filler phrasing
- ASCII-only operators for cross-model efficiency and audit compatibility

ASCII operator legend (use only these in `CONTEXT/*`):
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

Do not use LaTeX math symbols, Unicode math symbols, box-drawing characters, fancy quotes, em-dashes, or en-dashes. These expand into byte-junk under BPE tokenization and degrade compression across Claude, Cursor, and other harnesses. Use ASCII hyphen `-` or double-hyphen `--` in place of dashes.

Use normal plain English in adapters:
- root `CLAUDE.md`
- module `CLAUDE.md`
- Cursor `.mdc` rules

Do not put dates in adapters unless the date itself is structurally meaningful. Dates belong in handoffs, decisions, completed work, and git history.

## Confidence Scoring

Use a three-level scale for all confidence claims in `DECISIONS.md` and `LESSONS.md`:

- `H` (high): directly verified by execution, tests, or explicit user confirmation. Requires an inline verification note.
- `M` (medium): inferred from strong evidence but not directly verified. Default level when verification is absent or stale.
- `L` (low): plausible but unverified; flag what would confirm it.

Plus one variant of `H`:

- `H-holdout`: same as `H` but specifically ratified by held-out task scoring during auto-loop graduation. Used on `DECISIONS.md` entries graduated from `LOOP/<mode>/observations.md` Candidates when `HANDOFF-LOOP.md` Step 2b ran `./run-holdout.sh` and the held-out metric moved in the same direction as the primary metric. Distinguishes structural verification (held-out passed) from `H`'s "human said yes" alone. Plain `H` is used when the Candidate predates holdout retrofit OR was promoted without holdout scoring.

Default to `M` unless verification is explicit and recent. `H` and `H-holdout` are only valid with a note that names the verification source and date.

Format grammar (regex-enforceable):

```
Confidence: H(-holdout)? -- <source>, verified YYYY-MM-DD
Confidence: M( -- <verification hint>)?
Confidence: L -- <what would verify>
```

Examples:

- `Confidence: H -- tests pass, verified 2026-04-16`
- `Confidence: H -- confirmed by user, verified 2026-04-16`
- `Confidence: H-holdout -- ratified from prompt-optimizer/v3, verified 2026-04-20`
- `Confidence: M`
- `Confidence: M -- verify by running integration test`
- `Confidence: L -- needs vendor confirmation`

In `DECISIONS.md`, confidence is mandatory on every entry. In `LESSONS.md`, include confidence only when the lesson is inferred rather than explicitly stated by the user.

## Schema Versioning

Every canonical schema header carries a `Version: N` line on its second line (immediately after `<!-- SCHEMA: <name>`). The version exists so Upgrade Mode can detect drift precisely instead of grep-fuzzy-matching field names.

Rules:

- Current version of every schema is listed in the File Header Generation section. Baseline is `Version: 1` for TODO/DECISIONS/ARCHITECTURE/LESSONS/handoff/archive; `Version: 2` for `observations.md` (bumped from 1 at v2 due to status-enum change affecting Evidence format).
- The version increments only on a **field-level schema change**: adding, removing, or renaming a field; changing the type or format of an existing field. Style changes, doc-wording clarifications, and rule re-orderings do NOT bump the version.
- A schema header with no `Version:` line is treated as `Version: 0` (pre-versioning era) for upgrade comparison.
- Step 0 reads each project schema's version, compares against current. If `project < current`, mark for upgrade. If `project > current`, stop and report version mismatch (do not downgrade -- the user needs the newer spec).
- Upgrade-Mode Step 9 always writes the current version into the replaced header. User content between header and template is preserved byte-for-byte; only the header (and template) change.

When you bump a schema version, also update the corresponding example in this prompt's File Header Generation section to carry the new `Version:` value, and document the field-level change in this prompt's commit message so Upgrade Mode runs against existing projects pick up the diff intent.

## Canonical File Contracts

### `TODO.md`
- Sections: `Active`, `Blocked`, `Verification`, `Completed`.
- `Active` owns the ordered worklist and next step.
- `Blocked` owns current blockers only.
- `Verification` owns latest validation, missing validation, and known risks.
- `Completed` keeps up to 5 recent completed items.
- If you catch yourself writing rationale history in `TODO.md`, move the sentence to `DECISIONS.md`. If you catch yourself writing architecture notes here, move them to `ARCHITECTURE.md`.

### `DECISIONS.md`
- Record durable product, architecture, and workflow decisions only.
- Reverse chronological, newest first.
- Include rationale and a Confidence level (`H`, `M`, or `L`) on each decision.
- Mark invalidated entries `Superseded`; do not erase history.
- Rejected alternatives may be noted under a decision when they are likely to resurface or when the rejection rationale would save re-litigation later.
- Optional `Source:` field when the decision originated from an auto-loop observation. Values: `human` (default, omit) or `meta-agent-ratified`. Unratified proposals stay in `LOOP/<mode>/observations.md` Candidates; they do not enter DECISIONS.md until the human affirms them.
- Optional `Evidence:` field linking a decision to the run that produced the signal. Format: `<mode>/<tag> (<metric>: <value>)`. One line, reference only, never copy trace contents.
- If you catch yourself writing temporary plans, unresolved questions, or task checklists here, move them to `TODO.md`.

### `ARCHITECTURE.md`
- Capture current structure, boundaries, flows, and integrations.
- Keep it concise enough to rescan quickly.
- Overwrite the snapshot instead of appending.
- If you catch yourself writing task state here, move to `TODO.md`. Rationale history belongs in `DECISIONS.md`; user preferences belong in `LESSONS.md`.

### `LESSONS.md`
- Store durable user preferences, repeated pitfalls, and workflow corrections.
- Scope entries clearly, such as `[GLOBAL]`, `[PROJECT]`, or `[MODULE: {module-name}]`.
- Include a Confidence level per the Confidence Scoring section (only when the lesson is inferred rather than explicitly stated).
- Each entry carries `Affirmations: N` starting at 0. Increment on user restatement or recurrence. Graduate at 2 per the Graduation And Retirement rule.
- Optional `Evidence:` field when the lesson originated from an auto-loop observation. Same format as DECISIONS.md: `<mode>/<tag> (<metric>: <value>)`.
- Do not log one-off chat trivia. If you catch yourself duplicating normal project state from `TODO.md` or `DECISIONS.md`, remove the duplicate.

### `handoffs/*.md`
- Session continuity only.
- Keep only the current handoff file. The prior handoff is deleted at end-of-session when the new handoff is written.
- Naming: `YYYY-MM-DD-{short-slug}.md`.
- Keep them concise, state-oriented, and disposable.
- Do not duplicate full `TODO.md` or `DECISIONS.md` content.
- Include git and validation resume context when relevant.

## File Header Generation

Each canonical file gets a schema header at the top and a template at the bottom. These are HTML comments, invisible in rendered markdown, fully visible to any agent reading the raw file. The bootstrap writes the exact text below into each file on initialization or refresh. Preserve existing content between header and template when refreshing.

### `TODO.md` header

```
<!-- SCHEMA: TODO.md
Version: 1
Purpose: current worklist, blockers, verification state, recent completions.
Write mode: overwrite in place as status changes. Not append-only.

Sections (in order):
- Active: ordered list of current work. Top item is the next step.
- Blocked: items waiting on external dependencies or user input.
- Verification: what has been validated, what is missing, known risks.
- Completed: up to 5 most recent completed items. Older items drop off.

Rules:
- Bullets under 12 words, sentences under 20 words, no paragraphs.
- ASCII operators only (see Operator Legend in PROJECT_MEMORY_BOOTSTRAP.md).
- If you catch yourself writing rationale, move it to DECISIONS.md.
- If you catch yourself writing architecture notes, move them to ARCHITECTURE.md.
- If you catch yourself writing preferences, move them to LESSONS.md.
- Items graduate to Completed when done and verified. Durable rationale
  moves to DECISIONS.md.
-->
```

### `TODO.md` template

```
<!-- TEMPLATE
## Active
- [task] -- next step: [concrete action]
- [task] -- blocked by [item in Blocked]

## Blocked
- [task] -- waiting on [external or user] -- since [YYYY-MM-DD]

## Verification
- Last validated: [what was checked, how, date]
- Missing validation: [what still needs checking]
- RISK: [known risk, impact]

## Completed
- [YYYY-MM-DD] [task] -- verified by [test or user confirmation]
-->
```

### `DECISIONS.md` header

```
<!-- SCHEMA: DECISIONS.md
Version: 1
Purpose: durable product, architecture, and workflow decisions with rationale.
Write mode: append new entries at the top. Reverse chronological.

Rules:
- Newest entries at the top.
- Every entry has: date heading, decision title, rationale, Confidence level.
- Confidence scale: H (high), M (medium), L (low).
- Confidence grammar (regex-enforceable):
    Confidence: H(-holdout)? -- <source>, verified YYYY-MM-DD
    Confidence: M( -- <verification hint>)?
    Confidence: L -- <what would verify>
- Confidence: H-holdout is used on entries graduated from auto-loop with
  held-out task scoring passing. Use plain H if the mode predates holdout
  retrofit or the Candidate was promoted without holdout scoring.
- Confidence: M is the default when verification is absent or stale.
- Optional Source field: human (default, omit) or meta-agent-ratified.
  Used when the decision came from auto-loop observation rather than direct human choice.
  Unratified proposals live in LOOP/<mode>/observations.md Candidates, not here.
- Optional Evidence field: <mode>/<tag> (<metric>: <value>). Reference only.
  Links a decision to the run that produced the signal.
- Invalidated entries get marked `Superseded` but stay in the file. Do not erase.
- Rejected alternatives may be noted under the decision when they are likely to
  resurface or when the rejection rationale saves future re-litigation.
- If you catch yourself writing temporary plans, open questions, or task
  checklists, move them to TODO.md.
- Bullets under 12 words, sentences under 20 words, no paragraphs.
- ASCII operators only.
-->
```

### `DECISIONS.md` template

```
<!-- TEMPLATE
## YYYY-MM-DD -- [Decision title]
Decision: [one sentence statement of what was decided]
Rationale: [one to three sentences on why]
Confidence: H -- [source], verified YYYY-MM-DD
(or Confidence: M)
(or Confidence: L -- [what would verify])

Rejected alternatives (optional):
- [alternative] -- rejected because [reason]

## YYYY-MM-DD -- [Older decision, still valid]
...

## YYYY-MM-DD -- [Decision ratified from auto-loop observation]
Decision: [one sentence statement]
Rationale: [one to three sentences]
Confidence: H-holdout -- ratified from <mode>/<tag>, verified YYYY-MM-DD
Source: meta-agent-ratified
Evidence: <mode>/<tag> (<metric>: <value>)

## YYYY-MM-DD -- [Old decision] (Superseded by YYYY-MM-DD)
...
-->
```

### `ARCHITECTURE.md` header

```
<!-- SCHEMA: ARCHITECTURE.md
Version: 1
Purpose: current structure, boundaries, flows, and integrations.
Write mode: overwrite the snapshot. Do not append history.

Rules:
- Snapshot of the system as it is now. Not a log of how it got here.
- Concise enough to rescan quickly. Long details belong in reference docs.
- Describe components, flows, integrations, and boundaries.
- If you catch yourself writing task state, move it to TODO.md. Rationale
  history belongs in DECISIONS.md; preferences belong in LESSONS.md.
- Bullets under 12 words, sentences under 20 words, no paragraphs.
- ASCII operators only.
- Update on structural change, not on routine progress.
-->
```

### `ARCHITECTURE.md` template

```
<!-- TEMPLATE
## Overview
- [one line stating what this system is]

## Components
- [component] -- [purpose] -- [key files or dirs]
- [component] -- [purpose] -- [key files or dirs]

## Flows
- [flow name]: [start] -> [middle] -> [end]

## Integrations
- [external system] -- [how we talk to it] -- [owned by us or them]

## Boundaries
- In scope: [what this system owns]
- Out of scope: [what it does not]
-->
```

### `LESSONS.md` header

```
<!-- SCHEMA: LESSONS.md
Version: 1
Purpose: durable user preferences, repeated pitfalls, and workflow corrections.
Write mode: append new entries. Update Affirmations counter on recurrence.

Rules:
- Each entry scoped with [GLOBAL], [PROJECT], or [MODULE: {module-name}].
- Each entry carries Affirmations: N starting at 0.
- Increment Affirmations when the user restates the lesson or the same
  correction recurs in a later session.
- Graduate to the root adapter when Affirmations reaches 2, OR when its
  absence caused a repeated failure class that cost real time.
- Confidence level only when the lesson is inferred rather than explicitly
  stated by the user. Same H/M/L scale as DECISIONS.md (same grammar).
- Optional Evidence field when the lesson came from auto-loop observation.
  Format: <mode>/<tag> (<metric>: <value>). Reference only.
- Optional Source field: graduated-from-project (cross-project graduation)
  or meta-agent-ratified (auto-loop observation). Default human (omit).
- Optional Origin field: short name(s) of the project(s) the lesson originated
  in. Used on globally-graduated entries to preserve provenance.
- Do not log one-off chat trivia.
- If you catch yourself duplicating state from TODO.md or DECISIONS.md,
  remove the duplicate.
- Bullets under 12 words, sentences under 20 words, no paragraphs.
- ASCII operators only.
-->
```

### `LESSONS.md` template

```
<!-- TEMPLATE
## [GLOBAL] -- [Lesson title]
Lesson: [what to do or avoid, in one sentence]
Context: [when it applies]
Affirmations: 0

## [PROJECT] -- [Lesson title]
Lesson: [what to do or avoid]
Context: [when it applies]
Affirmations: 1
(Graduates to root adapter at Affirmations: 2)

## [MODULE: auth] -- [Lesson title, inferred]
Lesson: [what to do or avoid]
Context: [when it applies]
Confidence: M -- [what would verify]
Affirmations: 0

## [PROJECT] -- [Lesson ratified from auto-loop]
Lesson: [what to do or avoid]
Context: [when it applies]
Affirmations: 0
Source: meta-agent-ratified
Evidence: <mode>/<tag> (<metric>: <value>)

## [GLOBAL] -- [Lesson graduated from cross-project pattern]
Lesson: [what to do or avoid]
Context: [when it applies]
Affirmations: 0
Source: graduated-from-project
Origin: [project-a, project-b]
-->
```

### handoff file header

Handoff files get a schema header only. No template; the handoff prompt defines the full shape.

```
<!-- SCHEMA: handoff
Version: 1
Purpose: session continuity for the next chat. Ephemeral.
Write mode: one file at a time. Prior handoff deleted when new one is written
             via atomic rename (write .tmp then mv).

Rules:
- Filename: YYYY-MM-DD-{short-slug}.md
- Required sections defined in HANDOFF.md (lite) or HANDOFF-LOOP.md (full).
- Do not duplicate full TODO.md or DECISIONS.md content; reference them.
- Do not restate adapter content. Do not become another adapter layer.
- ASCII operators only.
-->
```

### `archive/README.md` header (created lazily on first archival)

Rule: when the Ongoing Write flow first archives a doc into `CONTEXT/archive/`, also write `CONTEXT/archive/README.md` from this template if absent. This avoids a specified-but-unwritten artifact.

```
<!-- SCHEMA: archive/
Version: 1
Purpose: historical routing, integration, or decision docs with learning value.
Write mode: write once, do not update.

Rules:
- Filename: YYYY-MM-{short-slug}.md (month prefix, not full date)
- Delete pure redundancy instead of archiving.
- Do not archive handoffs (the handoff retention rule handles them).
- Archived docs are not active memory. The agent reads them only when
  history is directly relevant to a current question.
-->
```

### Root adapter templates

Adapters are created fresh by Step 3 (fresh init) or replaced/appended by Step 10 (upgrade). Both templates carry `<!-- ADAPTER_SCHEMA_V1 -->` and `<!-- LOOP_ACCESS_RULES_V1 -->` markers so Upgrade Mode can detect state.

#### `CLAUDE.md` template

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

Write `CONTEXT/*` during normal work. Update `TODO.md` on status change. Update `DECISIONS.md` on durable direction change. Update `ARCHITECTURE.md` on structural change. Update `LESSONS.md` on durable preference or repeated pitfall. Write handoffs only on end-of-session request, atomically (`.tmp` then `mv`).

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

#### `.cursor/rules/context-system.mdc` template

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

Telegraphic ASCII. Bullets aim under 12 words. Sentences under 20. ASCII operators only (`!=`, `==`, `->`, `=>`, `in`, `not`, `and`, `or`, `blocked by`, `TODO:`, `RISK:`). No LaTeX, no Unicode math, no em-dashes, no en-dashes.

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
- Handoffs: end-of-session only, atomic write (`.tmp` then `mv`).

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

## Adapter Responsibilities

### Root adapter

The root adapter must:
- point the model to `CONTEXT/*` as canonical mutable memory
- default to the current project unless scope is genuinely ambiguous
- define non-overlapping ownership for the memory files
- define what to read at session start
- define when to re-read memory mid-chat
- define write triggers for each memory file
- define end-of-task sync behavior
- define module-adapter growth triggers
- define LOOP access rules behind the `<!-- LOOP_ACCESS_RULES_V1 -->` marker
- avoid storing dated, fast-changing project state
- stay thin, stable, and mostly static
- avoid live task state, handoff text, and decision history
- avoid depending on or restating the other harness's adapter
- define that the other harness's adapter is ignored during normal work except repair

Both root adapters must:
- point to the same `CONTEXT/*`
- stay thin, stable, and undated
- stay under 160 lines each
- avoid storing task lists, handoff text, or decision history
- avoid depending on each other
- avoid mirroring each other line-for-line

### Adapter Bloat Audit

Trigger an audit when either root adapter exceeds 160 lines. The threshold is 160 (not 150) to account for the `## Loop Access Rules` section that loop-aware adapters now carry as baseline. During audit:
- relocate code style rules to `ARCHITECTURE.md` or project conventions
- relocate project conventions to `LESSONS.md` scoped as `[PROJECT]`
- relocate any live state (task items, decisions, handoff content) to the appropriate `CONTEXT/*` file
- compress routing rules by referencing `CONTEXT/*` instead of restating its contents

Line count is a proxy, not a hard rule. If the adapter is under 160 lines but contains drift content, audit anyway.

Schema mismatches are hard-fails (missing marker, missing required section). Style violations (em-dash usage, over-long bullets) are soft-warns. Do not conflate them -- schema integrity is a correctness concern; style is hygiene.

### Module adapter

A module adapter must own only:
- module purpose
- key files
- local conventions
- local boundaries
- local dependencies
- local read triggers when they differ from project root

A module adapter must not own:
- project-wide task state
- decision history
- handoff content
- dated session notes

Module adapters should stay under 100 lines each.

## Module Growth Rules

Create a module adapter when one or more of these become true:
- the subtree has its own runtime, service, app shell, or deployment surface
- the subtree has distinct conventions or data shapes
- the subtree owns an external integration or cross-boundary contract
- the subtree contains 3 or more important source files that are repeatedly touched together
- the subtree appears repeatedly in active work, handoffs, or repeated mistakes

Retire or merge a module adapter when:
- the module is removed
- the module is merged into another boundary
- the local conventions are no longer distinct from root
- the adapter has become redundant with the root adapter

## Archive Structure

- `{CONTEXT_ROOT}/archive/` holds historical but inactive routing, integration, or decision documents that still have learning value.
- Naming: `YYYY-MM-{short-slug}.md` (year-month prefix, not full date, since archived docs are time-of-retirement markers rather than events).
- On first archival, also write `archive/README.md` from the schema template if absent. This makes the archive self-describing without requiring a dedicated bootstrap step.
- Delete pure redundancy. Archive only items with residual learning value.
- Do not archive handoffs. The handoff retention rule handles them.

## Ongoing Read Rules

- Boot read: `TODO.md`, `DECISIONS.md`, and `ARCHITECTURE.md`.
- Read `LESSONS.md` when user preferences, corrections, or repeated pitfalls may affect the approach.
- Read the current handoff only when resuming continuity or recovering a previous stop state.
- Re-read the relevant memory file when it changed, when scope shifts, when a contradiction appears, or before edits that depend on the current plan, decisions, or architecture.
- During routine work, read the current harness adapter plus `CONTEXT/*`, not the other harness's adapter.
- Read the other harness's adapter only during adapter repair or suspected adapter drift.
- Read a module adapter when working inside that module or crossing into its boundary.
- Do not read `LOOP/<mode>/*` during routine human work. The only exception is `LOOP/<mode>/observations.md` when reviewing meta-agent findings for graduation. All other `LOOP/*` files are machine-owned.

## Ongoing Write Rules

- Update `TODO.md` when task status, order, blockers, next steps, or verification state changes.
- Update `DECISIONS.md` when a durable direction is chosen or proven by implementation.
- Update `ARCHITECTURE.md` when structure, boundaries, flows, or integrations change.
- Update `LESSONS.md` when a durable preference, correction, or repeated pitfall emerges.
- Write handoffs only on explicit end-of-session or handoff requests, after syncing the main memory files. Always write atomically (`.tmp` then `mv`).
- On first write to `CONTEXT/archive/`, also write `CONTEXT/archive/README.md` from the schema template if absent.
- `CONTEXT/*` is the default write target during normal work.
- Do not update adapters during routine task progress.
- Update both root adapters only when routing, ownership, read/write behavior, or project structure changed.
- If one root adapter is repaired for drift, repair the other in the same task.
- Update or create module adapters only when module growth conditions are met or when local conventions materially changed.
- Do not write to `LOOP/<mode>/*` during routine human work. `program.md` is edited only when redirecting the loop (rare). `tasks/*` is frozen once initialized. All other `LOOP/*` files are meta-agent-owned and should never be hand-edited during a work session.

## Graduation And Retirement

- Repeated workflow corrections land in `LESSONS.md` first.
- Each `LESSONS.md` entry carries an `Affirmations:` counter, starting at 0. Increment when the user explicitly restates the rule or when the agent notices the same correction recurring in a later session.
- A `LESSONS.md` entry graduates into the root adapter when `Affirmations` reaches 2, OR when its absence has caused a repeated failure class that cost real time.
- Repeated module-local correction creates or strengthens a module adapter under the same rule.
- Candidates in `LOOP/<mode>/observations.md` graduate to `CONTEXT/LESSONS.md` or `CONTEXT/DECISIONS.md` on human affirmation via the transactional pending-file flow in `HANDOFF-LOOP.md` Step 2b. Ratified entries are marked `Source: meta-agent-ratified` with an `Evidence:` reference. Rejected candidates are deleted from `observations.md`, not archived.
- `[PROJECT]`-scoped `LESSONS.md` entries graduate to `{GLOBAL_ROOT}/CONTEXT/LESSONS.md` as `[GLOBAL]` only when the pattern is affirmed across projects. Single-project affirmation stays local.
- Superseded decisions stay in `DECISIONS.md` marked `Superseded`.
- Handoffs: keep only the current handoff; the prior handoff is deleted at end-of-session when the new handoff is written.
- `Completed` in `TODO.md` keeps the 5 most recent items.
- Historical but inactive routing or integration docs go to `{CONTEXT_ROOT}/archive/`.
- Purely redundant docs should be deleted, not preserved as clutter.

## Verification

Pass only if:
- `{CONTEXT_ROOT}/` exists and contains the canonical files.
- The files reflect current project state rather than stale template language.
- Each canonical file has its schema header at the top and template at the bottom per File Header Generation.
- File scopes are explicit and do not overlap.
- `TODO.md` includes `Verification` by default.
- Handoffs live under `{CONTEXT_ROOT}/handoffs/` with at most one current file.
- Both root adapters exist, point to the same `CONTEXT/*`, and carry both `<!-- ADAPTER_SCHEMA_V1 -->` and `<!-- LOOP_ACCESS_RULES_V1 -->` markers.
- Both root adapters are under 160 lines and define explicit read/write triggers without storing mutable project state.
- Cross-harness ignore rules are explicit.
- Module adapters exist only where justified by project growth, and are under 100 lines each.
- `CONTEXT/*` uses ASCII-only operators; no LaTeX, no Unicode math symbols, no em-dashes or en-dashes.
- `DECISIONS.md` uses the H/M/L confidence scale consistently with the regex-enforceable grammar.
- If the project is a git repo, `.gitignore` covers `.context-migration/`, `.migration-recovery/`, and `CONTEXT/.upgrade-snapshot/`.
- No helper template files are required.
- No extra routing or mirror files were introduced unless explicitly requested.

## Model Self-Check

Before delivering output, confirm:
1. Is `{PROJECT_ROOT}` correctly resolved (not the prompt file's directory)?
2. Did I pick the right mode (fresh / upgrade / no-op) based on Step 0's state check?
3. If Upgrade Mode: did I capture the snapshot before any write, and did the Step 13 diff-vs-snapshot pass for every modified file?
4. Are both root adapters under 160 lines and do they contain both `<!-- ADAPTER_SCHEMA_V1 -->` and `<!-- LOOP_ACCESS_RULES_V1 -->` markers?
5. Did I avoid touching handoffs, archive, and `LOOP/*`?
