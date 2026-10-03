# LinkedIn engineering campaign — September 2026

Audience: Solutions Engineer, Implementation Engineer, and customer-facing Technical Support hiring teams.

## Factual evidence

- Translation race: commit d7ffaa6b5b6baf02a8e167098bf4d7aab792ba29, ReaderClient.tsx. Selection changed before replacement verses arrived; stale verses could be saved under the new edition. Fix clears data synchronously, disables saves through null verses, ignores superseded responses, and distinguishes load/comparison errors.
- Regression coverage: tests/e2e/offline-reader.spec.ts in that commit. Covers held KJV requests through shared links and in-page switches, 503 primary/comparison responses, and actual wording plus edition after offline reload. Campaign describes existing test coverage; no claim of a new full release audit.
- Dossier: live /scriptures/dossier inspected September 7. Curated presets, named source entries, separately labeled editorial notes, raw Markdown view, Download .md and Copy Audio Host Prompt. NotebookLM handoff is manual file ingestion, not an API connection or an automated NotebookLM result.
- Product stack and self-funded status: src/lib/portfolio-content.ts and /work/garovartabedian.
- Field-service and customer-facing history: RESUME in src/lib/portfolio-content.ts. No commercial software customers, performance metrics, certifications, or adoption claims.
- Voice: synthetic macOS narration; no voice cloning. Public video is labeled and captioned.

## Delivery

Three LinkedIn posts with two original engineering diagrams and one narrated, captioned product walkthrough. Source text in this folder; media and reproducible working files in ~/LinkedIn/2026-09-engineering.

Native LinkedIn schedule confirmed (America/Chicago): September 8, September 10, September 15 at 9:15 a.m. LinkedIn showed Scheduled (3) after saving the third post. All entries use the public Anyone audience. Both images have custom alternative text; the video has an uploaded SRT and thumbnail.

## Review and media verification

An independent Gemini 3.8 Flash review was completed through Antigravity. Wording was narrowed to curated research topics and the demonstrated John 1 preset. Its claim that arbitrary input is unavailable was rejected after inspecting the live query input; its uncertainty about bundled research prompts was resolved by inspecting the downloaded Markdown. No claims of NotebookLM API integration, model evaluation, enterprise customers, or adoption are made.

The two original engineering diagrams were rendered from SVG at 1200 × 1500 and visually inspected. The 55.888-second product walkthrough uses edited captures from the actual deployed dossier UI, local synthetic narration, and an exact transcript displayed as captions. H.264 / AAC, 1200 × 1500, 48 kHz mono, 2.02 MB; maximum audio level -2.3 dB. No music or cloned voice. A matching SRT and thumbnail accompany the video.

The website source is unchanged; this is a campaign documentation and media unit. Verification covers copy length, supporting evidence, image layout, exported dossier content, video decode and audio levels, and the native LinkedIn scheduling confirmations. The private source repository's standard secrets/history gate applies before push.
