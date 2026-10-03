# Church Giants Plates — Implementation Plan

**Goal:** Add six historically specific, honest gift-and-fault portraits to the Church giants room in the established illuminated-manuscript house style.
**Approach:** Use the existing Nicaea I and Trent plates as binding visual references; generate one 16:9 manuscript leaf per approved brief; review each image for subject, symbolic accuracy, prohibited text, period cues, and house-style fidelity; then wire only the six approved plates into their matching giant records with accessible metadata and lazy loading.
**Files affected:** `tests/church-interactions.test.tsx`, `src/app/church/giants/GiantsRoom.tsx`, `src/lib/church/giant-plates.ts`, six new JPEGs under `public/church/giants/`, and this plan.

---

### Task 1: Lock the six-plate contract

1. Assert that Athanasius, Augustine, Aquinas, Luther, Calvin, and Barth resolve to versioned plate metadata.
2. Assert that giants without an approved brief remain text-only.
3. Assert that every approved plate has useful alt text and an honest gift-and-fault caption.

- [x] Task 1 complete

### Task 2: Generate and review the manuscript leaves

1. Generate each brief separately with Nicaea I and Trent as style references.
2. Preserve the 1280×720 landscape delivery size, aged parchment, period-adjusted border, flat tempera figures, lapis/oxblood/ochre/gold palette, and pseudo-script-only rule.
3. Review every output for the named man's scene, gift, fault, hands, faces, unintended legible text, anachronisms, and AI artifacts.
4. Make one targeted correction when an output misses a binding requirement; do not ship a merely plausible substitute.

- [x] Task 2 complete

### Task 3: Wire the approved plates

1. Add typed plate metadata for the six approved IDs.
2. Render each plate inside its open giant record with existing lazy-load behavior.
3. Leave Origen, Cyril of Alexandria, and John of Damascus unchanged until they receive their own approved briefs.

- [x] Task 3 complete

### Task 4: Verify and ship

1. Run unit tests, lint, TypeScript, media audit, production build, and focused browser checks for desktop/mobile giant records.
2. Run the required three-pass review and inspect all six plates at full resolution.
3. Audit the scoped diff and branch history for secrets, commit only task files, push the feature branch, and prepare a reviewable deployment.

- [x] Task 4 complete
