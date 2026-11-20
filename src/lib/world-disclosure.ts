type DisclosureRoot = Pick<Document, "getElementById">;

export function openDisclosureForHash(
  hash: string,
  root: DisclosureRoot,
): HTMLElement | null {
  if (!hash.startsWith("#") || hash.length < 2) return null;

  let id: string;
  try {
    id = decodeURIComponent(hash.slice(1));
  } catch {
    return null;
  }

  const target = root.getElementById(id);
  if (!target) return null;

  let cur: Element | null =
    target.tagName === "DETAILS" ? target : target.closest("details");
  while (cur) {
    if ("open" in cur) {
      (cur as HTMLDetailsElement).open = true;
    }
    cur = cur.parentElement?.closest("details") ?? null;
  }

  return target;
}
