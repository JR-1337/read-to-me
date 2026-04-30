# DATA -- TTS

Project data plane for fixtures, traces, rubrics, and exports. Scaffolded
2026-04-30 cold-start (no LOOP yet); gold-sources rubric only.

- `catalog.md` is the inventory; every file under `DATA/` except this README
  and `catalog.md` must be referenced by a catalog entry.
- Run `bash scripts/validate-data-catalog.sh` from `{PROJECT_ROOT}` to check
  for orphans before commits that touch `DATA/`.
- Agents read `DATA/*` only for explicit LOOP work, `DATA_CAPTURE_BOOTSTRAP.md`,
  or an explicit `CONTEXT/TODO` line. Not on every session.
- No PII or PHI in repo. User-entered Google Cloud API key lives only in
  browser localStorage and never reaches this directory.
