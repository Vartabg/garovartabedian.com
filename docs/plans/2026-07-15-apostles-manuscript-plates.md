# Apostles Manuscript Plates — Implementation Plan

**Goal:** Add a coherent illuminated-manuscript plate to each of the thirteen apostle records and a separate Paul coda without inventing disputed traditions.
**Approach:** Generate fourteen 1280×720 historical-scene assets with the existing Galilee storm plate as the binding house-style reference. Keep the record mapping typed and separate from page data, lazy-load each roster plate inside its open record, and render Paul outside the thirteen-record list as the page already does.
**Files affected:** `public/apostles/twelve/*.jpg`, `src/lib/apostles/plates.ts`, `src/app/apostles/twelve/TwelveRoom.tsx`, `src/app/styles/apostles.css`, `tests/apostles-data.test.ts`

---

### Task 1: Lock the roster and honesty rules
**Files:** Modify `tests/apostles-data.test.ts`; create `src/lib/apostles/plates.ts`
**Step 1:** Add assertions that the plate map covers exactly the thirteen live record IDs and that Paul remains a separate coda.
**Step 2:** Run `npm run test:unit -- tests/apostles-data.test.ts` and confirm the new import fails before implementation.
**Step 3:** Add typed plate metadata with meaningful alt text and captions.
**Step 4:** Re-run the targeted unit test and confirm it passes.

- [x] Task 1 complete

### Task 2: Produce the manuscript leaves
**Files:** Create `public/apostles/twelve/peter.jpg`, `andrew.jpg`, `james-zebedee.jpg`, `john.jpg`, `philip.jpg`, `bartholomew.jpg`, `thomas.jpg`, `matthew.jpg`, `james-alphaeus.jpg`, `thaddaeus.jpg`, `simon-zealot.jpg`, `judas-iscariot.jpg`, `matthias.jpg`, and `paul.jpg`
**Step 1:** Generate each scene separately with the user brief preserved and the Galilee storm/Nicaea plates labeled as style references.
**Step 2:** Inspect every full-resolution result for 16:9 composition, plain Byzantine border, flat tempera rendering, halo rules, pseudo-script only, and prohibited death iconography.
**Step 3:** Copy selected results into the project with stable filenames and verify dimensions and formats.

- [x] Task 2 complete

### Task 3: Integrate the plates into the reading flow
**Files:** Modify `src/app/apostles/twelve/TwelveRoom.tsx` and `src/app/styles/apostles.css`
**Step 1:** Render each roster plate once, inside the corresponding expanded record, using the existing lazy `InlineMediaPlate` component.
**Step 2:** Render Paul’s plate only in the separate Paul coda.
**Step 3:** Add apostles-owned responsive styling that preserves the full illuminated leaf and keeps captions outside the image.

- [x] Task 3 complete

### Task 4: Verify the finished room
**Files:** Review all task files
**Step 1:** Run targeted tests, then `npm run lint`, `npm run typecheck`, `npm run test`, `npm run media:audit`, and `npm run build`.
**Step 2:** Run the three-pass code review and a secrets/history audit.
**Step 3:** Check desktop and mobile deep links in a real browser, including lazy loading, overflow, captions, console errors, and accessibility.
**Step 4:** Commit, push `codex/apostles-plates`, and prepare a review deployment or pull request.

- [x] Task 4 complete
