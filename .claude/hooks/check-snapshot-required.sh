#!/usr/bin/env bash
# PreToolUse hook: block CONTEXT/* writes during /bootstrap upgrade mode
# unless the upgrade snapshot has been captured.
#
# Defense in depth for the Non-Destructive Guarantee in
# drivers/PROJECT_MEMORY_BOOTSTRAP.md. The snapshot capture lives in
# specs/BOOTSTRAP_UPGRADE_REFERENCE.md Step 7; if a write to CONTEXT/*
# fires before that step (e.g. an agent skipped ahead), the hook blocks
# at the keystroke instead of relying on prose discipline.
#
# Trigger:
#   - Marker file `.claude/.upgrade-in-progress` exists at project root.
#   - Snapshot dir `CONTEXT/.upgrade-snapshot/` does NOT exist.
# When both true, block any Edit/Write to CONTEXT/*.
#
# Marker lifecycle (specs/BOOTSTRAP_UPGRADE_REFERENCE.md):
#   - Step 7  writes marker (before snapshot capture).
#   - Step 7  captures snapshot.
#   - Step 14 verifies success -> deletes marker.
# A stale marker (left by a crashed run) blocks legitimately until the user
# either re-runs /bootstrap (which re-snapshots and clears) or manually
# deletes the marker after confirming snapshot integrity.
#
# Exit 2 = blocking; Exit 0 = pass-through.
#
# Bypass: export CONTEXT_HOOKS_DISABLED=1 in the parent shell BEFORE launching
# the AI harness (inline shell-prefix on a single tool command does NOT propagate
# to the hook subprocess in Claude Code).

set -euo pipefail

if [ "${CONTEXT_HOOKS_DISABLED:-0}" = "1" ]; then
  exit 0
fi

INPUT=$(cat)
FILE=$(printf '%s' "$INPUT" | jq -r '.tool_input.file_path // empty')

case "$FILE" in
  */CONTEXT/*|CONTEXT/*) ;;
  *) exit 0 ;;
esac

# Find project root. For absolute paths, walk up from FILE. For relative paths,
# fall back to cwd (Claude Code runs hooks from the project root).
case "$FILE" in
  /*) DIR=$(dirname "$FILE") ;;
  *)  DIR=$(pwd) ;;
esac
PROJECT_ROOT=""
while [ "$DIR" != "/" ] && [ "$DIR" != "." ] && [ -n "$DIR" ]; do
  if [ -d "$DIR/.claude" ] && [ -d "$DIR/CONTEXT" ]; then
    PROJECT_ROOT="$DIR"
    break
  fi
  DIR=$(dirname "$DIR")
done

[ -z "$PROJECT_ROOT" ] && exit 0

if [ ! -f "$PROJECT_ROOT/.claude/.upgrade-in-progress" ]; then
  exit 0
fi

if [ -d "$PROJECT_ROOT/CONTEXT/.upgrade-snapshot" ]; then
  exit 0
fi

printf 'BLOCKED: /bootstrap upgrade in progress with no snapshot.\n' >&2
printf 'Project root: %s\n' "$PROJECT_ROOT" >&2
printf 'Expected: %s/CONTEXT/.upgrade-snapshot/ (created by UPGRADE_REFERENCE Step 7).\n' "$PROJECT_ROOT" >&2
printf 'Run /bootstrap to resume the upgrade flow, or delete %s/.claude/.upgrade-in-progress if the prior run completed safely.\n' "$PROJECT_ROOT" >&2
exit 2
