# Semantic search integrity and publication

This milestone restores omitted Scripture results and makes the WEB index reproducible and safe to rebuild in part. It does not establish retrieval quality or historical relationships. The subsequent [long-text indexing and retrieval benchmark](retrieval-benchmark-v1.md) extends publication integrity to the three other corpora and records a small, provisional evaluation.

## Coverage and interpretation

The chapter index contains 81 WEB books, 1,402 chapters, and 38,029 nonempty verses. The radar now assigns every indexed chapter to a corpus group. Gospel chapter narrative is separate from the overlapping sayings index. An additional-books group includes the 213 chapters in the 15 indexed books outside the Protestant canon; links select a tradition that actually contains the book and explicitly request WEB with `?t=web`.

Five hosted book IDs are absent from the WEB chapter index: LJE, SUS, BEL, ENO, and JUB. The interface lists these exclusions and their reason. This is a statement about indexed book IDs and editions; it does not imply that every passage is absent elsewhere in the hosted collections. Unknown future indexed IDs are reported as excluded until they have a registered group and reader route.

The nine groups compare chapter centroids, selected verses, translated early-text sections, and editorial framework summaries. Their score distributions have not been calibrated against one another. The interface reports raw approximate cosine similarity and a relative display scale, with no inferred historical timeline, match probability, or claim of influence. Empty/nonpositive groups show zero and no invented peak. The combined list contains up to four candidates from each group, ordered by raw score; it is not a global top-k over every source row. No relevance threshold is claimed: the zero cutoff only excludes nonpositive dot products.

## Build and publication contract

Use the repository's required Node 24 runtime and installed lockfile dependencies. No API key or remote model download is needed.

```sh
npm run data:embeddings
npm run data:neighbors
npm run data:health
npm run test:smoke
```

The embedding builder uses the vendored `Xenova/all-MiniLM-L6-v2` model with explicit `dtype: q8`, mean pooling, and normalization. The manifest binds the model configuration, tokenizer, q8 ONNX weights, Transformers.js version, preprocessing/quantization/centroid recipe, source-file bytes, and ordered verse references. Fresh and cached builds derive chapter centroids from the same quantized verse rows. Pooled Node Buffers are read using their actual byte offset and length.

Each shard is stored under `public/scriptures/semantic/objects/<sha256>.<bin|json>`. The manifest records its relative path, hash, and byte length. Valid objects are immutable; a corrupt object at an expected content address can be repaired from verified rebuilt bytes. The builder publishes the complete manifest with one same-filesystem rename after writing and validating its referenced objects. Failure before that point leaves the previous published manifest intact. Orphaned objects from interrupted builds are harmless and remain unreferenced.

A reader loads the manifest once and fetches the artifacts it names. The client verifies the manifest content digest as well as artifact hashes, matrix dimensions, book identity, and ordered references before ranking. The neighbor builder also rejects modified chapter metadata without a matching semantic release binding. It rejects incompatible manifests and resets failed manifest/artifact fetches for retry. This binds the Scripture index artifacts to each other; it does not version every linked reader page. The subsequent corpus milestone publishes sayings, early texts and frameworks together through their own verified root manifest.

## Partial and repeat builds

```sh
npm run data:embeddings -- --books=GEN,JHN
npm run data:embeddings -- --books GEN,JHN --force
npm run data:neighbors -- --books=GEN,JHN
```

Both `--books` syntaxes are accepted; missing, empty, duplicate, and unknown selections fail. A partial embedding build preserves every unselected book only after its current source, recipe, references, and output hashes pass validation. Missing legacy provenance, edits to an unselected book, or corrupt unselected artifacts require a full build. Same-count source edits invalidate the selected book's cache. The force flag recomputes only selected books when a selection is supplied.

Neighbor rankings depend on the complete chapter matrix. The neighbor manifest therefore contains one complete snapshot, including records with no neighbors, and binds the global semantic release, ordered chapter index, all relevant cross-reference hashes, and ranking parameters. A partial neighbor rebuild is a conservative regeneration/verification operation: it is permitted only when these global inputs are unchanged and the previous snapshot is complete and intact. Changed inputs require a full neighbor rebuild. The server suppresses a neighbor snapshot whose semantic release differs from the current index.

A repeated build with unchanged content preserves the release ID and timestamp. Source/canon/model drift during embedding, and semantic/cross-reference drift during neighbor computation, abort publication. Concurrent writers to the same index in a worktree are rejected.

## Locks, migration, and recovery

Locks live outside served files under the ignored `.cache/scripture-index-builds/` directory. If a killed process leaves a lock, the next run identifies its path. Inspect the recorded PID and confirm no build is running before removing that specific lock. Do not remove another active build's lock.

The new runtime uses only version-2 manifests and their referenced artifacts. Legacy flat verse/chapter and neighbor files are retained as transition artifacts, are not rebuilt, and are not used by this runtime. External scripts must migrate to manifest paths rather than keep reading the old flat paths. Clients running pre-migration JavaScript should reload when this change is deployed. Future removal of legacy files and unreferenced content-addressed objects needs an explicit retention policy; the builders do not delete a valid prior release's objects.

These guarantees cover process interruption and coherent reads of published index artifacts. They do not claim power-loss durability (`fsync` is not used), atomic publication across the entire site, or simultaneous publication of all independent corpus indexes. Run the build and verification gates before deploying the combined application and data change.

The non-Scripture corpus manifest at `/semantic-corpora/manifest.json` revalidates on each new HTTP cache use; its content-addressed `/semantic-corpora/objects/` files cache immutably for a year. A loader still pins one verified manifest for its session. The browser checks contiguous chunk metadata and artifact hashes; `scripts/smoke/corpus-publication.test.mjs` checks the final chunk reaches the actual normalized source's end. Browsers do not download every source text to repeat that completeness check. The current client supports the fixed 384-token chunk budget; changes to the recipe or budget require coordinated client compatibility, including clients holding older JavaScript.

Find navigation now reads `public/early/catalog.json`, generated directly from hosted source sections by `npm run data:early-catalog` and automatically during `prebuild`. The compact, committed catalog contains section identities and labels without vector rows. It is independent of the legacy embedding snapshots, so source insertions or reordered sections update Find without rewriting those snapshots. Regenerate it after changing early-text sources; the freshness smoke test compares it with the current sources. This catalog and the semantic manifest have separate publication steps and are deployed together with the built application.

## Browser recovery

A worker startup, asynchronous runtime, inference, message, or 90-second request timeout failure rejects pending and future requests, terminates the worker, and retries the query through inline inference. Failed inline initialization can be retried. Once a worker fails, the session uses inline inference until a page reload; this can be slower on low-powered devices. Timeout tuning and device profiling remain benchmark work.

A deep link starts model inference automatically only for a reader who already opted in. An explicit search records that choice. New readers see the approximate model download size before starting a search.

## Verification and remaining work

Regression coverage includes every actual indexed chapter; Gospel narrative as the highest synthetic result; additional-book reader routes and WEB selection; explicit unknown-ID exclusions; empty/nonpositive results; source/recipe/cache corruption; ordered references; Buffer offsets; complete partial builds; interrupted publication; concurrent locks; browser artifact validation; and worker failure/retry.

Final verification passed: lint, TypeScript, 554 unit tests, 29 smoke checks, and the production build; 9 browser tests cover resonance, search, and the chapter reader. Axe passed on the resonance entry page and the WEB Wisdom reader in light and dark themes; both scored 100 for Lighthouse accessibility. A manual phone-breakpoint check of live search results found no horizontal overflow or browser console errors. These checks establish behavior and integrity, not measured retrieval relevance.

The full local rebuild produced semantic release `ac0b8bce50b1ae9a937997b351be3fd06915e2a4bfe6663102e9b7a100e6c3c4` and neighbor release `8abccf6ff61adfdb02b0b162e596c78b470c0e7b70e01924a7ede192ae659f83` (8,407 links, 4,323 also connected by cross-references). Repeating selected-book builds preserved these releases.

The subsequent milestone adds a provisional known-target benchmark, long-section chunking, and consistent provenance/publication for sayings, early texts, and framework summaries. Still open: independent human relevance labels; query-to-passage relevance thresholds; hybrid retrieval; passage-role metadata; original-language evaluation; and model/device comparisons. The Scripture search funnel still selects up to 48 chapter candidates and 14 books before verse ranking, so full verse recall is not claimed. The older Find catalog's resonance description is a separate copy follow-up after the earlier investigation branch lands; its command/action descriptions and the resonance page itself are updated here.
