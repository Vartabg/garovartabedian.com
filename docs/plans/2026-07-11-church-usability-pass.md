# Church Usability Pass — Implementation Plan

**Goal:** Make the `/church` section easier to navigate on mobile and across long pages while improving citation accessibility and search metadata.
**Approach:** Keep the existing static-first App Router architecture and add one small client-side progress navigation component. Scope layout changes to the Church world, preserve the interactive SVG tree, and reuse the existing Church artwork for social metadata.
**Files affected:** `src/app/church/ChurchSectionNav.tsx`, Church room components, Church route metadata, `src/app/church/tree/Tree.tsx`, `src/app/styles/church.css`, and `tests/church-interactions.test.tsx`.

---

### Task 1: Long-page progress navigation
**Files:** Create `src/app/church/ChurchSectionNav.tsx`; modify `src/app/church/ChurchHome.tsx`, `src/app/church/councils/CouncilsRoom.tsx`, `src/app/church/faces/FacesRoom.tsx`, and `src/app/church/giants/GiantsRoom.tsx`

- [x] Add a compact sticky navigation strip that tracks the visible section.
- [x] Reuse each page's existing section IDs and labels.
- [x] Keep all content and anchor links available without JavaScript.

### Task 2: Mobile wayfinding and tree treatment
**Files:** Modify `src/app/church/layout.tsx`, `src/app/church/tree/Tree.tsx`, and `src/app/styles/church.css`

- [x] Remove duplicate Church header navigation on small screens.
- [x] Collapse the repeated source-method copy into a compact disclosure control.
- [x] Give the tree a dedicated horizontal viewport and visible mobile swipe instruction.

### Task 3: Accessible citations and metadata
**Files:** Modify `src/app/church/ChurchHome.tsx`, `src/app/church/giants/GiantsRoom.tsx`, Church route metadata files, and `src/app/church/layout.tsx`

- [x] Give generic visible `source` links descriptive accessible names.
- [x] Add a canonical URL to each Church route.
- [x] Use the Church artwork for social cards and describe the section with `CollectionPage` structured data.

### Task 4: Interaction coverage and verification
**Files:** Create `tests/church-interactions.test.tsx`

- [x] Test progress navigation state and tree interaction/wayfinding.
- [x] Run targeted unit tests, lint, typecheck, smoke tests, build, and a local responsive browser check.
- [x] Run the three-pass code review, secrets/history audit, commit only scoped files, and push the feature branch.

### Task 5: Progressive disclosure for Church rooms
**Files:** Create `src/app/church/ChurchDiveList.tsx`; modify `src/app/church/giants/GiantsRoom.tsx`, `src/app/church/councils/CouncilsRoom.tsx`, `src/app/church/faces/FacesRoom.tsx`, and `src/app/styles/church.css`

- [x] Present Giants, Councils, and Faces as compact scan-first summaries.
- [x] Preserve every existing quote, source, image, consequence, gift, and fault inside native expandable records.
- [x] Add open-all and close-all controls, plus hash-aware auto-opening for direct links.

### Task 6: Giant learning summaries and verification
**Files:** Modify `public/church/giants.json`, `src/lib/church/types.ts`, and `tests/church-interactions.test.tsx`

- [x] Add one-sentence gift and fault summaries derived from the existing sourced record.
- [x] Test individual, bulk, and deep-linked disclosure behavior.
- [x] Run the complete repository check, responsive browser verification, code review, secrets audit, commit, and push.
