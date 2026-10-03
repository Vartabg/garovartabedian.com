import assert from "node:assert/strict";
import { describe, it } from "node:test";
import { MED_CITIES, medCityXY, medProject } from "../src/lib/maps/med-geo";
import { MODERN_REFERENCE_CITIES, PLACES, SCALE_BAR, project } from "../src/app/jesus/life/geo";

describe("Mediterranean projection", () => {
  it("places Rome west of Antioch and north of Smyrna", () => {
    const rome = medCityXY("rome");
    const antioch = medCityXY("antioch");
    const smyrna = medCityXY("smyrna");
    assert.ok(rome.x < antioch.x, "Rome should be west of Antioch");
    assert.ok(rome.y < smyrna.y, "Rome should be north of Smyrna (smaller y)");
  });

  it("places Philippi near Neapolis and west of Troas", () => {
    const philippi = medCityXY("philippi");
    const neapolis = medCityXY("neapolis");
    const troas = medCityXY("troas");
    assert.ok(Math.abs(philippi.x - neapolis.x) < 20);
    assert.ok(philippi.x < troas.x);
  });

  it("keeps every pinned city inside the viewBox", () => {
    for (const id of Object.keys(MED_CITIES) as (keyof typeof MED_CITIES)[]) {
      const { x, y } = medCityXY(id);
      assert.ok(x >= 0 && x <= 720, `${id} x=${x}`);
      assert.ok(y >= 0 && y <= 420, `${id} y=${y}`);
    }
  });

  it("projects higher latitudes to smaller y", () => {
    const north = medProject(46, 20);
    const south = medProject(36, 20);
    assert.ok(north.y < south.y);
  });
});

describe("Holy Land projection", () => {
  it("places Capernaum north of Jerusalem and east of Nazareth", () => {
    const capernaum = project(32.8809, 35.5753);
    const jerusalem = project(31.778, 35.2354);
    const nazareth = project(32.6996, 35.3035);
    assert.ok(capernaum.y < jerusalem.y, "Capernaum north of Jerusalem");
    assert.ok(capernaum.x > nazareth.x, "Capernaum east of Nazareth");
  });

  it("places Bethlehem south of Jerusalem", () => {
    const bethlehem = project(31.7054, 35.2024);
    const jerusalem = project(31.778, 35.2354);
    assert.ok(bethlehem.y > jerusalem.y);
  });

  it("keeps life places and modern reference anchors inside the atlas", () => {
    const points = [...PLACES, ...MODERN_REFERENCE_CITIES];
    for (const point of points) {
      assert.ok(point.x >= 0 && point.x <= 400, `${point.id} x=${point.x}`);
      assert.ok(point.y >= 0 && point.y <= 560, `${point.id} y=${point.y}`);
    }
    assert.ok(SCALE_BAR.x1 >= 0 && SCALE_BAR.x2 <= 400);
    assert.ok(SCALE_BAR.y >= 0 && SCALE_BAR.y <= 560);
  });
});
