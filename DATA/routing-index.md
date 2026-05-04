<!-- SCHEMA: DATA/routing-index.md
Version: 6.3
Purpose: routing index for project-authoritative sources that live outside DATA/.
  Answers "where does this project keep its gold?" -- points at in-tree files
  (knowledge, schemas, rubrics, fixtures, traces, lineage snapshots) and
  external truth sources (vendor APIs, model versions, integration endpoints).
  Distinct from DATA/catalog.md, which inventories files INSIDE DATA/.

Write mode: written by drivers/DATA_CAPTURE_BOOTSTRAP.md Step 5 from the Step 3
  subagent scan. Refreshed by re-running /data-capture (refresh mode). Entries
  are append-or-edit; do not silently drop entries on refresh -- if a path no
  longer exists, mark `status: removed` rather than deleting the row.

Organizing axis: by the eight baseline capture categories (cls 1-8). Categories
  are classification labels (purpose), not folder names (location). One file may
  appear in multiple categories; emit one entry per (path, category) pair.

Entry fields (markdown bullet under a `### Category N: <name>` heading):
- path: repo-relative path or external integration name
- sensitivity: public | internal | pii | phi
- role: 1-clause sentence on what this source authoritatively provides
- notes: optional free-form -- use for anything that does not fit the above
  (version pins, retention policy, gitignore status, cross-references)

Required sections in the active file (in order):
1. Per-category map (### Category 1 ... ### Category 8). Categories with zero
   observable artifacts get a single `- (no observable artifacts; gap noted)` bullet.
2. ## External integrations -- vendor APIs, model versions, third-party
   endpoints. One bullet per integration. Distinct from in-tree paths.
3. ## Governance summary -- 3-5 lines on PHI/PII boundary, retention policy,
   tool-boundary doc location. Per-entry sensitivity is canonical; this section
   summarizes the policy, does not duplicate row-level flags.
4. ## Gaps -- which of the 8 categories returned zero artifacts. Forward-looking
   note only; not a TODO.

Refresh triggers (run /data-capture refresh when):
- New top-level directory added to the project
- New SKILL / PK / knowledge file family added
- Major schema change to a primary contract file (e.g. extraction schemas, DB)
- New external integration (replacement vendor or new API surface)
- Annual review (catch silent drift)

Rules:
- ASCII operators only.
- Emit one entry per (path, category) pair. A file appearing in multiple
  categories produces multiple entries; the per-category map is the primary
  navigation axis, so keep them separate.
- `role` is one clause; verbose explanations belong in `notes`.
- Refresh never silently deletes; mark status: removed instead.
- This file is human-and-agent readable; not parsed by validate-data-catalog.sh.
-->

# Data Routing Index -- TTS

Purpose: pointer map to project-authoritative sources outside DATA/. Reshaped 2026-04-30 from gold-sources-inventory.md to 8-category schema.

## Per-category map

### Category 1: Ground truth and rubrics

- path: js/chunker.js
  sensitivity: public
  role: canonical text sanitization set (markdown stripping, em-dash + double-hyphen to comma-pause, repeat-punct collapse, sentence boundary, MAX_BYTES 4500).
  notes: any sanitize regression detectable by diffing chunker output against a frozen snapshot.

- path: js/player.js
  sensitivity: public
  role: word-timing heuristic constants of record (base = sqrt(length); sentence-end bonus 1.6 for .!?; clause bonus 0.7 for ,;:).
  notes: highlight drift on punctuated text is the observable failure mode (DECISIONS 2026-04-20).

- path: js/api.js
  sensitivity: public
  role: Google Cloud TTS contract surface (synthesizeChunk request shape, listVoices response handling).
  notes: vendor changes are exogenous; gold = the current request/response shape this file encodes.

- path: js/settings.js
  sensitivity: public
  role: localStorage schema (api key, voice, rate, position pointer, history).
  notes: schema sovereignty -- field names and types immutable once set; unknown field on read = flag.

- path: js/audio-cache.js
  sensitivity: public
  role: IndexedDB cache shape; key = voice + rate + chunk hash.

- path: js/media-session.js + sw.js
  sensitivity: public
  role: MediaSession transport contract + service-worker shell version (rtm-shell-v6 current).
  notes: cache version bump per release is manual; drift breaks offline shell.

### Category 2: Representative inputs (fixtures / slices)

- path: index.html, manifest.json, icons/, css/app.css
  sensitivity: public
  role: PWA shell surface (layout, install flow).
  notes: regressions are visual; not loop-scorable without screenshot fixtures.

### Category 3: Behavioral / production traces

- (no observable artifacts; gap noted)

### Category 4: Metric bridge

- (no observable artifacts; gap noted)

### Category 5: Lineage (snapshots, API/doc versions)

- path: sw.js (rtm-shell-v6 cache version)
  sensitivity: public
  role: service-worker shell version pin; manual bump per release.

### Category 6: Cost / latency / reliability side signals

- (no observable artifacts; gap noted)

### Category 7: Governance (PII/PHI, retention, tool boundaries)

- path: (project-wide)
  sensitivity: public
  role: no PII in repo; user Google Cloud API key lives only in their browser localStorage; pasted text is ephemeral in browser memory + IndexedDB.

### Category 8: Negative and gaming probes

- (no observable artifacts; gap noted)

## External integrations

- Google Cloud Text-to-Speech API -- v1 endpoint contract. v1beta1 enableTimePointing deferred per DECISIONS 2026-04-20 (requires SSML mark rewrite in chunker).
- allorigins.win /raw?url= -- third-party CORS proxy for URL article extraction. Single point of failure; vendor-owned.
- Web Platform: SpeechSynthesis API (fallback path), MediaSession API (lockscreen controls), IndexedDB (audio cache), Web Audio (timing). Browser-vendor canonical; MDN doc surface.

## Governance summary

No PII or PHI in repo. User Google Cloud API key lives only in browser localStorage; never written to DATA/, never logged. Pasted text is ephemeral in browser memory + IndexedDB cache; out of scope for repo storage. Future trace capture (e.g. anonymized punctuation-distribution histograms) goes under DATA/traces/ with sensitivity: public only after redaction review.

## Gaps

- Categories 3, 4, 6, 8 -- no observable artifacts today. Forward-looking: chunker sanitize regression fixtures + word-timing drift samples are first-loop candidates; capture lands under DATA/fixtures/ + DATA/traces/ when allocated.

<!-- TEMPLATE
# Data Routing Index -- {project-name}

Purpose: pointer map to project-authoritative sources outside DATA/. Refreshed YYYY-MM-DD via /data-capture.

## Per-category map

### Category 1: Ground truth and rubrics
- path: tests/ground_truth.md
  sensitivity: internal
  role: extraction scoring baseline against held-out fixtures.
  notes: optional.

### Category 2: Representative inputs (fixtures / slices)
- path: tests/sample_transcript.txt
  sensitivity: internal
  role: representative input fixture for pipeline tests.

### Category 3: Behavioral / production traces
- (no observable artifacts; gap noted)

### Category 4: Metric bridge
- path: dashboard/metrics-spec.md
  sensitivity: internal
  role: maps tracked scalars to client-facing dashboards.

### Category 5: Lineage (snapshots, API/doc versions)
- path: data/db-backup-vN.sql
  sensitivity: phi
  role: versioned DB snapshot pre-migration.
  notes: gitignored.

### Category 6: Cost / latency / reliability side signals
- (no observable artifacts; gap noted)

### Category 7: Governance (PII/PHI, retention, tool boundaries)
- path: .gitignore
  sensitivity: public
  role: declares PHI exclusions and retention boundaries.

### Category 8: Negative and gaming probes
- path: tests/adversarial_inputs.txt
  sensitivity: internal
  role: stress-tests degenerate or adversarial inputs.

## External integrations

- Anthropic Claude Opus 4.7 -- extraction (tool_use, temp=0.0).
- Vendor API X -- description; API version pin.

## Governance summary

PHI: clients/{slug}/ and data/db.* (gitignored, off-repo retention at <path>). PII:
named-fixture content in tests/ (in-repo, see CONTEXT/TODO if cleanup queued).
Tool boundaries: docs/tool-policy.md or equivalent. Sensitivity flags on each
entry are canonical; this section summarizes the policy.

## Gaps

- Category 3, 6 -- no observable artifacts. Forward-looking: drop a path here when
  the project starts capturing behavioral traces or cost/latency scalars.
-->
