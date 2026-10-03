# Cache prepared wording in writings search

Goal: reduce repeated normalization in the server-side writings index while preserving complete search results and source excerpts.

- [x] Add prepared query/text helpers with the existing string evaluator as a compatible wrapper.
- [x] Cache prepared paragraph wording beside postings; refresh when source text changes and reuse ordered query tokens for snippets.
- [x] Verify negation, contractions, Unicode, repeated words, source changes, and returned Set isolation.
- [x] Compare complete baseline/current results on all 58 diagnostics plus filters and pagination; measure warm latency, cold index cost, and retained heap on Node 24.
- [x] Run lint, typecheck, tests, and build (755 unit tests and 48 smoke tests passed).

Completion workflow: finish the audited task lifecycle, merge the feature PR, run the repository production release, and verify live writings results. The benchmark and resource tradeoff are recorded in `docs/research/cache-writings-search-2026-10.md`.

Scope: writings search only. Source data, ranking precedence, APIs, Bible concordance retrieval, and meaning-search ranking retain their current behavior. Prepared data is bounded by index rows; no global query cache is introduced.

Baseline: `833f637746a8e951eb1a34ee41b63f2eae8db117`. The investigation measured 46,549 rows and 58 development/reported queries. Performance claims require matched before/after measurements; browser or mobile gains are not inferred from Node timings.
