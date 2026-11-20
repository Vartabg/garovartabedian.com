# Unit 2 Plan: Find Overlay UX, Native `<dialog>`, Mobile Geometry & Accessibility (`2026-11-11`)

## Context & Visual Direction

- **Who & Why:** Readers moving across eight historical/textual worlds and recruiters/engineers jumping directly to case studies, resume, or rooms. Find is a quiet editorial source instrument — a fast cross-world palette — not a hero banner or generative assistant.
- **Accepted Invariants:**
  - Source-only, non-generative results ("No generated answers"); zero LLM calls or automatic 47 MB embedding downloads from the popup.
  - Explicit `>` or `/` command prefix required for scholarly and preference commands (`"root of all evil"` and `"compare love and fear"` stay ordinary text searches).
  - `?` or `Commands` opens the Classical Knowledge Console command directory.
  - Edition-preserving reader URLs (`?t=...`, `withFindContext`).
- **Action-to-Result Contract:**
  1. Pressing `⌘K` / `Ctrl K` or clicking `Find` opens a native top-layer `<dialog>` with 2 compact chrome rows so the first result appears in the upper third of the viewport on both desktop (`~155–190 px`) and `390×844` phone (`~185–220 px`, down from `573–648 px`).
  2. Typing any query auto-previews `items[0]` on desktop without mutating keyboard selection (`selectedId`), highlights matched query words with `<mark class="find-hl">`, and loads KJV verse snippets for top Nave related topic hits alongside exact hits.
  3. Pressing `Enter` without an arrow-selected option navigates directly when `reference` matches, `commandOnly`, `scope === "site"`, OR `items[0]` is an unambiguous exact catalog title/alias (`score >= 95`, non-verse/topic) with confirmed `textExact.totalHits === 0` (e.g. `"Didache"`, `"JobPilot"`, `"Zoroastrianism"`, `"NIV"`); otherwise submits full text search (`/scriptures/search?q=...`).

## Planned File Changes

1. **`src/lib/site/find-bridge.ts`**
   - Capture `lastTrigger: HTMLElement | null` inside `setFindOpen(true)` when transitioning from closed to open (before `LazyFindOverlay` finishes dynamic hydration if needed) and export `restoreFindFocus()` so `Escape`, `×`, and backdrop light-dismiss reliably return focus to the opener.
   - Export a tiny post-hydration `usePlatformShortcutMod()` helper (or separate `src/lib/site/use-platform-mod.ts`) backed by `useSyncExternalStore` + `requestAnimationFrame` so both `SiteNavigation.tsx` and `FindOverlay.tsx` display `"⌘"` on Apple platforms and `"Ctrl "` elsewhere with zero SSR hydration mismatches and zero `react-hooks/set-state-in-effect` warnings.

2. **`src/lib/site/find-highlight.tsx`**
   - Add pure helper `highlightFindText(text: string, rawQuery: string): ReactNode` that strips translation/command prefixes, extracts folded/escaped non-stopword query tokens (`>= 2` chars), and wraps matched ranges in `<mark className="find-hl">` without mutating `textContent`.

3. **`src/app/_components/SiteNavigation.tsx`**
   - Replace hardcoded `<kbd className="site-nav-find-kbd">⌘K</kbd>` with platform-aware `{mod === "⌘" ? "⌘K" : "Ctrl K"}` via `usePlatformShortcutMod()`. Keep `aria-label="Find"` on `.site-nav-find` so `getByRole("button", { name: "Find" })` is unchanged.

4. **`src/app/_components/FindOverlay.tsx`**
   - **Native `<dialog>`:** Render `<dialog ref={dialogRef} className="find-dialog" closedby="any" aria-labelledby={dialogId + "-title"} onCancel={...} onClose={...} onClick={...}>`. Open via `dialog.showModal()` inside `useLayoutEffect` when `open` is `true`, and return `null` when `!open` so closed state has 0 dialog nodes. Include coordinate-checked click fallback on `<dialog>` when `!("closedBy" in HTMLDialogElement.prototype)`. Remove `.find-root`, `.find-scrim`, `document.body.style.overflow` mutation, `html[data-find-open]`, and manual `Tab` focus-trap code.
   - **2-Row Compact Chrome:**
     - Row 1 (`.find-top`): Inline `<h2 id={dialogId + "-title"} className="find-brand">Find<span aria-hidden="true">.</span></h2>` + `<form className="find-bar" role="search" ...>` (`⌕`, `<label className="find-label" htmlFor={...}>Find</label>`, `<input type="search" ...>`, Clear `×` or `<kbd className="find-shortcut">`) + `<button type="button" className="find-close" aria-label="Close find">×</button>` (`44×44`).
     - Row 2 (`.find-toolbar`): `.find-scopes` (`Everything`, `Passages & writings`, `Site pages`) + `.find-toolbar-end` containing compact `<select className="find-edition-select" aria-label="Find Scripture edition">` (when `scope !== "site" && canons`) and `Commands` button.
   - **Honest Refinement Chips & Related Snippets:**
     - Remove premature above-the-toolbar `.find-empty` `"No word matches"` banner.
     - Load KJV verse snippets (`kjv:${book}:${chapter}:${verse}`) for top 4 `textRelated.hits` in addition to `textExact.hits`.
     - When `scope !== "site" && canSearch && textExact?.totalHits === 0 && !textLoading`, render a compact `.find-bridge-note` (placed after `places` when `places` exist so exact catalog hits always stay first!) with clickable source-wording chips from `searchExpansion(cleanQuery).terms.slice(0, 6)` (`alone`, `forsaken`, `consolation`, `comfort`, `friend`).
   - **Single Search Passages CTA, Auto-Preview, & Smart `Enter`:**
     - Consolidate the 3 duplicate search actions into 1 compact button in `.find-footer` (`Search passages · “{trimmed}” ↗` when `canSearch && scope !== "site"`, falling back to `Open full text search ↗` link when `!trimmed && scope !== "site"`, and hidden when `scope === "site"`).
     - Auto-preview `items[0]` when `previewId === null && selectedId === null` (`previewItem = items.find(...) ?? items[0]`).
     - Route `Enter` directly to `items[0]` when `!selectedId && !reference && !commandOnly && scope !== "site" && (items[0]?.score ?? 0) >= 95 && !["verse", "topic", "action", "ask"].includes(items[0].kind) && textExact !== null && textExact.totalHits === 0`.
   - **Valid ARIA & Zero React 19 Lint Warnings:**
     - Remove invalid `aria-autocomplete`, `aria-activedescendant`, and `aria-controls` from `<input type="search">`.
     - Replace `selected.current` ref reads during render with `selectedId` state and key `textState` by `${selectedTranslation}:${trimmed}` so `eslint` reports **0 errors and 0 warnings** on `FindOverlay.tsx` and `FindPreview.tsx`.

5. **`src/app/_components/FindPreview.tsx`**
   - Key async preview state by `${translation}:${book}:${chapter}:${verse}` to eliminate synchronous `setState` in `useEffect`.
   - Highlight matched query tokens in `<blockquote>` and `item.snippet` with `highlightFindText`.
   - Remove duplicate `"Explore this question ↗"` button in empty preview state.

6. **`src/app/styles/find.css`**
   - Style native `.find-dialog`, `.find-dialog:modal`, `.find-dialog::backdrop`, `html:has(.find-dialog:modal)` scroll containment, 2-row `.find-top` + `.find-toolbar`, top-anchored mobile dialog (`margin: 0.5rem auto auto; width: calc(100vw - 1rem); max-height: calc(100dvh - 1rem);`), `.find-bridge-note` + `.find-chip` pills, `.find-hl` (`<mark>` with background + bottom border for non-color distinction), and `:is(button, a, select, summary):focus-visible` (single focus ring on `.find-bar:focus-within`).

7. **`tests/e2e/find-overlay.spec.ts`**
   - Keep all existing 17 behavioral tests green and add coverage for:
     - Native `<dialog>` backdrop click close & `Escape` focus restoration.
     - Mobile (`390×844`) top-anchored geometry (`firstItem.y < 280`).
     - Zero-exact-word refinement chips (`"loneliness"` -> clicking `"forsaken"` updates query and shows exact hits) + related verse snippets.
     - Exact-entity `Enter` routing (`"Didache"` -> `/early/didache`).
     - `axe-core` WCAG 2.2 AA scan in both light and dark mode on open Find dialog (`0` violations).
