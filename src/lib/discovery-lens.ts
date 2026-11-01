export type DiscoveryLens = "reader" | "engineer";
export const LENS_STORAGE_KEY = "garovartabedian:lens:v1";
const CHANGE_EVENT = "discovery:lens";
let volatileLens: DiscoveryLens | undefined;

export function getLens(): DiscoveryLens {
  if (volatileLens) return volatileLens;
  try { return window.localStorage.getItem(LENS_STORAGE_KEY) === "engineer" ? "engineer" : "reader"; }
  catch { return "reader"; }
}

export function setLens(lens: DiscoveryLens) {
  volatileLens = lens;
  try { window.localStorage.setItem(LENS_STORAGE_KEY, lens); } catch { /* usable without storage */ }
  window.dispatchEvent(new Event(CHANGE_EVENT));
}

export function subscribeLens(callback: () => void) {
  const onStorage = (event: StorageEvent) => {
    if (event.key === LENS_STORAGE_KEY || event.key === null) {
      volatileLens = undefined;
      callback();
    }
  };
  window.addEventListener(CHANGE_EVENT, callback);
  window.addEventListener("storage", onStorage);
  return () => {
    window.removeEventListener(CHANGE_EVENT, callback);
    window.removeEventListener("storage", onStorage);
  };
}

export const serverLens = (): DiscoveryLens => "reader";
