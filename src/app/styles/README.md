# CSS ownership

Route-level styles so the homepage does not pay for world-room CSS.

| File | Loaded from | Owns |
|------|-------------|------|
| `../globals.css` | root layout | Tailwind entry + imports below |
| `core.css` | globals | Tokens, layout, portfolio skins (Story/Lab/Terminal/…), glossary, wayfinding, Fraunces world type (shared with `.clean`) |
| `worlds-shared.css` | globals | Cards, inline plates (`.ew-section-plate`), WorldPreview, shared scr-* chrome, paper grain |
| `scriptures.css` | `scriptures/layout` | `.world-scr` + reader / search / shelf |
| `jesus.css` | `jesus/layout` | `.world-jesus`, life map, red-letter UI |
| `apostles.css` | `apostles/layout` | `.world-apostles`, records / sending chart |
| `early.css` | `early/layout` | `.world-early`, writings timeline, text pages |
| `church.css` | `church/layout` | `.world-church`, road / tree / councils |
| `word.css` | `word/layout` | `.world-word`, fences / cases |
| `angels.css` | `angels/layout` | `.world-angels`, ladder / encounters |

Prefer adding selectors to the world that owns the feature. Put shared
vocabulary (`.scr-card`, `.scr-empty`, plates) in `worlds-shared.css`.
