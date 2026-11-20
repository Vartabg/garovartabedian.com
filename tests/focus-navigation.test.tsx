import assert from "node:assert/strict";
import test from "node:test";
import React from "react";
import { renderToStaticMarkup } from "react-dom/server";
import { JSDOM } from "jsdom";
import StoryHome from "../src/app/_components/StoryHome";
import WorldDisclosure from "../src/app/_components/WorldDisclosure";
import WorldHeader from "../src/app/_components/WorldHeader";
import {
  centerWorldInTrack,
  claimWorldSwitcherCoachmark,
} from "../src/lib/world-switcher";
import { openDisclosureForHash } from "../src/lib/world-disclosure";
import WorldHeroActions from "../src/app/_components/WorldHeroActions";
import AccessibilityMenu from "../src/app/_components/AccessibilityMenu";
import SiteNavigation from "../src/app/_components/SiteNavigation";
import { sectionMenu } from "../src/lib/site/section-menu";
import { getWorldRoutes } from "../src/lib/site-navigation";
import { SHELF_STORIES } from "../src/lib/story-shelf";
import {
  defaultAccessibilityPreferences,
  normalizeAccessibilityPreferences,
} from "../src/lib/accessibility-preferences";

(globalThis as typeof globalThis & { React: typeof React }).React = React;

/** Text as assistive technology reads it: aria-hidden subtrees dropped, tags stripped. */
function accessibleText(html: string): string {
  let out = "";
  let hiddenDepth = 0;
  for (const token of html.split(/(<[^>]+>)/)) {
    if (!token) continue;
    if (token.startsWith("<")) {
      const isVoid = token.endsWith("/>");
      if (hiddenDepth) {
        if (token.startsWith("</")) hiddenDepth -= 1;
        else if (!isVoid) hiddenDepth += 1;
      } else if (/\saria-hidden="true"/.test(token) && !isVoid) {
        hiddenDepth = 1;
      }
      continue;
    }
    if (!hiddenDepth) out += token;
  }
  return out;
}

test("site navigation keeps direct links minimal and houses About and Work with Garo in Explore", () => {
  const markup = renderToStaticMarkup(<SiteNavigation activeHref="/" />);
  const dom = new JSDOM(markup);
  const doc = dom.window.document;

  const directLinks = Array.from(
    doc.querySelectorAll(".site-nav-direct a"),
  ).map((a) => ({
    href: a.getAttribute("href"),
    text: a.textContent?.trim(),
  }));

  assert.deepEqual(directLinks, [
    { href: "/", text: "Home" },
    { href: "/scriptures", text: "Scriptures" },
    { href: "/jesus", text: "Jesus" },
  ]);

  const panelLinks = Array.from(
    doc.querySelectorAll(".site-nav-panel a"),
  ).map((a) => a.getAttribute("href"));

  assert.equal(doc.querySelector(".site-nav-menu > summary")?.textContent?.trim(), "Menu");
  assert.ok(panelLinks.includes("/scriptures/stories"), "Menu panel must include /scriptures/stories");
  assert.ok(panelLinks.includes("/about"), "Explore panel must include /about");
  assert.ok(panelLinks.includes("/services"), "Explore panel must include /services");

  const scripturesNav = new JSDOM(
    renderToStaticMarkup(<SiteNavigation activeHref="/scriptures" />),
  ).window.document;
  const scripturesPanelLinks = Array.from(
    scripturesNav.querySelectorAll(".site-nav-panel a"),
  ).map((a) => a.getAttribute("href"));
  assert.equal(
    scripturesPanelLinks.filter((href) => href === "/scriptures/stories").length,
    1,
    "Stories link should not repeat when /scriptures section menu is active",
  );

  const groupHeadings = Array.from(
    doc.querySelectorAll(".site-nav-group :is(h2, h3)"),
  ).map((h2) => h2.textContent?.trim());

  assert.ok(groupHeadings.includes("Work with Garo"), "Explore panel must have Work with Garo section");
});

test("world headers keep section navigation in one place", () => {
  const markup = renderToStaticMarkup(
    <WorldHeader href="/church" label="The Church" />,
  );

  assert.match(markup, /href="\/church"/);
  assert.match(markup, /href="\/"/);
  assert.match(markup, /href="\/scriptures"/);
  assert.match(markup, /href="\/scriptures\/topics"/);
  assert.match(markup, /href="\/scriptures\/search"/);
  assert.match(markup, /Everything else/);
  assert.doesNotMatch(markup, /Explore the whole site/);
  assert.match(markup, /Work &amp; case studies/);
  assert.match(markup, /aria-current="page" href="\/church"/);
  assert.match(markup, />Find</);
  assert.match(markup, /aria-label="Find"/);
  assert.match(markup, /aria-haspopup="dialog"/);
  assert.doesNotMatch(markup, /Garo Vartabedian/);
});

test("a section's pages open the site menu once, with one current page", () => {
  const menu = sectionMenu("/jesus", "/jesus/history/belief-and-growth");
  assert.ok(menu);
  assert.equal(menu.label, "Jesus Christ");
  const jesusPages = getWorldRoutes("jesus").map((route) => route.href).filter((href) => href !== "/jesus");
  assert.deepEqual(menu.all.map((link) => link.href), [...jesusPages, "/sources#jesus-history"]);
  // The menu opens on six main pages, the page you are on, and the sources link.
  assert.deepEqual(
    menu.links.map((link) => link.href),
    [
      "/jesus/words",
      "/jesus/parables",
      "/jesus/harmony",
      "/jesus/life",
      "/jesus/risen",
      "/jesus/prophecy",
      "/jesus/history/belief-and-growth",
      "/sources#jesus-history",
    ].sort((x, y) => [...jesusPages, "/sources#jesus-history"].indexOf(x) - [...jesusPages, "/sources#jesus-history"].indexOf(y)),
  );
  assert.deepEqual(
    [...menu.links.slice(0, -1), ...menu.more].map((link) => link.href).sort(),
    [...jesusPages].sort(),
    "lead plus folded is every page, once",
  );
  assert.equal(menu.links.at(-1)?.label, "Sources for Jesus Christ");
  assert.equal(menu.current, "/jesus/history/belief-and-growth");
  assert.equal(sectionMenu("/about", "/about"), null);

  const doc = new JSDOM(renderToStaticMarkup(<SiteNavigation activeHref="/scriptures" />)).window.document;
  const panel = doc.querySelector(".site-nav-panel")!;
  const group = panel.firstElementChild!;
  assert.ok(group.classList.contains("site-nav-group--section"), "the section's pages lead the menu");
  assert.equal(group.querySelector("h2")?.textContent, "Scriptures");
  assert.ok(group.querySelector('a[href="/scriptures/search"]'));
  assert.equal(group.querySelector('a[href="/scriptures"]'), null, "the brand link already goes home");
  assert.equal(panel.querySelectorAll('a[href="/scriptures/search"]').length, 1, "Search Scripture is listed once");
  assert.ok(panel.querySelector(".site-nav-everything .site-nav-group--worlds h3")?.textContent?.includes("Explore the record"));
  assert.equal(new JSDOM(renderToStaticMarkup(<SiteNavigation activeHref="/" />)).window.document.querySelector(".site-nav-group--section"), null);
});

test("the menu opens on the page's own links and folds the rest", () => {
  const menuOf = (activeHref: string) =>
    new JSDOM(renderToStaticMarkup(<SiteNavigation activeHref={activeHref} />)).window.document.querySelector(".site-nav-panel")!;
  const lead = (panel: Element) =>
    Array.from(panel.children).filter((el) => !el.classList.contains("site-nav-everything"));
  const leadHeadings = (panel: Element) => lead(panel).map((el) => el.querySelector("h2")?.textContent);
  const folded = (panel: Element) =>
    Array.from(panel.querySelectorAll(".site-nav-everything .site-nav-group h3")).map((heading) => heading.textContent);

  // The front door opens on the eight sections.
  const home = menuOf("/");
  assert.deepEqual(leadHeadings(home), ["Explore the record"]);
  assert.equal(lead(home)[0].querySelectorAll("a").length, 8);
  assert.deepEqual(folded(home), ["Use Scripture", "Understand the work", "Work with Garo"]);
  assert.equal(home.querySelector(".site-nav-everything > summary")?.textContent, "Everything else");
  assert.equal(home.querySelector(".site-nav-everything")?.hasAttribute("open"), false);

  // A section page opens on that section's pages.
  const jesus = menuOf("/jesus");
  assert.deepEqual(leadHeadings(jesus), ["Jesus Christ"]);
  assert.ok(folded(jesus).includes("Explore the record"));

  // An about or work page opens on the about and work links.
  for (const href of ["/about", "/hire"]) {
    const about = menuOf(href);
    assert.deepEqual(leadHeadings(about), ["Understand the work", "Work with Garo"], href);
    assert.deepEqual(folded(about), ["Explore the record", "Use Scripture"], href);
  }

  // Nothing is listed twice, nothing is lost, and the intro block is gone.
  for (const href of ["/", "/jesus", "/about"]) {
    const panel = menuOf(href);
    const hrefs = Array.from(panel.querySelectorAll("a")).map((a) => a.getAttribute("href"));
    assert.equal(new Set(hrefs).size, hrefs.length, href);
    for (const required of ["/scriptures", "/scriptures/search", "/about", "/work", "/contact"]) {
      assert.ok(hrefs.includes(required), `${href} menu lists ${required}`);
    }
    assert.equal(panel.querySelector(".site-nav-panel-head"), null);
  }
});

test("a long section opens the menu on its main pages and folds its other pages", () => {
  const all = getWorldRoutes("scriptures").map((route) => route.href).filter((href) => href !== "/scriptures");

  const home = sectionMenu("/scriptures", "/scriptures")!;
  assert.deepEqual(
    home.links.map((link) => link.href),
    [
      "/scriptures/stories",
      "/scriptures/search",
      "/scriptures/word-bridge",
      "/scriptures/topics",
      "/scriptures/polyglot",
      "/scriptures/catena",
      "/scriptures/graph",
      "/sources#scripture-texts",
    ],
  );
  // Nothing is lost or repeated: lead + folded = every page, once.
  assert.deepEqual(
    [...home.links.slice(0, -1), ...home.more].map((link) => link.href).sort(),
    [...all].sort(),
  );
  assert.deepEqual(home.all.map((link) => link.href), [...all, "/sources#scripture-texts"]);

  // A page from the folded set leads the menu while you are on it.
  const debates = sectionMenu("/scriptures", "/scriptures/disputation")!;
  assert.ok(debates.links.some((link) => link.href === "/scriptures/disputation"));
  assert.equal(debates.more.some((link) => link.href === "/scriptures/disputation"), false);
  assert.equal(debates.current, "/scriptures/disputation");

  // A section that names no shorter list keeps every page up front.
  const angels = sectionMenu("/angels", "/angels")!;
  assert.deepEqual(angels.more, []);
  assert.deepEqual(angels.links, angels.all);

  const panel = new JSDOM(renderToStaticMarkup(<SiteNavigation activeHref="/scriptures" />)).window.document.querySelector(".site-nav-panel")!;
  const lead = panel.querySelector(":scope > .site-nav-group--section")!;
  assert.equal(lead.querySelectorAll("a").length, 8);
  const more = panel.querySelector(".site-nav-everything .site-nav-group--more")!;
  assert.equal(more.querySelector("h3")?.textContent, "More in Scriptures");
  assert.ok(more.querySelector('a[href="/scriptures/disputation"]'));
  assert.equal(more.previousElementSibling, null, "the section's other pages come first under Everything else");
  const hrefs = Array.from(panel.querySelectorAll("a")).map((a) => a.getAttribute("href"));
  assert.equal(new Set(hrefs).size, hrefs.length);
  for (const href of all) assert.ok(hrefs.includes(href), `Scriptures menu lists ${href}`);
});

test("the homepage leads with Jesus, Scripture, and the shape of the record", () => {
  const markup = renderToStaticMarkup(<StoryHome />);

  // The mark links home and names itself; 4754d98 gave it the fuller
  // "Home — Garo Vartabedian" so the accessible name says whose site this is.
  // What matters is that the link is there and its name starts at Home, not
  // that the label is that one word.
  assert.match(markup, /aria-label="Home(?:[^"]*)?"[^>]*href="\/"/);
  // The front door's title carries a gold versal on its first letter and
  // letters that breathe — real inline text, one source in the DOM, read once
  // by screen readers, crawlers, reading modes, and copy/paste alike — so the
  // h1's plain text is the heading exactly once.
  const frontTitle = markup.match(/<h1[^>]*id="home-purpose"[^>]*>([\s\S]*?)<\/h1>/);
  assert.ok(frontTitle, "the front door has its h1");
  assert.equal(accessibleText(frontTitle[1]), "Jesus Christ.");
  assert.equal(frontTitle[1].replace(/<[^>]+>/g, ""), "Jesus Christ.");
  assert.match(markup, /He is not here, for he has risen, just like he said\./);
  assert.match(markup, /href="\/scriptures\/protestant\/MAT\/28#v6"/);
  assert.match(
    markup,
    /class="[^"]*\bst-intro-primary\b[^"]*"[^>]*href="\/jesus\/words"/,
  );
  // Garo, 2026-10-15: "keep the top screen and one directory." The Scripture
  // links and the reading walks repeated the hero buttons and the doors.
  assert.doesNotMatch(markup, /The text itself\./);
  assert.doesNotMatch(markup, /id="paths"/);
  // Garo's pick, 2026-11-10: the story pictures take the place of the two
  // scroll links ("Try the research tools", "Explore the whole record"). The
  // worlds heading stays; the first screen no longer links down to it.
  assert.match(markup, /<h2[^>]*id="rail-h"[^>]*>The whole record\.<\/h2>/);
  const front = new JSDOM(markup).window.document.querySelector(".st-front");
  assert.ok(front, "the front door has its text column");
  assert.equal(front.querySelectorAll('a[href="#discover"], a[href="#worlds"]').length, 0);
  // Every told story, in shelf order, each opening its own page. The picture
  // is decorative because the title follows in the same link.
  assert.deepEqual(
    [...front.querySelectorAll(".st-stories-strip a")].map((link) => ({
      href: link.getAttribute("href"),
      title: link.querySelector(".st-stories-title")?.textContent,
    })),
    SHELF_STORIES.map((story) => ({ href: story.href, title: story.title })),
  );
  assert.equal(front.querySelectorAll('.st-stories-strip img[alt=""]').length, SHELF_STORIES.length);
  const allStories = front.querySelector("#home-all-stories");
  assert.equal(allStories?.getAttribute("href"), "/scriptures/stories");
  assert.ok(allStories?.textContent?.startsWith(`All ${SHELF_STORIES.length} stories`));
  // A keyboard user can step over the 27 pictures to that link.
  const skip = front.querySelector("a.skip-link");
  assert.equal(skip?.getAttribute("href"), "#home-all-stories");
  assert.equal(skip?.textContent, "Skip the story pictures");
  assert.ok(
    skip && allStories && skip.compareDocumentPosition(allStories) & 4,
    "the skip link comes before the pictures and lands after them",
  );
  // The worlds ride one ordered rail now, not record/investigation card
  // grids: eight titled doors in walk order, Jesus first and How We Know
  // last. (The old "Three records that refuse easy answers." subhead left
  // with the grids.)
  const railHrefs = [...markup.matchAll(/<a[^>]*class="[^"]*\bst-rail-title\b[^"]*"[^>]*href="([^"]*)"/g)].map(
    (m) => m[1],
  );
  assert.deepEqual(railHrefs, [
    "/jesus",
    "/scriptures",
    "/apostles",
    "/early",
    "/church",
    "/word",
    "/angels",
    "/evidence",
  ]);
  // Garo's call, 2026-10-03: the front door says plainly that this is a
  // portfolio project, above the headline, and links to how it was built. His
  // name stays plain text — the link is the case study, not the author.
  const builderLine = markup.match(/<p class="st-builder">([\s\S]*?)<\/p>/);
  assert.ok(builderLine, "the front door has its builder line");
  assert.match(builderLine[1], /A portfolio project by Garo Vartabedian/);
  assert.match(builderLine[1], /<a[^>]*href="\/work\/garovartabedian"/);
  assert.ok(
    (builderLine.index ?? Infinity) < (frontTitle.index ?? -1),
    "the builder line sits above the headline",
  );
  assert.doesNotMatch(markup, /Garo Vartabedian<\/a>/);
});

test("the homepage keeps discovery concise and the eight worlds scannable", () => {
  // The approved discovery release adds four real tool entrances and an
  // engineer lens. Keep a bounded copy budget rather than restoring long walks.
  const markup = renderToStaticMarkup(<StoryHome />);
  const main = markup.match(/<main[\s\S]*<\/main>/);
  assert.ok(main, "the front door has its main landmark");

  for (const heading of ["st-worlds-heading"]) {
    const block = main[0].match(
      new RegExp(`class="${heading}"[^>]*>([\\s\\S]*?)</(?:div|header)>`),
    );
    assert.ok(block, `${heading} is on the page`);
    assert.doesNotMatch(block[1], /<p\b/, `${heading} carries no kicker or intro paragraph`);
  }
  assert.doesNotMatch(main[0], /<small>/, "links carry no blurb beneath them");

  // Includes both lenses in the server markup; only one is visible at a time.
  // The budget is for prose. The story pictures carry the 27 story titles,
  // which are names in a list; they are counted apart and must be exactly the
  // shelf's titles, so nothing else can ride in with them (2026-11-10).
  const countWords = (html: string) => html.replace(/<[^>]+>/g, " ").split(/\s+/).filter(Boolean).length;
  const strip = main[0].match(/<ul class="st-stories-strip"[\s\S]*?<\/ul>/);
  assert.ok(strip, "the front door has its story pictures");
  assert.equal(
    countWords(strip[0]),
    SHELF_STORIES.reduce((sum, story) => sum + story.title.split(/\s+/).length, 0),
    "the story strip holds the story titles and nothing else",
  );
  const words = countWords(main[0].replace(strip[0], ""));
  assert.ok(words <= 520, `the front door grew to ${words} words (budget 520)`);
});

test("centering a world changes only the switcher's horizontal track", () => {
  const track = { clientWidth: 320, scrollLeft: 0 };
  const active = { offsetLeft: 460, offsetWidth: 120 };

  centerWorldInTrack(track, active);

  assert.equal(track.scrollLeft, 360);
});

test("the world switcher coachmark is claimed once per document", () => {
  const firstLoad = new JSDOM().window.document;
  const fullReload = new JSDOM().window.document;

  assert.equal(claimWorldSwitcherCoachmark(firstLoad), true);
  assert.equal(claimWorldSwitcherCoachmark(firstLoad), false);
  assert.equal(claimWorldSwitcherCoachmark(fullReload), true);
});

test("a section home's ways in tell a link down the page from a link to another page", () => {
  const markup = renderToStaticMarkup(
    <WorldHeroActions
      label="Explore early writings"
      links={[
        { href: "#catalog", label: "Browse all 23 writings" },
        { href: "/early/library", label: "Expanded library" },
      ]}
    />,
  );

  assert.match(markup, /<nav class="world-hero-actions" aria-label="Explore early writings">/);
  assert.match(markup, /href="#catalog"[^>]*>Browse all 23 writings <span aria-hidden="true">↓<\/span>/);
  assert.match(markup, /href="\/early\/library"[^>]*>Expanded library <span aria-hidden="true">→<\/span>/);
});

test("secondary and deep-dive content starts collapsed", () => {
  const markup = renderToStaticMarkup(
    <WorldDisclosure
      label="Open the full record"
      note="Read the complete sourced history."
    >
      <a href="/church/tree">The tree</a>
    </WorldDisclosure>,
  );

  assert.match(markup, /<details/);
  assert.match(markup, /Open the full record/);
  assert.doesNotMatch(markup, /<details[^>]*open/);
});

test("accessibility choices are discoverable and invalid storage is normalized", () => {
  const markup = renderToStaticMarkup(<AccessibilityMenu />);
  const normalized = normalizeAccessibilityPreferences({
    font: "comic-sans",
    size: "huge",
    spacious: true,
  });

  assert.match(markup, /Open reading and accessibility settings/);
  assert.match(markup, /These choices stay on this device/);
  assert.doesNotMatch(markup, /Saved in this browser and shared between texts/);
  assert.match(markup, /Device/);
  assert.match(markup, /Night/);
  assert.match(markup, /OpenDyslexic/);
  assert.match(markup, /Higher contrast/);
  assert.match(markup, /Reduce motion/);
  assert.deepEqual(normalized, {
    ...defaultAccessibilityPreferences,
    spacious: true,
    spacing: "spacious",
  });
});

test("deep links open the disclosure that owns their target", () => {
  const dom = new JSDOM(
    '<details id="record"><summary>Open</summary><h2 id="free-way">The free way</h2></details>',
  );
  const details = dom.window.document.querySelector("details");

  assert.equal(details?.open, false);
  const target = openDisclosureForHash("#free-way", dom.window.document);

  assert.equal(details?.open, true);
  assert.equal(target?.id, "free-way");
});
