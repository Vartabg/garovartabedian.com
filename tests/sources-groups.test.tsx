import test from "node:test";
import assert from "node:assert/strict";
import { renderToStaticMarkup } from "react-dom/server";
import { JSDOM } from "jsdom";
import { SOURCE_GROUPS } from "../src/lib/source-guidance";
import { WORLD_GUIDES } from "../src/lib/world-guidance";
import SourcesPage from "../src/app/sources/page";

const text = (node: Element | null) => (node?.textContent ?? "").replace(/\s+/g, " ").trim();

test("the sources page opens on its groups, closed, and keeps everything each group says", () => {
  const page = new JSDOM(renderToStaticMarkup(<SourcesPage />)).window.document;
  const groups = [...page.querySelectorAll("details.source-group")];

  assert.deepEqual(groups.map((group) => group.id), SOURCE_GROUPS.map((group) => group.id));
  assert.equal(groups.filter((group) => group.hasAttribute("open")).length, 0, "every group starts closed");
  assert.equal(page.querySelectorAll("nav.source-index, .source-group-kicker").length, 0);

  SOURCE_GROUPS.forEach((source, index) => {
    const group = groups[index];
    assert.equal(text(group.querySelector("summary h2")), source.title);
    assert.equal(text(group.querySelector(".source-group-count")), `${source.links.length} records`);
    assert.ok(text(group.querySelector(".source-group-names")).startsWith(source.links[0].label));
    assert.ok(text(group).includes(source.summary), `${source.id} keeps its summary`);
    assert.equal(group.querySelectorAll(".source-method > li").length, source.method.length);
    const records = [...group.querySelectorAll(".source-links > li")];
    assert.deepEqual(records.map((record) => record.querySelector("a")!.getAttribute("href")), source.links.map((link) => link.href));
    records.forEach((record, at) => assert.equal(text(record.querySelector("p")), source.links[at].note));
  });

  // Every "Sources for ..." link in the site points at a group that exists, so it can open it.
  for (const guide of Object.values(WORLD_GUIDES)) {
    const href = guide.source.href ?? "/sources";
    if (href.startsWith("/sources#")) assert.ok(page.getElementById(href.slice("/sources#".length)), `${href} has a group`);
  }
});
