# `scripts/` Directory Guide

Automation, data pipelines, verification gates, and local research tooling for
`garovartabedian.com`. Scripts are grouped into three buckets: **automated
build/test/release gates**, **on-demand data/media/research pipelines**, and
**archived one-off generators**.

All Node scripts target Node 24 (`.nvmrc` / `package.json#engines`).

## 1. Automated Build, Test & Release Gates

These run automatically via `npm run build` (`prebuild`/`postbuild`),
`npm run test`, `npm run test:a11y`, or `npm run release:production`.

| Path | Role | Primary npm scripts |
|---|---|---|
| `scripts/release/` | Local production release gate (`production.mjs`), staged-deployment Playwright & Thomas-reader verifiers (`browser.mjs`, `check-staged-thomas.mjs`, `staged-routing.mjs`, `early-round3-comparisons.json`), and release-record generator/verifier (`release-record.mjs`, `check-release-record.mjs`). | `release:production`, `data:release-record` |
| `scripts/site/` | Prebuild generators (`prepare-hermon.mjs`, `prepare-maplibre-worker.mjs`, `build-corpus-health.mjs`, `build-guide-record.mjs`, `build-site-xray.mjs`, `build-early-catalog.mjs`, `build-ai-legibility.ts`, `build-reading-paths.mjs`, `build-scripture-graph.mjs`), postbuild trace checks (`check-topic-image-trace.mjs`, `check-investigation-trace.mjs`, `check-thomas-parables-trace.mjs`), plus on-demand builders (`build-claims.mjs`, `build-corpus-embeddings.mjs`, `vendor-museum-art.mjs`, `build-resume.ts`, `build-knowledge-pipeline-onepager.ts`, `make-pdf.sh`, `check-embeds.mjs`). | `prepare:hermon`, `prebuild`, `postbuild`, `data:health`, `data:guide-record`, `data:xray`, `data:early-catalog`, `data:llms`, `data:paths`, `data:graph`, `data:claims`, `data:corpus-embeddings`, `data:art`, `data:map-worker`, `check:map-worker`, `check:embeds`, `resume:build`, `onepager:build` |
| `scripts/smoke/` | 15 repository & published-artifact integrity tests run as part of `npm run test` (site integrity, media audit, accessibility/button contracts, semantic index, early library, trace guards, research audio, Thomas parables). | `test:smoke`, `test` |
| `scripts/a11y/` | Parallel Playwright + axe-core + Lighthouse accessibility & contrast suite across all routes listed in `scripts/a11y/config.mjs`. | `test:a11y` |
| `scripts/browser/` | Shared graceful server teardown helper (`close-server.mjs`) used by browser runners. | (imported by runners) |
| `scripts/lib/` | Shared helpers for atomic publication (`atomic-publication.mjs`), child-process control (`child-control.mjs`), and guide validation (`guide-validation.mjs`). | (imported by scripts) |
| `scripts/check-voice.ts` | Recruiter/portfolio voice & claim-discipline lint gate run at the start of `npm run test:unit`. | `voice:check`, `test:unit` |
| `scripts/check-repo-health.sh` | Advisory `.git` vs `public/` binary-bloat check (warns when overwritten binary blobs inflate Git history). | manual (`bash scripts/check-repo-health.sh`) |

## 2. Active Data, Media & Research Pipelines

Run on demand when updating corpus texts, guides, imagery, audio companions,
or running local retrieval benchmarks.

| Path | Role | Entrypoints / docs |
|---|---|---|
| `scripts/scriptures/` | Core Scripture corpus pipeline (`build-data.mjs`, `build-originals.mjs`, `ingest-jubilees.mjs`, `charles-supplement.mjs`, `ingest-enoch.mjs`, `reconstruct-jubilees.mjs`, `build-doorways.mjs`, `build-nave.py`, `extract-words.mjs`), embeddings/neighbors (`build-embeddings.mjs`, `build-neighbors.mjs`), chapter-guide v2/v3 pipeline (`build-guides-v2.mjs`, `rebind-guide-grounding.mjs`, `stamp-guide-review.mjs`, `guide-validation.mjs`, legacy v1 `build-guides.mjs` kept for `tests/build-guides-safety.test.ts`), investigations (`build-investigations.ts`), word-bridge (`bridge/`), narration pipeline (`batch-narration.py`, `narration_pipeline.py`, `verify-narration.py`, `generate-narration.py`, `reference/`), and source snapshots (`sources/`). Note: `build-shelf.mjs` rebuilds `shelf.json` standalone, while `build-data.mjs` and `charles-supplement.mjs` also emit it atomically. (`generate-romans-v2.mjs` and `romans-data-{1,2}.mjs` are held here until `codex/grok-content-review` resolves.) | [`scripts/scriptures/README.md`](scriptures/README.md); `data:originals`, `data:jubilees`, `check:jubilees`, `data:embeddings`, `data:neighbors`, `data:guides`, `data:guides:rebind`, `data:bridge`, `bridge:draft`, `data:investigations`, `check:investigations`, `check:source-urls` |
| `scripts/early/` | Early Writings pinned-source acquisition (`acquire-expansion.py`, `extract-secret-book-james.py`, `sources/`), deterministic library importer (`import-library.mjs`), allusion builder (`build-allusions.mjs`), and section plate media lane (`gen-section-plates.py`, `copy-section-image.sh`, `build-section-manifest.mjs`). | `data:allusions`, `early:gen-sections`, [`docs/media-lanes.md`](../docs/media-lanes.md), [`docs/research/scripture-library-import.md`](../docs/research/scripture-library-import.md) |
| `scripts/jesus/` | Jesus world data builders (`split-words.mjs`, `build-life-lenses.ts`, `verify-attestation.mjs`) and life/stone plate media lanes (`copy-life-image.sh`, `build-life-manifest.mjs`, `copy-stone-image.sh`, `build-stones-manifest.mjs`). | `data:split-words`, `check:attestation`, [`docs/media-lanes.md`](../docs/media-lanes.md) |
| `scripts/parallels/` | Claim-matrix generators (`build-matrix.mjs`, `build-enoch-sources.mjs`, `build-enoch-matrices.mjs`), rights manifest (`build-rights-manifest.mjs`), provenance/witness helpers (`provenance.mjs`, `witness-metadata.mjs`), and prebuild validator (`validate-parallels.mjs`). | `data:parallels`, `check:parallels`, `data:rights` |
| `scripts/angels/` | Angels vocabulary lexicon builder (`build-lexicon.mjs`, `lexicon-terms.mjs`) and media plate lane (`copy-media-image.sh`, `build-media-manifest.mjs`). | `data:angels-lexicon`, [`docs/media-lanes.md`](../docs/media-lanes.md) |
| `scripts/apostles/` | Natural Earth 50m land/lake geometry baker (`build-map-land.mjs`) for committed `src/lib/apostles/map-land.json`. | manual (`node scripts/apostles/build-map-land.mjs <dir>`) |
| `scripts/church/` | Church road-links builder (`build-road-links.mjs`) and council plate media lane (`copy-council-image.sh`, `build-council-manifest.mjs`). | `data:road-links`, [`docs/media-lanes.md`](../docs/media-lanes.md) |
| `scripts/media/` | Shared media audit (`audit.mjs`, invoked by `scripts/smoke/site-integrity.test.mjs`), plate sizing/compression (`fit-plate.py`, `compress-jpgs.py`), and programmatic lane config (`lanes.mjs`). | `media:audit`, `media:compress`, `media:fit`, [`docs/media-lanes.md`](../docs/media-lanes.md) |
| `scripts/research/` | Local Jev editorial comparison CLI, private web workspace, retrieval/search benchmarks, and pilot fixture corpora (`pilot/`, `search-pilot/`). | [`scripts/research/README.md`](research/README.md); `research:jev*`, `research:find:*` |
| `scripts/research-audio/` | Local MLX listening-companion renderer, ASR repair/verifier, and live audio check. | [`scripts/research-audio/README.md`](research-audio/README.md) |
| `scripts/bench/` & `scripts/benchmarks/` | Local library-search cache/responsiveness benchmarks (`library-search.ts`, `semantic-responsiveness.ts`) and versioned retrieval benchmark runner (`run-retrieval.ts`, `retrieval-cases.json`, tested by `tests/retrieval-benchmark.test.ts`). | `research:find:cache-benchmark`, [`docs/research/retrieval-benchmark-v1.md`](../docs/research/retrieval-benchmark-v1.md) |
| `scripts/reading/` | Reading layout typography/measure auditor (`audit-layout.ts`). | `reading:audit` |
| `scripts/social/` | Standalone Romans 8 promo video/card renderer (`build-romans-8-promo.mjs`). | `social:romans8` |

## 3. Archived One-Off Generators

| Path | Role |
|---|---|
| `scripts/archive/` | Retired one-off generators guarded with `--allow-archived-overwrite` and excluded from active `site-xray.json` build-script counts. See [`scripts/archive/README.md`](archive/README.md). |
