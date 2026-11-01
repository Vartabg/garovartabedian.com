# Scripture edition counts

Goal: book navigation reports the chapters in the hosted edition its link opens, and the canon matrix distinguishes traditional enumeration from hosted records.

Use the existing generated `public/scriptures/doorways.json` counts rather than canonical maximums. Preserve canon membership, sources, and traditional enumeration values. The existing generator reproducibility test remains the data gate.

Files: `src/lib/scriptures/edition-counts.ts`, `src/app/scriptures/_components/BookList.tsx`, `src/app/scriptures/[tradition]/Shelf.tsx`, `src/app/scriptures/[tradition]/[book]/page.tsx` (count metadata fallback), `src/lib/scriptures/canons-matrix.ts`, `src/app/scriptures/_components/CanonsMatrix.tsx`, `tests/scripture-edition-counts.test.tsx`, `tests/canons-matrix.test.ts`, `tests/e2e/scripture-edition-counts.spec.ts`.

- [x] Add regression checks for Ezra, Esther, Psalms, Daniel and Joel in their actual hosted editions.
- [x] Use hosted edition counts in list/shelf navigation without changing the reader's default edition.
- [x] Label matrix filters as hosted entries and keep traditional enumeration explicit; expose chapter differences by hosted edition.
- [x] Run relevant tests, lint, typecheck and complete unit/smoke verification.
- [x] Coordinate the heavy build/browser slot and verify the visible path using system Chrome.

Validation: full unit (834) and smoke (50) suites passed. The final changes passed 22 targeted source/data reproducibility tests, production build (including lint/type validation), and three system Chrome browser checks. The browser checks cover edition-matched chapter navigation, keyboard dossier focus/close, and canon selectors at 320px with 200% text. A long-option overflow caught in the first narrow-screen check was fixed by keeping select options short and moving both counts to wrapping, associated descriptions. The managed preview was stopped after the checks.

Delivery: use audited `agent-task finish` and open a PR; do not merge or deploy.
