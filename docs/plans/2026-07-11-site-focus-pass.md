# Site Focus Pass — Implementation Plan

**Goal:** Make every landing page reach its purpose before secondary navigation, source detail, or cross-world chrome competes for attention.
**Approach:** Use one shared world header, keep the world guide as the sole section navigator, collapse source detail, move the world switcher into normal document flow, and lead the homepage with its thesis and one primary path. Preserve the existing world content and active Jesus feature work.
**Files affected:** `tests/focus-navigation.test.tsx`, `src/app/_components/WorldHeader.tsx`, `src/app/_components/WorldPrimaryAction.tsx`, `src/app/_components/WorldSourceDisclosure.tsx`, `src/app/_components/WorldGuide.tsx`, `src/app/_components/WorldSwitcher.tsx`, `src/app/_components/StoryHome.tsx`, `src/app/_components/sections/Worlds.tsx`, `src/app/scriptures/layout.tsx`, `src/app/scriptures/page.tsx`, `src/app/early/layout.tsx`, `src/app/early/page.tsx`, `src/app/jesus/layout.tsx`, `src/app/jesus/page.tsx`, `src/app/church/layout.tsx`, `src/app/church/ChurchHome.tsx`, `src/app/angels/layout.tsx`, `src/app/angels/AngelsHome.tsx`, `src/app/word/layout.tsx`, `src/app/word/WordHome.tsx`, `src/app/styles/core.css`, `src/lib/portfolio-content.ts`, `src/lib/world-switcher.ts`.

---

### Task 1: Lock the focus contract in tests
**Files:** Create `tests/focus-navigation.test.tsx`

1. Assert the shared header renders one world link and one site-home link without a second section nav.
2. Assert source detail is represented by a closed `details` disclosure.
3. Assert the homepage renders its `h1` before the verse band and exposes one emphasized Jesus path.
4. Run `npm run test:unit` and confirm the new assertions fail before implementation.

- [x] Task 1 complete

### Task 2: Simplify shared world chrome
**Files:** Create `src/app/_components/WorldHeader.tsx`; modify `src/app/_components/WorldGuide.tsx`, `src/app/scriptures/layout.tsx`, `src/app/early/layout.tsx`, `src/app/jesus/layout.tsx`, `src/app/church/layout.tsx`, `src/app/angels/layout.tsx`, `src/app/word/layout.tsx`, `src/app/styles/core.css`

1. Replace repeated header navigation with the shared world header.
2. Use the guide as the sole section navigation and collapse source detail on every world.
3. Remove the extra Church-only source disclosure.
4. Override the cross-world switcher to remain in normal document flow.
5. Run the focused unit test and lint/typecheck.

- [x] Task 2 complete

### Task 3: Put the homepage purpose first
**Files:** Modify `src/app/_components/StoryHome.tsx`, `src/app/_components/sections/Worlds.tsx`, `src/app/_components/WorldPrimaryAction.tsx`, `src/app/scriptures/page.tsx`, `src/app/early/page.tsx`, `src/app/jesus/page.tsx`, `src/app/church/ChurchHome.tsx`, `src/app/angels/AngelsHome.tsx`, `src/app/word/WordHome.tsx`, `src/app/styles/core.css`, `src/lib/portfolio-content.ts`

1. Render the homepage thesis, explanation, and primary Jesus link before the artwork.
2. Turn the worlds section heading into an `h2` and give it a stable anchor.
3. Keep the critical homepage introduction outside opacity-based scroll reveal.
4. Add one explicit starting action to each world landing page.
5. Run the focused unit test and browser-check desktop and mobile.

- [x] Task 3 complete

### Task 4: Verify and ship
**Files:** All task files above

1. Run the three-pass code review.
2. Run `npm run check`.
3. Audit the scoped diff and repository history for secrets.
4. Commit only task-related changes and push the current feature branch.

- [x] Task 4 complete
