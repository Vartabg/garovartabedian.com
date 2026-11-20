# Independent review: Say-it-once cuts and first-screen wayfinding

Reviewer: fresh-context research subagent (`7b7c5202-a115-46db-9a30-b250c5c6ec4a`), reading `docs/plans/say-it-once-cuts.md` (`r1` and `r2`) and the named source files on baseline `62775acc`.

Initial review (`r1`) identified four material blockers and three optional improvements:
1. `/early` first-screen options left an unworkable lede-trimming branch, lacked `.world-hero-actions` styling, and repeated `#catalog` and `#timeline` in `<WorldEntry>` right below the hero plate. Accepted: specified token-aware `.world-hero-actions` (`>= 48px` targets, dynamic `{EARLY_TEXTS.length}`) inside `<WorldHomeHero actions>` and removed `<WorldEntry>` on `/early`.
2. `/apostles/twelve` reordering floated sticky `<ApostlesSectionNav>` (`position: sticky`) over intro prose and `<TwelveMap>` and pushed the Acts 4:13 epigraph `~1,280px` down on phones. Accepted: kept the existing intro/epigraph/map/sticky-nav/dive-list order intact and added a compact non-sticky `<nav className="ap-room-jump">` directly below `<h1>`.
3. `CleanChrome` route list omitted `/work/excel-handler` (hero eyebrow) and did not explicitly exclude standalone `/work/landing-page` or note unused-import cleanup. Accepted: added `src/app/work/excel-handler/page.tsx:17`, documented `/work/landing-page` exclusion, and verified local bindings across all 17 route files.
4. Verification checks omitted explicit Playwright runs, overstated current `navigation.spec.ts` route coverage, and missed `public/meta/site-xray.json` `routeTests` regeneration (`npm run data:xray`). Accepted: added `npm run data:xray` sequencing and explicit unit + Playwright checks.
5. Accepted all three optional improvements: filtered `/early/library` collection links fall back to `/early/library#collection-${g.id}`, dead `.scr-hub-stories .scr-hub-group` CSS is removed, and the two intentional landmark/label updates are documented.

The same reviewer re-read `r2` against source and approved with zero remaining material blockers. Browser layout and full suite verification remain with the implementer.
