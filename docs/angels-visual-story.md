# Open his eyes: visual story

## Creative brief

A five-moment reading of 2 Kings 6:14–17, World English Bible, in which the visitor controls the revelation and compares two interpretations of the same landscape. The visual principle is **hold the frame; change the seeing**. The passage describes the servant seeing the mountain full of horses and chariots of fire after Elisha prays; the experience does not assert when that host arrived, assign it an angelic rank, or name the servant.

The public story is at `/angels/stories/open-his-eyes`, promoted from the Angels & Demons opening and editorial feature. Its source remains the site's canonical WEB text. The geography, clothing, and visible forms are interpretive illustration, not historical reconstruction.

## Team and asset provenance

Codex coordinated implementation, original artwork, integration, and verification. Native agents handled the story experience, acceptance tests, and independent review. Muse Spark 1.3 Contributor provided a bounded editorial review through the existing subscription CLI; its proposed quotations were checked against the repository's WEB text rather than copied as authority.

Both new images were created using the built-in image generation tool. The revealed frame was edited from the opening frame to preserve geography and composition. Original generated PNGs remain outside the repository; the site uses compressed JPEG derivatives without compositional edits:

- `public/angels/stories/dothan-unseen.jpg`
- `public/angels/stories/dothan-revealed.jpg`

## Opening-frame prompt

Use case: illustration-story.
Asset type: full-bleed cinematic landscape for a sophisticated web story, 16:9, 1920x1080 if possible.
Primary request: An extraordinarily crafted painterly engraving of Dothan at dawn, the BEFORE frame of the story of Elisha's servant in 2 Kings 6:14–17. This is an interpretive illustration, not a historical reconstruction.
Scene: a small ancient hill town of limestone walls and flat-roofed houses sits in the lower middle of a great bowl of rolling arid mountains. A distant encircling human army is visible as tiny ranks, spears, horse silhouettes, and restrained pinpoints of warm torchlight around the city. In the lower right foreground on a rocky overlook, two small robed human figures stand facing the city, one younger servant slightly forward and an older prophet beside him. Both seen from behind, no faces. Immense quiet mountain ridge spans the upper middle horizon. No supernatural army visible yet.
Art direction: masterful detailed intaglio engraving beneath translucent oil glazes, antique sacred landscape print enlarged into cinema, fine etched crosshatching and worn pigment, tactile without literal paper frame. Vast depth, credible terrain, remarkably beautiful subtle light, solemn restrained emotion. Ink-black and midnight-indigo valleys, slate blue dawn sky, bone stone highlights, sparse antique gold torchlight. Deep shadow toward left edge for title legibility, center and right landscape luminous enough to read. Foreground olive tree or rocky silhouette at far right only; mountain horizon and town extremely readable.
Composition must work wide and with a central mobile crop. Town just below center; main mountain centered; human witnesses within central 60% width slightly right. Sky upper third spacious; no ornate border. All important story elements within central 70%. Do not place text in image.
Constraints: no angels, no wings, no magical beams, no fire on mountain, no modern objects, no castles/spires, no text, lettering, symbols, logos, watermarks, border or vignette frame. Understated and editorial, not a fantasy game poster. Render a single continuous beautiful composition.

## Revelation edit prompt

Use case: precise-object-edit / illustration-story.
Edit target: the provided Dothan dawn landscape. This is the AFTER frame of a precise before-and-after web comparison for 2 Kings 6:17.
Primary request: Keep the entire source image's composition, camera, pixel dimensions, terrain, town, human army, sky, olive tree, and the two robed foreground witnesses in EXACTLY the same places and the same sizes. Change only the revelation on the great mountain: show the mountain full of radiant horses and ancient two-wheeled chariots of fire. The landscape itself remains recognizable.
Arrange many clearly readable elegant luminous horse silhouettes and chariot wheels across the mountain ridge and its sloping contours, receding in depth, a vast ordered host. Shapes arise from antique-gold luminous etched lines and ivory-gold fire, with amber light softly touching the ridge. The effect should inspire awe and quiet assurance, magnificent and sacred, retaining fine intaglio crosshatching, subtle oil glazes, midnight-blue earth and luminous dawn.
Keep the little surrounding HUMAN army and camp lights below unchanged. Do not remove or replace it. Keep foreground figures unchanged, still facing the scene. Do not add wings, halos, human-shaped angels, flaming buildings, destruction, smoke columns, explosions, magical beams, text, border, logo, or watermark. Fire belongs to the horses/chariots; this is not a burning mountain disaster. No composition shift, no recrop, no altered town layout. Warm light may grow from the fiery host, but preserve the clear aligned geometry. Single continuous frame, same aspect ratio.

## Acceptance criteria

- Reader controls pace, reveal, and comparison; ordinary page scrolling stays native.
- Five narrative moments and the complete four-verse source remain available without JavaScript.
- Keyboard, touch, reduced motion, high contrast, and narrow screens receive usable content and controls.
- Interpretive artwork is labelled; exact source text and the linked chapter remain directly available.
- Existing research-room anchors and navigation remain reachable.
