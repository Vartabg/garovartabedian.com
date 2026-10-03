# Direct touch in the visual stories

The reader's finger should change what the artwork reveals. The collection uses three different visual operations: Dothan's comparison line, Bethel's change of scale, and a movable pool of light inside Peter's cell. The constructed gate/shutter effect has been removed.

## Interaction and emotional purpose

| Story | Action on the artwork | What it carries |
| --- | --- | --- |
| Open his eyes | Drag the vertical comparison line across a registered pair | A human army remains visible while another order appears around it |
| I am with you | Drag sideways to widen or narrow the dream camera | A stone pillow and a small traveler open into a vast promise |
| The gate opened | Move a soft light mask across registered cell paintings | Darkness gives way to awakening and release |

Dothan's reveal button, comparison range, and artwork handle share one image pair and one state. The fully clipped reveal image loads eagerly so the first drag does not wait for native lazy loading. Reflection now has its own aftermath painting instead of repeating that pair.

Bethel retains a continuous camera and endpoint controls. Peter has a new image of the praying assembly, one paired cell scene, the open street as an uninterrupted painting, and the recognition portrait. The earlier unregistered `peter-awakened.jpg` remains an archived illustration; it is not repeated in the story body.

Each viewer preserves ordinary vertical scrolling and browser pinch zoom, has keyboard equivalents and persistent controls, handles cancelled gestures, respects reduced motion, and provides complete artwork and source text without JavaScript. No audio is required.

## Art direction

The current narrative uses 17 distinct image sources: seven at Dothan, four at Bethel, and six in Peter's story. Generous original scene art replaces repeated crops. Paired paintings appear together once where their registration serves the interaction.

All scenes are explicitly presented as artistic interpretations. Architecture, faces, dress, light, and angelic appearance are not asserted to be accurate representations. Quotations and full passages remain drawn from the site's canonical WEB data.

The lasting instructions are in `src/app/angels/stories/AGENTS.md`. The earlier collection's nine original prompts remain in `docs/angels-stories-collection.md`.

## Production

Mode: built-in image generation. Six new paintings were generated and one registered Peter cell image was edited from the existing `peter-cell.jpg`. Each output was visually inspected and compressed to JPEG with Sharp at quality 88/mozjpeg, preserving its composition. Source PNGs remain in the local generation archive.

| Shipped asset | Dimensions | Role |
| --- | --- | --- |
| `public/angels/stories/dothan-night-arrival.jpg` | 1536 × 1024 | Opening |
| `public/angels/stories/dothan-encircled.jpg` | 1536 × 1024 | Surrounded |
| `public/angels/stories/dothan-servant-afraid.jpg` | 1024 × 1536 | Afraid |
| `public/angels/stories/dothan-prayer.jpg` | 1536 × 1024 | Prayer |
| `public/angels/stories/dothan-assurance.jpg` | 1536 × 1024 | Reflection |
| `public/angels/stories/peter-praying.jpg` | 1536 × 1024 | The assembly praying |
| `public/angels/stories/peter-cell-light.jpg` | 1672 × 941 | Light inside the registered cell |

## Final prompts

### dothan-night-arrival

Original PNG: `~/.codex/generated_images/01a07418-23d7-78b3-bf49-58ab21cf1f19/exec-edea072d-01dc-4176-b694-7c2c109704fa.png`.

```text
Use case: illustration-story. Create an original interpretive sacred story illustration in superb antique intaglio crosshatching beneath translucent oil glazes, tactile etched stone and linen, restrained cinematic lighting and human emotion. Artistic interpretation, not a historical or archaeological reconstruction. No words, lettering, borders, logos, watermarks, modern objects, medieval fantasy castles, graphic violence or visible deity.
Landscape3:2 approximately1536x1024, opening for 2Kings6:14–17. A distant ancient hill town of low limestone buildings sleeps under a deep indigo NIGHT sky. In the dark foreground and middle distance, a long restrained column of mounted men, a few simple two-wheeled chariots and foot soldiers approaches the hill by torchlight. Torches form a broken amberthread through olive groves, not an overwhelming fantasy army. Viewpoint low outside the town, architecture and horizon highright, upperleft dark negative space for a title. Quiet foreboding: the city is unaware. No Elisha or servant, no fieryheavenly host, no sunlight, no combat, no gate closeup. Weathered limestone, blueblack sky, smokygold torches. Important town/column within central70% forresponsivecrops. A unique establishing scene, not a viewpoint from two figures on a ridge.
```

### dothan-encircled

Original PNG: `~/.codex/generated_images/01a07418-23d7-78b3-bf49-58ab21cf1f19/exec-e2bf9a56-99c7-41d3-ae5e-1b51e5e5c438.png`.

```text
Use case: illustration-story. Create an original interpretive sacred story illustration in superb antique intaglio crosshatching beneath translucent oil glazes, tactile etched stone and linen, restrained cinematic lighting and human emotion. Artistic interpretation, not a historical or archaeological reconstruction. No words, lettering, borders, logos, watermarks, modern objects, medieval fantasy castles, graphic violence or visible deity.
Landscape3:2 approximately1536x1024, a new illustration of 2Kings6:14. A high oblique panorama at the cold edge of DAWN, looking down across a modest ancient limestone hill town and the land around it. Bands of small human troops with horses and several simple chariots form an enclosing ring along the valley roads. Narrow roads with no easy opening; fields, olives, limestone ridges. Strong readable sense of encirclement through composition alone. No foregroundpeople, no prophet or servant, no magical armies or heavenly fire. Foreground rocky slope offers depth, town nearcenter. Thin pale morninglight in mutedbluegrey, verysmall amber campfires. Refined historical-book illustration with extraordinary engraved texture, no diagram/map labels, no modern military shapes. This must be a fresh aerial/oblique composition, distinct from the low night-arrival view.
```

### dothan-servant-afraid

Original PNG: `~/.codex/generated_images/01a07418-23d7-78b3-bf49-58ab21cf1f19/exec-b6101986-9f09-4f36-a503-c75b16d38daa.png`.

```text
Use case: illustration-story. Create an original interpretive sacred story illustration in superb antique intaglio crosshatching beneath translucent oil glazes, tactile etched stone and linen, restrained cinematic lighting and human emotion. Artistic interpretation, not a historical or archaeological reconstruction. No words, lettering, borders, logos, watermarks, modern objects, medieval fantasy castles, graphic violence or visible deity.
Portrait2:3 approximately1024x1536. A young adult servant in his twenties, short dark curly hair and a plain olive-brown linen robe, stands just outside a rough limestone house in Dothan at first morninglight. Threequarter view from near his face; he has turned abruptly toward the valley and sees what is outside. One hand grips the stone jamb, the other pauses against his chest. His expression shows contained alarm and vulnerability, not theatrical screaming. Beyond his shoulder, in softfocus, a handful of tiny horses, chariots and soldiers makes the reason for fear visible. Coolblue shadow with a narrow palegold line on his cheek. Face/handscentral60%. No olderprophet, angel, fieryhost, deity, gore, modern objects. The emotional center is the young man’s unanswered question, before reassurance.
```

### dothan-prayer

Original PNG: `~/.codex/generated_images/01a07418-23d7-78b3-bf49-58ab21cf1f19/exec-860b1ba0-cf5a-47bd-9f74-dd5670f1e6be.png`.

```text
Use case: illustration-story. Create an original interpretive sacred story illustration in superb antique intaglio crosshatching beneath translucent oil glazes, tactile etched stone and linen, restrained cinematic lighting and human emotion. Artistic interpretation, not a historical or archaeological reconstruction. No words, lettering, borders, logos, watermarks, modern objects, medieval fantasy castles, graphic violence or visible deity.
Landscape3:2 approximately1536x1024. A new intimate illustration of Elisha praying beside his frightened young servant, 2Kings6:16–17. An elderly prophet with a short silver beard, weathered face and humble umber mantle stands calmly beside a young man with short darkcurlyhair in an olive-brown linen robe. Elisha's hand rests lightly at the young man's upper back/shoulder; his other hand is open in a quiet gesture of prayer, gaze raised just slightly. The young man listens, still tense, looking toward the unseen horizon. A rough limestone terrace, olivebranch, cool earlymorning shadow, a wash of restrained gold emerging far behind. Close waist-up twofigure composition, spacious and profoundly human. No beam from hands, no visible deity, no wings, no fieryarmy yet, no theatrical praying pose, no halos. Reassurance expressed in posture and proximity, not spectacle. Bothfigures/hands within central70%.
```

### dothan-assurance

Original PNG: `~/.codex/generated_images/01a07418-23d7-78b3-bf49-58ab21cf1f19/exec-634d8eaa-d4b8-4127-9a9f-9f9786dd7f1b.png`.

```text
Use case: illustration-story. Create an original interpretive sacred story illustration in superb antique intaglio crosshatching beneath translucent oil glazes, tactile etched stone and linen, restrained cinematic lighting and human emotion. Artistic interpretation, not a historical or archaeological reconstruction. No words, lettering, borders, logos, watermarks, modern objects, medieval fantasy castles, graphic violence or visible deity.
Landscape3:2 approximately1536x1024. The quiet emotional aftermath of the servant's opened eyes at Dothan, 2Kings6:17. A young adult man with short darkcurlyhair and an olive-brown linen robe stands beside an elderly short-silver-bearded prophet in an umber mantle, shown in close threequarter profile. The young man's shoulders have lowered and his face opens into restrained wonder and relieved attention; Elisha remains quietly composed. They look toward a warm light beyond the right edge of frame. The mundane human army is still faintly visible in the valley behind them; it has not vanished. A pale limestone terrace, oliveleaves, delicate firstlight on their faces, cool shadows, very restrainedgold reflections. The emphasis is the difference in his seeing and bearing, not a new battle. No visible deity, wings, floatingsymbols, big smilingfaces or magical force from people. Distinct personal aftermath, not another panoramic view of the fierymountain.
```

### peter-praying

Original PNG: `~/.codex/generated_images/01a07418-23d7-78b3-bf49-58ab21cf1f19/exec-e560919d-e330-4d54-8cc0-eb8e9fdddd3e.png`.

```text
Use case: illustration-story. Create an original interpretive sacred story illustration in superb antique intaglio crosshatching beneath translucent oil glazes, tactile etched stone and linen, restrained cinematic lighting and human emotion. Artistic interpretation, not a historical or archaeological reconstruction. No words, lettering, borders, logos, watermarks, modern objects, medieval fantasy castles, graphic violence or visible deity.
Landscape3:2 approximately1536x1024. A quiet house interior at NIGHT, an interpretive scene for Acts12:5: the assembly prays earnestly for Peter while he is imprisoned. A small group of five adults in simple first-century linen, men and women, close together around a low earthenware lamp. Faces mostly in profile andshadow, openhands or hands restingtogether naturally, one olderwoman listening with her eyes closed. No namedidentity claims. Warm pool of amberlight makes the people feel united against the enclosing dark beyond the window. Simple plasteredlimestone walls, wovenmat, an earthenwarebowl, no ornatechurch or modernprayerprops. Intimate composition, focus on faces/hands and shared care. No Peter himself, no prison, no angel, no cross, no altar, no visibledeity. This is communal care beyond the prison, not theatrical anguish.
```

### peter-cell-light

Original PNG: `~/.codex/generated_images/01a07418-23d7-78b3-bf49-58ab21cf1f19/exec-4e573fff-8885-463c-96fe-75f26f2e0ff6.png`.

Edit reference: `public/angels/stories/peter-cell.jpg`. Keep the original and edited image together at their shared aspect ratio.

```text
Use case: illustration-story. Edit target/reference: the attached prison-cell painting. Produce a second precisely REGISTERED image for a touch-controlled before/after overlay. Preserve the same image width/height, aspect ratio16:9, camera, perspective, cropping, all stonewalls/window/doorway placements, guard positions/identities, shadows' geometry where possible, seatedPeter's location and overall body silhouette. Keep the exact intaglio/oilglaze style and fine surface texture. Do not redesign the room or change the camera at all.
Change only the narrative moment to Acts12:7: Peter has just been awakened by an angel, the cell is filled with light, and his chains have fallen. Peter remains low/seated at the sameplace, but his head turns up slightly with attentive surprise, eyesopen and hands free. The two old wrist chains are now loose on the floor close to their oldpositions. Both guards remain asleep in precisely the sameplaces and poses. Add one restrained human-shaped robed messenger in the open wallspace immediately behind and beside Peter, with a hand lightly touching his shoulder; carefully fit this new figure without moving either guard. Messenger in paleplainlinen, face side-on, no wings, halo, assigned rank or deity. A gentle strong ivory-gold radiance from the messenger illuminates Peter and the SAME cellwall surfaces, revealing etcheddetails in shadow. Do not overexpose or obscure the room. This is a painterly interpretation, not a claim about exact appearance. No camera pan/zoom, new door, new guard, new architecture, new perspective, text, logos, watermark, blood, magicalweapon or visible deity. Critical: a user will reveal small circular portions over the original image, so existing architecture and people must align wherever they have not deliberately changed.
```

## Verification

The three story test files cover native touch gestures through Chrome's touch input, keyboard equivalents, vertical page scrolling, cancellation and recovery, canonical passages, no-JavaScript reading, and narrow layouts with enlarged OpenDyslexic text. Image checks normalize Next Image URLs to reject repeated sources and verify every narrative image loads.

The repository's lint, type, unit/smoke, media, production-build, and rendered accessibility checks remain part of release verification. Manual browser review checks that the artwork and gesture response communicate the intended story.

Verified for this release: lint, typecheck, 617 unit tests, 40 smoke tests (including media integrity), and the production build passed. All 20 story browser tests passed, including native touch and the initially hidden Dothan image loading before interaction. Angels, the collection, and all three stories passed axe in both color schemes and scored 100 for Lighthouse accessibility. Desktop views and 13 phone/reading-settings captures were reviewed.
