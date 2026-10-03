# Shared reader rollout

Preview-only change on `codex/jev-research`. Production publication is a separate decision. Engineering verification does not establish improved reader comprehension; no reader study has been performed.

## Route coverage

| Route family | Shared presentation and controls | Notes / constraints |
| --- | --- | --- |
| `/scriptures/read/isaiah-53-clement-16` | Shared appearance, typography, source dialog, lazy comparison | Existing English pilot; editorial and AI findings stay unreviewed |
| `/scriptures/[tradition]/[book]/[chapter]` | Shared size/face/spacing/paper, Read default; Aa panel | Translation, verse layout, original alignment, red letters, narration and offline saving retained; references pin displayed edition; cross-canon neighbors choose a valid shelf |
| `/early/[text]` | Shared surface, Read/Trace and appearance | All original sections/paragraphs and citation aliases retained. Context/artwork/source records available in a disclosure. Deterministic WEB matches explicitly suggested/unreviewed |
| `/early/library/[edition]/[section]` | Shared surface and appearance; Trace when notes exist | Fragment gaps, translator commentary and source locators unchanged. Edition notes use nearby dialogs with ordinary-link fallbacks |
| `/jesus/history/belief-and-growth` | Shared surface, appearance, annotation patterns | Existing citations open source notes; editorial prose distinguished from source citations. Video excerpts stay on demand |
| `/jesus/*`, `/apostles/*`, `/church/*`, `/angels/*`, `/word/*`, `/evidence/*` narrative rooms | Shared prose styles and global Aa; no empty Trace | Applies to surrounding prose. Maps, charts, tables, evidence comparison layouts and their labels remain specialized |
| `/apostles/stories/[slug]` | Shared narrative/source prose and appearance | Original paintings, interaction, narrative headings and exact WEB passages retained |
| `/angels/stories/{open-his-eyes,i-am-with-you,the-gate-opened}` | Shared prose/source panels and appearance | Artwork scenes, overlay contrast, gestures and pacing retained; source links pin WEB |
| Collection indexes, Find/search, professional/contact pages | Shared global Aa/preferences; existing functional layouts | These are navigation/tools rather than full reading surfaces |
| `/scripture-reader/index.html` | Existing standalone offline app retained | Its offline size controls and app shell remain specialized; cached editions and offline behavior are not migrated or republished |

## Downloaded text structure

The original shelf, hosted edition library and Isaiah–Clement path now share a lossless paragraph/quotation formatter. See [text-layout.md](text-layout.md) for coverage, source preservation, editorial-break rules and the reproducible corpus audit. Scripture retains its specialized verse structure while grouping unchanged verses into shorter reading paragraphs. New visitors use flowing prose; saved verse-per-line choices, poetry/wisdom verse lines, and comparison/original alignment remain intact. See [all-text coverage](../research/all-text-coverage-2026-09.md) for the full-corpus audit and Find coverage.

## Preference contract

`garovartabedian:reading:v2` owns shared appearance. One self-contained runtime is used before paint and by React controls. The root scales once; reading paragraphs use 1.1875rem, approximately 65ch and 1.8 line height. New visitors use Device and Book. Device has a server-rendered fallback even when storage or JavaScript is unavailable.

Migration reads, without deleting, `garovartabedian:a11y:v1`, `garovartabedian:reading-path:v1`, and `scr:easy`. New shared data takes precedence. Non-default global accessibility accommodations win; effective saved text sizes include the old global multiplier and never shrink during migration. Flow, translation, original-language and speech preferences remain specialized.

Teal/solid = source; copper/dashed = interpretation; violet/dotted = open question. Each has a visible text label. Monochrome retains labels and patterns; it does not desaturate artwork. Existing world accents identify navigation and headings.

## Navigation and source boundaries

Each browser history entry owns a session-only bookmark: URL, edition, stable paragraph/verse, containing section, relative offset and layout signature. Back/Forward restores the absolute offset only if layout is unchanged; changed type/layout restores the same anchor. Fresh explicit citation links take priority. Missing anchors fall back to the section. Storage failure leaves ordinary links and browser navigation usable. Session records are not sent to a server.

Source-note dialogs retain a visible Return to reading control, Escape support and focus/position restoration. Dialogs mount at the document body only when opened: inline citations never introduce block elements inside paragraphs or superscripts. This keeps server HTML valid and prevents hydration recovery from resetting appearance. Without JavaScript, citations remain ordinary links; edition notes and deterministic matches remain available. Scripture's existing static shell still renders the named default edition without JavaScript; selecting another edition uses the existing client loader.

No hosted source files or public allusion/claim formats are changed. Deterministic matches and AI suggestions are separately identified. Similarity does not prove borrowing or agreement. Comparison remains lazy and supported source types, provider credentials, limits, caching and privacy controls are unchanged. Merely reading, typing in Find, switching Trace or opening an ordinary source note makes no provider request.

## Verification

Automated coverage includes conflicting legacy choices, bounded/disabled storage, one-time scaling, synchronized controls, source equality, preserved citations, no-JavaScript reading, reference editions, notes/focus, Back/Forward, changed text size, and appearance before application hydration. Reflow checks use 320/390/768/1440px widths and the [WCAG text-spacing overrides](https://www.w3.org/WAI/WCAG22/Understanding/text-spacing.html); specialized maps and artwork remain distinct from the [reflowing prose](https://www.w3.org/WAI/WCAG22/Understanding/reflow.html).

Existing original-language, speech, offline and illustrated-story suites are retained. Bounded whole-page axe checks cover all four themes on Clement, John 3, the historical essay and four illustrated stories, plus monochrome, high contrast and forced colors. The pilot suite also checks its open source note. These checks are representative, not a claim that every page has received a manual accessibility audit.

The September 25 verification passed lint, typecheck, 704 unit tests, 46 smoke tests and the production build (8,278 pages). The final browser runs passed 118 desktop, 24 phone and 8 tablet cases, with five intentional viewport-specific skips. The combined browser invocation stalled during runner cleanup after its assertions passed; isolated suite runs completed with exit code zero. The hosted check caught an inline-dialog hydration regression; the fix and a new essay/edition regression passed all 32 affected reader checks against the rebuilt production output. The browser check also exercised Find → Isaiah in KJV → Clement → a source note → Back.

Reader feedback is still needed on comfort, comprehension and ease of resuming after following a connection. The preview is for that assessment, not evidence of an improvement already measured.
