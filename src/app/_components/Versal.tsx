"use client";

import { useEffect, useRef, useState } from "react";

const NS = "http://www.w3.org/2000/svg";

function motionReduced() {
  return (
    document.documentElement.dataset.a11yMotion === "reduce" ||
    window.matchMedia("(prefers-reduced-motion: reduce)").matches
  );
}

/**
 * An illuminated initial. The letter is gold leaf bounded by an ink line
 * (core.css `.versal-inline`); resting the pointer on it, or tapping it, grows
 * gold vines from it — leaf and berry, generated fresh as vector paths and
 * drawn stroke by stroke — which withdraw when the hand leaves. The letter is
 * real text, read with the word it begins, unless `decorative` says the text
 * beside it already carries the whole word; the vines are always hidden from
 * assistive technology, so nothing depends on the flourish.
 */
export default function Versal({
  letter,
  className = "",
  decorative = false,
}: {
  letter: string;
  className?: string;
  /** The text beside the initial already carries the whole word. */
  decorative?: boolean;
}) {
  const rootRef = useRef<HTMLSpanElement>(null);
  const svgRef = useRef<SVGSVGElement>(null);
  const [lit, setLit] = useState(false);

  useEffect(() => {
    const root = rootRef.current;
    const svg = svgRef.current;
    if (!root || !svg) return;
    if (!lit) {
      svg.style.opacity = "0";
      const timer = window.setTimeout(() => {
        svg.replaceChildren();
        // At rest the svg has no box of its own (core.css sizes it 0 by 0), so
        // it can never widen the page; the lit branch sizes it explicitly.
        for (const property of ["width", "height", "left", "top"]) svg.style.removeProperty(property);
      }, 500);
      return () => window.clearTimeout(timer);
    }
    const reduced = motionReduced();
    const box = root.getBoundingClientRect();
    const w = box.width * 3.2;
    const h = box.height * 2.6;
    svg.setAttribute("viewBox", `${-w / 2} ${-h / 2} ${w} ${h}`);
    svg.style.width = `${w}px`;
    svg.style.height = `${h}px`;
    svg.style.left = `${box.width / 2 - w / 2}px`;
    svg.style.top = `${box.height / 2 - h / 2}px`;
    svg.replaceChildren();
    svg.style.opacity = "1";

    const rnd = (a: number, b: number) => a + Math.random() * (b - a);
    const gradient = document.createElementNS(NS, "linearGradient");
    gradient.setAttribute("id", "versal-gold");
    gradient.setAttribute("gradientUnits", "userSpaceOnUse");
    gradient.setAttribute("x1", `${-w / 2}`);
    gradient.setAttribute("y1", `${-h / 2}`);
    gradient.setAttribute("x2", `${w / 2}`);
    gradient.setAttribute("y2", `${h / 2}`);
    for (const [offset, color] of [["0", "#f2dc8e"], ["0.5", "#c9a24a"], ["1", "#8f6d22"]]) {
      const stop = document.createElementNS(NS, "stop");
      stop.setAttribute("offset", offset);
      stop.setAttribute("stop-color", color);
      gradient.append(stop);
    }
    const defs = document.createElementNS(NS, "defs");
    defs.append(gradient);
    svg.append(defs);

    const berryColor = getComputedStyle(document.documentElement).getPropertyValue("--rubric").trim() || "#a6301c";
    const rx = box.width * 0.5;
    const ry = box.height * 0.42;
    const count = 8;
    const drawn: SVGPathElement[] = [];
    const fades: SVGElement[] = [];
    for (let i = 0; i < count; i++) {
      const a = (i / count) * Math.PI * 2 + rnd(-0.25, 0.25);
      const sx = Math.cos(a) * rx;
      const sy = Math.sin(a) * ry;
      const length = rnd(box.height * 0.45, box.height * 0.9);
      const curl = rnd(0.5, 1.1) * (Math.random() < 0.5 ? -1 : 1);
      const mid = { x: sx + Math.cos(a) * length * 0.5, y: sy + Math.sin(a) * length * 0.5 };
      const a2 = a + curl;
      const end = { x: mid.x + Math.cos(a2) * length * 0.5, y: mid.y + Math.sin(a2) * length * 0.5 };
      const c1 = { x: sx + Math.cos(a - curl * 0.4) * length * 0.3, y: sy + Math.sin(a - curl * 0.4) * length * 0.3 };
      const c2 = { x: mid.x - Math.cos(a + curl * 0.3) * length * 0.2, y: mid.y - Math.sin(a + curl * 0.3) * length * 0.2 };
      const c3 = { x: mid.x + Math.cos(a + curl * 0.3) * length * 0.25, y: mid.y + Math.sin(a + curl * 0.3) * length * 0.25 };
      const c4 = { x: end.x - Math.cos(a2 + curl * 0.9) * length * 0.22, y: end.y - Math.sin(a2 + curl * 0.9) * length * 0.22 };
      const path = document.createElementNS(NS, "path");
      path.setAttribute("class", "versal-tendril");
      path.setAttribute("d", `M${sx},${sy} C${c1.x},${c1.y} ${c2.x},${c2.y} ${mid.x},${mid.y} C${c3.x},${c3.y} ${c4.x},${c4.y} ${end.x},${end.y}`);
      path.setAttribute("stroke", "url(#versal-gold)");
      svg.append(path);
      const total = path.getTotalLength();
      if (!reduced) {
        path.style.strokeDasharray = `${total}`;
        path.style.strokeDashoffset = `${total}`;
        path.style.transitionDelay = `${i * 70}ms`;
      }
      drawn.push(path);
      [0.5, 0.82].forEach((fraction, j) => {
        const point = path.getPointAtLength(total * fraction);
        const ahead = path.getPointAtLength(Math.min(total, total * fraction + 3));
        const angle = (Math.atan2(ahead.y - point.y, ahead.x - point.x) * 180) / Math.PI + (j ? -50 : 50);
        const leaf = document.createElementNS(NS, "path");
        leaf.setAttribute("class", "versal-leaf");
        leaf.setAttribute("d", "M0,0 q7,-9 17,0 q-10,9 -17,0 z");
        leaf.setAttribute("transform", `translate(${point.x.toFixed(1)},${point.y.toFixed(1)}) rotate(${angle.toFixed(1)}) scale(${rnd(0.6, 0.95).toFixed(2)})`);
        leaf.setAttribute("fill", "url(#versal-gold)");
        if (!reduced) {
          leaf.style.opacity = "0";
          leaf.style.transitionDelay = `${i * 70 + 450 + j * 200}ms`;
        }
        svg.append(leaf);
        fades.push(leaf);
      });
      const berry = document.createElementNS(NS, "circle");
      berry.setAttribute("cx", `${end.x}`);
      berry.setAttribute("cy", `${end.y}`);
      berry.setAttribute("r", "2.6");
      berry.setAttribute("fill", berryColor);
      berry.setAttribute("class", "versal-berry");
      if (!reduced) {
        berry.style.opacity = "0";
        berry.style.transitionDelay = `${i * 70 + 800}ms`;
      }
      svg.append(berry);
      fades.push(berry);
    }
    if (!reduced) {
      const raf = requestAnimationFrame(() =>
        requestAnimationFrame(() => {
          drawn.forEach((path) => (path.style.strokeDashoffset = "0"));
          fades.forEach((element) => (element.style.opacity = "1"));
        }),
      );
      return () => cancelAnimationFrame(raf);
    }
  }, [lit]);

  return (
    <span
      ref={rootRef}
      className={`versal-inline versal-live ${className}`.trim()}
      aria-hidden={decorative || undefined}
      onPointerEnter={(event) => {
        if (event.pointerType === "mouse") setLit(true);
      }}
      onPointerLeave={(event) => {
        if (event.pointerType === "mouse") setLit(false);
      }}
      onClick={() => setLit((value) => !value)}
    >
      {/* The vines render before the letter: an out-of-flow box between two
          text runs makes the accessible name read "J esus Christ." — before
          the letter, the boundary lands in trimmed leading whitespace. */}
      <svg ref={svgRef} className="versal-vines" aria-hidden="true" focusable="false" />
      {letter}
    </span>
  );
}
