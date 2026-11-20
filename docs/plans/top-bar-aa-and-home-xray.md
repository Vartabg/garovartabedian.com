# Top-bar Aa reading controls and home Engineer x-ray tag

Plan revision: `r2` (revised after independent EGM review of `r1` to resolve M1–M5 and incorporate O1–O5 + inline path/cascade fixes)
Source baseline: `master` (`e1182f97`, includes merged Unit 2 PR #259 with `<ReadingAppearance showPersistenceHelp={false} />` in `AccessibilityMenu.tsx`)
Target plan path on Unit 3 branch: `docs/plans/top-bar-aa-and-home-xray.md`

## Goal

Resolve two live-site usability and discoverability issues without regressing accessibility, viewport reflow, keyboard focus visibility, or the front door's 520-word prose budget:

1. **Dock `Aa` in the top bar (`#8`):** Currently `<AccessibilityMenu />` renders `.a11y-trigger` as a `position: fixed; right: 1rem; bottom: 1rem` floating circle (`globals.css:203–219`) that covers bottom-right page content on phones (Jesus home, book pages, `/scriptures/topics`, etc.) and required a `padding-right: calc(3.25rem + 1rem + 0.5rem)` workaround on `.world-home-hero-facets` (`worlds-shared.css:1310–1314`). Move `<AccessibilityMenu />` into `.discovery-lens-bar` right beside `Reader | Engineer` (`DiscoveryLens.tsx` + `layout.tsx`), keeping the chapter reader's own bottom `.scr-bar` `Aa` sheet trigger intact and hiding `.a11y-menu` when `body:has(.scr-bar)` is active.
2. **First-screen Engineer x-ray proof on `/`:** All 8 world homes render `<XrayTag {...worldXrayTag(...)} />` near the top of the page (`tests/e2e/section-homes-xray.spec.ts`), whereas `/` (`StoryHome.tsx`) only shows changes far down at `#discover` (`DiscoveryDesk`) and `#xray-foot` (`XrayFoot`). Add a compact `homeXrayTag()` (`data-xray="world"`) immediately after `<p className="st-builder">` in `StoryHome.tsx` so clicking `Engineer` on `/` gives immediate first-screen proof while keeping `Reader` mode pixel-identical and staying strictly within `StoryHome`'s 520-word prose budget (`tests/focus-navigation.test.tsx:235`).

## Scope and boundaries

- **Preserve exact accessible names and roles:**
  - `.a11y-trigger` keeps `aria-label="Open reading and accessibility settings"` with `<span aria-hidden="true">Aa</span>` (`tests/e2e/shared-reading-a11y.spec.ts:12`, `tests/e2e/discovery.spec.ts:97`, `tests/focus-navigation.test.tsx:305`).
  - `.a11y-panel` keeps `role="dialog"` and `aria-labelledby` pointing to `"Reading & accessibility"`, and `.a11y-close` keeps `aria-label="Close accessibility settings"`.
  - `body:has(.scr-bar) .a11y-menu { display: none; }` (`globals.css:543`) and `body:has(.scr-sheet-layer) .a11y-trigger { visibility: hidden; }` (`scriptures.css:5712`) remain intact so chapter reader routes (`/scriptures/protestant/MRK/1`, `/scriptures/protestant/JHN/3`) continue hiding `.a11y-trigger` (`tests/e2e/navigation.spec.ts:165`, `tests/e2e/worlds-responsive.spec.ts:449`).
- **Stay within the 520-word front-door budget:** `StoryHome` `<main>` currently renders **472 words** (excluding `.st-stories-strip`), leaving **48 words** of headroom (`tests/focus-navigation.test.tsx:226–235`). Do not use `<small>` anywhere inside `<main>` (`tests/focus-navigation.test.tsx:220`).
- **Do not add or delete test files;** extend existing test files and unconditionally regenerate `public/meta/site-xray.json` (`npm run data:xray`) after E2E spec edits.

## Consequential decisions and contracts

### 1. Docking `<AccessibilityMenu />` inside `.discovery-lens-bar`

- **`src/app/_components/DiscoveryLens.tsx` & `src/app/layout.tsx`:**
  - Wrap `.discovery-lens-options` and `<AccessibilityMenu />` inside `<div className="discovery-lens-controls">` inside `.discovery-lens-bar`, and remove the standalone `<AccessibilityMenu />` mount at `src/app/layout.tsx:330` and its import at `src/app/layout.tsx:7`.
  - Note on `<noscript>`: `layout.tsx:301` hides `.discovery-lens` when JavaScript is disabled. Because `AccessibilityMenu` is already a client-only control (`disabled={!ready}` until hydration), housing it inside `.discovery-lens` cleanly hides both JS-dependent controls together when scripting is off.

- **`src/app/_components/AccessibilityMenu.tsx` (WCAG 2.2 AA SC 2.4.11 focus-out guard — M3):**
  - Because `<AccessibilityMenu />` now sits in DOM tab order immediately before `<header>` (`.site-header` / `.st-nav`), tabbing forward past `Reset to site defaults` or pressing `Cmd+K` / `Ctrl+K` to open `FindOverlay` (`z-index: 300`) would otherwise leave `.a11y-panel` open directly over focused header controls or under `FindOverlay`.
  - Add a `document` `focusin` listener (and matching cleanup removal) inside `AccessibilityMenu.tsx`'s `useEffect` when `open` is `true` so moving DOM focus outside `.a11y-menu` immediately calls `setOpen(false)` without stealing focus back to `.a11y-trigger`.

- **`src/app/globals.css`, `src/app/styles/discovery.css` & `src/app/styles/reading.css` (Stacking, 390px single-row math, and 320px grid containment — M1, M2, M4, O3):**
  - **Root stacking context (`.a11y-menu` — M2):** Replace `position: relative; z-index: 220;` on `.a11y-menu` (`globals.css:198–201`) with `display: flex; align-items: center;` so `.a11y-panel`'s `z-index: 260` participates directly in the root stacking context (above `.site-nav-panel` at `120` and below `.find-root` at `300`).
  - **In-flow `.a11y-trigger` (`globals.css:203–232` — M2, O3):**
    - Use `position: static` (no `right`, `bottom`, or `z-index`), `display: inline-grid; place-items: center; min-width: 2.75rem; min-height: 2.75rem; padding: 0 0.75rem; border: 1px solid var(--line); border-radius: 2rem; background: var(--bg); color: var(--ink); box-shadow: none; cursor: pointer;`.
    - For `:hover, [aria-expanded="true"]`: `background: var(--ink); color: var(--bg); border-color: var(--ink);`.
    - Let `controls.css:306–312`'s global `button:focus-visible` ring govern keyboard focus, and in `discovery.css` add `.a11y-trigger[aria-expanded="true"]` alongside `.discovery-lens-options button[aria-pressed="true"] { outline: 2px solid Highlight; }` under `@media (forced-colors: active)`.
  - **Top-anchored `.a11y-panel` & `<= 520px` cascade replacement (`globals.css:234–280, 526–538` — M2, M4):**
    - Set `.a11y-panel` to `position: fixed; top: calc(3.5rem + env(safe-area-inset-top)); right: max(1rem, env(safe-area-inset-right)); bottom: auto; z-index: 260; display: grid; grid-template-columns: minmax(0, 1fr); width: min(26rem, calc(100vw - 2rem)); max-height: calc(100dvh - 4.5rem - env(safe-area-inset-top) - env(safe-area-inset-bottom));`.
    - Set `min-width: 0; overflow-wrap: anywhere;` on `.a11y-panel-head > div`.
    - In `src/app/styles/reading.css:59, 61`, add `min-width: 0;` to `.reading-settings-grid > div` and `width: 100%; min-width: 0;` to `.reading-appearance select`.
    - Replace `@media (max-width: 520px)` in `globals.css` — deleting the mobile `.a11y-trigger` offset rule completely and setting `.a11y-panel` to `left: 0.5rem; right: 0.5rem; bottom: auto; width: auto; max-width: none; max-height: calc(100dvh - 4.25rem - env(safe-area-inset-top) - env(safe-area-inset-bottom));`.
  - **Single-row phone math in `.discovery-lens-bar` (`src/app/styles/discovery.css` — M1):**
    - `.discovery-lens-controls { display: flex; flex-wrap: wrap; align-items: center; gap: 0.45rem; margin-inline-start: auto; max-width: 100%; min-width: 0; }` (removing `margin-inline-start: auto` from `.discovery-lens-options`).
    - At `@media (max-width: 700px)`: `.discovery-lens-bar { padding-inline: 0.75rem; gap: 0.4rem; }`, `.discovery-lens-hint { flex: 1 1 7.5rem; min-width: 0; max-width: 9rem; font-size: .7rem; }`, `.discovery-lens-controls { gap: 0.35rem; }`, `.discovery-lens-options button { padding-inline: 0.7rem; }`, and `.discovery-lens-controls .a11y-trigger { padding-inline: 0.6rem; }` (`(0,2,0)` specificity outranking `globals.css:203`).

- **`src/app/styles/worlds-shared.css`:**
  - Remove the obsolete `padding-right: calc(3.25rem + 1rem + 0.5rem)` workaround and comment on `.world-home-hero-facets` (`worlds-shared.css:1310–1314`).

### 2. Front-door Engineer `<XrayTag>` (`StoryHome.tsx` + `world-xray.ts` — O2, O5, M5)

- **`src/lib/site/world-xray.ts`:**
  - Export `homeXrayTag()` importing `SHELF_STORIES` from `@/lib/story-shelf` and `RESEARCH_TOOLS` from `@/lib/discovery-content`, returning `id: "world"`, `label: "Built from"`, `facts: [plural(worlds, "world"), plural(stories, "illustrated story", "illustrated stories"), plural(tools, "research tool"), plural(publicJson, "JSON file")]` (`8 worlds · 27 illustrated stories · 7 research tools · <N> JSON files`), and `detail: ["Counted from the shelf, tool registry, and site snapshot."]` (`30` `countWords` tokens -> `472 + 30 = 502 <= 520`).
- **`src/app/_components/StoryHome.tsx` & `src/app/styles/discovery.css`:**
  - Render `<XrayTag {...homeXrayTag()} />` immediately after `<p className="st-builder">…</p>` inside `<main id="main">`.
  - Add `html[data-site-lens="engineer"] .v-story .xray-tag[data-xray="world"] { background: var(--folio); }` in `src/app/styles/discovery.css` for `SunlitLeaf` night-sky contrast.

## Acceptance checks

1. Extend `tests/e2e/section-homes-xray.spec.ts` (`const homes = ["/", "/scriptures", ...]`) and `tests/e2e/engineer-xray.spec.ts` so `/` is verified to carry 1 `.xray-tag[data-xray="world"]` hidden in `Reader` and visible in `Engineer` above `.st-frontispiece`.
2. Extend `tests/e2e/discovery.spec.ts`:
   - Audit `'.discovery-lens, .xray-tag[data-xray="world"], #discover'` with `axe-core` on `/?sky=00:00` across `["system", "light", "warm", "dark"]` with `.xray-tag[data-xray="world"] details` idempotently set to `open = true` under `Engineer`.
   - Assert `expect(dimensions.overflow).toEqual([])` at `320px` + `largest` OpenDyslexic text.
   - Assert at `390×844` on `/` that `.discovery-lens` stays single-row (`height <= 68`) and tabbing out of `.a11y-panel` closes the dialog so focused header controls are never obscured.
3. Update `tests/e2e/worlds-responsive.spec.ts` (`the compact accessibility trigger never covers a live target`) to check `/`, `/jesus`, `/early/ignatius`, and `/scriptures/topics`, asserting `.discovery-lens-bar .a11y-trigger` is visible near the top (`y < 100`) and never overlaps any target.
4. Run `npm run data:xray`, then `npm run lint && npm run typecheck && npm run test && npm run build`, then `PORT=3440 npx playwright test tests/e2e/discovery.spec.ts tests/e2e/engineer-xray.spec.ts tests/e2e/section-homes-xray.spec.ts tests/e2e/shared-reading-a11y.spec.ts tests/e2e/navigation.spec.ts tests/e2e/navigation-reflow.spec.ts tests/e2e/worlds-responsive.spec.ts`.
