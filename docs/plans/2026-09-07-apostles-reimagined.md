# Apostles: Called. Changed. Sent.

Goal: give the Apostles a human, visually substantial story experience with the care of Angels & Demons, preserving every record and evidence distinction.

Approach: an illustrated editorial home, equal access to thirteen records, and three source-grounded stories: Peter restored (John21:1–19), Thomas (John20:24–29), and Pentecost (Acts2:1–13). Original paintings carry distinct narrative moments. The reader controls reflection and emphasis; the interaction never simulates producing a miracle. Source passages remain available without JavaScript.

Ownership: Muse owns `src/app/apostles/ApostlesHome.tsx` and `src/app/styles/apostles-home.css`; Codex owns content contracts, artwork, story integration, research section extraction, metadata, tests and verification. Gemini independently reviews supplied artifacts. At most two external workers; compact prompts and bounded replies; no duplicate implementation or autonomous worker commits.

- [x] Preserve legacy sources in `src/app/apostles/ApostlesSources.tsx`; implement the home using `src/lib/apostles/stories.ts`.
- [x] Create source-grounded stories at `src/app/apostles/stories/[slug]/page.tsx` with small reader controls and dedicated styles. Three emotionally distinct experiences, native scroll, no timed content gates.
- [x] Generate six original paintings under `public/apostles/stories/`, recording prompts and provenance in `docs/apostles-reimagined.md`. Do not replace the existing manuscript originals.
- [x] Add discovery/source/interaction/no-JS/mobile tests in `tests/e2e/apostles-stories.spec.ts`, plus content integrity checks; extend accessibility routes and metadata.
- [x] Independent review; lint, types, unit/smoke, build, browser and accessibility gates; desktop/mobile screenshots and reading-preference checks.
Release procedure: finish through audited commit/push, then update PR86 and its hosted preview. The durable review handoff records the exact pushed revision, deployment identity, and lifecycle result after execution. Publication remains held for Garo’s visual review.

Guardrails: do not invent dialogue, identities, destinations or martyrdoms; the Twelve are not the entire early church; Matthias replaces Judas; Paul is distinct. Thomas is invited to touch, but the passage does not say that he touched. Pentecost includes a gathered community and multilingual Jewish hearers; do not assert an exact room, crowd size or individual reactions from art. No scroll hijacking, required animation, unlabeled visual-only state, or new dependencies. Keep source and local reading accessible at320px, large type, reduced motion and forced colors.
