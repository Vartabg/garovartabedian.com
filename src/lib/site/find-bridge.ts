/**
 * Tiny open-state store so the header Find button and the overlay (mounted
 * once in the root layout) stay in sync without prop drilling.
 */

export type FindOpenListener = (open: boolean) => void;

let open = false;
let lastTrigger: HTMLElement | null = null;
const listeners = new Set<FindOpenListener>();
const storeListeners = new Set<() => void>();

function emit() {
  for (const listener of listeners) listener(open);
  for (const listener of storeListeners) listener();
}

export function isFindOpen(): boolean {
  return open;
}

export function setFindOpen(next: boolean, trigger?: HTMLElement | null) {
  if (open === next) return;
  if (next && typeof document !== "undefined") {
    const active =
      document.activeElement instanceof HTMLElement &&
      document.activeElement !== document.body &&
      document.activeElement !== document.documentElement
        ? document.activeElement
        : null;
    lastTrigger =
      trigger ??
      active ??
      document.querySelector<HTMLElement>(".site-nav-find");
  }
  open = next;
  emit();
}

export function toggleFind(trigger?: HTMLElement | null) {
  setFindOpen(!open, trigger);
}

export function restoreFindFocus(options?: FocusOptions) {
  if (typeof document === "undefined") return;
  const target =
    lastTrigger && lastTrigger.isConnected
      ? lastTrigger
      : document.querySelector<HTMLElement>(".site-nav-find");
  target?.focus(options);
}

export function subscribeFind(listener: FindOpenListener): () => void {
  listener(open);
  listeners.add(listener);
  return () => {
    listeners.delete(listener);
  };
}

/** React `useSyncExternalStore`-compatible subscription (no synchronous emit on subscribe). */
export function subscribeFindChange(onStoreChange: () => void): () => void {
  storeListeners.add(onStoreChange);
  return () => {
    storeListeners.delete(onStoreChange);
  };
}
