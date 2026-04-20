#!/usr/bin/env bash
# run.sh -- executes one batch of punct-cleaner experiments
# Usage: ./run.sh "<description of change>" [task-glob]
#   task-glob is optional. If given, only tasks matching the glob run (spot-check).
#   If omitted, all tasks under tasks/ run (full evaluation).

set -euo pipefail

DESC="${1:-(no description)}"
FILTER="${2:-*}"
MODE_DIR="$(cd "$(dirname "${BASH_SOURCE[0]}")" && pwd)"
cd "$MODE_DIR"

# Timer
START=$(date +%s)
TIMEOUT_SEC=$(( 5 * 60 ))

# Accumulator
TOTAL=0.0
COUNT=0
STATUS="keep"

# Iterate tasks
for TASK_DIR in tasks/$FILTER/; do
  [ -d "$TASK_DIR" ] || continue  # handle empty glob
  # Run the user-supplied runner command against this task.
  # {RUNNER_COMMAND} should reference ${TASK_DIR} and the mutable file.
  # Example substitution: `python judge.py "$TASK_DIR" --harness sanitize-rules.json`
  # TODO: replace the next line with the real command:
  RAW=$("$TASK_DIR/score.sh" 2>&1) || STATUS="crash"

  # Extract metric per stdout last line.
  # Default: take the last line of stdout as the numeric value.
  VAL=$(echo "$RAW" | tail -n 1)

  # Validate: must parse as a number. Non-numeric output means the scorer
  # failed or emitted something unexpected. Treat as crash, do not sum.
  if ! [[ "$VAL" =~ ^-?[0-9]+(\.[0-9]+)?$ ]]; then
    echo "WARN: non-numeric output from $TASK_DIR -- $VAL" >&2
    STATUS="crash"
    continue
  fi

  TOTAL=$(awk -v t="$TOTAL" -v v="$VAL" 'BEGIN{print t+v}')
  COUNT=$((COUNT+1))

  # Budget check
  NOW=$(date +%s)
  if [ $((NOW - START)) -gt "$TIMEOUT_SEC" ]; then
    echo "Budget exceeded after $COUNT tasks." >&2
    break
  fi
done

# Compute primary metric (mean across tasks; adjust if your metric differs)
if [ "$COUNT" -gt 0 ]; then
  METRIC=$(awk -v t="$TOTAL" -v c="$COUNT" 'BEGIN{printf "%.6f", t/c}')
else
  METRIC="0.0"
  STATUS="crash"
fi

# Log to results.tsv
SHA=$(git rev-parse --short HEAD)
SECONDARY="$COUNT"  # placeholder; replace with a second metric if relevant
printf "%s\t%s\t%s\t%s\t%s\n" "$SHA" "$METRIC" "$SECONDARY" "$STATUS" "$DESC" >> results.tsv

# Plateau detection: flag when the last 5 data rows are all non-keep.
# The meta-agent watches stderr for this signal and consults research.md on trigger.
# See program.md "Plateau response" section for the response protocol.
PLATEAU_N=5
DATA_ROWS=$(tail -n +2 results.tsv | wc -l)
if [ "$DATA_ROWS" -ge "$PLATEAU_N" ]; then
  NONKEEP=$(tail -n +2 results.tsv | tail -n "$PLATEAU_N" \
    | awk -F'\t' '$4!="keep"{c++} END{print c+0}')
  if [ "$NONKEEP" -ge "$PLATEAU_N" ]; then
    echo "PLATEAU_DETECTED: last $PLATEAU_N experiments all non-keep. Consult research.md before next experiment." >&2
  fi
fi

echo "=== run complete: $METRIC ($STATUS) ==="
