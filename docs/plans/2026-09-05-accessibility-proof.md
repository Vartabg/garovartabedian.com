# Accessibility proof

Goal: make the published four-product accessibility work discoverable from Work and demonstrate keyboard operation and an announced result.

Approach: use the shared portfolio content spine, a static case study, and a small illustrative interaction. Describe the old failure as code rather than putting an inaccessible control into the page. Do not claim certification or new user-study results.

- [x] Add `tests/e2e/accessibility-proof.spec.ts`: navigate from Work, operate the sample with a keyboard, confirm its announced state, and scan the page.
- [x] Add `/work/accessibility`, its OG image, shared copy, demo, and local styles.
- [x] Include the case study in `src/lib/portfolio-content.ts`, `src/app/sitemap.ts`, and the rendered accessibility route list.
- [x] Run lint, types, unit/smoke tests, production build, browser verification, and accessibility checks; record evidence.
- [x] Finish the audited branch and ship through a verified PR.

## Verification — 2026-09-05

Lint, TypeScript, unit/smoke integrity tests, and production build passed. Production Chrome test navigated from Work and toggled the illustrative sample with Enter and Space. Full rendered gate passed all 35 routes in light/dark with Axe and Lighthouse; cleanup was slow but completed successfully. Native browser inspection confirmed the two examples and announced saved state.

Review: checked claims against the public source, keyboard/state semantics and generated portfolio artifacts, then routing and responsive styles. No certification or historical screenshot is implied. See TECH_DEBT.md for the pending human screen-reader check.

Release: PR #75 merged as `4bd282137b47973c0fa8e678aed45c2929014b08`. The complete local browser gate passed 122 tests with three device-specific skips. Production artifact metadata matched that commit; the staged case study and generated PNG passed HTTP/content checks before Vercel promotion. Live route: https://garovartabedian.com/work/accessibility. GitHub runners remain unavailable; verification was performed locally.
