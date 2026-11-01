import test from "node:test";
import assert from "node:assert/strict";

import { compassPoint, leafBrightness, lightDirection, skyLight, sunPosition } from "../src/lib/sun";

// Jerusalem, 15 October 2026. Solar noon is about 09:25 UTC (longitude
// 35.21°E puts it 2h21m before 12:00 UTC, and the equation of time is about
// +14 minutes in mid-October). Day length at 31.77°N is about 11h26m.
const day = (time: string) => new Date(`2026-10-15T${time}Z`);

test("the sun crosses the meridian due south around 09:22 UTC", () => {
  const noon = sunPosition(day("09:22:00"));
  assert.ok(Math.abs(noon.azimuth - 180) < 2, `azimuth ${noon.azimuth.toFixed(1)}`);
  // 90 − 31.77 + declination (about −8.6°) ≈ 49.6°.
  assert.ok(Math.abs(noon.elevation - 49.6) < 0.7, `elevation ${noon.elevation.toFixed(1)}`);
});

test("sunrise falls between 03:35 and 03:50 UTC, in the east", () => {
  const before = sunPosition(day("03:35:00"));
  const after = sunPosition(day("03:50:00"));
  assert.ok(before.elevation < -0.833 && after.elevation > -0.833, "the sun rises in that window");
  assert.ok(after.azimuth > 90 && after.azimuth < 110, `azimuth ${after.azimuth.toFixed(0)}`);
});

test("the June solstice noon sun stands near 81.7° (90 − 31.77 + 23.44)", () => {
  let best = -90;
  for (let m = 0; m < 24 * 60; m += 2) {
    best = Math.max(best, sunPosition(new Date(Date.UTC(2026, 5, 21, 0, m))).elevation);
  }
  assert.ok(Math.abs(best - 81.67) < 0.6, `peak ${best.toFixed(2)}`);
});

test("midnight is deep night, and the light reads that way", () => {
  const night = sunPosition(day("21:00:00"));
  assert.ok(night.elevation < -60);
  assert.ok(leafBrightness(night.elevation) < 0.3, "night calls for light ink");
  assert.ok(leafBrightness(40) > 0.5, "day calls for dark ink");
  assert.deepEqual(skyLight(-40), skyLight(-18), "below astronomical twilight the light stops changing");
});

test("light comes from the sun's side of the page", () => {
  const [x, y, z] = lightDirection({ elevation: 5, azimuth: 90 });
  assert.ok(x > 0.9 && Math.abs(y) < 0.05 && z > 0.3, "a rising sun lights the page from the right");
  assert.equal(compassPoint(90), "east");
  assert.equal(compassPoint(359), "north");
  assert.equal(compassPoint(225), "southwest");
});
