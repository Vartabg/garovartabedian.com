# Site Microcopy Pass — Implementation Plan

**Goal:** Make navigation, calls to action, empty states, and recovery messages across garovartabedian.com clear, consistent, and recognizably human.
**Approach:** Preserve the site&rsquo;s direct, personal voice while naming links by destination and buttons by outcome. Centralize repeated portfolio action labels, add an actionable Scripture-topics zero state, and give error pages plain-English recovery paths.
**Files affected:** `src/lib/portfolio-content.ts`, `src/app/_components/CleanChrome.tsx`, `src/app/_components/StoryHome.tsx`, `src/app/_components/versions/LabView.tsx`, `src/app/_components/versions/TiltView.tsx`, `src/app/_components/versions/ShaderView.tsx`, `src/app/about/page.tsx`, `src/app/contact/page.tsx`, `src/app/services/page.tsx`, `src/app/resume/page.tsx`, `src/app/hire/page.tsx`, `src/app/work/page.tsx`, `src/app/work/jobpilot/page.tsx`, `src/app/work/eye/page.tsx`, `src/app/work/garovartabedian/page.tsx`, `src/app/scriptures/_components/AskBox.tsx`, `src/app/scriptures/search/SearchRoom.tsx`, `src/app/scriptures/topics/TopicsRoom.tsx`, `src/app/error.tsx`, `src/app/global-error.tsx`, `src/app/not-found.tsx`, `tests/microcopy.test.tsx`

---

### Task 1: Lock the empty-state behavior
**Files:** Create `tests/microcopy.test.tsx`; modify `src/app/scriptures/topics/TopicsRoom.tsx`

**Step 1:** Render the topics room, search for a missing topic, and assert that the page explains the zero state and offers a clear-search control.
**Step 2:** Run `npm run test:unit -- --test-name-pattern="microcopy"` and confirm the new assertion fails.
**Step 3:** Render the zero state and clear the active query from its button.
**Step 4:** Run the targeted test and confirm it passes.

- [x] Task 1 complete

### Task 2: Standardize portfolio navigation and actions
**Files:** Modify `src/lib/portfolio-content.ts`, `src/app/_components/CleanChrome.tsx`, `src/app/_components/StoryHome.tsx`, `src/app/_components/versions/LabView.tsx`, `src/app/_components/versions/TiltView.tsx`, `src/app/_components/versions/ShaderView.tsx`, `src/app/about/page.tsx`, `src/app/contact/page.tsx`, `src/app/services/page.tsx`, `src/app/resume/page.tsx`, `src/app/hire/page.tsx`, `src/app/work/page.tsx`, `src/app/work/jobpilot/page.tsx`, `src/app/work/eye/page.tsx`, `src/app/work/garovartabedian/page.tsx`

**Step 1:** Add one shared set of repeated action labels for the hiring overview, résumé, email, case studies, source, and live surfaces.
**Step 2:** Replace vague or inconsistent labels such as “Hire,” “Recruiter front door,” “Review,” raw email addresses, and “Reset” with destination- or outcome-specific text.
**Step 3:** Keep labels short enough for the existing desktop and mobile layouts.

- [x] Task 2 complete

### Task 3: Clarify search and recovery states
**Files:** Modify `src/app/scriptures/_components/AskBox.tsx`, `src/app/scriptures/search/SearchRoom.tsx`, `src/app/error.tsx`, `src/app/global-error.tsx`, `src/app/not-found.tsx`

**Step 1:** Make the Scripture input describe its exact-word search behavior and give the untouched screen a useful prompt.
**Step 2:** Replace vague preview and failure text with a plain explanation and next action.
**Step 3:** Give 404 and error screens concise recovery links or buttons.

- [x] Task 3 complete

### Task 4: Verify and ship
**Files:** All files above

**Step 1:** Run `npm run check`.
**Step 2:** Inspect `/`, `/hire`, `/contact`, `/scriptures/search`, `/scriptures/topics`, and a missing route in the local browser at desktop and phone widths; check console errors and horizontal overflow.
**Step 3:** Run the three-pass review checklist and confirm the staging scope leaves unrelated work untouched. The repository completion contract handles commit and push after the plan is complete.

- [x] Task 4 complete
