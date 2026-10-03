import assert from "node:assert/strict";
import test from "node:test";
import { ATLAS_LAND, ATLAS_WATER } from "../src/app/jesus/life/atlas-geography";

function contains(rings: [number, number][][], lng: number, lat: number) {
  return rings.some((ring) => {
    let inside = false;
    for (let i = 0, j = ring.length - 1; i < ring.length; j = i++) {
      const [xi, yi] = ring[i], [xj, yj] = ring[j];
      if ((yi > lat) !== (yj > lat) && lng < ((xj - xi) * (lat - yi)) / (yj - yi) + xi) inside = !inside;
    }
    return inside;
  });
}

test("atlas land continues east of the Jordan instead of drawing a false coastline", () => {
  assert.equal(contains(ATLAS_LAND, 35.95, 32.5), true, "Transjordan is land");
  assert.equal(contains(ATLAS_LAND, 34.6, 32.5), false, "Mediterranean is water");
  assert.equal(contains(ATLAS_LAND, 35.2354, 31.778), true, "Jerusalem is land");
});

test("the detailed atlas shorelines contain both major lakes and exclude nearby cities", () => {
  assert.equal(contains(ATLAS_WATER, 35.59, 32.81), true, "Sea of Galilee");
  assert.equal(contains(ATLAS_WATER, 35.51, 31.48), true, "Dead Sea");
  assert.equal(contains(ATLAS_WATER, 35.3035, 32.6996), false, "Nazareth");
});
