"use client";

import { useEffect } from "react";
import { HAND_OUTLINES, type Hand } from "@/lib/hands";

/**
 * A heading changes hands as it comes into view: the letters it had in the
 * era before melt into the letters of its own era. Every shape is the real
 * outline of the face, blended contour by contour (outlines with outlines,
 * counters with counters), and the ink pools and settles while it moves.
 *
 * Headings opt in with `data-hand` (where they land) and `data-hand-from`
 * (where they start). The heading's own text stays in place the whole time:
 * the drawing sits over it, and is removed when the letters arrive. Nothing
 * loads until a heading is about to change, and nothing runs under reduced
 * motion, a reading-font choice, or forced colors.
 */

type Opentype = typeof import("opentype.js");
type Flubber = {
  interpolate: (from: string | number[][], to: string | number[][], options?: { maxSegmentLength?: number; string?: boolean }) => (t: number) => string;
};
type Ring = { d: string; c: [number, number]; area: number; hole: boolean };

const DURATION = 1100;

function motionReduced() {
  const root = document.documentElement;
  return (
    root.dataset.a11yMotion === "reduce" ||
    root.dataset.a11yFont === "dyslexic" ||
    root.dataset.a11yFont === "system" ||
    window.matchMedia("(prefers-reduced-motion: reduce)").matches ||
    window.matchMedia("(forced-colors: active)").matches
  );
}

let engine: Promise<{ opentype: Opentype; flubber: Flubber }> | null = null;
const faces = new Map<Hand, Promise<import("opentype.js").Font>>();

function loadEngine() {
  engine ??= Promise.all([import("opentype.js"), import("flubber")]).then(([opentype, flubber]) => ({
    opentype: (opentype as unknown as { default?: Opentype }).default ?? opentype,
    flubber: ((flubber as unknown as { default?: Flubber }).default ?? flubber) as Flubber,
  }));
  return engine;
}

function loadFace(opentype: Opentype, hand: Hand) {
  let face = faces.get(hand);
  if (!face) {
    face = fetch(HAND_OUTLINES[hand])
      .then((res) => {
        if (!res.ok) throw new Error(`${hand} outlines`);
        return res.arrayBuffer();
      })
      .then((buffer) => opentype.parse(buffer));
    faces.set(hand, face);
  }
  return face;
}

/** Split one glyph into closed contours, tagged outline or counter. */
function rings(path: import("opentype.js").Path): Ring[] {
  const out: { d: string; pts: [number, number][] }[] = [];
  let current: { d: string; pts: [number, number][] } | null = null;
  for (const c of path.commands) {
    if (c.type === "M") {
      current = { d: `M${c.x} ${c.y}`, pts: [[c.x, c.y]] };
      out.push(current);
    } else if (!current) {
      continue;
    } else if (c.type === "L") {
      current.d += `L${c.x} ${c.y}`;
      current.pts.push([c.x, c.y]);
    } else if (c.type === "Q") {
      current.d += `Q${c.x1} ${c.y1} ${c.x} ${c.y}`;
      current.pts.push([c.x, c.y]);
    } else if (c.type === "C") {
      current.d += `C${c.x1} ${c.y1} ${c.x2} ${c.y2} ${c.x} ${c.y}`;
      current.pts.push([c.x, c.y]);
    } else if (c.type === "Z") {
      current.d += "Z";
    }
  }
  const measured = out
    .filter((r) => r.pts.length > 2)
    .map((r) => {
      let signed = 0;
      r.pts.forEach(([x1, y1], i) => {
        const [x2, y2] = r.pts[(i + 1) % r.pts.length];
        signed += x1 * y2 - x2 * y1;
      });
      const n = r.pts.length;
      const c = r.pts.reduce<[number, number]>((s, [x, y]) => [s[0] + x / n, s[1] + y / n], [0, 0]);
      return { d: r.d, c, signed: signed / 2, area: Math.abs(signed / 2) };
    })
    .sort((a, b) => b.area - a.area);
  const outward = measured.length ? Math.sign(measured[0].signed) : 1;
  return measured.map(({ d, c, signed, area }) => ({ d, c, area, hole: Math.sign(signed) !== outward }));
}

const speck = ([x, y]: [number, number]) => [
  [x, y],
  [x + 0.4, y],
  [x, y + 0.4],
];

/** Pair outlines with outlines and counters with counters, nearest first. */
function bridge(flubber: Flubber, from: Ring[], to: Ring[]) {
  const fns: ((t: number) => string)[] = [];
  for (const hole of [false, true]) {
    const free = to.filter((r) => r.hole === hole);
    for (const a of from.filter((r) => r.hole === hole)) {
      let best = -1;
      let bestDistance = Infinity;
      free.forEach((b, j) => {
        const d = Math.hypot(a.c[0] - b.c[0], a.c[1] - b.c[1]) - Math.sqrt(Math.min(a.area, b.area)) * 0.2;
        if (d < bestDistance) {
          bestDistance = d;
          best = j;
        }
      });
      const b = best >= 0 ? free.splice(best, 1)[0] : null;
      fns.push(flubber.interpolate(a.d, b ? b.d : speck(a.c), { maxSegmentLength: 3, string: true }));
    }
    for (const b of free) fns.push(flubber.interpolate(speck(b.c), b.d, { maxSegmentLength: 3, string: true }));
  }
  return (t: number) => fns.map((fn) => fn(t)).join(" ");
}

async function change(heading: HTMLElement, from: Hand, to: Hand) {
  const { opentype, flubber } = await loadEngine();
  const [fromFace, toFace] = await Promise.all([loadFace(opentype, from), loadFace(opentype, to)]);
  const style = getComputedStyle(heading);
  const size = parseFloat(style.fontSize);
  const box = heading.getBoundingClientRect();
  const ascent = (toFace.ascender / toFace.unitsPerEm) * size;
  const range = document.createRange();
  const walker = document.createTreeWalker(heading, NodeFilter.SHOW_TEXT);
  const glyphs: ((t: number) => string)[] = [];
  for (let node = walker.nextNode() as Text | null; node; node = walker.nextNode() as Text | null) {
    for (let i = 0; i < node.length; i++) {
      const ch = node.data[i];
      if (ch.trim() === "") continue;
      range.setStart(node, i);
      range.setEnd(node, i + 1);
      const r = range.getBoundingClientRect();
      if (!r.width) continue;
      const x = r.left - box.left;
      const y = r.top - box.top + ascent;
      const a = rings(fromFace.charToGlyph(ch).getPath(x, y, size));
      const b = rings(toFace.charToGlyph(ch).getPath(x, y, size));
      if (!a.length || !b.length) continue;
      glyphs.push(bridge(flubber, a, b));
    }
  }
  if (!glyphs.length) return;

  const svgNs = "http://www.w3.org/2000/svg";
  const svg = document.createElementNS(svgNs, "svg");
  svg.setAttribute("class", "hand-change");
  svg.setAttribute("aria-hidden", "true");
  svg.setAttribute("width", String(box.width));
  svg.setAttribute("height", String(box.height));
  svg.setAttribute("viewBox", `0 0 ${box.width} ${box.height}`);
  const filterId = `ink-${Math.random().toString(36).slice(2, 8)}`;
  svg.innerHTML = `<defs><filter id="${filterId}" x="-5%" y="-30%" width="110%" height="160%"><feGaussianBlur stdDeviation="0" result="b"/><feColorMatrix in="b" type="matrix" values="1 0 0 0 0  0 1 0 0 0  0 0 1 0 0  0 0 0 10 -3"/></filter></defs>`;
  const blur = svg.querySelector("feGaussianBlur")!;
  const group = document.createElementNS(svgNs, "g");
  group.setAttribute("filter", `url(#${filterId})`);
  const paths = glyphs.map(() => {
    const p = document.createElementNS(svgNs, "path");
    group.appendChild(p);
    return p;
  });
  svg.appendChild(group);

  // The ink pools in proportion to the letters: a large title can blur
  // further than a small heading before its thin strokes drop out.
  const pool = Math.max(0.35, size * 0.03);
  heading.style.setProperty("--hand-ink", style.color);
  heading.classList.add("is-changing");
  heading.appendChild(svg);

  await new Promise<void>((done) => {
    const start = performance.now();
    const frame = (now: number) => {
      const u = Math.min(1, (now - start) / DURATION);
      const t = u < 0.5 ? 2 * u * u : 1 - Math.pow(-2 * u + 2, 2) / 2;
      blur.setAttribute("stdDeviation", (pool * Math.sin(Math.PI * t)).toFixed(2));
      paths.forEach((p, i) => p.setAttribute("d", glyphs[i](t)));
      if (u < 1) requestAnimationFrame(frame);
      else done();
    };
    requestAnimationFrame(frame);
  });

  svg.remove();
  heading.classList.remove("is-changing");
  heading.style.removeProperty("--hand-ink");
}

export default function HandChange() {
  useEffect(() => {
    if (motionReduced() || !("IntersectionObserver" in window)) return;
    const headings = Array.from(document.querySelectorAll<HTMLElement>("[data-hand][data-hand-from]")).filter(
      (h) => h.dataset.hand !== h.dataset.handFrom,
    );
    if (!headings.length) return;
    const io = new IntersectionObserver(
      (entries) => {
        for (const entry of entries) {
          if (!entry.isIntersecting) continue;
          const heading = entry.target as HTMLElement;
          io.unobserve(heading);
          change(heading, heading.dataset.handFrom as Hand, heading.dataset.hand as Hand).catch(() => {
            heading.classList.remove("is-changing");
            heading.querySelector(".hand-change")?.remove();
          });
        }
      },
      { threshold: 0.9, rootMargin: "0px 0px -15% 0px" },
    );
    headings.forEach((h) => io.observe(h));
    // Warm the engine once the page is idle, so the first change is not late.
    const idle = window.setTimeout(() => void loadEngine().catch(() => undefined), 1500);
    return () => {
      io.disconnect();
      window.clearTimeout(idle);
    };
  }, []);

  return null;
}
