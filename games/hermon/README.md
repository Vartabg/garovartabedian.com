# Mount Hermon at dawn

The free flight opens at `/play/hermon`. The Cloven Arch opens at `/play/hermon/crossing`. Its story and three possible outcomes are available at `/play/hermon/crossing/account` with JavaScript disabled. The shepherds and their flight are fiction inspired by 1 Enoch 6.

## Build and test

Use Node 24 in this directory.

```sh
npm ci --include=dev
npm run typecheck
npm test
npm run build
```

The site publishes the files from `out/` at `/play/hermon`. Its three entry URLs serve `index.html`, `crossing.html`, and `crossing/account.html`. Normal anchors return to the Stories collection and the hosted text of 1 Enoch. Models, elevation samples, terrain textures, and fonts ship with the game.

The flight renderer uses React 19.2.8. Its independent dependency lock preserves the supported peer range of React Three Fiber. Flight progress, control preferences, and the list of tried controls use the `hermon.` namespace in browser storage.

Flight settings can download frame timings, a recording of trackpad inputs, and the Gesture Lab’s measurements and recent strokes as local JSON files. The field guide shows the same build identifier as the frame report and includes a QR code that opens the published flight on a phone.

## Sources

- The scenes, flight behavior, controls, and initial asset versions come from [Halaverga at fbf267fdbd](https://github.com/Vartabg/halaverga/tree/fbf267fdbd8bfcfdf6dfba4f97f1c13ddedc5a96).
- The [character provenance](docs/art/real-bodies/PROVENANCE.md) records the CC0 MakeHuman and Quaternius material and the original work in the two shipped models. The [asset manifest](art/real-bodies/asset.json) records their hashes.
- The [terrain provenance](docs/art/hermon-sky/PROVENANCE.md) credits the Poly Haven CC0 limestone and snow photographs, Mapzen Terrain Tiles, and SRTM data courtesy of the U.S. Geological Survey.
- The field guide's 1 Enoch excerpts use R. H. Charles's 1917 translation. Its Jude quotation uses the World English Bible. Both translations are in the public domain.
- The local variable Geist font uses the [SIL Open Font License](src/app/fonts/OFL.txt).
