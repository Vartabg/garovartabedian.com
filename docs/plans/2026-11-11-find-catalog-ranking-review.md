# EGM Design Review Record — `2026-11-11-find-catalog-ranking`

- **Reviewer:** Fresh-context `research` subagent (`EGM Design Reviewer (Unit 1)`)
- **Baseline Commit:** `06fddb31e7c9825054ed8b5e8ba11a90ff2bd6ae`
- **Plan Reviewed:** `docs/plans/2026-11-11-find-catalog-ranking.md`

## Material Blockers & Dispositions

1. **`href` deduplication collision between `Genesis` (`/scriptures/protestant/GEN/1`) and `READING_PATHS` (`where-it-starts`), plus `SHELF_SITUATIONS` having no standalone `href`**
   - **Disposition:** **Accepted & revised.**
   - **Action:** Register the 86 hosted Scripture books before `READING_PATHS`, point `READING_PATHS` entries whose `steps[0]?.href` collides with an existing catalog route to `${firstHref}#v1` (for chapter routes) or merge keywords when identical, and fold `SHELF_SITUATIONS` labels/lines into their referenced `SHELF_STORIES` entries' `keywords` rather than emitting standalone situation items.

2. **Omitting Unicode diacritic folding (`NFD`) breaks ASCII queries on accented records (`"Résumé"`, `"Saraqâêl"`, `"Teresa of Ávila"`, `"Ragnarök"`, `"Mictlān"`)**
   - **Disposition:** **Accepted & revised.**
   - **Action:** Introduce a shared `foldFindText(value)` helper applying `.normalize("NFD").replace(/[\u0300-\u036f]/g, "").toLowerCase().replace(/ø/g, "o").replace(/œ/g, "oe").replace(/æ/g, "ae")` in both `find-catalog.ts` and `find-query.ts`, while keeping `AngelsHome.tsx`'s exact DOM slug expression (`n.name.toLowerCase().replace(/[^a-z0-9]+/g, "-")`) when constructing `/angels#${slug}` links. Add regression tests for `"resume"`, `"Saraqael"`, `"Teresa of Avila"`, and `"Ragnarok"`.

3. **`PARALLEL_MATRICES` missing from `src/lib/parallels/search-match.ts` and omitted from Files Modified**
   - **Disposition:** **Accepted & revised.**
   - **Action:** Export `PARALLEL_MATRICES` (with plain-text `aliases` alongside `MatchedParallel` fields) from `src/lib/parallels/search-match.ts` and consume it in `find-catalog.ts`.

4. **Root layout bundle bloat from eagerly importing `FindOverlay` (`FIND_CATALOG` + JSON corpora) in `src/app/layout.tsx`**
   - **Disposition:** **Accepted & revised.**
   - **Action:** Replace eager `FindOverlay` import in `src/app/layout.tsx` with a lightweight client shell `FindOverlayGate.tsx` (~45 lines) that handles `subscribeFind` and global `⌘K` / `Ctrl+K` / `/` keyboard triggers, dynamically loading `FindOverlay` (`next/dynamic` with `ssr: false`) on first trigger. This eliminates both the newly added JSON corpora and the ~277 KB of pre-existing `FIND_CATALOG` + `LIBRARY_FIND` data from initial page-load bundles across every route.

5. **Promoting `WORLD_ALIASES` into `aliases` (`95` pts) causes generic world hubs to outrank canonical texts, people, and Torah divisions**
   - **Disposition:** **Accepted & revised.**
   - **Action:** Keep `WORLD_ALIASES` in `keywords` (`60` pts), reserving world-level `aliases` (`95` pts) strictly for true synonyms (`"bible"` on `/scriptures`, `"christ"` / `"messiah"` on `/jesus`, `"how we know"` on `/evidence`). Keep explicit `ROOM_ALIASES` (`"wordbridge"` -> `/scriptures/word-bridge`, `"paul"` / `"saul"` -> `/apostles/sent`) in `aliases`.

6. **`SearchRoom.tsx` `Places across the record` placement inside `{result && ...}` vanishes on `directRef` / loading states, and filter predicate needs `item.kind !== "book"` + `!item.href.startsWith("/scriptures/parallels")` + `withFindContext`**
   - **Disposition:** **Accepted & revised.**
   - **Action:** Render `<CrossWorldPlaces>` outside `{result && ...}` right below `<ParallelMatches q={q} />`, exclude `item.kind === "book"`, `/scriptures/search`, and `/scriptures/parallels`, and wrap links with `withFindContext(item.href, q, trans, scope)`.

## Minor Findings & Dispositions

1. **`grief` expansion missing `"consolation"`, and `relatedTopicGroup` needing `hit.context` sanitization**
   - **Disposition:** **Accepted.** Added `"consolation"` to `grief.related` in `search-expansion.ts` and sanitized `hit.context` in `relatedTopicGroup` (skipping generic labels and truncating malformed ref lists).
2. **Duplicate titles (`The Pilate Stone` in `stones.json` vs `claimLab`; `Athanasius of Alexandria` in `giants.json` vs `faces.json`)**
   - **Disposition:** **Accepted.** Prefix Claim Lab entries (`Claim Lab: ${item.title}`), suffix Church Faces entries (`${face.name} · ${face.culture}` with `face.name` in `aliases`), include `"artifact"` in primary tie-breakers, and also index non-Christian historical witnesses (`public/jesus/history.json`: Josephus, Tacitus, Pliny, Suetonius, Mara bar Serapion) on `/jesus/history#${item.id}`.
3. **Closed `<details>` on `/jesus/history#${id}` and `/evidence#${id}`**
   - **Disposition:** **Accepted.** Add a tiny `<HashDisclosureOpener />` client island using `openDisclosureForHash` in `HistoryRoom.tsx` and `EvidenceHome.tsx` so `#hash` navigation opens and scrolls to target `<details>` cards while keeping both rooms Server Components.
4. **`canons.json` book count (`86` hosted codes) and `sent.json` `unplaced` seats**
   - **Disposition:** **Accepted.** Index all 86 `canons.bookOrder` entries and include `sentJson.unplaced` (`james-alphaeus`, `matthias`, `judas-iscariot`) alongside `sentJson.rays`.
