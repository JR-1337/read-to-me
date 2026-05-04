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
# Bypass: export CONTEXT_HOOKS_DISABLED=1 in the parent shell BEFORE launching
# the AI harness (Claude Code spawns hook subprocesses with its own env, so an
# inline shell-prefix on a single tool command -- e.g. `CONTEXT_HOOKS_DISABLED=1
# rm -rf ...` -- does NOT propagate to the hook). Alternative for legitimate
# one-off deletions: rephrase the command to not match the regex (e.g. use
# `find PATH -delete` instead of `rm -rf PATH`); the hook only matches `rm`
# invocations with a recursive flag.

set -euo pipefail

if [ "${CONTEXT_HOOKS_DISABLED:-0}" = "1" ]; then
  exit 0
fi

# grep -P (PCRE) is required for the negative-lookahead in the rm pattern.
# Probe with a known PCRE-only feature.
if ! printf 'x' | grep -qP 'x(?!y)' 2>/dev/null; then
  printf 'WARN: block-rm-rf-context.sh requires grep with PCRE (-P) support; rm -rf CONTEXT/ check is INACTIVE on this system.\n' >&2
  printf 'Install GNU grep, OR export CONTEXT_HOOKS_DISABLED=1 in the parent shell before launching the harness, to silence.\n' >&2
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
  printf 'If you intend deletion: (a) export CONTEXT_HOOKS_DISABLED=1 in the parent shell BEFORE launching the harness (inline-prefix on a single tool command does NOT propagate to the hook subprocess), OR (b) use `find PATH -delete` instead of `rm -rf PATH` (the hook only matches recursive `rm`).\n' >&2
  exit 2
fi

exit 0
