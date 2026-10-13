# garovartabedian.com

Independent work portfolio for Garo Vartabedian, and a live
**eight-world research site** about Scripture, Jesus Christ, the apostles, the
early church, the church through history, angels and demons, and who owns the
Bible—and how its claims are known. The site **is** the engineering proof: generated public-domain data,
source provenance, static-friendly App Router routes, and verified shipping.

The front door is the eight worlds. Independent services live at `/services`,
with the full-time employment profile retained separately at `/hire`. Story is
the SSR default, so the research site works with JavaScript disabled.

## The eight worlds

All eight render from one shared content layer
(`src/lib/portfolio-content.ts` for the portfolio spine; generated JSON under
`public/` for the research data). No route authors its own copy — that's what
keeps every page truthful.

| World | Route | What |
|---|---|---|
| **Scriptures** | `/scriptures` | Every canon of every tradition, full text, cross-referenced, plus topic and search readers |
| **Jesus Christ** | `/jesus` | His words (red-letter + word studies), his life on the map, prophecy and fulfillment, the record in ink and stone, and perspectives |
| **The Apostles** | `/apostles` | The twelve he chose — who each man was, where his road went; the sent map |
| **The Writings** | `/early` | Everything the early church read outside the canon — the texts whole, grouped by era, with a map and timeline |
| **The Church** | `/church` | From the upper room to today — the tree, the faces, the councils, the giants |
| **Angels & Demons** | `/angels` | The unseen order, the fall traced text by text, every encounter on record, and the demons room |
| **Who Owns the Word?** | `/word` | Modern translations are owned — the facts, the fences, and the ones given free |
| **How We Know** | `/evidence` | Observation, inference, interpretation, and explicit limits — beginning with Faith & Science |

The portfolio surfaces sit alongside the worlds: `/about`, `/work` (with case
studies for JobPilot, garovartabedian.com, and EYE), `/hire`, `/resume`,
`/services` (the $500 Workflow & Automation Audit), `/sources`, and `/contact`.

## Stack

- **Next.js 15** (App Router) + **React 19**, TypeScript
- **Generated JSON data** in `public/` (scripture text, canons, cross-refs,
  search shards, Nave topics, early writings, church road, angels, word
  studies, evidence cases, source records) — static-friendly and inspectable
- **Hand-written CSS design system**; each world owns its own palette and CSS,
  loaded at route level for per-route splitting
- **Self-hosted fonts** compiled by `next/font/local` from local `@fontsource`
  files: Atkinson Hyperlegible (default), Atkinson Hyperlegible Mono,
  OpenDyslexic, and Fraunces. There are no Google font requests; swap rendering
  and adjusted fallbacks reduce font-related layout shift.
- **Strict CSP** in production: `default-src 'self'`, `object-src 'none'`,
  `frame-ancestors 'none'`, HSTS preload, nosniff, referrer-policy,
  permissions-policy (FLoC off) · deployed on Vercel
- **Two client libraries** beyond React/Next: `maplibre-gl` (the `/jesus/life`
  map) and `@huggingface/transformers` (in-browser semantic search). Tilt,
  geo, WebGL and speech are platform APIs; the only iframe origins are two of
  Garo's own live demos (EYE, atxbro.com), and each demo deploy must allow
  `frame-ancestors` for the embed

## Develop

Node.js 24.x is required locally, matching CI and Vercel. `.nvmrc` and
`.node-version` both select that major; activate it with your version manager
before installing dependencies.

```bash
nvm use          # or activate Node 24 with your version manager
npm install
npm run dev      # http://localhost:3000
npm run build    # production build
npm run check    # the full gate, including E2E and a11y
```

Two server routes take visitor text. `/api/library-search` is a GET search of
the early writings index and needs no secrets. The optional AI relevance checks
(`/api/find/*`) accept POST input and need `FIND_PUBLIC_ENABLED=1`,
`FIND_PUBLIC_ORIGIN`, `FIND_SESSION_SECRET`, `FIND_DATABASE_URL` (Postgres) and
`TYPESAFE_API_KEY`, with work dispatched through a Vercel queue; the API answers
503 unless every value is set. Without `FIND_PUBLIC_ENABLED=1` the reading path
and search show no AI check, and because those pages read it when they are
prerendered, it must be set at build time. The `/scriptures` per-chapter
reader is server-rendered on demand (every other route is prerendered as static
or SSG). The `/scriptures` and `/jesus` traditions use
public-domain texts (World English Bible, etc.); modern copyrighted
translations are analyzed in `/word` but never hosted as scripture.

## Verification

`npm run check` chains the full local gate. The local release runs these same
checks with a Vercel production build:

- `npm run lint` (ESLint, flat config)
- `npm run typecheck` (`tsc --noEmit`)
- `npm run test` — unit tests in `tests/` + smoke integrity in `scripts/smoke/`
  (includes a media audit)
- `npm run build` (production build)
- `npm run test:e2e` — Playwright browser checks
- `npm run test:a11y` — **axe** (WCAG 2a/2aa/2.1a/2.1aa/2.2aa), run under both
  light and dark `prefers-color-scheme`, + **Lighthouse accessibility ≥ 0.95**
  on 44 routes across every world, including `/jesus/words`. Two isolated Node
  workers share the route list; each reuses Chrome with fresh page storage.
  Per-route timings and the temporary Lighthouse report directory are logged.
  Use `A11Y_WORKERS=1 npm run test:a11y` to diagnose resource contention on a
  smaller machine. Both worker settings run every route and the same checks.

## Production releases

Primary command, run from a repository checkout after the feature PR has
merged to `master`:

```bash
npm run release:production
```

Requirements: Node 24, npm, git, authenticated `gh`, authenticated Vercel CLI
(via `npx vercel@59.9.1`), `gitleaks`, Chrome, and `pdftotext`. Keep the Mac
awake for the whole run. Run one release at a time locally.

The script fetches `origin/master` and deploys from a separate temporary
detached checkout of that exact merged commit, so unrelated changes in the
primary worktree are not deployed. It requires GitHub evidence that the commit
came through a merged PR to `master`. It then runs source/history secret
scans, `npm ci`, lint, typecheck, unit+smoke, a production configuration pull
and a single local Vercel production build, full Playwright E2E, and full
axe/Lighthouse accessibility checks. After the checks pass it stages with
`--prebuilt --prod --skip-domain`, validates the deployment URL, READY state,
production target, project, and exact commit, rechecks `origin/master`
immediately before promotion, then promotes and verifies the production
aliases. It saves a release report under
`~/.local/state/garovartabedian/releases/` and cleans the temporary checkout.

Never push `master` directly; ship isolated feature worktrees via verified
push, PR, and merge, then release from the merged commit. Artifacts and
commands never contain hardcoded credentials — use the existing local logins.
Vercel project/team IDs are identifiers, not secrets.

[vercel.json](./vercel.json) keeps Vercel automatic Git deployments disabled.
`.github/workflows/ci.yml` is `workflow_dispatch` only for optional manually
requested verification: no automatic push/PR runs, no Actions deploy path, and
no required CI statuses. Manual GitHub runs consume hosted minutes. GitHub
Actions is out of the normal release compute path; hosting stays on Vercel
independently (currently Pro plan, unchanged).

## Assets & data

- `scripts/media/audit.mjs` — the smoke media audit (referenced by
  `npm run test:smoke`)
- `scripts/media/compress-jpgs.py` — one-shot JPG compression pass
- `scripts/jesus/split-words.mjs` — rebuilds the red-letter / word-study data
- `public/scriptures/canons.json` — the canon metadata the scripture shelves,
  sitemap, and `{tradition}` static params all read from

## Structure

- `src/app/page.tsx` — the eight-world home (SSR renders the Story composition)
- `src/app/_components/StoryHome.tsx` — single presentation (Story), photo-led
- `src/app/_components/WorldSwitcher.tsx` — steps between the eight worlds
- `src/app/_components/sections/` — shared section components
- `src/app/{world}/` — each world owns its route tree, layout, navigation,
  palette, and rooms (e.g. `/jesus/{words,life,prophecy,history,lens}`)
- `src/lib/portfolio-content.ts` — one prose source for every portfolio surface
- `src/lib/{world}/` — per-world loaders, types, and plate data
- `src/lib/i18n/` — nine locale bundles (en/es/fr/de/ar/hi/ja/pt/zh)
- `src/hooks/` — `useReveal`
- `src/app/sitemap.ts` — generated from the same data the pages use, so it
  cannot drift from the live routes (worlds, rooms, traditions, eras, hosted
  early texts, and the portfolio surfaces)

## Companion site

[atxbro.com](https://www.atxbro.com) — community portfolio and the heavier
interactive demos.
