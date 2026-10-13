# Verification follow-ups

Both items are **OVERDUE**: target 2026-09-12, still open.

- OVERDUE · **Accessibility case study: VoiceOver traversal.** Owner: Garo / accessibility review. Recorded 2026-09-05; target 2026-09-12. Verify heading/link navigation and the sample save/remove announcement using VoiceOver on Safari. Mitigation: native button with aria-pressed and a persistent role=status, keyboard interaction test, and full Axe/Lighthouse gate passed. Automated checks do not establish the spoken experience.
- OVERDUE · **VoiceOver and iOS Home Screen installation.** Owner: Garo / Scripture accessibility review. Recorded 2026-09-05; target 2026-09-12. In Safari on an actual iPhone, save a chapter, add the reader to the Home Screen, close it and reopen in airplane mode. Verify headings, chapter selection, reading size and status announcements with VoiceOver. Mitigation: native HTML controls, source text in the DOM, valid standalone manifest/icons, Chrome browser-restart offline test, failure injection, Axe in both schemes and responsive/forced-color checks. Desktop Chrome does not verify iOS installation or the spoken reading experience.
