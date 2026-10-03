# Site Focus Completion — Implementation Plan

**Goal:** Finish the remaining focus improvements by hiding secondary catalogs until requested and progressively disclosing the three longest research pages without breaking deep links.
**Approach:** Add one shared accessible disclosure component with hash-aware opening, use it for secondary choices and long records, move Scripture search above its artwork, and remove redundant source panels now covered by the shared world guide.
**Files affected:** `tests/focus-navigation.test.tsx`, `src/lib/world-disclosure.ts`, `src/app/_components/WorldDisclosure.tsx`, `src/app/_components/WorldPrimaryAction.tsx`, `src/app/scriptures/page.tsx`, `src/app/jesus/page.tsx`, `src/app/early/page.tsx`, `src/app/church/ChurchHome.tsx`, `src/app/angels/AngelsHome.tsx`, `src/app/word/WordHome.tsx`, `src/app/styles/core.css`.

---

### Task 1: Lock disclosure behavior in tests
**Files:** Modify `tests/focus-navigation.test.tsx`; create `src/lib/world-disclosure.ts`, `src/app/_components/WorldDisclosure.tsx`

1. Assert disclosures render closed with a clear summary.
2. Assert a hash targeting nested content opens its owning disclosure.
3. Run the focused test and confirm failure before implementation.

- [x] Task 1 complete

### Task 2: Group secondary choices
**Files:** Modify `src/app/scriptures/page.tsx`, `src/app/jesus/page.tsx`, `src/app/early/page.tsx`, `src/app/church/ChurchHome.tsx`, `src/app/angels/AngelsHome.tsx`, `src/app/word/WordHome.tsx`

1. Move the Scripture search form above the hero artwork and remove the duplicate Ask card.
2. Put secondary cards and catalogs behind explicit “More ways to explore” or “Browse” disclosures.
3. Keep the already-selected primary path outside every disclosure.

- [x] Task 2 complete

### Task 3: Progressively disclose long records
**Files:** Modify `src/app/church/ChurchHome.tsx`, `src/app/angels/AngelsHome.tsx`, `src/app/word/WordHome.tsx`, `src/app/styles/core.css`

1. Wrap the Church road, Angels order, and Word ownership record in deep-dive disclosures.
2. Preserve anchor navigation by opening the owning disclosure when its hash is targeted.
3. Remove the redundant `SourceBasis` panel from each landing.

- [x] Task 3 complete

### Task 4: Verify and ship
**Files:** All task files above

1. Run React and three-pass code review.
2. Run desktop and mobile browser checks, including direct hash navigation.
3. Run `npm run check` and the full-history secrets audit.
4. Commit and push only this task’s files.

- [x] Task 4 complete
