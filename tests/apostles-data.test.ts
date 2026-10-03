import assert from "node:assert/strict";
import { readFileSync } from "node:fs";
import { describe, it } from "node:test";
import type { SentData, TwelveData } from "../src/lib/apostles/types";
import { parseRef, refHref } from "../src/lib/apostles/client";
import mapLand from "../src/lib/apostles/map-land.json";
import { APOSTLE_PLATES, PAUL_PLATE } from "../src/lib/apostles/plates";

const twelve = JSON.parse(
  readFileSync(new URL("../public/apostles/twelve.json", import.meta.url), "utf8"),
) as TwelveData;
const sent = JSON.parse(
  readFileSync(new URL("../public/apostles/sent.json", import.meta.url), "utf8"),
) as SentData;

const WEIGHTS = new Set(["scripture", "early", "late"]);
const REF = /^[1-3]?[A-Z]{2,4} \d+:\d+(?:-\d+)?$/;

describe("Apostles learning data", () => {
  it("keeps thirteen records — the Twelve, the traitor, and the replacement", () => {
    assert.equal(twelve.apostles.length, 13);
    const ids = new Set(twelve.apostles.map((a) => a.id));
    assert.equal(ids.size, 13, "record ids must be unique");
    assert.ok(ids.has("judas-iscariot") && ids.has("matthias"));
    const seats = twelve.apostles.map((a) => a.seat).sort((a, b) => a - b);
    assert.deepEqual(
      seats,
      [1, 2, 3, 4, 5, 6, 7, 8, 9, 10, 11, 12, 12],
      "seats must be exactly 1..12 with the twelfth held twice",
    );
  });

  it("illustrates exactly the thirteen records and keeps Paul outside the roster", () => {
    const recordIds = twelve.apostles.map((apostle) => apostle.id).sort();
    assert.deepEqual(Object.keys(APOSTLE_PLATES).sort(), recordIds);

    for (const [id, plate] of Object.entries(APOSTLE_PLATES)) {
      assert.equal(plate.src, `/apostles/twelve/${id}.jpg`);
      assert.ok(plate.alt.length >= 40, `${id} needs meaningful alt text`);
      assert.ok(plate.caption.length >= 30, `${id} needs a useful caption`);
    }

    assert.equal(PAUL_PLATE.src, "/apostles/twelve/paul.jpg");
    assert.ok(!Object.hasOwn(APOSTLE_PLATES, "paul"));
  });

  it("keeps the four roll-calls true to the structural claims the page makes", () => {
    // The listsNote asserts these invariants in prose; hold the data to them.
    assert.equal(twelve.lists.length, 4);
    for (const list of twelve.lists) {
      const expected = list.id === "acts" ? 11 : 12;
      assert.equal(list.names.length, expected, `${list.id} roll-call length`);
      assert.match(list.names[0], /Peter/, `${list.id}: Peter always first`);
      assert.match(list.names[4], /Philip/, `${list.id}: Philip always fifth`);
      assert.match(list.names[8], /James of Alphaeus/, `${list.id}: ninth seat`);
      if (list.names.length === 12) {
        assert.match(
          list.names[11],
          /Judas Iscariot/,
          `${list.id}: Iscariot last while present`,
        );
      } else {
        assert.ok(
          !list.names.some((n) => /Iscariot/.test(n)),
          "Acts roll-call has no Iscariot",
        );
      }
    }
  });

  it("keeps every record scannable without losing the deep evidence", () => {
    for (const a of twelve.apostles) {
      assert.ok(a.glanceCall.length >= 45, a.name + " needs a useful call glance");
      assert.ok(a.glanceCall.length <= 190, a.name + " call glance is too long");
      assert.ok(a.glanceCost.length >= 45, a.name + " needs a useful cost glance");
      assert.ok(a.glanceCost.length <= 190, a.name + " cost glance is too long");
      assert.ok(a.before.length > 80, a.name + " needs a real before-the-call record");
      assert.ok(a.record.length >= 1, a.name + " needs at least one recorded scene");
      assert.ok(a.human.text.length > 80, a.name + " needs an honest human moment");
      assert.ok(a.human.refs.length > 0, a.name + " human moment must be cited");
    }
  });

  it("grades every tradition claim and names its earliest source", () => {
    for (const a of twelve.apostles) {
      for (const claim of [...a.sent, a.death]) {
        assert.ok(WEIGHTS.has(claim.weight), a.name + " claim has no honesty grade");
        assert.ok(claim.earliest.length > 8, a.name + " claim must name its earliest source");
        assert.match(
          claim.sourceUrl,
          /^(https:\/\/|\/)/,
          a.name + " claim needs an https or internal source link",
        );
        assert.doesNotMatch(claim.sourceUrl, /wikipedia\.org/, a.name);
      }
    }
  });

  it("uses machine refs that resolve into the hosted reader", () => {
    const allRefs = twelve.apostles.flatMap((a) => [
      ...a.call.refs,
      ...a.record.flatMap((s) => s.refs),
      ...a.human.refs,
      ...a.after.refs,
    ]);
    assert.ok(allRefs.length >= 60, "the room should cite scripture densely");
    for (const r of allRefs) {
      assert.match(r.ref, REF, r.ref + " is not a machine ref");
      assert.ok(parseRef(r.ref), r.ref + " must parse");
      assert.match(refHref(r.ref), /^\/scriptures\/protestant\/[1-3]?[A-Z]{2,4}\/\d+#v\d+$/);
      assert.ok(r.label.length > 4, r.ref + " needs a human label");
    }
  });

  it("draws the sending honestly — every ray graded, the unplaced left unplaced", () => {
    const recordIds = new Set(twelve.apostles.map((a) => a.id));
    const charted = new Set<string>();
    for (const ray of sent.rays) {
      assert.ok(recordIds.has(ray.apostleId), ray.apostleId + " has no record");
      assert.ok(!charted.has(ray.apostleId), ray.apostleId + " is charted twice");
      charted.add(ray.apostleId);
      assert.ok(ray.bearing >= 0 && ray.bearing < 360, ray.name + " bearing out of range");
      assert.ok(ray.reach >= 0 && ray.reach <= 1, ray.name + " reach out of range");
      assert.ok(WEIGHTS.has(ray.weight), ray.name + " ray has no grade");
      assert.ok(ray.claims.length > 0, ray.name + " ray needs at least one claim");
    }
    for (const entry of sent.unplaced) {
      assert.ok(recordIds.has(entry.apostleId), entry.apostleId + " has no record");
      assert.ok(!charted.has(entry.apostleId), entry.name + " cannot be both placed and unplaced");
      assert.ok(entry.note.length > 40, entry.name + " unplaced note must explain the refusal");
    }
    assert.equal(
      sent.rays.length + sent.unplaced.length,
      13,
      "every seat is either placed or honestly unplaced",
    );
  });

  it("keeps the map's cities and roads consistent with the graded record", () => {
    const cityIds = new Set(sent.cities.map((c) => c.id));
    assert.equal(cityIds.size, sent.cities.length, "city ids must be unique");
    for (const city of sent.cities) {
      assert.ok(city.lat > 5 && city.lat < 49, city.id + " latitude outside the plate");
      assert.ok(city.lng > 4 && city.lng < 84, city.id + " longitude outside the plate");
      assert.ok(["start", "middle", "end"].includes(city.anchor), city.id + " anchor");
    }
    assert.equal(sent.cities.filter((c) => c.hub).length, 1, "exactly one hub");

    const rayIds = new Set(sent.rays.map((r) => r.apostleId));
    const routeIds = new Set(sent.routes.map((r) => r.apostleId));
    assert.equal(routeIds.size, sent.routes.length, "route ids must be unique");
    for (const ray of sent.rays) {
      if (ray.reach === 0) {
        assert.ok(!routeIds.has(ray.apostleId), ray.name + " stayed — no road to draw");
      } else {
        assert.ok(routeIds.has(ray.apostleId), ray.name + " has a ray but no road");
      }
    }
    for (const route of sent.routes) {
      assert.ok(rayIds.has(route.apostleId), route.name + " road has no graded ray");
      assert.ok(cityIds.has(route.label.at), route.name + " label city missing");
      for (const also of route.label.alsoAt ?? []) {
        assert.ok(cityIds.has(also), `${route.name} alsoAt ${also} unknown`);
      }
      assert.ok(route.legs.length > 0, route.name + " needs at least one leg");
      for (const leg of route.legs) {
        assert.ok(cityIds.has(leg.from), `${route.name} leg from ${leg.from} unknown`);
        assert.ok(cityIds.has(leg.to), `${route.name} leg to ${leg.to} unknown`);
        assert.ok(WEIGHTS.has(leg.weight), `${route.name} leg has no grade`);
        for (const [lat, lng] of leg.via ?? []) {
          assert.ok(lat > 5 && lat < 49 && lng > 4 && lng < 84, `${route.name} via point off-plate`);
        }
      }
      if (route.stub) {
        const [lat, lng] = route.stub.toward;
        assert.ok(lat > 5 && lat < 49 && lng > 4 && lng < 84, `${route.name} stub off-plate`);
        assert.ok(WEIGHTS.has(route.stub.weight), `${route.name} stub has no grade`);
        assert.ok(route.stub.note.length > 3, `${route.name} stub needs a note`);
      }
      assert.equal(route.legs[0].from, "jerusalem", route.name + " must leave from Jerusalem");
    }
    assert.equal(
      sent.rays.filter((r) => r.reach === 0).length,
      1,
      "the map renders exactly one stayed seat as the center ring",
    );
  });

  it("keeps the baked land asset structurally sound", () => {
    const geo = mapLand as {
      bounds: Record<string, number>;
      xscale: number;
      scale: number;
      pad: number;
      view: { w: number; h: number };
      land: string[];
      lakes: string[];
    };
    for (const key of ["west", "east", "south", "north"]) {
      assert.ok(Number.isFinite(geo.bounds[key]), `bounds.${key} missing`);
    }
    assert.ok(geo.view.w > 0 && geo.view.h > 0, "view must have positive size");
    assert.ok(
      Number.isFinite(geo.xscale) && Number.isFinite(geo.scale) && Number.isFinite(geo.pad),
      "projection constants must be numbers",
    );
    assert.ok(geo.land.length > 0, "land must not be empty");
    assert.ok(geo.lakes.length > 0, "the window includes the Caspian — lakes must not be empty");
    for (const d of [...geo.land, ...geo.lakes]) {
      assert.match(d, /^M[\d.]/, "path must start with a move");
      assert.match(d, /Z$/, "ring must close");
    }
  });
});
