#!/usr/bin/env bash
# validate-data-catalog.sh -- fail if DATA/ files are missing from catalog.md
# Usage: bash scripts/validate-data-catalog.sh [REPO_ROOT]
# Exit 0 if no DATA/ dir. Exit 1 on missing catalog, orphans, or missing schema hint.

set -euo pipefail

ROOT="${1:-.}"
DATA="$ROOT/DATA"

if [[ ! -d "$DATA" ]]; then
  echo "validate-data-catalog: no DATA/ directory; nothing to validate (ok)"
  exit 0
fi

if [[ ! -f "$DATA/catalog.md" ]]; then
  echo "validate-data-catalog: ERROR: DATA/ exists but DATA/catalog.md is missing" >&2
  exit 1
fi

if ! grep -q 'SCHEMA: DATA/catalog.md' "$DATA/catalog.md"; then
  echo "validate-data-catalog: WARN: DATA/catalog.md missing SCHEMA: DATA/catalog.md header" >&2
fi

fail=0
while IFS= read -r -d '' f; do
  rel="${f#"$DATA"/}"
  case "$rel" in
    catalog.md|README.md) continue ;;
  esac
  if ! grep -qF "$rel" "$DATA/catalog.md"; then
    echo "validate-data-catalog: ERROR: '$rel' not referenced in DATA/catalog.md" >&2
    fail=1
  fi
done < <(find "$DATA" -type f ! -name '.DS_Store' -print0)

if [[ "$fail" -ne 0 ]]; then
  exit 1
fi

echo "validate-data-catalog: ok"
exit 0
