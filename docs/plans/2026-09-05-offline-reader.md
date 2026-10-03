# Scripture kept on the device

Goal: save the currently selected chapter and translation, close the reader, disconnect, and reopen the saved text in a standalone phone app.

Design: a small static reading shell at `/scripture-reader/` has its own scoped service worker and manifest. Saving first verifies shell installation, then atomically writes the exact displayed chapter to Cache Storage. It does not cache the whole research site or its Next.js routes. A durable versioned chapter store is separate from replaceable shell assets.

- [x] Add production browser tests for saving, closing/reopening offline, translation identity, failure reporting, and accessible reflow.
- [x] Add a typed save helper and a chapter control in `ReaderClient.tsx`.
- [x] Build `public/scripture-reader/` with the static shell, responsive reading controls, source attribution, reading position, saved-chapter management, manifest, and icons.
- [x] Add `public/scripture-sw.js` with bounded same-origin scope and fail-closed installation.
- [x] Verify the full repo gates, offline restart, keyboard, mobile, reduced motion, and forced colors; document screen-reader evidence and limits.
- [x] Verify locally, audit the branch, and release through a PR and staged Vercel promotion.

## Verification — 2026-09-05

Lint, TypeScript, unit/smoke tests and production build passed. The full rendered gate passed all 34 existing routes in two color schemes plus Lighthouse. Nine focused Chrome tests passed: save and reopen offline, complete browser restart offline, exact WEB/KJV identity and persisted size/removal, service-worker registration denial, quota failure, Axe at 1280/390/320 px in light/dark and forced colors, and valid standalone manifest with reachable icons. Native browser inspection verified the chapter-to-saved-reader flow and readable 390 px layout.

Review: checked service-worker scope and shell installation before success; cache write/readback and chapter/translation keys; DOM-only saved text, native keyboard controls, source attribution and motion/contrast/reflow. The failure tests inject registration and quota errors; the offline persistence tests use the actual worker/cache and a fully closed/restarted system Chrome.

Human VoiceOver and actual iOS installation remain explicit follow-ups in `docs/TECH_DEBT.md`. This branch is independent of the portfolio card branch so each can land separately.

## Local release verification

GitHub-hosted runners are unavailable because of account billing. After the user confirmed that CI was unavailable, the existing checks ran locally. After integrating the accessibility case study: lint, types, unit/smoke tests, and production Vercel build passed; the full browser suite passed 131 tests with three device-specific skips; the rendered gate passed 35 routes in light/dark and Lighthouse. No branch protection, secret audit, or test was disabled. Release uses a staged production artifact, commit metadata and HTTP checks before promotion.
