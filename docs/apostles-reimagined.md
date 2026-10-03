# Apostles: Called. Changed. Sent.

The Apostles section now opens with people and visual stories, with the individual records and graded sending evidence kept accessible. Peter’s breakfast, Thomas’s encounter, and Pentecost each pair two distinct original paintings with an optional reading interaction. The full WEB passages are server-rendered, independently of JavaScript.

## Direction and source boundaries

- Peter: an empty night, breakfast, three exchanges, and a renewed call that still has a cost (John 21:1–19).
- Thomas: testimony, the interval, Jesus’s invitation, and confession (John 20:24–29). Neither words nor artwork claim he touched Jesus.
- Pentecost: the gathered community, varied hearers, and a response that includes both wonder and mockery (Acts 2:1–13, with an onward link to Peter’s speech).
- All thirteen records remain directly reachable. Paul is linked separately. Original manuscript images remain uncropped with the records. Appearance, setting and gestures in the new paintings are interpretive.
- Reader actions change emphasis within the text: Peter’s three exchanges; Thomas’s demand and confession; the breadth of the Pentecost hearers. They do not reenact miracles. No scroll hijacking, automatic progression or required sound.

## Team and verification

Muse Spark 1.3 Contributor implemented the home and the three optional reading interactions in two exclusive file pairs. The initial read-only discovery attempt hit its eight-step limit and was not accepted as completed; implementation was re-scoped with explicit source contracts. Gemini 3.8 Flash reviewed the creative direction and supplied code independently. Codex chose the direction, integrated scripture and navigation, corrected layout and implementation issues, generated/inspected artwork, and owns all verification and lifecycle gates.

Provider usage is recorded separately in the task handoff. No estimated billing savings are asserted. All source and visual changes remain on PR86 for Garo’s visual review before publication.

## Verified candidate — September 7, 2026

- Lint, TypeScript, 637 unit tests, 40 smoke tests, and the production/prebuilt build pass.
- Full browser suite: 181 passed, with three existing conditional skips. New coverage verifies all thirteen record links, exact scripture passages, distinct loaded scenes, onward links, no-JavaScript reading, and each interaction by keyboard.
- Accessibility: 43 routes in both themes, plus Lighthouse accessibility scoring. The home and all three stories also pass 320px reflow with OpenDyslexic, largest reading preference, a 24px root font, reduced motion, forced colors, and the site menu open. A real narrow-screen header overflow was fixed within Apostles; five repeated checks and the final full suite pass.
- Desktop and phone-sized browser views were inspected, including all three story interactions; no browser console errors were observed. This is browser emulation and keyboard testing, not a claim of physical iPhone or VoiceOver verification.
- Six JPEGs total 1,661,177 bytes. Story route-specific JavaScript is 2.17 kB in the production build; shared site JavaScript is additional. No new runtime dependencies.
- Source records remain intact. The new compact index avoids repeating uncertain biographical shorthand; the extracted overview distinguishes Simon’s label from unknown earlier political commitments.

The exact audited commit and matching hosted preview are recorded in the PR86 review handoff after upload. Publication remains pending Garo’s visual review.

## Artwork and exact prompts

Mode: built-in image generation. Six final 1536 × 1024 paintings are exported with Sharp to JPEG quality86/mozjpeg without cropping or compositional edits. Originals are retained. The fishing-boat count needed two edits: the first over-removed people and was rejected; the final selected image shows seven distinct figures. No new third-party assets or dependencies.

### peter-night

Shipped: `public/apostles/stories/peter-night.jpg`.

Original: `~/.codex/generated_images/01a0734c-c2b3-7ca1-af2f-97b6d0b8a787/exec-03ffb7cb-93b9-49ef-be52-344873264bf6.png`.

```text
Use case: illustration-story. Original Apostles story website painting.
A wide quiet Sea of Tiberias at the end of an unproductive night, John21:1–3. A small first-century wooden fishing boat in the lower central middle distance holds a group of seven humble adult male disciples, figures tiny and indistinct, lowering an empty wet net. Two sons of Zebedee and others are not individually labeled. Vast dark blue still water and pale first dawn mist; rough pebbled shoreline subtly visible at lower edge, no Jesus on shore in this moment. Emotion: effort and emptiness, patient quiet. Wide 3:2 landscape1536x1024, no text, no borders. Fine intaglio etched lines under luminous restrained oil glazes, deep marine charcoal/indigo, limestone and ember undertones; beautifully atmospheric, humane, not glossy fantasy. Keep important action within central60% for responsive view. No ship sails, halo, supernatural light, modern object or invented miracle. Original interpretive illustration, not a historical reconstruction.
```

Count correction prompt:
```text
Use case: precise-object-edit / illustration-story. Correct only the number of people in the supplied fishing-boat painting. John21:2 names SEVEN disciples together, but this painting appears to have an extra small head immediately behind and to the right of the central standing fisherman, near x848,y502 in the1536x1024 image. Remove that small partially occluded extra figure, filling naturally with boat/interior/lake as appropriate. Ensure exactly SEVEN human heads/people remain in the boat. Keep every other person, net, boat geometry, horizon, dawn, shoreline, composition, painting texture and dimensions unchanged. No new elements or text. The goal is the smallest count correction, not a new scene.
```

Count correction prompt:
```text
Use case: precise-object-edit. The supplied revised boat image has FIVE visible people: two seated left, one seated center-left, one standing center, one seated right. Add exactly TWO additional adult fishermen as small seated figures in the boat: one in the nearer-left empty seat around x676,y528, and one in the nearer-right empty seat around x870,y522. Both should have visible heads distinct from existing five, simple dark linen, understated. Final boat must have SEVEN clearly separated human heads. Keep the original five people unchanged. Keep boat, nets, sea, landscape, framing, dimensions and art texture unchanged. Minimal addition only. No text or symbols.
```

### peter-breakfast

Shipped: `public/apostles/stories/peter-breakfast.jpg`.

Original: `~/.codex/generated_images/01a0734c-c2b3-7ca1-af2f-97b6d0b8a787/exec-cff7c387-610b-41ec-b8ab-0bc74f505cdb.png`.

```text
Use case: illustration-story. Original Apostles story website painting.
An intimate dawn breakfast on the pebbled Sea of Tiberias shore, John21:9–15. In central foreground a small charcoal fire holds fish, with simple bread beside it. Jesus and Peter sit near the fire in quiet conversation, two adult first-century Jewish men in humble undyed linen and muted earth-color mantles, shown mostly in profile/frombehind; Peter middle-aged dark greying hair and close beard, Jesus younger adult dark hair/beard. Other disciples are small quiet figures nearer the distant pulled-up wooden boat, ordinary calm fellowship. No exact portrait claim. Broad pale luminous water behind, warm ember light and sea-blue dawn; subtle humanity and attentive posture, Jesus gently offering bread, no pointing triumph. Extraordinary refined intaglio crosshatching beneath translucent oil glazes, tactile linen/stone/charcoal, sacred editorial restraint. Landscape3:2 1536x1024, key fireandtwofigures central60%, fullcontinuouscomposition, noframe, words, logos, watermark, halo, wings, modern objects, crowds or fantasy rays. This is interpretive illustration, not historical reconstruction.
```

### thomas-waiting

Shipped: `public/apostles/stories/thomas-waiting.jpg`.

Original: `~/.codex/generated_images/01a0734c-c2b3-7ca1-af2f-97b6d0b8a787/exec-f2a1aca4-b0bc-4bee-a883-d054e01d350c.png`.

```text
Use case: illustration-story. Original Apostles story website painting.
John20:24–25 as an interpretive scene of listening to testimony. In a quiet modest first-century Jerusalem stone room, a small group of adult Jewish male disciples sits together near an oil lamp. Thomas, a dark-haired bearded adult in a weathered blue-grey mantle, stands apart near the near-right wall, hands relaxed at his sides, listening; no assertion of private thoughts. An unoccupied strip of floor separates him from his companions. View framed by dark stone at the edges, central human spacing clearly visible, a wooden door in the background. No Jesus in this scene. Extraordinary gentle intaglio crosshatching underneath translucent oil glazes, tactile linen and limestone, deep teal shadows and muted ochre lamplight, spacious, vulnerable and human, sacred editorial naturalism. Landscape3:2 1536x1024, important figures central60%, no text, frame, logos, halo, wings, spectacle, modern furnishings or weapons. No caricature of doubt or angry pointing.
```

### thomas-peace

Shipped: `public/apostles/stories/thomas-peace.jpg`.

Original: `~/.codex/generated_images/01a0734c-c2b3-7ca1-af2f-97b6d0b8a787/exec-ca1e76f0-d9b8-4504-af38-c1f8efd65b3b.png`.

```text
Use case: illustration-story. Original Apostles story website painting.
John20:26–28, a quiet encounter with the risen Jesus in a modest first-century Jerusalem stone room. Jesus, a young adult Jewish man with dark hair and beard in undyed ivory linen, stands calmly at center-left with open palms in invitation. Thomas, an adult Jewish man in muted blue-grey linen at center-right, faces him with reverent attention; Thomas's hands remain clearly near his OWN chest and DO NOT TOUCH Jesus anywhere. A modest open space between them is crucial. Several disciples watch quietly in the background. Wooden door remains closed in back. Eye-level intimate scene; ordinary soft lamplight and subtle ivory light on faces and hands, no supernatural rays or visible deity spectacle. Full anatomy natural, no bleeding wounds, a restrained small mark on Jesus's palms if visible. Fine intaglio crosshatching under translucent oil glazes matching humane sacred editorial paintings, marinecharcoal/limestone/umber/mutedgold. Landscape3:2 1536x1024, all key figures withincentral60%, no words, lettering, border, logo, watermark, halo or wings. Interpretive illustration, not portrait/history claim.
```

### pentecost-gathering

Shipped: `public/apostles/stories/pentecost-gathering.jpg`.

Original: `~/.codex/generated_images/01a0734c-c2b3-7ca1-af2f-97b6d0b8a787/exec-79bc02ec-aa09-4d96-8904-dff097e4f616.png`.

```text
Use case: illustration-story. Original Apostles story website painting.
Acts2:1–4. A gathered early Christian community of adult Jewish men and women seated together in a simple first-century Jerusalem stone house. Shown as a community larger than only twelve, without assigning the unnamed individuals specific identities. Modest linen/clay/stone interior and high window. Small separated tongue-like forms of warm flame hover just above each person, delicate restrained lights, no fire on clothing, no burning room; faces quietly attentive, no theatrical trance. Painterly interpretation of the passage's 'tongues like fire', NOT a physical historical reconstruction. Humane intimate eye-level broad composition, warm earthy ochre light and deep teal shadows, extraordinary intaglio crosshatching beneath translucent oil glazes. Sacred editorial craftsmanship, enough negative space to breathe, all keyfigureswithincentral70%. Landscape3:2 1536x1024. No dove, visible deity, giantflames, wings, halos, glowingeyes, crossesinwindows, medievalchurch, modernobjects, text, borders, logo,watermark. Noexactroomclaim; no crowdedfantasyspectacle.
```

### pentecost-hearers

Shipped: `public/apostles/stories/pentecost-hearers.jpg`.

Original: `~/.codex/generated_images/01a0734c-c2b3-7ca1-af2f-97b6d0b8a787/exec-bc2bdbda-1b89-46e0-b886-b2d7d885c2d0.png`.

```text
Use case: illustration-story. Original Apostles story website painting.
Acts2:5–13 as an interpretive narrative scene: a broad humane gathering of Jewish pilgrims and residents in a sunlit first-century Jerusalem limestone street, from many parts of the ancient Mediterranean and Near East. Men and women of different adult ages in historically restrained linen/wool earthcolored garments, some listening intently to a few ordinary disciples speaking near a low stone step, some looking toward each other in surprise. Do not use ethniccaricatures, fantasy costumes, modern flags, maplines, written languages, headlabels or stereotypes. An open doorway atfarleftconnects quieter domestic shadow with generous public space. Evoke the marvel of recognizing one's own language through attentive faces and groups conversing; no miraculous light effects inthisscene. Eyelevel landscape3:2 1536x1024, wide open foreground, central60% carries keyaction. Exquisite antique intaglio lines under translucent luminous oilglazes, warmlimestone, dustyumber, restrained blueandterracotta, softafternoonlight, deeply human. No namedportraitclaims, no exactcrowdcount, no visibleGod, giantflames, halos,wings,text, border,logo,watermark, modernbuildings, mosques orcrusaderarchitecture.
```
