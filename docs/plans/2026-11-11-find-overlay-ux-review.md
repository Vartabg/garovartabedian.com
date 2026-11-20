# EGM Review Disposition: Unit 2 (`2026-11-11-find-overlay-ux.md`)

Independent fresh-context `research` subagent review completed before implementation. Every blocker, major, and minor finding is accepted and incorporated into Unit 2:

## Blockers Incorporated
1. **Preserve `/No word matches in/` inside `.find-bridge-note` (`public-search-relevance.spec.ts:77`):**
   - Start `.find-bridge-note` status copy with `No word matches in {editionName}` (placed inside `.find-results` after `places` rather than as an above-the-toolbar banner) followed by clickable source-wording chips (`alone`, `forsaken`, `consolation`, `comfort`, `friend`).
2. **Modal `<dialog>` inertness & focus restoration (`find-overlay.spec.ts:98`, `navigation-reflow.spec.ts:81`, `thomas-parables.spec.ts:118`):**
   - `setFindOpen(next, trigger)` records `trigger` (with `SiteNavigation` passing `event.currentTarget` for WebKit mouse clicks and fallback to `.site-nav-find`).
   - Interactive dismissals (`Escape`, `×`, backdrop click) close via `dialogRef.current?.close()` and run `setFindOpen(false)` + `restoreFindFocus()` inside `<dialog onClose={...}>` after modal inertness clears.
   - Programmatic unmount closes (`Cmd/Ctrl+K`, `go()`, `search()`) call `if (dialog.open) dialog.close()` first inside `useLayoutEffect` cleanup before restoring focus (with `{ preventScroll: true }` when `openSameRoomParable` handled same-room opening, and skipping focus restore on cross-route navigation).
   - Add `autoFocus` on `<input ref={inputRef}>` alongside `useLayoutEffect` focus.
3. **Smart `Enter` 280ms debounce race (`Blocker 3`):**
   - Make `submit()` async-capable when `!selectedId && !reference && !commandOnly && scope !== "site" && (items[0]?.score ?? 0) >= 95 && !["verse", "topic", "action", "ask"].includes(items[0].kind)`: if `currentTextExact === null && canons`, query `searchVerses(cleanQuery, selectedTranslation, 1)` directly before deciding between `go(items[0])` (`totalHits === 0`) and `search()` (`totalHits > 0`).

## Major & Minor Findings Incorporated
1. **Use installed `axe-core` (`node_modules/axe-core/axe.min.js`):** Reuse the repo's `page.addScriptTag` + `window.axe.run(".find-dialog", ...)` pattern instead of uninstalled `@axe-core/playwright`.
2. **Eliminate all 11 ESLint hook/ref warnings & graduate from `eslint.config.mjs`:**
   - Split `FindOverlay` into thin outer store shell (`useSyncExternalStore(subscribeFindChange, isFindOpen, () => false)`) + `<FindOverlaySession>` with lazy state initializers, keyed `selection`, async-only `setTextState`, `requestedSnippetsRef`, and keyed `FindPreview` state.
   - Remove `FindOverlay.tsx` and `FindPreview.tsx` from `eslint.config.mjs` legacy warning allowlists (`legacy/react-effects-migration` and `legacy/react-refs-migration`).
3. **UA `<dialog>` CSS resets, scroll containment & `.lamp` rule:**
   - Scope `.find-dialog[open] { display: flex; flex-direction: column; }`, set `padding: 0; max-width: none;` on `.find-dialog`, use `overscroll-behavior: contain` on `.find-dialog:modal` and `overflow: hidden; overscroll-behavior: contain;` on `.find-dialog::backdrop` (no `html { overflow: hidden }`), and update `src/app/styles/core.css:259` `.find-root` -> `.find-dialog[open]`.
4. **Safari `closedby="any"` fallback safety:** Pair `onPointerDown` (`pressedBackdropRef`) + `onClick` (`event.target === dialog && !(clientX === 0 && clientY === 0) && isOutsideRect`) so `<select>` popups, keyboard clicks, and input drag-selections never dismiss the dialog.
5. **Mobile `390px` / `320px` toolbar wrapping, `firstItem.y < 250px`, and `.find-hl` contrast:**
   - Wrap `.find-toolbar`, bound `.find-edition-select` width (`max-width: 10.5rem`), make `.find-start` a compact flex strip, scope result option locators to `.find-results`, and style `.find-hl` with `color: inherit`, `color-mix` gold/accent wash, bottom border, and `@media (forced-colors: active)` `Mark`/`MarkText`.
6. **Minor polish:** Render `.find-bridge-note` outside `role="listbox"`, fold word-by-word in `highlightFindText` so ligatures (`æ`, `œ`, `ß`) preserve slice indices, keep `44px` mobile touch targets, keep `Open full text search ↗` when `!canSearch && scope !== "site"`, and guard `scrollIntoView` with `selectedId !== null`.
