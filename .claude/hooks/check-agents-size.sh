#!/usr/bin/env bash
# PreToolUse hook: block AGENTS.md writes that would exceed the size cap.
#
# Caps (from specs/BOOTSTRAP_REFERENCE.md Adapter Responsibilities):
#   Root AGENTS.md   -- 12,000 chars
#   Module AGENTS.md --  8,000 chars (any nested AGENTS.md)
#
# Fires on Edit + Write to any path ending in /AGENTS.md. Computes the
# projected size after the write and rejects if over cap.
#
# Edit projection: for single-occurrence Edit, projected = current_size +
# (len(new) - len(old)). For replace_all the projection is the same delta
# applied once -- approximate, intentionally lenient: a replace_all that
# grows the file past cap will be caught on the next Edit/Write.
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
TOOL=$(printf '%s' "$INPUT" | jq -r '.tool_name // empty')
FILE=$(printf '%s' "$INPUT" | jq -r '.tool_input.file_path // empty')

case "$FILE" in
  */AGENTS.md|AGENTS.md) ;;
  *) exit 0 ;;
esac

# Determine cap.
# Module AGENTS.md = nested under the project root, i.e. NOT directly at the
# project root. Heuristic: a path that has a parent dir which itself has
# CONTEXT/ as a sibling is at the project root. Cheaper proxy: the file's
# parent dir contains CONTEXT/ -> root; otherwise -> module.
PARENT=$(dirname "$FILE")
if [ -d "$PARENT/CONTEXT" ]; then
  CAP=12000
  KIND=root
else
  CAP=8000
  KIND=module
fi

case "$TOOL" in
  Write)
    CONTENT=$(printf '%s' "$INPUT" | jq -r '.tool_input.content // empty')
    PROJECTED=${#CONTENT}
    ;;
  Edit)
    if [ ! -f "$FILE" ]; then
      # Edit on missing file - let the tool itself error.
      exit 0
    fi
    OLD=$(printf '%s' "$INPUT" | jq -r '.tool_input.old_string // empty')
    NEW=$(printf '%s' "$INPUT" | jq -r '.tool_input.new_string // empty')
    CURRENT_SIZE=$(wc -c < "$FILE" | tr -d ' ')
    PROJECTED=$(( CURRENT_SIZE + ${#NEW} - ${#OLD} ))
    ;;
  *) exit 0 ;;
esac

if [ "$PROJECTED" -gt "$CAP" ]; then
  printf 'BLOCKED: %s AGENTS.md write would exceed cap.\n' "$KIND" >&2
  printf 'File: %s\n' "$FILE" >&2
  printf 'Projected size: %s chars; cap: %s.\n' "$PROJECTED" "$CAP" >&2
  printf 'Action: trim AGENTS.md or move content into a module adapter (specs/BOOTSTRAP_REFERENCE.md Module Growth Rules).\n' >&2
  printf 'Bypass: export CONTEXT_HOOKS_DISABLED=1 in parent shell before launching harness (inline-prefix does not propagate).\n' >&2
  exit 2
fi

exit 0
