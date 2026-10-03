# Jesus World Perspectives — Implementation Plan

**Goal:** Rebuild the Jesus traditions room around how different communities, readers, and legends understand Jesus, with art kept as optional supporting material.
**Approach:** Add a sourced perspectives dataset with explicit evidence boundaries, use it to lead the existing `/jesus/lens` route, and move the text archive and art gallery into secondary sections. Update the Jesus overview and navigation language so the route promises belief, reception, and lore rather than an art-led gallery.
**Files affected:** `public/jesus/perspectives.json`, `src/lib/jesus/types.ts`, `src/lib/jesus/server.ts`, `src/app/jesus/lens/LensRoom.tsx`, `src/app/jesus/lens/page.tsx`, `src/app/jesus/lens/layout.tsx`, `src/app/jesus/page.tsx`, `src/app/jesus/layout.tsx`, `src/lib/world-guidance.ts`, `src/app/styles/jesus.css`, `tests/jesus-perspectives.test.tsx`

---

### Task 1: Define the perspective contract and content
**Files:** Create `public/jesus/perspectives.json`; modify `src/lib/jesus/types.ts`, `src/lib/jesus/server.ts`
**Step 1:** Add a test fixture that requires grouped perspectives, source links, and a visible evidence boundary.
**Step 2:** Run `npm run test:unit -- tests/jesus-perspectives.test.tsx` → Expected: FAIL.
**Step 3:** Add the typed dataset and server accessor.
**Step 4:** Run the focused test → Expected: PASS after the room implementation.
**Step 5:** Review the diff against source and scope boundaries.

- [x] Task 1 complete

### Task 2: Rebuild the room hierarchy
**Files:** Modify `src/app/jesus/lens/LensRoom.tsx`, `src/app/jesus/lens/page.tsx`, `src/app/styles/jesus.css`
**Step 1:** Make perspective groups and their answers the first substantive content.
**Step 2:** Keep textual traditions as a deeper source shelf.
**Step 3:** Move world art into a collapsed, optional archive.
**Step 4:** Run the focused interaction/render test → Expected: PASS.
**Step 5:** Review semantics, keyboard access, and mobile layout.

- [x] Task 2 complete

### Task 3: Align navigation and promises
**Files:** Modify `src/app/jesus/lens/layout.tsx`, `src/app/jesus/page.tsx`, `src/app/jesus/layout.tsx`, `src/lib/world-guidance.ts`
**Step 1:** Rename the room and overview card around world perspectives.
**Step 2:** Update metadata and source-basis language to cover beliefs, reception, and lore.
**Step 3:** Run the focused test and existing focus-navigation tests → Expected: PASS.
**Step 4:** Review copy for accuracy and non-flattening language.

- [x] Task 3 complete

### Task 4: Verify and ship the branch
**Files:** All task files above
**Step 1:** Run `npm run check`.
**Step 2:** Run the site locally and verify `/jesus` and `/jesus/lens` in a browser.
**Step 3:** Run the three-pass review and secrets audit.
**Step 4:** Commit with `feat(jesus): broaden traditions into world perspectives`.
**Step 5:** Push the feature branch and confirm a clean worktree.

- [x] Task 4 complete
