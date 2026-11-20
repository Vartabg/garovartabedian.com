"use client";

import { useSyncExternalStore } from "react";

let hydrated = false;
const modListeners = new Set<() => void>();

function subscribeMod(onStoreChange: () => void): () => void {
  modListeners.add(onStoreChange);
  let frame = 0;
  if (!hydrated && typeof window !== "undefined") {
    frame = window.requestAnimationFrame(() => {
      if (!hydrated) {
        hydrated = true;
        for (const cb of modListeners) cb();
      }
    });
  }
  return () => {
    modListeners.delete(onStoreChange);
    if (frame) window.cancelAnimationFrame(frame);
  };
}

function getModSnapshot(): "⌘" | "Ctrl" {
  if (!hydrated || typeof navigator === "undefined") return "⌘";
  return /Mac|iPhone|iPad/.test(navigator.platform) ? "⌘" : "Ctrl";
}

function getModServerSnapshot(): "⌘" {
  return "⌘";
}

export function usePlatformShortcutMod(): "⌘" | "Ctrl" {
  return useSyncExternalStore(
    subscribeMod,
    getModSnapshot,
    getModServerSnapshot,
  );
}
