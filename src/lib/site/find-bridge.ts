/**
 * Tiny open-state store so the header Find button and the overlay (mounted
 * once in the root layout) stay in sync without prop drilling.
 */

export type FindOpenListener = (open: boolean) => void;

let open = false;
const listeners = new Set<FindOpenListener>();

function emit() {
  for (const listener of listeners) listener(open);
}

export function isFindOpen(): boolean {
  return open;
}

export function setFindOpen(next: boolean) {
  if (open === next) return;
  open = next;
  emit();
}

export function toggleFind() {
  setFindOpen(!open);
}

export function subscribeFind(listener: FindOpenListener): () => void {
  listener(open);
  listeners.add(listener);
  return () => {
    listeners.delete(listener);
  };
}
