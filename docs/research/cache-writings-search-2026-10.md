# Prepared-wording cache: local performance check

The server-side writings index now prepares source wording once per index row and query wording once per search. Bible concordance retrieval and meaning-search ranking retain their existing algorithms.

The cache retains ordered normalized tokens, literal and contraction-expanded phrase strings, and compact negation evidence. It avoids retained expanded token arrays and per-row word Sets. Each returned evidence result has a fresh mutable Set. A changed source-text value refreshes its cache entry; metadata, snippets, original postings, and ranking precedence retain their previous behavior.

## Matched diagnostic run

Run with Node 24: `npm run research:find:cache-benchmark -- --output .research/search-benchmark/cache-writings/report.json`.

Baseline: `833f637746a8e951eb1a34ee41b63f2eae8db117`. Both implementations were frozen before the run and used the same serialized 46,549-row corpus and 58 previously reported/development queries. Separate Node 24.20.0 subprocesses ran on an Apple M2 Max, Darwin 25.6.0, arm64. Each query had one warmup and five timed samples. No competing verification tests ran during the benchmark.

| Measurement | Baseline | Prepared cache |
| --- | ---: | ---: |
| Pooled warm-query median | 190.799 ms | 28.078 ms |
| Pooled warm-query p95 | 725.780 ms | 94.859 ms |
| Index construction, excluding disk loading | 1,029.716 ms | 1,720.740 ms |
| Additional retained index heap | 32.8 MiB | 115.2 MiB |
| Total measured heap after index construction | 101.6 MiB | 184.2 MiB |

Retained index heap increased by 82.4 MiB. Memory probes ran before query-output collection and after three explicit garbage collections. Loaded-row heap was identical in both subprocesses. Index storage is bounded by the number of rows; there is no global query cache.

All **405 complete returned result objects matched**, including ordered hits, snippets, match labels, negation evidence, edition metadata, totals, searched/dropped words, filters, and pagination. Coverage includes all 58 unfiltered first pages, representative second/last/clamped pages, matching kind/record/combined filters, and unknown filters. The report records corpus, fixture, source and result hashes.

These are local Node measurements, not browser/phone timings, visitor latency, or independently reviewed relevance judgments. The comparison does not exercise every possible filter/page combination. No provider operations, new embeddings, source-text edits, accepted relevance labels, or held-out adoption evaluation were involved.
