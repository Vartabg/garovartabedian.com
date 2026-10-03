# Jesus History Investigation — Implementation Plan

**Goal:** Rebuild the Jesus history room as a clear investigation of what early Christian, Jewish, Roman, and archaeological evidence can and cannot establish.
**Approach:** Add a compact early-Christian baseline, enrich every existing written and material record with source distance and evidence boundaries, and reorganize the route into a short answer, timeline, source lanes, and expandable evidence files. Preserve the original quotations, artifact media, and source links.
**Files affected:** `public/jesus/christian-witnesses.json`, `public/jesus/history.json`, `public/jesus/stones.json`, `src/lib/jesus/types.ts`, `src/lib/jesus/server.ts`, `src/lib/source-guidance.ts`, `src/app/jesus/history/HistoryEvidenceBoundary.tsx`, `src/app/jesus/history/ChristianWitnessCard.tsx`, `src/app/jesus/history/WrittenWitnessCard.tsx`, `src/app/jesus/history/StoneEvidenceCard.tsx`, `src/app/jesus/history/HistoryRoom.tsx`, `src/app/jesus/history/InkAndStone.tsx`, `src/app/jesus/history/page.tsx`, `src/app/jesus/history/layout.tsx`, `src/app/styles/jesus.css`, `tests/jesus-history.test.tsx`

---

### Task 1: Define the evidence contracts
**Files:** Create `tests/jesus-history.test.tsx`, `public/jesus/christian-witnesses.json`; modify `public/jesus/history.json`, `public/jesus/stones.json`, `src/lib/jesus/types.ts`, `src/lib/jesus/server.ts`
**Step 1:** Write a failing render test requiring a short answer, three source lanes, source-distance labels, and explicit evidence limits.
**Step 2:** Run `npm run test:unit -- tests/jesus-history.test.tsx` → Expected: FAIL.
**Step 3:** Add typed Christian-baseline data and enrich written/material records with lane, assessment, distance, and limits.
**Step 4:** Validate every record has a source and evidence boundary.

- [x] Task 1 complete

### Task 2: Build the investigation hierarchy
**Files:** Create `src/app/jesus/history/HistoryEvidenceBoundary.tsx`, `src/app/jesus/history/ChristianWitnessCard.tsx`, `src/app/jesus/history/WrittenWitnessCard.tsx`, `src/app/jesus/history/StoneEvidenceCard.tsx`; modify `src/app/jesus/history/HistoryRoom.tsx`, `src/app/jesus/history/page.tsx`, `src/app/styles/jesus.css`
**Step 1:** Lead with the concise historical bottom line and method boundary.
**Step 2:** Add jump links and distinct early-Christian, Jewish, Roman, and archaeology sections.
**Step 3:** Make full quotations and object detail expandable while keeping conclusions scannable.
**Step 4:** Run the focused render test → Expected: PASS.

- [x] Task 2 complete

### Task 3: Make source distance legible
**Files:** Modify `src/app/jesus/history/InkAndStone.tsx`, `src/app/jesus/history/layout.tsx`, `src/app/styles/jesus.css`
**Step 1:** Add the early-Christian baseline to the timeline.
**Step 2:** Visually distinguish Christian, Jewish, Roman, and material evidence.
**Step 3:** Update metadata and explanatory copy around the investigation question.
**Step 4:** Run focused and navigation tests → Expected: PASS.

- [x] Task 3 complete

### Task 4: Verify and ship the branch
**Files:** All task files above
**Step 1:** Run `npm run check`.
**Step 2:** Verify `/jesus/history` locally in the browser, including disclosure controls.
**Step 3:** Run React and three-pass code review checks.
**Step 4:** Run secrets audits, commit, and push `codex/jesus-history-investigation`.

- [x] Task 4 complete
