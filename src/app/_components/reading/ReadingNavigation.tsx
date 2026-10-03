"use client";
import { ACCESSIBILITY_CHANGE, refreshAccessibilityPreferences } from "@/lib/accessibility-preferences";
import { useEffect, useRef } from "react";
import { usePathname } from "next/navigation";
import { captureReadingPosition, restoreReadingPosition, type ReadingPosition } from "@/lib/reading-position";

const KEY = "readingEntry";
const PREFIX = "reading:position:v1:";
/** Keep Next's history state intact. Each entry owns its position, even for repeated URLs. */
export default function ReadingNavigation() {
  const pathname = usePathname();
  const traversalRef = useRef(false);
  useEffect(() => {
    document.documentElement.dataset.readingReady = "true";
    const memory = new Map<string, ReadingPosition>();
    let entry = history.state?.[KEY] as string | undefined;
    let pending: ReadingPosition | null = null, appearance: ReadingPosition | null = null;
    let timer: ReturnType<typeof setTimeout> | undefined;
    const push = history.pushState, replace = history.replaceState;
    const unique = () => crypto.randomUUID();
    if (!entry) { entry = unique(); replace.call(history, { ...history.state, [KEY]: entry }, ""); }
    let routeState = history.state, routeUrl = location.pathname + location.search;
    const read = (id: string): ReadingPosition | null => {
      try { const p = memory.get(id) ?? JSON.parse(sessionStorage.getItem(PREFIX + id) ?? "null"); return p && typeof p.url === "string" && typeof p.anchor === "string" && Number.isFinite(p.y) && Number.isFinite(p.offset) ? p : null; } catch { return memory.get(id) ?? null; }
    };
    const save = () => {
      if (pending) return;
      const place = captureReadingPosition();
      if (!place || !entry) return;
      memory.set(entry, place);
      try { sessionStorage.setItem(PREFIX + entry, JSON.stringify(place)); } catch { /* Ordinary links and Back still work. */ }
    };
    const tagPassages = () => {
      document.querySelectorAll<HTMLElement>("[data-reading-surface] p").forEach((p, i) => {
        if (p.closest("dialog, .reading-tools, nav")) return;
        if (!p.id) p.id = `reading-passage-${i}`;
        p.dataset.readingAnchor = "";
      });
    };
    let deadline = 0;
    const attempt = () => {
      tagPassages();
      if (!pending) return;
      const current = location.pathname + location.search + location.hash;
      if (pending.url !== current) return;
      // Router rendering and font loading can complete after popstate.
      if (document.fonts.status === "loading" && Date.now() < deadline) return;
      if (restoreReadingPosition(pending) || Date.now() > deadline) pending = null;
    };
    const queueRestore = (place: ReadingPosition | null) => {
      pending = place; deadline = Date.now() + 4000;
      if (timer) clearTimeout(timer);
      const tick = () => { attempt(); if (pending && Date.now() <= deadline) timer = setTimeout(tick, 80); else pending = null; };
      timer = setTimeout(tick, 100);
    };
    history.pushState = function (data, unused, url) {
      save(); pending = null; traversalRef.current = false; entry = unique();
      push.call(this, { ...data, [KEY]: entry }, unused, url);
      routeState = history.state; routeUrl = location.pathname + location.search;
    };
    history.replaceState = function (data, unused, url) {
      replace.call(this, { ...data, [KEY]: entry }, unused, url);
      routeState = history.state; routeUrl = location.pathname + location.search;
    };
    const onPop = (event: PopStateEvent) => {
      // Native same-document fragment navigation creates a null history state.
      // Keep the router's opaque state for this same document, with a new reading
      // entry. Otherwise Next reloads that entry on Back and loses its restoration.
      const nativeFragment = !event.state && routeUrl === location.pathname + location.search;
      const state = nativeFragment ? routeState : event.state;
      traversalRef.current = !nativeFragment;
      entry = nativeFragment ? unique() : state?.[KEY] ?? unique();
      if (nativeFragment || !state?.[KEY]) replace.call(history, { ...state, [KEY]: entry }, "");
      routeState = history.state; routeUrl = location.pathname + location.search;
      if (!nativeFragment) queueRestore(read(entry!));
    };
    const onHash = () => {
      if (history.state?.[KEY] === entry) return;
      entry = history.state?.[KEY] ?? unique();
      replace.call(history, { ...history.state, [KEY]: entry }, "");
    };
    const scroll = () => { if (!pending) { if (timer) clearTimeout(timer); timer = setTimeout(save, 120); } };
    const cancelRestoration = () => { pending = null; if (timer) clearTimeout(timer); };
    const beforeAppearance = () => { appearance = captureReadingPosition(); };
    const afterAppearance = () => { const place = appearance; appearance = null; if (place) requestAnimationFrame(() => restoreReadingPosition(place, true)); };
    const onShow = (event: PageTransitionEvent) => { if (event.persisted && entry) { refreshAccessibilityPreferences(); window.dispatchEvent(new Event(ACCESSIBILITY_CHANGE)); queueRestore(read(entry)); } };
    const observer = new MutationObserver(tagPassages);
    tagPassages(); observer.observe(document.body, { childList: true, subtree: true });
    window.addEventListener("popstate", onPop);
    window.addEventListener("hashchange", onHash);
    window.addEventListener("scroll", scroll, { passive: true });
    for (const event of ["wheel", "touchstart", "pointerdown", "keydown"]) window.addEventListener(event, cancelRestoration, { passive: true });
    document.addEventListener("click", save, true);
    window.addEventListener("pagehide", save);
    window.addEventListener("pageshow", onShow);
    window.addEventListener("reading:before-appearance", beforeAppearance);
    window.addEventListener("reading:preferences", afterAppearance);
    // An explicit incoming citation wins on reload, while Back/Forward restores its own entry.
    const traversal = (performance.getEntriesByType("navigation")[0] as PerformanceNavigationTiming | undefined)?.type === "back_forward";
    traversalRef.current = traversal;
    if ((!location.hash || traversal) && entry) queueRestore(read(entry));
    return () => {
      save(); observer.disconnect(); if (timer) clearTimeout(timer);
      history.pushState = push; history.replaceState = replace;
      window.removeEventListener("hashchange", onHash); window.removeEventListener("popstate", onPop); window.removeEventListener("scroll", scroll);
      for (const event of ["wheel", "touchstart", "pointerdown", "keydown"]) window.removeEventListener(event, cancelRestoration);
      document.removeEventListener("click", save, true); window.removeEventListener("pagehide", save); window.removeEventListener("pageshow", onShow);
      window.removeEventListener("reading:before-appearance", beforeAppearance); window.removeEventListener("reading:preferences", afterAppearance);
    };
  }, []);
  useEffect(() => {
    if (traversalRef.current || !location.hash) return;
    let cancelled = false, frame = 0;
    const cancel = () => { cancelled = true; };
    window.addEventListener("wheel", cancel, { once: true, passive: true });
    window.addEventListener("pointerdown", cancel, { once: true });
    void document.fonts.ready.then(() => {
      frame = requestAnimationFrame(() => {
        if (cancelled) return;
        let id: string;
        try { id = decodeURIComponent(location.hash.slice(1)); } catch { return; }
        const target = document.getElementById(id);
        if (target?.closest("[data-reading-surface]")) target.scrollIntoView({ block: "start", behavior: "instant" });
      });
    });
    return () => { cancelled = true; cancelAnimationFrame(frame); window.removeEventListener("wheel", cancel); window.removeEventListener("pointerdown", cancel); };
  }, [pathname]);
  return null;
}
