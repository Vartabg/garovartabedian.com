/**
 * The page's own next steps for the site menu. A reading page registers what
 * connects to it (the next chapter, the passage it quotes, the era it belongs
 * to); the menu opens on those before the whole-site list. Same tiny store
 * shape as find-bridge, so the header and the page stay in sync without prop
 * drilling.
 */

export type FromHereLink = {
  href: string;
  label: string;
  /** How it connects: "Next", "Quoted here", "Same wording". */
  kind: string;
};

export type FromHere = {
  /** Where the reader is, e.g. "Leviticus 16". */
  label: string;
  links: FromHereLink[];
};

export type FromHereListener = (value: FromHere | null) => void;

let current: FromHere | null = null;
const listeners = new Set<FromHereListener>();

export function setFromHere(next: FromHere | null) {
  current = next;
  for (const listener of listeners) listener(current);
}

export function subscribeFromHere(listener: FromHereListener): () => void {
  listener(current);
  listeners.add(listener);
  return () => {
    listeners.delete(listener);
  };
}
