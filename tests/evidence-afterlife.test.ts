import assert from "node:assert/strict";
import test from "node:test";
import {
  getAllBeliefSystems,
  getBeliefSystem,
  getAfterlifeIndex,
  getAfterlifeCardSummaries,
  getBereanDossierLayers,
  TRADITION_FAMILIES,
  COMPARATOR_PRESETS,
} from "../src/lib/evidence/afterlife";

test("afterlife atlas loads 54 complete world traditions", () => {
  const beliefs = getAllBeliefSystems();
  assert.equal(beliefs.length, 54, "Must contain all 54 frameworks");

  for (const b of beliefs) {
    assert.ok(b.id, `Belief must have id: ${b.name}`);
    assert.ok(b.name, `Belief must have name`);
    assert.ok(b.description, `Belief must have description: ${b.id}`);
    assert.ok(b.primaryDoctrine, `Belief must have doctrine: ${b.id}`);
    assert.ok(TRADITION_FAMILIES.includes(b.taxonomy.family), `Valid family for ${b.id}`);
    assert.ok(b.taxonomy.patterns.length > 0, `At least one pattern for ${b.id}`);
    assert.ok(b.metadata.keyTexts.length > 0, `Must have key texts for ${b.id}`);
  }
});

test("afterlife index matches tradition registry", () => {
  const index = getAfterlifeIndex();
  const beliefs = getAllBeliefSystems();
  assert.equal(index.length, beliefs.length);

  for (const entry of index) {
    const full = getBeliefSystem(entry.id);
    assert.ok(full, `Entry ${entry.id} must resolve in full registry`);
    assert.equal(entry.name, full.name);
  }
});

test("afterlife card summaries provide lightweight payload for explorer", () => {
  const summaries = getAfterlifeCardSummaries();
  assert.equal(summaries.length, 54);
  for (const s of summaries) {
    assert.ok(s.id && s.name && s.description);
    assert.ok(s.searchText && s.searchText.length > 0);
    assert.ok(s.thumbnail.endsWith(".webp"));
  }
});

test("comparator presets reference valid traditions", () => {
  assert.ok(COMPARATOR_PRESETS.length >= 4);
  for (const p of COMPARATOR_PRESETS) {
    assert.equal(p.traditionIds.length, 3);
    for (const id of p.traditionIds) {
      assert.ok(getBeliefSystem(id), `Preset ${p.id} tradition ${id} must exist`);
    }
  }
});

test("berean dossier maps into 4 epistemological layers with explicit limits", () => {
  const duat = getBeliefSystem("egyptian-duat");
  assert.ok(duat);

  const layers = getBereanDossierLayers(duat);
  assert.ok(layers.observed.texts.length > 0, "Layer 01 must have primary texts");
  assert.ok(layers.inferred.patterns.length > 0, "Layer 02 must have eschatological patterns");
  assert.ok(layers.interpreted.doctrine, "Layer 03 must have core doctrine");
  assert.ok(layers.limit.includes("article of religious confession"), "Layer 04 must state the limit");
});
