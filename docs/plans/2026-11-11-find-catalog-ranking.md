# Find Cross-World Catalog, Ranking & Vocabulary Bridge Plan

- **Date:** 2026-11-11
- **Baseline Commit:** `06fddb31e7c9825054ed8b5e8ba11a90ff2bd6ae` (`master`)
- **Branch / Worktree:** `codex/find-catalog-ranking` (`/Users/vartny/.codex/worktrees/find-catalog-ranking/garovartabedian`)
- **Review Record:** `docs/plans/2026-11-11-find-catalog-ranking-review.md`

## Goal & Invariants

Upgrade `Find`'s cross-world destination catalog, scoring precision, Nave 1897 vocabulary bridges, and `/scriptures/search` handoff so that:
1. Every published corpus and case study across the site's 8 research worlds and portfolio routes can be jumped to directly from `FIND_CATALOG` without network round-trips or generative synthesis, while deferring the `FindOverlay` + `FIND_CATALOG` bundle out of the initial root-layout JS load via `FindOverlayGate`.
2. Short queries, accented names, and entity lookups (`"NIV"`, `"Paul"`, `"Tobit"`, `"Genesis"`, `"JobPilot"`, `"Gabriel"`, `"Saraqael"`, `"Teresa of Avila"`, `"resume"`, `"Zoroastrianism"`, `"Pilate Stone"`, `"Josephus"`, `"David and Goliath"`) rank the canonical destination ahead of incidental blurb mentions, and never match mid-word substrings (`"NIV"` must not match `"universe"`).
3. Everyday emotional/thematic queries in `search-expansion.ts` (`"loneliness"`, `"grief"`, `"abandoned"`, `"doubt"`, `"generous"`) map to populated Nave 1897 topics (`refCount > 0`) rather than dead cross-reference stubs (`COMFORT`, `CHARITY`, nonexistent `DOUBT`), and `related.ts` scores Nave sub-item labels against both direct and expanded vocabulary roots so `"loneliness"` surfaces consolation/forsakenness/friendship passages rather than `Deuteronomy 13:6–9`.
4. Submitting a query to `/scriptures/search` (`SearchRoom.tsx`) carries matching non-Scripture catalog destinations (`Places across the record`) outside `{result && ...}` when `scope !== "texts"`, so pressing `Enter` never strands cross-world matches even on reference or loading states.

## Files Modified / Created

- `src/lib/parallels/search-match.ts` — export `PARALLEL_MATRICES` with plain-text `aliases` alongside `MatchedParallel` metadata.
- `src/lib/site/find-catalog.ts` — add `foldFindText` (`NFD` diacritic stripping + `ø/œ/æ`), `aliases?: string[]`, deterministic registration of all 86 hosted Scripture books, 27 told stories (folding `SHELF_SITUATIONS` keywords into their referenced stories), 54 afterlife frameworks, angels/bands/demons, archaeological stones & historical witnesses (`public/jesus/history.json`), church faces, apostles sent roads + unplaced seats + Armenia note, Word ownership ledger + free hosted texts, 8 parallel matrices, Evidence Claim Lab cases, and 9 internal `/work/*` portfolio case studies/demos.
- `src/lib/site/find-surface.ts` — add `"book"` to `textKinds`.
- `src/lib/site/find-query.ts` — upgrade `scorePlace` with `foldFindText`, alias-vs-keyword hierarchy, word-boundary rules, primary-kind tie-breaking (including `"artifact"`), and sanitized `hit.context` in `relatedTopicGroup`.
- `src/lib/scriptures/search-expansion.ts` — replace zero-ref/missing Nave topic IDs (`COMFORT`, `DOUBT`, `CHARITY`) with populated Nave topics and add `"consolation"` to `loneliness`, `grief`, and `abandoned`.
- `src/lib/scriptures/related.ts` — include `expansionRoots` in sub-item overlap scoring and sort sub-items by `right.score - left.score || left.item.depth - right.item.depth || left.position - right.position`.
- `src/app/_components/FindOverlayGate.tsx` & `src/app/layout.tsx` — lazy-load `FindOverlay` (`next/dynamic`, `ssr: false`) on first keyboard shortcut (`⌘K`/`Ctrl+K`/`/`) or `subscribeFind` open event so root-layout initial JS carries zero catalog JSON.
- `src/app/_components/HashDisclosureOpener.tsx`, `src/app/jesus/history/HistoryRoom.tsx`, `src/app/evidence/EvidenceHome.tsx` — open and scroll to `#hash`-targeted `<details>` cards on load and `hashchange` while keeping both rooms Server Components.
- `src/app/scriptures/search/SearchRoom.tsx` — render `Places across the record` outside `{result && ...}` below `ParallelMatches`, filtering out `book`, `/scriptures/search`, and `/scriptures/parallels`, and wrapping links with `withFindContext`.
- `tests/find-query.test.ts` & `tests/scripture-search.test.ts` — unit tests for cross-world catalog coverage, word-boundary ranking, diacritic folding, Nave topic validity, and `loneliness` retrieval.
