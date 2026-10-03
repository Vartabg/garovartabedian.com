# Jesus World — From the Cross to the Ascension

**Goal:** Add a sixth Jesus room covering the stretch the site currently compresses into seven map pins — the death, the three days in the tomb, the forty days of appearances, and the ascension.
**Approach:** One curated dataset with four movements. Every moment names which sources report it; every appearance is shown as a grid across Matthew, Mark, Luke, John, Acts, and 1 Corinthians 15; the "where was he" question gets its own shelf of canonical texts and texts outside the canon, with each record's limits stated. A closing section names the real tensions between the accounts rather than smoothing them.
**Not in scope:** Any framing around the forthcoming films. The room stands on the sources.
**Files affected:** `public/jesus/risen.json`, `src/lib/jesus/types.ts`, `src/lib/jesus/server.ts`, `src/app/jesus/risen/*`, `src/app/jesus/page.tsx`, `src/app/jesus/layout.tsx`, `src/app/styles/jesus.css`, `src/lib/world-guidance.ts`, `src/app/sitemap.ts`, `tests/jesus-risen.test.tsx`

---

### Task 1: Dataset and contract
**Files:** Create `public/jesus/risen.json`; modify `src/lib/jesus/types.ts`, `src/lib/jesus/server.ts`
**Step 1:** Curate movements, moments, appearances, descent records, and open questions with per-item refs and limits.
**Step 2:** Add the types and the server accessor.
**Step 3:** Validate every scripture ref parses and resolves to a real chapter.

- [x] Task 1 complete

### Task 2: The room
**Files:** Create `src/app/jesus/risen/page.tsx`, `layout.tsx`, `RisenRoom.tsx`, `PassionClock.tsx`, `AppearanceGrid.tsx`, `DescentShelf.tsx`; modify `src/app/styles/jesus.css`
**Step 1:** Timeline spine first, appearance grid second, descent shelf third, tensions last.
**Step 2:** Server-rendered — no client JS needed for the core content.
**Step 3:** Every ref links into the hosted reader; extracanonical records link to the hosted Early Writings text where one exists.

- [x] Task 2 complete

### Task 3: Wire it into the world
**Files:** Modify `src/app/jesus/page.tsx`, `src/app/jesus/layout.tsx`, `src/lib/world-guidance.ts`, `src/app/sitemap.ts`
**Step 1:** Add the room to nav, overview cards, structured data, and the sitemap.
**Step 2:** Add it to the guided journey. Not done: an inline link from the life map's resurrection era — `LifeRoom` renders through the i18n `t()` layer, so a link there needs translation keys in every supported language. Left for a follow-up rather than shipping untranslated English into a translated room.

- [x] Task 3 complete

### Task 4: Test, verify, ship
**Files:** Create `tests/jesus-risen.test.tsx`
**Step 1:** Cover ordering, the attestation labels, the grid, and the boundary language.
**Step 2:** Run `npm run lint`, `npm run typecheck`, `npm run test`.
**Step 3:** Verify the route in the browser at desktop and mobile widths.
**Step 4:** Finish through `agent-task finish`.

- [x] Task 4 complete
