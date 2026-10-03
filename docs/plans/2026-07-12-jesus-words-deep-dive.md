# His Words Deep Dive — Implementation Plan

**Goal:** Let readers move from Jesus' sayings into progressively deeper, source-linked study without interrupting the red-letter reading experience.
**Approach:** Add a curated study-path content spine and an optional interactive guide beside the existing book/chapter browser. A selected saying will expose its immediate scene, Gospel parallels, scriptural roots, and a restrained language note, with every reference linked to its full context.
**Files affected:** `src/lib/jesus/word-studies.ts`, `src/app/jesus/words/WordStudyGuide.tsx`, `src/app/jesus/words/word-utils.ts`, `src/app/jesus/words/WordsRoom.tsx`, `src/app/styles/jesus.css`, `tests/jesus-words-study.test.tsx`, `docs/plans/2026-07-12-jesus-words-deep-dive.md`

---

### Task 1: Specify the optional study interaction
**Files:** Create `tests/jesus-words-study.test.tsx`
**Step 1:** Add an interaction test asserting that the guide begins collapsed, exposes themed paths when opened, and reveals context, parallels, language, and full-passage links for a selected saying.
**Step 2:** Run `npx tsx --test tests/jesus-words-study.test.tsx` and confirm it fails because the study guide does not exist.
**Step 3:** Keep the existing red-letter chapter browser assertions intact.

- [x] Task 1 complete

### Task 2: Add the curated study content spine
**Files:** Create `src/lib/jesus/word-studies.ts`
**Step 1:** Define typed study paths and sayings covering kingdom, prayer, love, discipleship, identity, and the last night.
**Step 2:** Give every scene, parallel, root, and language note a direct scripture or STEP Bible link.
**Step 3:** Keep interpretation concise and distinguish textual observation from application prompts.

- [x] Task 2 complete

### Task 3: Build the progressive-disclosure guide
**Files:** Create `src/app/jesus/words/WordStudyGuide.tsx`; modify `src/app/jesus/words/WordsRoom.tsx`
**Step 1:** Render a closed-by-default “Go deeper” disclosure after the red-letter distribution.
**Step 2:** Add theme controls and study cards with immediate scene, parallels, scriptural roots, language lens, and questions.
**Step 3:** Let a study card jump the existing reader to the saying's book and chapter while preserving lazy book loading.
**Step 4:** Run the focused interaction tests and confirm they pass.

- [x] Task 3 complete

### Task 4: Establish a clear visual hierarchy
**Files:** Modify `src/app/styles/jesus.css`
**Step 1:** Style the guide as a quieter secondary layer, keeping red-letter text visually dominant.
**Step 2:** Make theme controls, reference links, and detail columns keyboard-visible and responsive.
**Step 3:** Check narrow and wide layouts in the browser.

- [x] Task 4 complete

### Task 5: Verify, review, and publish the branch
**Files:** All files above
**Step 1:** Run `npm run lint`, `npm run typecheck`, `npm run test`, and `npm run build`.
**Step 2:** Perform the required three-pass code review and browser sanity check.
**Step 3:** Stage only the His Words files, audit the staged diff and Git history for secrets, commit, push, and confirm a clean worktree.

- [x] Task 5 complete
