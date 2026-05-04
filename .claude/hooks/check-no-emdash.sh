#!/usr/bin/env bash
# PreToolUse hook: block non-ASCII operators in CONTEXT/* writes.
#
# Fires on Edit + Write. Inspects the new content (Edit.new_string or
# Write.content) for em-dash, en-dash, multiplication sign, smart quotes,
# Unicode math arrows/operators, and other non-ASCII operators per the
# operator legend in specs/BOOTSTRAP_REFERENCE.md (Telegraphic Memory Style).
#
# Exit 2 = blocking; Exit 0 = pass-through.
#
# Bypass: export CONTEXT_HOOKS_DISABLED=1 in the parent shell BEFORE launching
# the AI harness (inline shell-prefix on a single tool command does NOT propagate
# to the hook subprocess in Claude Code -- the hook reads its own env, not the
# Bash command's). Why: legitimate cases (e.g. archiving a quoted excerpt that
# contains the blocked chars) need a documented escape valve; the env var keeps
# the bypass auditable.

set -euo pipefail

if [ "${CONTEXT_HOOKS_DISABLED:-0}" = "1" ]; then
  exit 0
fi

# grep -P (PCRE codepoint patterns) is required. Without it, the em-dash check
# would silently pass everything. Probe with a known codepoint that should match.
if ! printf 'x' | grep -qP '\x{0078}' 2>/dev/null; then
  printf 'WARN: check-no-emdash.sh requires grep with PCRE (-P) support; non-ASCII operator check is INACTIVE on this system.\n' >&2
  printf 'Install GNU grep, OR export CONTEXT_HOOKS_DISABLED=1 in the parent shell before launching the harness, to silence.\n' >&2
  exit 1
fi

INPUT=$(cat)
TOOL=$(printf '%s' "$INPUT" | jq -r '.tool_name // empty')
FILE=$(printf '%s' "$INPUT" | jq -r '.tool_input.file_path // empty')

case "$FILE" in
  */CONTEXT/*|CONTEXT/*) ;;
  *) exit 0 ;;
esac

# Skip archive files - immutable snapshots may carry old chars.
case "$FILE" in
  */CONTEXT/archive/*|CONTEXT/archive/*) exit 0 ;;
esac

case "$TOOL" in
  Edit)  CONTENT=$(printf '%s' "$INPUT" | jq -r '.tool_input.new_string // empty') ;;
  Write) CONTENT=$(printf '%s' "$INPUT" | jq -r '.tool_input.content // empty') ;;
  *) exit 0 ;;
esac

[ -z "$CONTENT" ] && exit 0

HIT=$(printf '%s' "$CONTENT" | grep -no -P '[\x{2014}\x{2013}\x{00D7}\x{00F7}\x{2010}\x{2011}\x{2018}\x{2019}\x{201C}\x{201D}\x{2212}\x{2192}\x{2190}\x{2191}\x{2193}\x{221A}\x{2260}\x{2264}\x{2265}]' 2>/dev/null | head -3 || true)

if [ -n "$HIT" ]; then
  printf 'BLOCKED: non-ASCII operator in CONTEXT/* write.\n' >&2
  printf 'File: %s\n' "$FILE" >&2
  printf 'First hits (line:char):\n%s\n' "$HIT" >&2
  printf 'Operator legend: ASCII only (-- for em-dash, x for multiplication, ASCII quotes).\n' >&2
  printf 'Bypass: export CONTEXT_HOOKS_DISABLED=1 in parent shell before launching harness (with documented reason; inline-prefix does not propagate).\n' >&2
  exit 2
fi

exit 0
