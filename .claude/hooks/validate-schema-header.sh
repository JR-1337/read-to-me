#!/usr/bin/env bash
# PostToolUse hook: warn when a canonical CONTEXT/* file is written without
# its <!-- SCHEMA: <name> ... Version: N --> header.
#
# Fires on Edit + Write to CONTEXT/{TODO,DECISIONS,LESSONS,ARCHITECTURE}.md.
# PostToolUse cannot block (the write already happened); exits with code 1
# to surface the warning to the model so it can repair the header in the
# next turn.
#
# Why warn-not-block: schema headers are written by /bootstrap; routine
# edits should never touch them. If a write removed the header, the right
# fix is restoration, not rejection of the write itself (the rest of the
# write may be valid).
#
# Exit 1 = warning surfaced (PostToolUse non-blocking); Exit 0 = pass.
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
NAME=$(basename "$FILE")

case "$NAME" in
  TODO.md|DECISIONS.md|LESSONS.md|ARCHITECTURE.md) ;;
  *) exit 0 ;;
esac

case "$FILE" in
  */CONTEXT/$NAME|CONTEXT/$NAME) ;;
  *) exit 0 ;;
esac

[ -f "$FILE" ] || exit 0

if ! head -60 "$FILE" | grep -q "<!-- SCHEMA: $NAME"; then
  printf 'WARN: %s missing <!-- SCHEMA: %s --> header after write.\n' "$NAME" "$NAME" >&2
  printf 'Expected at top: <!-- SCHEMA: %s\\nVersion: N\\nPurpose: ...\\n-->.\n' "$NAME" >&2
  printf 'Restore from CONTEXT/.upgrade-snapshot/ or re-run /bootstrap.\n' >&2
  exit 1
fi

if ! head -60 "$FILE" | grep -qE '^Version: [0-9]+(\.[0-9]+)?$'; then
  printf 'WARN: %s schema header missing or malformed Version field.\n' "$NAME" >&2
  printf 'Expected line in schema block: Version: N\n' >&2
  exit 1
fi

exit 0
