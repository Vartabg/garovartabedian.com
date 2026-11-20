# Say-it-once cuts and first-screen wayfinding

Plan revision: `r2`
Source baseline: `62775acc` (`codex/say-it-once-cuts`)

## Goal

Eliminate four visible forms of repetition and delayed first-screen navigation across the live site without changing underlying corpus or story data:

1. **Scripture hub stories (`#3`):** `/scriptures` currently renders a 14-row text list under `.scr-hub-stories` where `story.summary` repeats `"One stop at a time"` six times on the first phone screen. Replace the 14-row list with the shared horizontal picture strip (`<StoryStrip />`), matching `/` while keeping `src/lib/scriptures/stories.ts` untouched.
2. **Duplicate trail + hero kicker (`#4`):** `CleanChrome` renders `<SiteBreadcrumbs />` directly above `<main>`, and top-level/subpage heroes repeat the same label (`"About this work"`, `"Work with Garo"`, `"Work"`, `"Sources"`, `"Contact"`, `"Résumé"`, `"The machinery"`, etc.) in a `<p className="kicker">` (or hero eyebrow on `/work/excel-handler`) above `<h1>`. Remove those redundant hero kickers on `CleanChrome` pages while keeping in-body card/comparison kickers (`KeyboardExample`, `HandoffDemo`, section eyebrows) and standalone fictional demos (`/work/landing-page`) intact.
3. **First-screen links on phone (`#5`):** `/early`, `/early/library`, and `/apostles/twelve` open with multi-paragraph intros/epigraphs that push the first interactive link or jump bar below `844px` on a `390px` phone. Surface primary wayfinding links above `844px` at `390×844` without deleting substantive prose or epigraphs and without introducing duplicate navigation widgets.
4. **Menu & `Aa` copy cleanup:** Add `/scriptures/stories` (`"Stories"`) under `"Use Scripture"` in `SiteNavigation` (auto-deduplicated when already inside `/scriptures/*`), unify the menu `<summary>` label to `"Menu"` across desktop and mobile (removing the dual-span `Explore` / `Menu` split), and suppress the duplicate persistence help line inside `AccessibilityMenu` where `.a11y-intro` already explains device persistence.

## Scope and boundaries

- **Do not modify `src/lib/scriptures/stories.ts`** (owned by active branch `codex/sower-two-books`).
- **Do not add or delete test files**; extend existing test files instead, and regenerate `public/meta/site-xray.json` (`npm run data:xray`) whenever `tests/e2e/*.spec.ts` route literals change so `tests/site-xray.test.ts` stays green.
- Preserve existing accessible names, landmarks, and keyboard skip behavior except for two intentional updates:
  1. On `/scriptures`, replacing `<nav className="scr-hub-group" aria-label="Stories">` inside `<section aria-labelledby="scr-hub-stories-title">` with `<StoryStrip allStoriesId="scr-all-stories" />` (`<ul aria-label={HOME.storiesListLabel}>` + skip link).
  2. In `SiteNavigation`, unifying the `<summary>` accessible name on desktop and mobile to `"Menu"`.

## Consequential decisions and contracts

### 1. Shared `<StoryStrip />` inside `/scriptures`
- `src/app/_components/StoryStrip.tsx`: accept `{ allStoriesId = "home-all-stories" }: { allStoriesId?: string }`. Pass `allStoriesId="scr-all-stories"` from `src/app/scriptures/page.tsx` so the skip link (`href={`#${allStoriesId}`}`) resolves uniquely on both `/` and `/scriptures`.
- `src/app/styles/core.css`: scope the `@media (max-width: 899px)` `.st-stories { margin-right: -2rem; }` and `.st-stories-strip` bleed rules (`core.css:2121–2134`) to `.st-front .st-stories` and `.st-front .st-stories-strip`. On `/scriptures`, `.scr-hub` inherits `.wrap`'s `1.5rem` side padding (`< 2rem`), so an unscoped `-2rem` right margin would overflow `innerWidth` at `320px` and `200%` text size (`tests/e2e/scriptures-hub.spec.ts`).
- `src/app/scriptures/page.tsx` & `src/app/styles/scriptures-hub.css`: inside `<section className="scr-hub-stories" aria-labelledby="scr-hub-stories-title">`, keep the heading `Begin with a story` and concise subtitle, replace `<nav className="scr-hub-group" aria-label="Stories">…</nav>` with `<StoryStrip allStoriesId="scr-all-stories" />`, drop the unused `SCRIPTURE_STORIES` / `scriptureStoryPath` import, and remove the dead `.scr-hub-stories .scr-hub-group` rule in `src/app/styles/scriptures-hub.css:9`.

### 2. `CleanChrome` hero kickers
- Remove the top hero `<p className="kicker">…</p>` (and `excel-handler` hero `<p className={styles.eyebrow}>02 / Excel document handler</p>`) immediately preceding `<h1>` in all 16 `CleanChrome` routes that have one:
  - `src/app/about/page.tsx`
  - `src/app/services/page.tsx`
  - `src/app/work/page.tsx`
  - `src/app/work/garovartabedian/page.tsx`
  - `src/app/work/jobpilot/page.tsx`
  - `src/app/work/telemetry/page.tsx`
  - `src/app/work/eye/page.tsx`
  - `src/app/work/merge-monitor/page.tsx`
  - `src/app/work/accessibility/page.tsx`
  - `src/app/work/job-report/page.tsx`
  - `src/app/work/excel-handler/page.tsx` (hero eyebrow line 17 only; keep section eyebrow line 24)
  - `src/app/hire/page.tsx`
  - `src/app/resume/page.tsx`
  - `src/app/contact/page.tsx`
  - `src/app/labs/page.tsx`
  - `src/app/sources/page.tsx`
- Explicitly exclude `/work/landing-page` (`src/app/work/landing-page/page.tsx`), which is a standalone fictional business demo without `CleanChrome` or `.kicker`.
- Remove any local imports or destructured bindings in edited `page.tsx` files that become unused after dropping the kicker, while leaving `@/lib/portfolio-content` exports untouched.

### 3. Deterministic first-screen wayfinding at `390×844`
- **`/early` (`src/app/early/page.tsx` + `src/app/styles/worlds-shared.css`):**
  - Keep the full hero lede intact. Pass `actions` into `<WorldHomeHero>` rendering `<nav className="world-hero-actions" aria-label="Explore early writings">` with three links:
    1. `<a href="#catalog">Browse all {EARLY_TEXTS.length} writings <span aria-hidden="true">↓</span></a>`
    2. `<Link href="/early/library">Expanded library <span aria-hidden="true">→</span></Link>`
    3. `<a href="#timeline">Timeline <span aria-hidden="true">↓</span></a>`
  - Style `.world-hero-actions` in `src/app/styles/worlds-shared.css` (`display: flex; flex-wrap: wrap; gap: 0.55rem; margin-top: 1.15rem;`) where `.world-hero-actions a` uses token-aware surface/border/ink contrast, `min-height: 48px`, `padding: 0.6rem 0.95rem`, `font-weight: 700`, and clear hover/focus-visible affordance. Because `WorldHomeHero` renders `actions` *before* `facets` and the `3:2` plate (`WorldHomeHero.tsx:72`), the first link lands around `y ≈ 640–690px` (`<= 844px`) on `390×844`.
  - **Remove `<WorldEntry>` (`src/app/early/page.tsx:34–49`)** and unused `WorldEntry` import so `#catalog` and `#timeline` are not repeated immediately below the hero plate. Keep `<aside className="world-survival">` (`lines 53–60`) for the `/early/library` and `/early/search` context notes.
- **`/early/library` (`src/app/early/library/page.tsx`):**
  - Move `<nav className="ew-era-nav" aria-label="Library collections">` and `<p><Link href="/early/search" className="textlink">Search text, commentary and source records →</Link></p>` directly beneath `<p className="lede">` (above the canon disclaimer, `<LibraryMeaningRail />`, and `<form className="ew-library-form">`).
  - Prevent dead `#collection-*` anchors when filters (`q`, `group`, `work`) omit non-matching sections: for each group `g` in `LIBRARY_GROUPS`, check whether `records.some(r => r.group === g.id)` is true; if true, render `<a href={`#collection-${g.id}`}>{g.label}</a>`, otherwise render `<Link href={`/early/library#collection-${g.id}`}>{g.label}</Link>`.
- **`/apostles/twelve` (`src/app/apostles/twelve/TwelveRoom.tsx` + `src/app/styles/apostles.css`):**
  - Keep `data.intro` (`<p className="lede">`), `<blockquote className="ap-precedent">`, `<TwelveMap data={data} />`, sticky `<ApostlesSectionNav>` (immediately above `<ApostlesDiveList>`), and `<ApostlesDiveList>` in their exact existing relative order so sticky `<ApostlesSectionNav>` never floats over intro prose, `<TwelveMap>`, or the Acts 4:13 epigraph.
  - Insert a compact, **non-sticky** `<nav className="ap-room-jump" aria-label="Jump into the twelve records">` immediately after `<h1>The twelve records.</h1>` (above `<p className="lede">`) containing `<a href="#apostle-records">Jump to the {data.apostles.length} records <span aria-hidden="true">↓</span></a>` and `<Link href="/apostles/sent">Where they were sent <span aria-hidden="true">→</span></Link>`, styled in `src/app/styles/apostles.css` with `>= 48px` tap targets (`y ≈ 230–290px`, well inside `844px` at `390×844`).

### 4. `SiteNavigation` and `ReadingAppearance`
- `src/app/_components/SiteNavigation.tsx` & `src/app/styles/core.css`:
  - Add `{ href: "/scriptures/stories", label: "Stories", note: "Walk a Bible story one scene at a time" }` to `MENU_GROUPS` under `"Use Scripture"`. `SiteNavigation` filters `group.links` by `!sectionHrefs.has(link.href)` (`SiteNavigation.tsx:140`) and `WORLD_GUIDES.scriptures.nav` (`world-guidance.ts:41`) includes `/scriptures/stories`, so `"Stories"` appears in `"Use Scripture"` outside `/scriptures/*` and is automatically omitted from `"Use Scripture"` inside `/scriptures/*`.
  - Replace `<span className="site-nav-summary-desktop">Explore</span><span className="site-nav-summary-mobile">Menu</span>` with `<span>Menu</span>`, and remove `.site-nav-summary-desktop` / `.site-nav-summary-mobile` rules from `src/app/styles/core.css:455, 682–688`.
- `src/app/_components/reading/ReadingAppearance.tsx` & `src/app/_components/AccessibilityMenu.tsx`:
  - Add `{ showPersistenceHelp = true }: { showPersistenceHelp?: boolean }` to `ReadingAppearance`. Render `<p className="reading-help">…</p>` only when `showPersistenceHelp` is `true`.
  - Pass `<ReadingAppearance showPersistenceHelp={false} />` in `AccessibilityMenu.tsx`.

## Failure behavior and invariants

- **No horizontal overflow at `320px` / `200%`:** `/scriptures` must pass `tests/e2e/scriptures-hub.spec.ts` (`scrollWidth <= innerWidth + 1` at `320px` and `font-size: 200%`).
- **No duplicate menu hrefs on `/`, `/scriptures`, or `/scriptures/protestant/MRK/1`:** Extend `tests/e2e/navigation.spec.ts` to open `.site-nav-menu` on `/` and `/scriptures` (in addition to `/scriptures/protestant/MRK/1`) and assert `new Set(hrefs).size === hrefs.length` plus presence of `/scriptures/stories`.
- **`site-xray.json` parity:** Run `npm run data:xray` after updating E2E specs so `public/meta/site-xray.json` matches `collectSiteXray()` in `tests/site-xray.test.ts`.
- **Voice check:** All added visitor strings must pass `npm run voice:check`.

## Acceptance checks

1. Run `npm run data:xray` (if any `tests/e2e/*.spec.ts` route literals changed), then `npm run lint && npm run typecheck && npm run test && npm run build` — all exit `0`.
2. Extend `tests/focus-navigation.test.tsx` to assert `SiteNavigation` summary text is `"Menu"`, `"Use Scripture"` includes `/scriptures/stories` on `/` and deduplicates it on `/scriptures`, and `AccessibilityMenu` renders `.a11y-intro` without `.reading-help`.
3. Extend `tests/e2e/scriptures-hub.spec.ts` to assert `/scriptures` renders `.st-stories-strip` + `#scr-all-stories` (`href="/scriptures/stories"`), `"One stop at a time"` appears at most once on `/scriptures`, and `320px` `200%` overflow remains `false`.
4. Extend `tests/e2e/worlds-responsive.spec.ts` (at `390×844`) to assert:
   - `/early`, `/early/library`, and `/apostles/twelve` each expose at least one visible `main a[href]` with `boundingBox().y + boundingBox().height <= 844` and `height >= 44`.
   - Representative `CleanChrome` routes (`/about`, `/services`, `/work`, `/work/garovartabedian`, `/work/excel-handler`, `/hire`, `/resume`, `/contact`, `/labs`, `/sources`) have no `.kicker` element preceding `main h1`.
5. Run `PORT=3440 npx playwright test tests/e2e/scriptures-hub.spec.ts tests/e2e/navigation.spec.ts tests/e2e/navigation-reflow.spec.ts tests/e2e/worlds-responsive.spec.ts tests/e2e/early-library.spec.ts tests/e2e/recruiter-path.spec.ts` — all pass.

## Reviewer reading list

- `AGENTS.md`
- `docs/plans/say-it-once-cuts.md`
- `src/app/_components/StoryStrip.tsx`
- `src/app/scriptures/page.tsx`
- `src/app/styles/scriptures-hub.css`
- `src/app/styles/core.css` (lines 450–695 and 2030–2135)
- `src/app/styles/worlds-shared.css` (lines 1029–1124 and 1262–1296)
- `src/app/styles/apostles.css` (lines 185–270)
- `src/app/_components/CleanChrome.tsx`
- `src/app/about/page.tsx`, `src/app/services/page.tsx`, `src/app/work/page.tsx`, `src/app/work/garovartabedian/page.tsx`, `src/app/work/jobpilot/page.tsx`, `src/app/work/telemetry/page.tsx`, `src/app/work/eye/page.tsx`, `src/app/work/merge-monitor/page.tsx`, `src/app/work/accessibility/page.tsx`, `src/app/work/job-report/page.tsx`, `src/app/work/excel-handler/page.tsx`, `src/app/work/landing-page/page.tsx`, `src/app/hire/page.tsx`, `src/app/resume/page.tsx`, `src/app/contact/page.tsx`, `src/app/labs/page.tsx`, `src/app/sources/page.tsx`
- `src/app/_components/SiteNavigation.tsx`
- `src/lib/world-guidance.ts` (lines 25–50)
- `src/app/_components/AccessibilityMenu.tsx`
- `src/app/_components/reading/ReadingAppearance.tsx`
- `src/app/_components/WorldHomeHero.tsx`
- `src/app/early/page.tsx`
- `src/app/early/library/page.tsx`
- `src/app/apostles/twelve/TwelveRoom.tsx`
- `tests/focus-navigation.test.tsx` (lines 45–180)
- `tests/e2e/scriptures-hub.spec.ts`
- `tests/e2e/navigation.spec.ts` (lines 140–210)
- `tests/e2e/worlds-responsive.spec.ts`
