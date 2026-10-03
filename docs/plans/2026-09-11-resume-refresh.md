# Resume refresh

Goal: deliver an updated, readable one-page master resume and keep the public
resume, project links, PDF, and generated metadata consistent.

Scope: `src/lib/portfolio-content.ts`, `src/lib/portfolio-truth.json`,
`public/Garo-Vartabedian-Resume.pdf`, `public/meta/resume-artifact.json`, and
generated `public/llms.txt` / `public/meta/profile-facts.json`. Preserve the
established timeline and education.

- [x] Compare the July resume and current PDF with the September LinkedIn review,
  project source, and the Merge Monitor launch/pilot record.
- [x] Add concrete project bullets and links; use a software/automation headline.
- [x] Retain Field Service Engineer, confirmed directly by the owner September 11.
  Use Career Transition for 2020-2022 without asserting unconfirmed paid freelance
  work. This label does not establish whether paid work occurred.
- [x] Generate and visually inspect the one-page PDF; preserve text and link checks.
- [x] Regenerate machine-readable content; lint, typecheck, 635 unit tests, and
  40 smoke tests pass. The production build passes; a final rebuild follows the
  link correction below.
- [x] Review the scoped diff against the factual and accessibility boundaries.
- [x] Provide the dated local PDF at
  `~/Downloads/Garo-Vartabedian-Resume-2026-09-11.pdf`.

Delivery uses `agent-task finish`, an audited PR merge, and the repository's
`release:production` gates. The PR and local release receipt record the actual
merge/deployment result. Verify the public resume and PDF before reporting live.

Link review: Merge Monitor's repository is private. Its project and PDF links
point to the owner's published LinkedIn walkthrough instead of a private repo
or a nonexistent public app.

Evidence boundaries: Merge Monitor works locally and demonstrated a real handoff;
it does not autonomously launch agents. JobPilot retains human review/submission.
Research and accessibility bullets describe implemented features, without client,
revenue, adoption, certification, or unsupported performance claims.
