# Jesus first pass

Revision 2; source baseline `a0f8e8dd21d89c76762e7773976a3614a822922f`.

## Goal and scope

Ship three user-authorized corrections: honest Gospel comparator claims, a working overview-to-map handoff, and useful starting choices on the overview. Preserve the current visual identity, Scripture witness text, comparison algorithm, free exploration, and remembered moment/lens. No broader navigation redesign, bibliography work, or terrain changes. Comparator editorial labels/synopses may be corrected where they assert source dependence; witness text and calculations remain unchanged.

## Decisions and contracts

- Comparator: describe the actual selected-passage corpus and normalized vocabulary overlap. Rename displayed “verbatim” runs to matching word sequences in English / matching lemma sequences in Greek, explaining normalization. Labels describe shared/unique vocabulary, not proven Gospel dependence. Keep existing internal algorithm/types in this pass. Separate Two-Source/Q and Farrer hypotheses from measurements; use the existing research worksheet for further study. Remove full-canon/proof claims from the page, controls, legends, metrics and inspector.
- Overview: a compact row of named starts in the existing type/color system: “Begin his life” selects annunciation + Gospel lens; “Read the Sermon on the Mount” selects `sermon-on-the-mount` + Words lens; “Examine the historical evidence” links to History. Buttons explicitly choose their lens; ordinary timeline/map/next selections continue preserving the chosen lens. Keep hash-over-saved-moment precedence and saved-lens restoration. Do not auto-select a moment or overwrite an existing selection on hydration.
- Empty Words lens: keep the honest no-speech statement and offer “Read the Gospel account” to switch the current moment to Gospels. Do not silently change a deliberately selected lens.
- Life map handoff: support existing `#life-event-<id>` and `#life-stop-<id>` URLs on initial mount and hash changes. Validate against data.events; select/focus the event, expand its passages, load through the existing loader, and scroll to the permanent `life-stop-<id>` article after render. Keep scroll requests separate from passage-load completion so text arriving never scrolls again. Preserve existing `life-stop-<id>` article anchors and `life-event-<id>` panel IDs/aria-controls. Invalid/malformed fragments leave the ordinary view functional. Async passage arrival must not reset user navigation. Hover previews apply only while no event is open: scrolling an opened event under a stationary pointer must not override the selected map event. No new persistence or map camera behavior.

## Likely files

`src/app/jesus/_components/SynopticComparator.tsx`, `src/app/jesus/harmony/page.tsx`, `src/app/jesus/life/LifeRoom.tsx`, `src/app/jesus/_components/life-lenses/{LifeLenses,MomentPanel}.tsx`, `src/app/styles/jesus.css`, focused unit/browser tests, and comparator editorial metadata in `public/jesus/synoptic-pericopes.json` only if necessary.

## Failure behavior

Preserve existing passage loading/error UI and retry where available. Hash decoding in both LifeLenses and LifeRoom must catch URIError and ignore malformed URLs. Starting buttons work without storage; normal links retain their destinations without JavaScript. Keep user choices stable after initial restoration. No network requests beyond the existing passage/data requests.

## Observable acceptance

1. Fresh overview offers three named starts; begin-life shows Annunciation Gospel text; sermon start shows recorded words; History link opens History.
2. A moment without speech offers a working Gospel action; subsequent ordinary selection preserves that lens.
3. Saved moment/lens and incoming moment hashes retain their existing precedence.
4. Overview Sermon -> full map selects Sermon, its place and journey index, opens text and reaches the event; direct URL and same-page hash changes work. Invalid fragments do not crash.
5. Comparator visibly describes its corpus and normalization, has no mathematical-proof/full-canon/verbatim/Q-as-measurement claims, and comparison functionality still works.
6. Review rendered desktop and phone-width layouts and keyboard starting actions; run lint, typecheck, full unit/smoke tests, build, relevant browser tests, independent diff review, staged/history secret gates, audited feature PR merge and normal production release.
