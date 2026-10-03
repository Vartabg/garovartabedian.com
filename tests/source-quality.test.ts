import assert from "node:assert/strict";
import { readdirSync, readFileSync } from "node:fs";
import { join } from "node:path";
import { describe, it } from "node:test";
import { SOURCE_GROUPS } from "../src/lib/source-guidance";

const SOURCE_ROOTS = [
  "public/angels",
  "public/apostles",
  "public/church",
  "public/early/texts",
  "public/jesus",
  "public/word",
];

const DISALLOWED_SOURCE_HOSTS = new Set([
  "earlychurchhistory.org",
  "en.wikipedia.org",
  "sellingjesus.org",
  "www.earlychristianwritings.com",
]);

function jsonFiles(directory: string): string[] {
  return readdirSync(directory, { withFileTypes: true }).flatMap((entry) => {
    const path = join(directory, entry.name);
    return entry.isDirectory()
      ? jsonFiles(path)
      : path.endsWith(".json")
        ? [path]
        : [];
  });
}

function collectSourceUrls(
  value: unknown,
  urls: string[],
  parentKey = "",
): void {
  if (Array.isArray(value)) {
    for (const item of value) collectSourceUrls(item, urls, parentKey);
    return;
  }

  if (!value || typeof value !== "object") return;

  for (const [key, child] of Object.entries(value)) {
    const isNamedSource = key === "sourceUrl";
    const isSourceCollectionUrl =
      key === "url" &&
      (parentKey === "sources" ||
        parentKey === "faultSources" ||
        parentKey === "linkOut");

    if (
      (isNamedSource || isSourceCollectionUrl) &&
      typeof child === "string" &&
      child.length > 0
    ) {
      urls.push(child);
    }

    collectSourceUrls(child, urls, key);
  }
}

describe("source quality", () => {
  it("keeps external research links secure and off weak aggregator domains", () => {
    const urls = SOURCE_ROOTS.flatMap(jsonFiles).flatMap((file) => {
      const found: string[] = [];
      collectSourceUrls(JSON.parse(readFileSync(file, "utf8")), found);
      return found;
    });

    for (const group of SOURCE_GROUPS) {
      urls.push(...group.links.map((link) => link.href));
    }

    assert.ok(urls.length >= 200, "the source audit should cover the full site");

    for (const url of urls) {
      if (url.startsWith("/") || url.startsWith("#")) continue;

      assert.match(url, /^https:\/\//, `${url} must use HTTPS`);
      assert.ok(
        !DISALLOWED_SOURCE_HOSTS.has(new URL(url).hostname),
        `${url} must be replaced with a primary or institutional source`,
      );
    }
  });

  it("publishes the lxx-morph license and adaptation notice", () => {
    const scriptureSources = SOURCE_GROUPS.find((group) => group.id === "scripture-texts");
    assert.ok(scriptureSources);

    const dataset = scriptureSources.links.find(
      (link) => link.href === "https://git.sr.ht/~sethkush/lxx-morph",
    );
    assert.ok(dataset);
    assert.match(dataset.note, /adapts and filters/i);
    assert.match(dataset.note, /reasoning remains at pinned revision/i);
    assert.ok(
      scriptureSources.links.some(
        (link) => link.href === "https://creativecommons.org/licenses/by/4.0/",
      ),
    );

    const generatedSources = readFileSync(
      "public/scriptures/original/SOURCES.md",
      "utf8",
    );
    assert.match(
      generatedSources,
      /\[CC BY 4\.0\]\(https:\/\/creativecommons\.org\/licenses\/by\/4\.0\/\)/,
    );
    assert.match(generatedSources, /adapts and filters lxx-morph/i);
    assert.match(generatedSources, /reasoning remains in the pinned upstream revision/i);
  });
});
