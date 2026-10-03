# Visual stories: a collection

Two new visual stories extend “Open his eyes” without repeating its comparison interaction.

## Creative standard

The scene should carry the feeling before the prose explains it. Choose each interaction from the passage's emotional movement, then check it against the neighboring stories. A new painting on the same control is not enough. Technology earns its place by changing what the reader feels or understands; visual novelty alone is not a reason to add it.

| Story | Emotional movement | Reader action | Visual technique |
| --- | --- | --- | --- |
| Open his eyes · 2 Kings 6:14–17 | Fear to assurance | Reveal / compare | Two registered views of the same valley |
| I am with you · Genesis 28:10–19 | Solitude to promise | Lift the gaze | A reversible camera opening from Jacob's stone to one immense portrait landscape |
| The gate opened · Acts 12:5–11 | Confinement to freedom | Explore the light in the cell | A movable soft light reveal over registered paintings, followed by the open street |

Peter's interaction now changes the artwork itself with a soft light reveal. Bethel's continuous camera and Dothan's comparison remain distinct. Shared navigation and source disclosure provide familiarity without prescribing every story's interaction. See `docs/angels-story-touch.md` for the direct-touch revision and Dothan's additional scene art.

For future additions, consider mechanisms such as changing light, spatial exploration, layered depth, temporal juxtaposition, typographic transformation, or opt-in sound only where the specific story calls for them. Alternate intensity with stillness. Check the opening composition, pacing, reader action, and emotional outcome against the collection before accepting another experience.

Generate generously for distinct narrative moments. Repeated crops of one painting must not substitute for arrival, encounter, or aftermath. Bethel uses four original scenes: arrival, nightfall, dream, and morning. Peter's current story uses the prison exterior, praying assembly, a paired cell scene, open street, and recognition. Each image appears once within its story body, and a browser regression checks both source uniqueness and successful image loading. The continuous dream camera remains one scene; its painting is not repeated in other beats.

## Routes and content

- Collection: `/angels/stories`
- Bethel: `/angels/stories/i-am-with-you`
- Peter: `/angels/stories/the-gate-opened`

The Angels & Demons home introduces all three stories. The shared catalog is `src/lib/angel-stories.ts`; source disclosure and onward navigation live in `StoryFrame.tsx`. Narrative stays server rendered, with small client components for the camera and doorway.

Exact World English Bible passages are drawn from the site's existing Genesis and Acts data, with links to the complete chapters. Artwork is interpretive. Visual details do not establish historical facts or angelic rank. Bethel retains the spoken promise and waking fear. Peter retains the praying church, falling chains, uncertainty, a gate opening by itself, and recognition after the angel departs.

## Art production

Mode: built-in image generation. The initial collection generated the nine illustrations recorded below, inspected and compressed to JPEG with Sharp (quality 88, mozjpeg). Later Dothan and registered cell additions are recorded in `docs/angels-story-touch.md`. No stock imagery or third-party art assets were added. Source PNGs remain in the local generation archive; shipped paths below are relative to this repository.

| Asset | Size | Shipped file |
| --- | --- | --- |
| Bethel dream | 1024 × 1536 | `public/angels/stories/bethel-dream.jpg` |
| Peter's cell | 1672 × 941 | `public/angels/stories/peter-cell.jpg` |
| Peter's night street | 1672 × 941 | `public/angels/stories/peter-night.jpg` |
| Jacob arrives | 1024 × 1536 | `public/angels/stories/bethel-arrival.jpg` |
| Jacob at nightfall | 1536 × 1024 | `public/angels/stories/bethel-nightfall.jpg` |
| Jacob in the morning | 1024 × 1536 | `public/angels/stories/bethel-morning.jpg` |
| Prison exterior | 1536 × 1024 | `public/angels/stories/peter-prison-exterior.jpg` |
| Peter awakened | 1536 × 1024 | `public/angels/stories/peter-awakened.jpg` |
| Peter recognizes his freedom | 1024 × 1536 | `public/angels/stories/peter-recognition.jpg` |

Original PNG archive: `~/.codex/generated_images/01a07418-23d7-78b3-bf49-58ab21cf1f19/`.

- Bethel: `exec-9e608d15-fbdf-434b-bc38-f030c03003b1.png`
- Cell: `exec-475a35ef-3e0a-4ca8-a63d-fc9d2c09bb9e.png`
- Street: `exec-03825d90-5ad4-4af7-831c-72a70216b534.png`

### Final Bethel prompt

```text
Use case: illustration-story.
Asset type: portrait 2:3 painting for an immersive visual story, approximately1024x1536. A single continuous portrait landscape with great vertical depth, no panels.
Primary request: Jacob's dream at Bethel, Genesis28:10–19, rendered as a superbly crafted antique intaglio engraving under translucent oil glazes. This is an interpretive sacred illustration, not a historical reconstruction.
Composition: the bottom quarter shows rough pale limestone, sparse dry grass and a tiny lone robed traveler asleep with his head beside a stone, at lower center-right. He must remain legible when the bottom third is enlarged. The land is humble and quiet. A great luminous ancient STAIRWAY begins near the middle of this rocky ground and rises diagonally/curving gently into the immense upper two thirds of star-filled indigo and muted violet night. Many small restrained luminous robed figures ascend and descend along the stairs. No wings are needed. The top disappears into beautiful diffuse ivory-gold radiance beyond the visible frame. Never show a visible deity.
Emotional movement: a stone pillow and a small human life opening into cosmic scale and quiet belonging. Extraordinary negative space and nuanced light. Fine etched lines, subtle glaze texture, editorial sophistication; no fantasy-game bombast. Lower earth detailed but dim, upper sky vast and welcoming. Deepblue, smokyplum, stonegrey, ivory, restrained palegold. All narrative elements within central60% for responsive crops.
No words, lettering, logos, watermarks, borders, numerals, stars arranged as symbols, castles, modern objects, literal wooden ladder, enormous wingedwarriors, magical beams from the man, split layout. No visible God's face/body. The stairway should read as a dream linking earth to heaven, not a tower or building.
```

### Final cell prompt

```text
Use case: illustration-story.
Asset type: widescreen16:9 painterly scene for an immersive story, approximately1672x941.
Primary request: Peter asleep in a guarded cell, Acts12:5–7, before he rises to follow the angel. An interpretive sacred illustration rendered as refined intaglio crosshatching under translucent oil glazes, tactile and cinematic.
Scene: an intimate first-century stone prison cell, low rough walls, a narrow arched doorway further back. A bearded middle-aged robed man sleeps seated low at center-left between two still Roman-era guards, one partly in shadow on each side. Two simple iron chains run from his wrists down beside him. Guard weapons sheathed, no threat/gore. Figures restrained, faces mostly shadowed/profile, no theatrical expressions. A modest soft warm light has just begun entering from the upper right doorway, suggesting a presence beyond frame without depicting a winged being or deity.
Composition: viewpoint within the room, enclosing stone sides and darkness compress the scene. Human story withincentral60%, leftupper space dark enough for headline. Superb tangible stonegrain, linen, iron, thinamber torchglow. Nearblack charcoalandumber, deepblue shadow, modestgold light. Emotion is vulnerable quiet and enclosure, not dungeonhorror. Widecoherent image, noornamentalframe.
No text, typography, watermarks, logos, modernprison bars, modernclothing, medievalarmour, torturesymbols, blood, glowingchains, giantwings, expressivefantasyangel, map, splitpanels.
```

### Final street prompt

```text
Use case: illustration-story.
Asset type: widescreen16:9 illustration for a web story's final open landscape, approximately1672x941.
Primary request: the quiet street Peter stands in after the iron gate opens and the angel departs, Acts12:10–11. This is an interpretive sacred illustration, not an archaeological reconstruction. Render as extraordinarily detailed antique intaglio engraving beneath translucent oil glazes.
Scene: a beautiful ancient Jerusalem limestone street at NIGHT, opening away from the viewer under a vast deep midnightblue sky. Warm small lamps along stone walls give the street a gentle path into depth. Broad open foreground paving invites entry. One small cloaked man seenfrombehind stands center-right in the middle distance, slightly awed and orienting himself; no other figures. The angel has departed. Low flat-roofed stone buildings and a few olivebranches frame an expansive opening to thenightsky. No closedgate, bars, door, or foregroundarch in this image; code adds moving gate panels over it.
Composition: wide balanced panorama, pathandman withincentral60% for mobile; horizon/massing arounduppermiddle, a luminous cool night beyond. Deepinkblue, cool limestone, sparse warm amber. Sublime release from enclosure into air and space, quiet wonder, relief, dignity. Etchedcrosshatching, weatheredpigment, delicatefinearchitecture, restrainedstarlight. Clearly nighttime, NOT sunrise.
No text, logos, watermark, borders, wings, angel, deity, halos, moderncity, domedmodernshrines, medievalcathedral, brightdaylight, crowds, fireworks, frontgate, splitpanels.
```

### Distinct scene prompts

The six scenes below were original generations, not crops or edits of the first three paintings. The current touch revision replaces the initial Peter awakening scene with a registered light view; its first illustration remains archived here. Cover/collection thumbnails and metadata may identify the story with its artwork; the narrative itself advances through distinct paintings.

#### bethel-arrival

Shipped file: `public/angels/stories/bethel-arrival.jpg`. Original: `~/.codex/generated_images/01a07418-23d7-78b3-bf49-58ab21cf1f19/exec-6e5843d6-863e-455b-b9ec-61efeb87cddb.png`.

```text
Use case: illustration-story. Create an original interpretive biblical story illustration, with the extraordinary craft of antique intaglio crosshatching beneath translucent oil glazes. Restrained, humane, tactile, cinematic, beautiful negative space. Not a historical reconstruction. Muted ink blue, weathered limestone, umber linen, restrained ivory-gold light. No words, typography, border, logo, watermark, modern objects, fantasy-game spectacle, or visible deity.
Asset: portrait 2:3, approximately1024x1536, a distinct opening scene for Jacob's night at Bethel (Genesis28:10–11). Show one small brown-haired bearded adult traveler in a humble ochre-brown robe walking away from us into empty pale limestone hills at the very end of dusk. A narrow dusty path, sparse grasses, one modest bundled cloth. He is alone. The last copper sliver of the sun has gone below the distant ridge; vast smoky violet sky above. Low eye-level framing, traveler lowercenter, long path towardupperleft. The emotion is the ache of being far from home, a landscape that seems ordinary and indifferent before a dream. Keep all important details within central60% for crops. No stairway, angels, pillar, torch, city, supernatural light, sleeping man, ornate architecture, modern pack. This is ARRIVAL and solitude, distinct from his later sleep and dream.
```

#### bethel-nightfall

Shipped file: `public/angels/stories/bethel-nightfall.jpg`. Original: `~/.codex/generated_images/01a07418-23d7-78b3-bf49-58ab21cf1f19/exec-2fe8d46f-e814-4991-8d41-639a72cf8cab.png`.

```text
Use case: illustration-story. Create an original interpretive biblical story illustration, with the extraordinary craft of antique intaglio crosshatching beneath translucent oil glazes. Restrained, humane, tactile, cinematic, beautiful negative space. Not a historical reconstruction. Muted ink blue, weathered limestone, umber linen, restrained ivory-gold light. No words, typography, border, logo, watermark, modern objects, fantasy-game spectacle, or visible deity.
Asset: landscape3:2, approximately1536x1024. A new intimate scene of Jacob preparing to sleep outdoors at Bethel (Genesis28:11). An adult brown-haired short-bearded traveler in worn ochre-brown linen lies curled low beside a pale rough limestone stone, one hand adjusting the folds beneath his shoulder as his head comes to rest upon the stone. Three-quarter view near ground level, human warmth and tired vulnerability; face in partial profile, restrained expression. The stone and his hand are the center of attention. Cool starlit earth, dry grass, barely visible horizon, no dawn. A delicate sense of breathing stillness, exquisitely etched linen folds and stonegrain. Composition a wide quiet close shot with both head and stone clearly visible, human subject in central60%. No dream stairway, angel, visible deity, erected pillar, campfire, guards, magic or text.
```

#### bethel-morning

Shipped file: `public/angels/stories/bethel-morning.jpg`. Original: `~/.codex/generated_images/01a07418-23d7-78b3-bf49-58ab21cf1f19/exec-2d3cb0e4-6924-43b0-8cec-8ac2af645370.png`.

```text
Use case: illustration-story. Create an original interpretive biblical story illustration, with the extraordinary craft of antique intaglio crosshatching beneath translucent oil glazes. Restrained, humane, tactile, cinematic, beautiful negative space. Not a historical reconstruction. Muted ink blue, weathered limestone, umber linen, restrained ivory-gold light. No words, typography, border, logo, watermark, modern objects, fantasy-game spectacle, or visible deity.
Asset: portrait2:3, approximately1024x1536. A new dawn aftermath scene at Bethel from Genesis28:18–19. The same type of humble adult traveler, brown hair and short beard, ochre-brown robe, kneels in quiet awe beside a single rough pale limestone stone he has set UPRIGHT as a modest pillar. He tips a small unadorned earthenware flask with one hand, a fine stream of olive oil touching the TOP of the upright stone. Other hand rests gently on knee. The stone is about knee height, imperfect, clearly one ordinary stone transformed in meaning. Sunrise touches his face, the oil and the stone with tender warmgold while indigo shadows remain among rocks. Compose hands, flask and pillar aroundcenter, figuretoone side, open dawnlandscape above. Emotion: reverence, recognition, a place he will remember. No stairway, angel, visible deity, inscription, carved monument, altar fire, cross, temple, crowd, city, text. This is MORNING, not another sleeping scene.
```

#### peter-prison-exterior

Shipped file: `public/angels/stories/peter-prison-exterior.jpg`. Original: `~/.codex/generated_images/01a07418-23d7-78b3-bf49-58ab21cf1f19/exec-6a5d33eb-78b9-49c4-9d9f-f7ffdea40b49.png`.

```text
Use case: illustration-story. Create an original interpretive biblical story illustration, with the extraordinary craft of antique intaglio crosshatching beneath translucent oil glazes. Restrained, humane, tactile, cinematic, beautiful negative space. Not a historical reconstruction. Muted ink blue, weathered limestone, umber linen, restrained ivory-gold light. No words, typography, border, logo, watermark, modern objects, fantasy-game spectacle, or visible deity.
Asset: landscape3:2, approximately1536x1024. Opening establishing shot for Peter's imprisonment (Acts12:5–6): an ancient limestone fortress prison exterior at NIGHT, imposing plain walls, a closed narrow iron-banded gateway set into a deep shadowed entrance, two small guards at their posts in restrained first-century Roman-era dress, no action. A single high warm torch is tiny against the mass of cool stone. View from outside at a slight angle, low broad courtyard paving, immense enclosed architectural weight occupyingrightcenter; upperleftdarknightspace. Focus on the feeling of being kept inside a place that appears impossible to leave. Fine engraved masonry, quietly oppressive scale, austere dignity. No prisoner visible, no angel, no medievaltowers, castle crenellations, modernbars, modernprison, text, blood or violence. Keep gateway/guards insidecentral60%. Entirely different composition from an interior cell.
```

#### peter-awakened

Shipped file: `public/angels/stories/peter-awakened.jpg`. Original: `~/.codex/generated_images/01a07418-23d7-78b3-bf49-58ab21cf1f19/exec-cabffac5-f54c-4b21-9fd1-f1f4c2f9f8b7.png`.

```text
Use case: illustration-story. Create an original interpretive biblical story illustration, with the extraordinary craft of antique intaglio crosshatching beneath translucent oil glazes. Restrained, humane, tactile, cinematic, beautiful negative space. Not a historical reconstruction. Muted ink blue, weathered limestone, umber linen, restrained ivory-gold light. No words, typography, border, logo, watermark, modern objects, fantasy-game spectacle, or visible deity.
Asset: landscape3:2, approximately1536x1024. A distinct turning-point scene from Acts12:7–8. Inside a low rough stone cell at night, Peter, a middle-aged bearded man with dark greying hair in a humble umber linen tunic, has just awakened and is beginning to rise from the low ground. A luminous but very human-shaped robed messenger stands beside him, one hand gently touching his side/shoulder as if waking him, the other calmly indicating the way beyond frame. The messenger's face is mostly in profile/light, no wings, no halo, no named rank. Two loosened simple iron chains lie fallen at Peter's sides on the ground, dark ordinary iron rather than glowing or snapped. Two guards remain asleep out at the shadowed edges. White-gold light fills the cell from the messenger's vicinity, warm on Peter's confused but quietly attentive face. Central action is WAKING AND FOLLOWING, neither combat nor triumph. Eye-level threequarter composition with the figures central, beautiful lightfall and fabrictexture; no giantangel, weapon brandishing, deity, gore, spectacle, magicchains or text. Artistic interpretation of appearance clearly restrained.
```

#### peter-recognition

Shipped file: `public/angels/stories/peter-recognition.jpg`. Original: `~/.codex/generated_images/01a07418-23d7-78b3-bf49-58ab21cf1f19/exec-dda198d5-134e-442c-9665-52d291bdab7f.png`.

```text
Use case: illustration-story. Create an original interpretive biblical story illustration, with the extraordinary craft of antique intaglio crosshatching beneath translucent oil glazes. Restrained, humane, tactile, cinematic, beautiful negative space. Not a historical reconstruction. Muted ink blue, weathered limestone, umber linen, restrained ivory-gold light. No words, typography, border, logo, watermark, modern objects, fantasy-game spectacle, or visible deity.
Asset: portrait2:3, approximately1024x1536. A new intimate aftermath moment from Acts12:11: Peter stands ALONE in a quiet ancient Jerusalem limestone street at NIGHT after the angel has departed. Middle-aged man with short dark greying hair and a close beard, wearing an umber cloak over plain linen, shown waist-up in threequarter profile. He looks down at his empty, free hands with restrained disbelief giving way to relief; hands slightly open, relaxed and anatomically natural. A small wall lamp out of frame casts tender amber light across one cheek and his hands. Behindhim the street falls into vast soft indigo night and cool stone shadow. No scars, wounds or metal on his hands; no broken chain props. The emotion is quiet recognition rather than theatrical celebration. Distinct from the panoramic street viewed from behind: this is close, personal, tactile, still. No angel, guards, gate, crowd, sunrise, halo, wings, visible deity, text, smiles tocamera or melodrama. Keep faceandhands in central60% forresponsiveframing.
```

## Reading and verification

Every scene has a complete static view without JavaScript. Reduced-motion settings remove transitions; keyboard and touch controls retain visible focus and usable targets. The ordinary source text remains available regardless of visual preferences.

Acceptance coverage in `tests/e2e/angels-stories-collection.spec.ts` checks collection discovery, both stories' interaction states, focus, canonical passages, no-JavaScript views, and narrow mobile layouts with enlarged OpenDyslexic settings. The collection and both new routes are included in the existing accessibility audit. Repository verification also includes lint, types, unit and smoke tests, media audit, and a production build.

Codex coordinated two scoped implementation agents and an independent QA agent. Muse Spark 1.3 Contributor provided a bounded editorial critique, including the continuity of Jacob's stone and Peter's uncertain perception before recognition. Final source choices, visual review, integration, verification, and release remain the coordinating agent's responsibility.
