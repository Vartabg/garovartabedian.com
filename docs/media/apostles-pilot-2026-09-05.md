# Apostles media pilot — 2026-09-05

Two new Lane B manuscript leaves extend the existing fourteen record plates. The portal and existing record images retain their artwork. These illustrations are symbolic: the sending map and its sources carry geographic and historical claims.

| Asset | Reading unit | Reference |
| --- | --- | --- |
| `public/apostles/plates/from-the-nets.jpg` | Apostles home, “The shape of the band” | Existing James of Zebedee plate |
| `public/apostles/plates/the-sending.jpg` | Sending page, after the evidence map | New fishermen plate; existing Matthias plate for interior materials |

Generation: built-in Imagegen tool; its underlying model identifier was not exposed. This pilot does not establish a comparison with other image providers. Originals remain in Codex's generated-image storage. Website copies are 1280 × 720 progressive JPEGs, exported with Sharp at quality 86 using contain sizing to preserve the whole border. No color changes or generative alterations were applied during export.

Presentation: server-rendered figures; native lazy loading; intrinsic dimensions; responsive image sizes; descriptive alt text; captions below the border. No autoplay or motion is added. Muse Spark 1.3 Contributor independently reviewed placement and accessibility constraints; Codex inspected both outputs and owns integration and verification.

## Review and verification

- Inspected both generated leaves and their desktop/light and mobile/dark page renders. The full borders and captions remain visible, both images load, and neither page overflows horizontally at 390px.
- The sending image is deliberately non-geographic. Its caption names no travelers or destinations and assigns the evidence to the map above it.
- Lint, type checking, 577 unit tests, 40 smoke tests, and the existing media audit passed.
- Scoped axe checks found no violations in either new figure in light or dark mode. No page errors were observed during those checks.
- Keyboard activation of the map's Thomas link reaches the matching claims below the image, with the heading visible below the fixed navigation.
- The browser check caught an unsupported Next/Image quality value; the final component uses the project's configured quality 70.

## Integration review — 2026-09-07

Integrated portfolio master `d0b7537` without changing the pilot's artwork or
component behavior. Lint, type checking, 616 unit tests, 40 smoke tests and the
production build passed. The accessibility audit passed all 40 routes in both
color schemes, including Lighthouse scoring.

Both figures passed image-loading, intrinsic-ratio, caption, overflow and scoped
axe checks at 1280, 390 and 320 pixels in light and dark mode (12 combinations).
The mobile keyboard check confirmed that activating the Thomas map link reaches
the visible claims heading below the illustration.

The first broad browser run exposed an existing offline translation race: a
pending KJV request could leave saving enabled with WEB verses under KJV
metadata. A delayed-response regression reproduced it, and the separate fix
landed in PR94 (`23cf55f`). This candidate includes that verified fix and the
local-release workflow from PR93. Its Vercel preview build,
621 unit tests, 40 smoke tests and full browser matrix passed: 172 passes,
three existing conditional skips. Both figures and the keyboard route were
checked again against this combined build.

The combined candidate also passed the full 40-route accessibility audit in
both color schemes, including Lighthouse scores; both workers exited normally.

The artwork and component behavior are unchanged from the first pilot. This
remains a review candidate pending Garo's visual review before publication.

## Final prompt: from the nets

```text
Use case: historical-scene.
Asset type: A new wide 16:9 manuscript illumination plate for the Apostles world of a reading website, final landscape composition intended for 1280x720 display.
Primary request: Illustrate the call out of ordinary work: four adult Galilean fishermen, two pairs of brothers, leaving their fishing nets at the shore and turning toward a winding path. This is a symbolic group illustration, not a claim that all four calls happened simultaneously.
Input image: The attached James manuscript leaf is a STYLE REFERENCE ONLY. Create a new independent composition, not an edit of that scene.
Style/medium: Match the reference's aged parchment, flat painted tempera, restrained Byzantine linework, thin ruled ember-red and candle-gold border, delicate ink contours, and handmade pigment texture. Figures must be stylized and symbolic, never photographic. Ember orange, burnt sienna, candle gold, subdued indigo water, warm parchment.
Composition: Full illuminated leaf visible with generous parchment margin on every side, no clipping of the border. Four small robed figures in the middle distance turned toward the road; empty wooden fishing boat and a loosely folded net in foreground; stylized lake on one side, ochre path continuing toward quiet hills on the other. Clear, calm visual hierarchy that stays readable on mobile. Wide horizontal artwork.
Lighting/mood: Lamplit warmth and quiet resolve, gold used as light, no luminous special effects.
Text: NONE.
Constraints: No letters, no glyphs, no inscriptions, no pseudo-script anywhere, including margins. Do not copy the reference's lettering, sword, architectural margin, specific individual scene or marked halos. No modern objects, no logos, no watermark, no photorealism, no glossy 3D. Keep all depicted faces symbolic; no invented martyrdom or contested destination. Generate one complete artwork, not a collage or contact sheet.
```

## Final prompt: the sending

```text
Use case: historical-scene.
Asset type: A new landscape 16:9 manuscript illustration for the Apostles sending page, intended for 1280x720 display.
Primary request: A symbolic image of the sending from Jerusalem: a small stone upper room opened toward a broad warm landscape, a single clay oil lamp glowing inside on a plain wooden table, and several quiet travelers departing on separate unmarked paths that fade into bare parchment. This is a symbolic meditation, NOT a geographic map or a reconstruction of a specific event.
Input images: Image 1 (four fishermen by the lake) is the primary house-style and border reference. Image 2 (Matthias manuscript scene) is a secondary reference for ancient stone interior materials ONLY. Do not copy lettering, people, halos, or compositions from either.
Style/medium: Flat symbolic Byzantine manuscript illumination, painted tempera on aged parchment, thin ruled ember-red and candle-gold border around the complete leaf, ink contours and handmade pigment texture. Ember orange, ochre, burnt sienna, candle gold, sparing subdued indigo. Human figures small and stylized, never photographic.
Composition: Wide horizontal composition. A cutaway upper room occupies the left third; through its open doorway the eye follows three gentle branching paths toward a low ochre horizon. Three pairs of small robed travelers seen from behind at different depths. The paths dissolve well before the frame edge. No destination buildings or recognizable landmarks. Gold light from the clay lamp gently links the room and roads. Preserve wide parchment margins and the complete ruled border; no clipping.
Lighting/mood: Quiet, lamplit warmth, outward movement, generous breathing space. Keep symbolic flat space and no glossy or cinematic photo effects.
Text: NONE.
Constraints: No map outlines, map labels, compass, geographic accuracy claims, arrows, routes to named places, destination symbols, letters, pseudo-script, glyphs or inscriptions. No floating magic, no extra faces, no modern objects, no logos, no watermark. Do not represent twelve literal destinations or imply certainty about disputed journeys. Generate one complete artwork, not a collage.
```
