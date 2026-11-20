# Playable stories on garovartabedian.com

Garo wants the Bible and 1 Enoch play experiments to live beside the readings on his personal site. People arriving from the Stories shelf should be able to start a short story or a flight and go straight to its source. The current Halaverga build stays live at its existing addresses until Garo designs its successor. Its repository, deployment, ballots, DNS, and player saves retain their existing owners.

## What carries over

- Give the existing 27-story shelf a separate link to `/scriptures/stories/play`. Make the games and the existing David reading independently discoverable. David and Goliath remains a game concept. Preserve the pitch in this repository as a development note and link the published David story as a reading.
- Bring the actual three-turn Temple game to `/scriptures/stories/play/overturned-tables`. Both companions and every route remain playable. Show the picture, source and readable account with JavaScript disabled. Base quotations on the site's World English Bible at Mark 11:15–18. Credit the public-domain El Greco image and distinguish the imagined witness from Mark.
- Bring the two existing Mount Hermon modes to `/play/hermon` and `/play/hermon/crossing`, and its readable account to `/play/hermon/crossing/account`. The setting is Mount Hermon at dawn, in the days of Jared. Distinguish 1 Enoch 6 from invented encounters and include its hosted reading. Preserve the controls, checkpoints, accessibility, game art and attributions.

## Ownership and delivery

The private site's baseline is `cd7cda2d`. Take the game from `Vartabg/halaverga` at `fbf267fdbd` and the Temple from the previously tested stand-alone prototype. Own the maintained Hermon source and assets under `games/hermon`. It builds as an independent Next static export with its own lockfile and renderer-compatible React 19.2.8. The host runs React 19.3.1. Mount the output at one same-origin prefix in `public/play/hermon` during the site's development and production builds. Use exact host rewrites for the three HTML pages. Keep exported chunks and all models, photographs, map, fonts and paths inside that prefix. Navigate between the two runtimes with normal HTML anchors.

The host keeps its existing CSP and framing protections. The migrated game needs no new accounts, tracking service or server-side store. Retire the former server-side control survey and its network analytics in the copy. Preserve local controls, progress, downloadable playtest measurements and opt-in gesture recordings. The field guide's QR code opens the flight on the personal site. Browser storage starts at the new origin and stays separate from the old install. No data is transferred between the domains. Avoid importing other historical prototypes or Vercel settings. Keep illustration/asset credit and license information with the source. Use the three already made play experiences to test the idea before adding episodes.

## Verification and release

- Independently install and build the game, check movement and the crossing state machine, and verify a clean site build generates the exported HTML and all of its JS, CSS, models and images. A failed inner build must fail the host build. The copy must work with the old host blocked. Confirm correct MIME types, no broken requests, successful game startup and usable fallbacks.
- Test navigation from the existing Stories shelf, Temple outcomes and restart, both Hermon modes, control selection, source links, no-JavaScript accounts, keyboard, reduced motion, desktop and phone-sized views. Test real rendering where available. Record physical-device limitations.
- Run the site's lint, type, test, production build, and browser/accessibility gates. Use its audited feature branch, PR and release process. Recheck the production discovery path and play each mode. Capture current responses at both historic addresses before and after the move. Rollback through the personal site's prior release or a revert of this unit. Halaverga has no release or DNS changes in this migration.

## Implementation contract after independent review

The Stories hub and Overturned Tables are native host App Router pages under `src/app/scriptures/stories/play`. The Temple input is the locally exported `temple-story-trial/index.html` (SHA-256 `4ba5ca06e196f25906b462b39a1445b7ac8c189b6f1f5f42ad1835db4a249a9c`). Its readable game rules, story and credited painting belong with the maintained native route. The Valley of Elah design is recorded in `docs/plans/playable-stories-design.md`. The source baseline was fast-forwarded to `5c43891b` after review. Only existing site browser tests changed in that fast-forward.

Build the game as a non-workspace npm package from its own lock with the explicit Next `basePath` `/play/hermon` and `trailingSlash: false`. Next prefixes its runtime chunks with the base path. Prefix public URLs explicitly. The host rewrites exactly the three entry routes to `index.html`, `crossing.html` and `crossing/account.html` beneath the same directory. All inter-application links use plain anchors. The host's development and production hooks install locked game packages, export, validate and copy the publishable files. Git ignores the mounted output and local build/dependency directories. Maintained source assets stay inside the game. No credentials or hosting configuration from Halaverga travel with it.

Check namespaced game storage against the host settings, MIME type and content of requested assets, and real loading of the renderer under the existing policy. Leave old-domain Web Storage alone. Validate that the host release tests and generated site inventory work both before and after a static export.
