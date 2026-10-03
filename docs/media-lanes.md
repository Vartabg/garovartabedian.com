# Site media — two lanes, one family

All imagery on garovartabedian.com shares the same **material world**: parchment, stone,
wood, candlelight, Mediterranean antiquity. Two rendering lanes keep that world consistent
while matching how each image is used.

## Lane A — Cinematic scene plates

**Use for:** homepage hero, homepage world portals (`/worlds/*.jpg`), `og.png`,
and other threshold / share images. World portal art establishes the doorway into a
world; it does not repeat as content inside that same world.

**Look:** photorealistic, cinematic, dramatic lighting (storm lightning, golden hour,
candle chiaroscuro). Composed like a film still — one clear subject, depth, atmosphere.
Props staged on real surfaces (study table, parchment map, stone chamber).

**Prompt tail** (append to every Lane A prompt):

```
Cinematic photorealistic biblical scene, dramatic natural lighting, rich material
textures on wood stone linen and leather, Mediterranean antiquity, shallow depth of
field, no readable text, no modern objects, no logos, no watermark.
```

**References:** `public/home/empty-tomb-dawn.jpg`, `public/worlds/*.jpg`, `public/og.png`

## Lane B — Manuscript illumination plates

**Use for:** reading beats inside long scroll content — Early Writings chapters, Jesus
life events, Angels encounters/fall fragments, Church councils, etc.

**Look:** flat/symbolic fresco or gospel illumination on aged parchment — **not**
photorealistic faces. Verdigris and ochre (Early Writings) or wine-red and gold (Jesus
world). Wide **16:9**, lamplit warmth, decorative wear at edges where appropriate.

**Prompt tail — Early Writings:**

```
Verdigris and ochre on aged parchment, stylized symbolic fresco style, lamplit,
no readable text, no letters, no glyphs, no inscriptions, no photorealistic faces,
no modern elements.
```

**Prompt tail — Jesus life:**

```
Wine-red and gold on aged parchment, stylized gospel fresco style, first-century
Mediterranean setting, lamplit, no readable text, no letters, no glyphs, no inscriptions,
no photorealistic faces, no modern elements.
```

**Prompt tail — Angels & Demons:**

```
Midnight blue, gold, and ember on aged parchment, stylized apocalyptic manuscript
illumination, symbolic unseen realm, lamplit, no readable text, no letters, no glyphs,
no inscriptions, no photorealistic faces, no modern elements.
```

**Prompt tail — Church councils:**

```
Stone, parchment, candlelight, and icon-gold, stylized church-history manuscript
illumination, council hall or ancient city setting, no readable text, no letters,
no glyphs, no inscriptions, no photorealistic faces, no modern elements.
```

**Prompt tail — Apostles:**

```
Ember-orange and candle-gold on aged parchment, stylized manuscript illumination of
roads, boats, nets, and scattered flames, first-century Mediterranean setting, lamplit,
no readable text, no letters, no glyphs, no inscriptions, no photorealistic faces,
no modern elements.
```

> `public/worlds/apostles.jpg` is currently a programmatic symbolic portal plate (the
> sending chart rendered in ember and gold). A Lane A cinematic portal may replace it —
> keep the one-lit-point-many-roads idea if it does.

**References:** `public/early/plates/`, `public/early/sections/`, `public/jesus/life/`

## Shared rules (both lanes)

| Rule | Why |
|------|-----|
| Warm parchment base | Matches site tokens (`--bg` `#f5efe3`, accents per world) |
| Gold as light, not decoration | Candle glow, divine rays, cite gold — not flat yellow fill |
| Symbolic > literal | Story without sermonizing; no builder self-plug in sacred scenes |
| No readable generated text | Avoid fake scripture or garbled lettering |
| No modern elements | Breaks the antiquity contract |
| One plate per reading unit | Chapter, life event, council — not decoration for its own sake |
| Portal art stays at the threshold | `/worlds/*.jpg` identifies a doorway or share card; in-world visuals must add story or information |

## Do not

- Regenerate or restyle established heroes without explicit approval (homepage storm boat).
- Mix Lane A photoreal faces inside Lane B fresco borders on the same plate.
- Use recruiter-era teal, glossy modern AI gloss, or celebrity photoreal in sacred scenes.

## File layout

| Content | Images | Manifest | Build script |
|---------|--------|----------|--------------|
| Early Writings chapters | `public/early/sections/{textId}/{slug}.jpg` | `public/early/sections/{textId}.json` | `scripts/early/build-section-manifest.mjs` |
| Jesus life events | `public/jesus/life/{eventId}.jpg` | `public/jesus/life-plates.json` | `scripts/jesus/build-life-manifest.mjs` |
| Jesus history stone reconstructions | `public/jesus/stones/{stoneId}.jpg` | `public/jesus/stones-plates.json` | `scripts/jesus/build-stones-manifest.mjs` |
| Angels fall + encounters + named demons | `public/angels/plates/{plateId}.jpg` | `public/angels/media-plates.json` | `scripts/angels/build-media-manifest.mjs` |
| Church councils | `public/church/councils/{councilId}.jpg` | `public/church/council-plates.json` | `scripts/church/build-council-manifest.mjs` |

Copy a generated image into place:

```bash
scripts/early/copy-section-image.sh <source.jpg> <textId> <sectionSlug>
scripts/jesus/copy-life-image.sh <source.jpg> <eventId>
scripts/jesus/copy-stone-image.sh <source.jpg> <stoneId>
scripts/angels/copy-media-image.sh <source.jpg> <plateId>
scripts/church/copy-council-image.sh <source.jpg> <councilId>
```

Programmatic prompt tails live in `scripts/media/lanes.mjs` (single source for build scripts).

---

## Free imagegen process (Lane B chapter plates)

Use this when filling Early Writings chapter stubs yourself — same path that
fixed the Apocalypse of Paul **hero** plate.

### Why a post-step exists

| free-img engine | Native size | House plate |
|-----------------|-------------|-------------|
| FLUX (Nvidia free) | 1024×1024 square | **1280×720** 16:9 |
| Google Gemini image | varies | **1280×720** 16:9 |

FLUX also sometimes stamps a corner watermark. `fit-plate.py` center-crops to
16:9 (slight upward bias so heaven/city stays in frame), resizes, and JPEG-encodes.

**Stub heuristic:** a real 1280×720 plate is usually ≥ ~40 KB. Text placeholders
(“plate pending”) land around 20 KB — `media:audit` fails until those are replaced.

### One-off (any source image)

```bash
# 1) generate somewhere
free-img --engine flux --out /tmp/raw.jpg "…Lane B prompt…"

# 2) fit to house size
python3 scripts/media/fit-plate.py /tmp/raw.jpg /tmp/fit.jpg

# 3) install
scripts/early/copy-section-image.sh /tmp/fit.jpg apocalypse-paul chapter-1
```

### Batch from curated section prompts (preferred)

Prompts already live in `public/early/sections/<textId>.json` (hand-curated for
Apocalypse of Paul). The batch runner reads them, boosts for free engines, calls
`free-img`, fits, and installs — **without** clobbering the JSON.

```bash
# See any pending plates without spending quota
python3 scripts/early/gen-section-plates.py apocalypse-paul --dry-run

# Smoke-test one chapter, then open the JPG
python3 scripts/early/gen-section-plates.py apocalypse-paul --only chapter-1
open public/early/sections/apocalypse-paul/chapter-1.jpg

# Work in small batches (free-tier rate limits)
python3 scripts/early/gen-section-plates.py apocalypse-paul --limit 5

# When a batch looks good
npm run media:audit
git add public/early/sections/apocalypse-paul/
git commit -m "media(early): real Apocalypse of Paul chapter plates (batch N)"
```

### Prompt rules that actually work on free engines

1. Start from the curated `prompt` field in the section JSON (already Lane B).
2. The batch script appends a **free-engine boost** (horizontal 16:9, flat tempera,
   no watermark/text). Don’t strip it.
3. Prefer `--engine flux` unless Google image keys are healthy.
4. Spot-check: if the plate is photoreal faces or has letters, `--force --only <slug>` and re-roll.
5. Curated manifests carry `"$lock": { "curated": true }`. `build-section-manifest.mjs`
   **refuses to overwrite them** (exit 3). Unlock only with both
   `EARLY_SECTION_UNLOCK=1` and `--force-unlock` — agents should not set that.

### npm shortcuts

```bash
npm run media:fit -- in.jpg out.jpg          # fit-plate.py
npm run early:gen-sections -- apocalypse-paul --dry-run
npm run media:audit
```
