import assert from "node:assert/strict";
import test from "node:test";
import React from "react";
import { renderToStaticMarkup } from "react-dom/server";
import { JSDOM } from "jsdom";
import StoryHome from "../src/app/_components/StoryHome";
import WorldDisclosure from "../src/app/_components/WorldDisclosure";
import WorldHeader from "../src/app/_components/WorldHeader";
import WorldSourceDisclosure from "../src/app/_components/WorldSourceDisclosure";
import {
  centerWorldInTrack,
  claimWorldSwitcherCoachmark,
} from "../src/lib/world-switcher";
import { openDisclosureForHash } from "../src/lib/world-disclosure";
import WorldEntry from "../src/app/_components/WorldEntry";
import AccessibilityMenu from "../src/app/_components/AccessibilityMenu";
import SiteNavigation from "../src/app/_components/SiteNavigation";
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
    { href: "/scriptures", text: "Scripture" },
    { href: "/jesus", text: "Jesus" },
  ]);

  const panelLinks = Array.from(
    doc.querySelectorAll(".site-nav-panel a"),
  ).map((a) => a.getAttribute("href"));

  assert.ok(panelLinks.includes("/about"), "Explore panel must include /about");
  assert.ok(panelLinks.includes("/services"), "Explore panel must include /services");

  const groupHeadings = Array.from(
    doc.querySelectorAll(".site-nav-group h2"),
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
  assert.match(markup, /Explore the whole site/);
  assert.match(markup, /Work &amp; case studies/);
  assert.match(markup, /aria-current="page" href="\/church"/);
  assert.match(markup, />Find</);
  assert.match(markup, /aria-label="Find"/);
  assert.match(markup, /aria-haspopup="dialog"/);
  assert.doesNotMatch(markup, /Garo Vartabedian/);
});

test("source context stays available without leading the page", () => {
  const markup = renderToStaticMarkup(
    <WorldSourceDisclosure world="scriptures" />,
  );

  assert.match(markup, /<details/);
  assert.match(markup, /Sources &amp; method/);
  assert.doesNotMatch(markup, /<details[^>]*open/);
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
  assert.match(
    markup,
    /class="[^"]*\bst-intro-primary\b[^"]*"[^>]*href="\/jesus\/words"/,
  );
  assert.match(markup, /<h2[^>]*>The text itself\.<\/h2>/);
  // The worlds heading names what the hero's "Explore the whole record" link
  // jumps to, so the link and the place it lands read the same.
  assert.match(markup, /<h2[^>]*id="rail-h"[^>]*>The whole record\.<\/h2>/);
  assert.match(markup, /<a href="#worlds"[^>]*>Explore the whole record/);
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

test("the homepage stays a page of headings and links", () => {
  // Garo, 2026-10-03: "its all the fluff." The front door was 759 words; the
  // walks alone carried 312 in lines and notes nobody had asked for. A section
  // opens on its heading — no kicker above it, no paragraph introducing it —
  // and neither the Scripture links nor the walk steps carry a blurb.
  const markup = renderToStaticMarkup(<StoryHome />);
  const main = markup.match(/<main[\s\S]*<\/main>/);
  assert.ok(main, "the front door has its main landmark");

  for (const heading of ["st-scripture-heading", "st-paths-heading", "st-worlds-heading"]) {
    const block = main[0].match(
      new RegExp(`class="${heading}"[^>]*>([\\s\\S]*?)</(?:div|header)>`),
    );
    assert.ok(block, `${heading} is on the page`);
    assert.doesNotMatch(block[1], /<p\b/, `${heading} carries no kicker or intro paragraph`);
  }
  assert.doesNotMatch(main[0], /st-path-line/, "a walk is its title and its steps");
  assert.doesNotMatch(main[0], /<small>/, "links carry no blurb beneath them");

  // The page is 355 words as rendered. The budget leaves room to say plainly
  // what the site is, and not much else.
  const words = main[0].replace(/<[^>]+>/g, " ").split(/\s+/).filter(Boolean).length;
  assert.ok(words <= 400, `the front door grew to ${words} words (budget 400)`);
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

test("world landing pages name a clear first action and visible alternatives", () => {
  const markup = renderToStaticMarkup(
    <WorldEntry
      eyebrow="Search the record"
      href="/scriptures/search"
      title="Ask the text"
      note="Search every hosted canon at once."
      action="Search Scripture"
      paths={[
        {
          href: "/scriptures/topics",
          label: "Browse by topic",
          note: "Follow linked subjects.",
        },
      ]}
    />,
  );

  assert.doesNotMatch(markup, /Start here/);
  assert.match(markup, /Search the record/);
  assert.match(markup, /href="\/scriptures\/search"/);
  assert.match(markup, /Ask the text/);
  assert.match(markup, /Choose another path/);
  assert.match(markup, /Browse by topic/);
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
