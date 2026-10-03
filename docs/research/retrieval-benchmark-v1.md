# Long-text retrieval and benchmark findings

The largest immediate improvement came from indexing the whole source section. In a fixed development set of 12 paraphrase queries, the expected early-text section appeared in the top ten for 12 queries with chunking, versus 8 with a matched whole-section baseline. The same exercise exposed a separate Scripture candidate-selection failure and three early-text ranking regressions. These results justify correcting truncation; they do not establish best-in-class retrieval, theological correctness, or a model ranking.

The implementation and results are in draft PR #74. Deployment is pending. The separate [publication report](semantic-index-publication.md) describes the preceding Scripture integrity milestone.

## What changed

All three non-Scripture corpora now use the vendored q8 MiniLM encoder, mean pooling and normalization, and inputs of at most 384 tokens including special tokens. Splits preserve Unicode characters and exact UTF-16 offsets in whitespace-normalized source text. Adjacent excerpts overlap by up to 48 content tokens, adjusted to word boundaries when possible. The tokenizer checks every emitted input. This is a fixed initial chunking policy, not an optimized window size.

| Corpus | Original source units | Searchable excerpts | Units exceeding the 512-token encoder limit | Longest original unit |
| --- | ---: | ---: | ---: | ---: |
| Sayings of Jesus | 2,059 | 2,059 | 0 | 83 tokens |
| Early-text shelf | 614 | 887 | 105 | 3,627 tokens |
| Editorial framework summaries | 54 | 93 | 35 | 685 tokens |

Each result retains its original verse, section or framework identity. Search scores every excerpt, keeps the strongest one per source unit, and then applies the result limit. A long section therefore cannot occupy every result slot. Early-text results identify the winning excerpt and link to the existing section anchor; the reader does not yet scroll to or highlight the exact span.

One root manifest publishes all three corpora together. It binds immutable matrix and metadata artifacts to their source-file hashes, normalized-source hashes, exact excerpt hashes, tokenizer/model files, library version and embedding recipe. The browser verifies hashes, shapes and provenance before ranking, and failed requests remain retryable. Partial builds preserve all unselected corpora only when their current inputs and artifacts validate. Interrupted inference or publication leaves the prior manifest visible. Legacy flat files remain unchanged for older clients.

The new artifacts total about 2.76 MB before transport compression. Separately gzipped metadata and vector files total about 1.01 MB: sayings 650 KB, early texts 302 KB, frameworks 61 KB. These are local gzip measurements, not observed network-transfer or loading-time benchmarks. Repeated provenance hashes compress well; source-table normalization remains an option if metadata grows substantially.

## Reproducible evaluation

The frozen [36 cases](../../scripts/benchmarks/retrieval-cases.json) were authored from hosted sources before the first ranking run. Every case contains an expected target and an exact supporting quote with source hashes. Twelve early-text cases are paraphrases. Twelve exact-tail probes deterministically select approximately the final 180 characters of the twelve longest early sections. Twelve WEB paraphrases include nine cases from eight Protestant-canon books and three cases from additional books.

The [runner](../../scripts/benchmarks/run-retrieval.ts) uses the same ranking and candidate-book functions as the application. It compares chunked early-text vectors with newly computed whole-section vectors using the same q8 model, pooling, normalization and int8 quantization. That baseline isolates chunking; it is not a measurement of the legacy files' unspecified inference settings. WEB comparisons use the verified 81-book, 38,029-verse index, with the live 48-chapter/14-book funnel versus exhaustive verse ranking.

Run with Node 24 and the installed lockfile dependencies:

```sh
npm run data:corpus-embeddings
node --import tsx scripts/benchmarks/run-retrieval.ts
```

The runner validates sources, labels, recipes and artifact hashes before scoring. It saves [per-query ranks, top-five candidates, winning spans and provenance](retrieval-benchmark-v1.json). Baseline vectors are cached in the ignored `.cache/scripture-index-builds/benchmark/` directory with an input fingerprint and output checksum. Remove only that benchmark cache to repeat baseline inference. Model files are local; no API credentials or model downloads are required.

The measures count whether the **single known target** appears in the top 1, 5 or 10 results, and its reciprocal rank within the top ten (MRR@10). Alternative relevant results were not labeled. These are not precision or exhaustive recall scores. No pass threshold, reranker, chunk budget or query wording was tuned to the results.

| Query set | Variant | Target at 1 | Target in 5 | Target in 10 | MRR@10 |
| --- | --- | ---: | ---: | ---: | ---: |
| Early paraphrases, 12 | Whole section | 3/12 | 6/12 | 8/12 | 0.359 |
| Early paraphrases, 12 | Best excerpt per section | 8/12 | 11/12 | 12/12 | 0.790 |
| Exact-tail probes, 12 | Whole section | 1/12 | 3/12 | 4/12 | 0.151 |
| Exact-tail probes, 12 | Best excerpt per section | 9/12 | 10/12 | 11/12 | 0.780 |
| WEB paraphrases, 12 | Current candidate funnel | 7/12 | 9/12 | 10/12 | 0.667 |
| WEB paraphrases, 12 | Exhaustive verse ranking | 7/12 | 10/12 | 11/12 | 0.691 |

These are small, source-selected development cases authored by the implementation model. Human relevance review and an independent evaluation set are still required. A subsequent [Claude Code Opus 5 implementation review](../reviews/2026-09-05-corpus-claude-code.md) checked the baseline, published provenance and metric claims, and identified a framework UI integration regression. This code review does not establish the relevance judgments. The stored CPU timings describe one Apple M2 Max / Node 24 run. WEB ranking timings include exhaustive evaluation work and must not be presented as application latency. Browser inference can differ from the CPU run.

## Findings and recommendations

1. **Truncation was a material coverage defect; the new index corrects it.** The early-text paraphrase about recorded testimony against the shepherds moves its known target from rank 569 to 2; the Spirit analogy using hail and drops moves from 293 to 1. Every current normalized source character is covered by at least one verified input. Sayings and framework retrieval quality were not separately benchmarked in this set; their input coverage and artifact integrity were verified.

2. **The Scripture funnel can discard the best verse before it is searched.** “The divine Word becomes human and lives among us” ranks John 1:14 first under exhaustive scanning, but John is absent from the selected books. A single chapter mean can dilute an isolated passage's distinctive meaning. Candidate artifacts average 2.83 MiB across these queries, compared with 14.19 MiB for all verse matrices and reference files, excluding shared chapter/model assets and HTTP compression. The next retrieval experiment should compare multiple passage representatives per chapter and lexical candidates against this byte/quality tradeoff. Simply widening the funnel on these twelve queries would be tuning to a very small development set.

3. **Some failures belong to the encoder, not only candidate selection.** The suffering-servant paraphrase places Isaiah 53:5 at rank 114 even with all verses scanned. The expected verse is therefore outside the top ten regardless of funnel width. Compare lexical plus dense retrieval and a bounded reranker on a larger reviewed set before replacing the model. Keep the current local model as the baseline; this study does not compare or recommend a new winning model.

4. **Best-excerpt aggregation still has a length bias and regressions.** More excerpts give long sections more chances to score highly. The Didache food/idols target moves from rank 2 to 7; the Apocalypse of Paul editorial tail moves from 1 to 4; the Enoch 60 tail moves from 11 to 24. The last is the remaining exact-tail miss. Add short-section controls, difficult competing passages and reader-authored queries. Evaluate length-aware scoring or reranking without removing these failed cases.

5. **The source abstraction needs passage roles as well as offsets.** The longest sections include Latin material in Enoch 106 and modern editorial commentary appended to the Apocalypse of Paul. Treating every indexed paragraph as ancient translated narrative would be misleading. UI labels now say “hosted section,” and the group description acknowledges editorial notes. A subsequent data pass should distinguish primary text, translation, supplied heading, apparatus and editorial commentary; record language and edition per segment; and allow role/language filters. Exact matching of a Latin tail does not demonstrate reliable Latin semantic retrieval.

6. **Retrieval evidence needs a review process.** Retain source and edition boundaries in every future cross-reference assertion. Build a human-reviewed set with alternative relevant targets, ambiguous queries, empty-answer cases, multiple traditions and original-language material. Split development and held-out cases before comparing models. Report relevance, citation support, latency and download/memory cost separately. Embedding similarity alone remains insufficient to claim quotation, influence, doctrinal agreement or a previously undiscovered historical relationship.

## Verification and release

Publication tests cover full/no-op/partial builds, forced selected rebuilds, stale and corrupt unselected artifacts, missing provenance, inference failure, failure before manifest replacement, source drift, Unicode spans and actual tokenizer budgets across all shipped excerpts. Runtime tests cover parent deduplication before top-k, invalid shapes and hashes, malformed provenance, consistent manifest generations and retry after failed fetches. The browser test exercises opt-in, a deliberately corrupted matrix response, recovery, unique source-section results and a real reader link.

Local verification passed: lint, TypeScript, 561 unit tests, 38 smoke checks, and a production build. Browser verification passed 27 tests covering early-text artifact recovery, resonance, Scripture search, Find and reader navigation; one phone-only assertion is intentionally skipped in the desktop project. Manual inspection found a readable narrow-width result layout and no browser console warnings or errors. Hosted CI status is recorded in the PR. The benchmark and chunk index are one completed implementation milestone; human evaluation, hybrid retrieval, passage-role metadata, original-language quality and model/device comparisons remain open.
