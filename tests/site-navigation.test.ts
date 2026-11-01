import assert from "node:assert/strict";
import { readdirSync } from "node:fs";
import path from "node:path";
import { describe, it } from "node:test";
import {
  SITE_ROUTES,
  getNavigationCurrent,
  getSiteLocation,
  getWorldForPath,
  getWorldRoutes,
  sitePath,
} from "../src/lib/site-navigation";
import { WORLD_REGISTRY } from "../src/lib/world-registry";

function pageRoutes(directory: string, prefix = ""): string[] {
  return readdirSync(directory, { withFileTypes: true }).flatMap((entry) => {
    if (entry.isDirectory()) {
      return pageRoutes(path.join(directory, entry.name), `${prefix}/${entry.name}`);
    }
    return entry.name === "page.tsx" ? [prefix || "/"] : [];
  });
}

const pagePatterns = pageRoutes(path.join(process.cwd(), "src/app"));

function hasPage(href: string) {
  const segments = href.split("/");
  return pagePatterns.some((pattern) => {
    const parts = pattern.split("/");
    return parts.length === segments.length && parts.every(
      (part, index) => part.startsWith("[") || part === segments[index],
    );
  });
}

describe("shared site navigation", () => {
  it("indexes every public static page and links only to actual pages", () => {
    const privatePages = new Set(["/scriptures/find", "/scriptures/research"]);
    const indexed = new Set(SITE_ROUTES.map((route) => route.href));
    assert.equal(indexed.size, SITE_ROUTES.length, "route hrefs must be unique");
    for (const href of pagePatterns) {
      if (!href.includes("[") && !privatePages.has(href)) {
        assert.ok(indexed.has(href), `Missing public page: ${href}`);
      }
    }
    for (const route of SITE_ROUTES) {
      assert.ok(hasPage(route.href), `Missing route target: ${route.href}`);
      assert.ok(route.note, `Missing destination description: ${route.href}`);
      assert.ok(!privatePages.has(route.href), "local tools stay out of public navigation");
    }
  });

  it("keeps world destinations and indexes scoped to the same world", () => {
    for (const world of WORLD_REGISTRY) {
      const location = getSiteLocation(world.href);
      assert.equal(location.world?.id, world.id);
      assert.equal(location.label, world.label);
      assert.deepEqual(location.breadcrumbs, [
        { href: "/#worlds", label: "All worlds" },
        { href: world.href, label: world.label },
      ]);
      const routes = getWorldRoutes(world.id);
      assert.ok(routes.length > 1);
      assert.equal(routes[0].href, world.href);
      assert.ok(routes.every((route) => getWorldForPath(route.href)?.id === world.id));
    }
    assert.equal(getWorldForPath("/early-access"), undefined);
    assert.equal(getWorldForPath("/work/eye"), undefined);
  });

  it("marks exact destinations as pages and containing sections as locations", () => {
    assert.equal(getNavigationCurrent("/", "/"), "page");
    assert.equal(getNavigationCurrent("/scriptures/web/john/3", "/"), undefined);
    assert.equal(getNavigationCurrent("/scriptures/web/john/3", "/scriptures"), "location");
    assert.equal(getNavigationCurrent("/work/eye", "/work"), "location");
    assert.equal(getNavigationCurrent("/work/eye/", "/work/eye"), "page");
    assert.equal(getNavigationCurrent("/workshop", "/work"), undefined);
    assert.equal(getNavigationCurrent("/evidence", "/evidence#method"), undefined);
    assert.equal(getNavigationCurrent("/scriptures/search?q=hope", "/scriptures/search"), "page");
    assert.equal(sitePath("/scriptures/search/?q=hope#results"), "/scriptures/search");
  });

  it("builds real parent trails for nested world and portfolio pages", () => {
    assert.deepEqual(getSiteLocation("/evidence/frameworks/compare").breadcrumbs, [
      { href: "/#worlds", label: "All worlds" },
      { href: "/evidence", label: "How We Know" },
      { href: "/evidence/frameworks", label: "The Afterlife Atlas" },
      { href: "/evidence/frameworks/compare", label: "Compare traditions" },
    ]);
    assert.deepEqual(getSiteLocation("/work/eye").breadcrumbs, [
      { href: "/", label: "Home" },
      { href: "/work", label: "Work & case studies" },
      { href: "/work/eye", label: "EYE" },
    ]);
    const investigation = getSiteLocation("/scriptures/investigations/isaiah-53-clement-16");
    assert.equal(investigation.breadcrumbs.length, 3);
    assert.ok(!investigation.breadcrumbs.some((crumb) => crumb.href === "/scriptures/investigations"));
    assert.equal(getSiteLocation("/early/era/fathers").label, "The Apostolic Fathers");
  });

  it("describes dynamic records without manufacturing titles from their slugs", () => {
    assert.deepEqual(getSiteLocation("/scriptures/web/john/3").breadcrumbs, [
      { href: "/#worlds", label: "All worlds" },
      { href: "/scriptures", label: "Scriptures" },
      { href: "/scriptures/web", label: "Scripture tradition" },
      { href: "/scriptures/web/john", label: "Book" },
      { href: "/scriptures/web/john/3", label: "Chapter" },
    ]);
    const topic = getSiteLocation("/scriptures/topics/mercy");
    assert.equal(topic.label, "Topic");
    assert.equal(topic.breadcrumbs.at(-2)?.href, "/scriptures/topics");
    const edition = getSiteLocation("/early/library/some-edition/section-1");
    assert.equal(edition.label, "Reading section");
    assert.equal(edition.breadcrumbs.at(-2)?.label, "Edition");
    const story = getSiteLocation("/apostles/stories/a-record-slug");
    assert.equal(story.label, "Apostle story");
    assert.ok(!story.breadcrumbs.some((crumb) => crumb.href === "/apostles/stories"));
    const dossier = getSiteLocation("/evidence/frameworks/a-tradition-slug");
    assert.equal(dossier.label, "Tradition dossier");
    assert.equal(dossier.breadcrumbs.at(-2)?.href, "/evidence/frameworks");
  });
});
