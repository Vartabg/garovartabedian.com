import assert from "node:assert/strict";
import { readFileSync, readdirSync } from "node:fs";
import path from "node:path";
import { describe, it } from "node:test";
import {
  EARLY_TEXTS,
  ERAS,
  TEXT_ERA,
  textLengthLabel,
  textsForEra,
} from "../src/lib/early/client";
import { WORLD_GUIDES } from "../src/lib/world-guidance";

const TEXTS_DIR = path.join(process.cwd(), "public", "early", "texts");
const TIMELINE_PATH = path.join(process.cwd(), "public", "early", "timeline.json");

describe("early catalog", () => {
  it("assigns every hosted text to exactly one era", () => {
    for (const t of EARLY_TEXTS) {
      assert.ok(TEXT_ERA[t.id], `missing TEXT_ERA for ${t.id}`);
    }
    const eraIds = new Set(ERAS.map((e) => e.id));
    for (const [id, era] of Object.entries(TEXT_ERA)) {
      assert.ok(eraIds.has(era), `unknown era ${era} for ${id}`);
      assert.ok(
        EARLY_TEXTS.some((t) => t.id === id),
        `TEXT_ERA orphan ${id}`,
      );
    }
  });

  it("keeps chapter/paragraph counts in sync with hosted JSON", () => {
    const files = readdirSync(TEXTS_DIR).filter((f) => f.endsWith(".json"));
    assert.equal(files.length, EARLY_TEXTS.length);

    for (const t of EARLY_TEXTS) {
      const raw = JSON.parse(
        readFileSync(path.join(TEXTS_DIR, `${t.id}.json`), "utf8"),
      ) as { sections: { heading?: string; paragraphs: string[] }[] };
      const chapters = raw.sections.filter((s) => s.heading).length;
      const paragraphs = raw.sections.reduce(
        (n, s) => n + s.paragraphs.length,
        0,
      );
      assert.equal(t.chapters, chapters, `${t.id} chapters`);
      assert.equal(t.paragraphs, paragraphs, `${t.id} paragraphs`);
    }
  });

  it("formats length labels without noise on tiny texts", () => {
    assert.equal(textLengthLabel({ chapters: 1, paragraphs: 1 }), null);
    assert.equal(textLengthLabel({ chapters: 17, paragraphs: 17 }), "17 sections");
    assert.equal(
      textLengthLabel({ chapters: 59, paragraphs: 61 }),
      "59 sections · 61 paragraphs",
    );
    assert.equal(textLengthLabel({ chapters: 1, paragraphs: 10 }), "10 paragraphs");
  });

  it("returns shelf order per era", () => {
    const fathers = textsForEra("fathers");
    assert.ok(fathers.length >= 10);
    assert.equal(fathers[0]?.id, "didache");
  });

  it("lists every era plus Ignatius in the world guide nav", () => {
    const hrefs = WORLD_GUIDES.early.nav.map((l) => l.href);
    assert.ok(hrefs.includes("/early"));
    assert.ok(hrefs.includes("/early/ignatius"));
    for (const era of ERAS) {
      assert.ok(
        hrefs.includes(`/early/era/${era.id}`),
        `nav missing era ${era.id}`,
      );
    }
  });

  it("puts every hosted writing on the timeline (or inside its range)", () => {
    const timeline = JSON.parse(readFileSync(TIMELINE_PATH, "utf8")) as {
      range: { start: number; end: number };
      items: { lane: string; textId?: string; start: number; end: number }[];
    };
    const linked = new Set(
      timeline.items
        .filter((i) => i.lane === "writing" && i.textId)
        .map((i) => i.textId as string),
    );

    // Ignatius is one bar for all seven letters.
    const ignatiusIds = EARLY_TEXTS.filter((t) => t.id.startsWith("ignatius-")).map(
      (t) => t.id,
    );
    for (const t of EARLY_TEXTS) {
      if (ignatiusIds.includes(t.id)) {
        assert.ok(
          linked.has("ignatius-ephesians") || linked.has(t.id),
          `timeline missing Ignatius coverage for ${t.id}`,
        );
        continue;
      }
      assert.ok(linked.has(t.id), `timeline missing hosted text ${t.id}`);
    }

    for (const item of timeline.items) {
      assert.ok(item.start >= timeline.range.start, `${item.start} before range`);
      assert.ok(item.end <= timeline.range.end + 50, `${item.end} far past range`);
    }
  });
});
