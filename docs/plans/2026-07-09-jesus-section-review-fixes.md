# Jesus Section Review Fixes — Implementation Plan

**Goal:** Resolve every issue from the `/jesus` review without changing the section's theological posture or source-first character.
**Approach:** Keep the routes statically rendered, but serialize only the first red-letter book and lazy-load later books from generated static files. Compact Jesus-specific wayfinding, make the art gallery visual by default through Next Image, expose interaction failures clearly, and add DOM-level regression tests for the repaired workflows.
**Files affected:** `src/app/jesus/**`, `src/app/_components/ArtPlate.tsx`, `src/app/_components/WorldGuide.tsx`, `src/app/styles/jesus.css`, `src/lib/jesus/**`, `public/jesus/**`, `scripts/jesus/split-words.mjs`, `scripts/smoke/site-integrity.test.mjs`, `tests/jesus-interactions.test.tsx`, `next.config.ts`, `package.json`, `package-lock.json`.

---

### Task 1: Lock the reviewed behavior with tests
**Files:** Modify `scripts/smoke/site-integrity.test.mjs`; create `tests/jesus-interactions.test.tsx`; modify `package.json` and `package-lock.json`.
**Step 1:** Add data-integrity assertions for every split red-letter book and DOM interaction tests for chapter selection, prophecy rejection, accessible map controls, and visible gallery images.
**Step 2:** Run `npm test` and confirm the new tests fail before implementation.
**Step 3:** Keep test setup local to the test file and avoid a new test runner.

- [x] Task 1 complete

### Task 2: Split and paginate the words corpus
**Files:** Create `scripts/jesus/split-words.mjs` and `public/jesus/words/*.json`; modify `src/lib/jesus/types.ts`, `src/lib/jesus/server.ts`, `src/lib/jesus/client.ts`, `src/app/jesus/words/page.tsx`, `src/app/jesus/words/WordsRoom.tsx`, and `src/app/styles/jesus.css`.
**Step 1:** Generate one static JSON document per red-letter book from canonical `public/jesus/words.json`.
**Step 2:** Pass only Matthew plus counts through the initial Server Component boundary.
**Step 3:** Lazy-load later books, expose loading/error/retry states, and render one chapter at a time unless a search is active.
**Step 4:** Verify the initial response and DOM are materially smaller.

- [x] Task 2 complete

### Task 3: Repair interaction failure and accessibility paths
**Files:** Modify `src/app/jesus/prophecy/ProphecyRoom.tsx`, `src/app/jesus/life/LifeRoom.tsx`, and `src/app/jesus/life/GalileeMap.tsx`; create `src/app/jesus/life/LifeEraRail.tsx` and `src/app/jesus/life/GalileeMapBackdrop.tsx`.
**Step 1:** Store prophecy rejection state and provide a working retry action.
**Step 2:** Expose the map as a labelled interactive group rather than an atomic image.
**Step 3:** Correct life-event instructions so they describe expansion before the source link.
**Step 4:** Split both touched files below the 200-line limit.

- [x] Task 3 complete

### Task 4: Improve the visual and editorial surface
**Files:** Modify `src/app/_components/ArtPlate.tsx`, `src/app/_components/WorldGuide.tsx`, `src/app/jesus/layout.tsx`, `src/app/jesus/page.tsx`, `src/app/jesus/lens/LensRoom.tsx`, `src/app/jesus/lens/layout.tsx`, `src/app/styles/jesus.css`, `next.config.ts`, `public/jesus/prophecies.json`, and `public/jesus/stones.json`.
**Step 1:** Render museum art through configured Next Image proxy hosts and retain the citation fallback.
**Step 2:** Remove duplicate header navigation, disclose source methodology compactly, and make the Worlds switcher non-overlapping on the Jesus landing.
**Step 3:** Mark the hero image as priority and align metadata with the actual section.
**Step 4:** Rename the lens to match its mixed global/Western collection, distinguish prophecy connection types, and replace encyclopedia artifact links with institutional or academic sources.

- [x] Task 4 complete

### Task 5: Verify end to end
**Files:** Review all modified files.
**Step 1:** Run `npm run lint`, `npm run typecheck`, `npm test`, and `npm run build`.
**Step 2:** Run the three-pass review, including line counts and secrets/diff checks.
**Step 3:** Start Next on `127.0.0.1`, verify `/jesus` and all five rooms at 1440×900 and 390×844, exercise the repaired interactions, and inspect console output.

- [x] Task 5 complete
