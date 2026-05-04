#!/usr/bin/env bash
# PreToolUse hook: block destructive removal of CONTEXT/.
#
# Matches `rm` invocations with a recursive flag (r/R) targeting CONTEXT/
# or CONTEXT/<anything>. Catches the common shapes:
#   rm -rf CONTEXT/
#   rm -fr CONTEXT
#   rm -rf ./CONTEXT/sub
#   rm -rf "$PROJECT/CONTEXT"
#   cd proj && rm -rf CONTEXT/
#
# Word-boundary anchored: rm -rf CONTEXT.bak would not match.
# Also catches CONTEXT/.upgrade-snapshot/ (a subdir) -- intentional, since
# snapshot deletion outside the upgrade flow is also data loss.
#
# Exit 2 = blocking; Exit 0 = pass-through.
#
# Bypass: CONTEXT_HOOKS_DISABLED=1.

set -euo pipefail

if [ "${CONTEXT_HOOKS_DISABLED:-0}" = "1" ]; then
  exit 0
fi

# grep -P (PCRE) is required for the negative-lookahead in the rm pattern.
# Probe with a known PCRE-only feature.
if ! printf 'x' | grep -qP 'x(?!y)' 2>/dev/null; then
  printf 'WARN: block-rm-rf-context.sh requires grep with PCRE (-P) support; rm -rf CONTEXT/ check is INACTIVE on this system.\n' >&2
  printf 'Install GNU grep or run with CONTEXT_HOOKS_DISABLED=1 to silence.\n' >&2
  exit 1
fi

INPUT=$(cat)
CMD=$(printf '%s' "$INPUT" | jq -r '.tool_input.command // empty')

[ -z "$CMD" ] && exit 0

# Match: rm followed by flags containing r or R, then anything ending at CONTEXT
# as a path component (followed by /, end-of-string, whitespace, or a quote).
# PCRE negative lookahead prevents false positives on CONTEXT.bak, CONTEXT_OLD,
# CONTEXTUAL, etc. Allow short or long flags: -r, -R, -rf, -fr, -rfv, --recursive.
if printf '%s' "$CMD" | grep -qP '\brm\b[^&|;]*(-[a-zA-Z]*[rR][a-zA-Z]*|--recursive)\b[^&|;]*\bCONTEXT(?![A-Za-z0-9_.])'; then
  printf 'BLOCKED: destructive removal of CONTEXT/.\n' >&2
  printf 'Command: %s\n' "$CMD" >&2
  printf 'CONTEXT/ holds canonical project memory (TODO, DECISIONS, LESSONS, ARCHITECTURE, handoffs, drift-reports).\n' >&2
  printf 'If you intend deletion, run the rm directly in a shell with CONTEXT_HOOKS_DISABLED=1.\n' >&2
  exit 2
fi

exit 0
