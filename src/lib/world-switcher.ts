const coachmarkSeenForDocument = Symbol.for(
  "garovartabedian.world-switcher.coachmark-seen",
);

export function claimWorldSwitcherCoachmark(page: Document): boolean {
  if (Reflect.get(page, coachmarkSeenForDocument) === true) return false;
  return Reflect.set(page, coachmarkSeenForDocument, true);
}

export function centerWorldInTrack(
  track: Pick<HTMLDivElement, "clientWidth" | "scrollLeft">,
  active: Pick<HTMLAnchorElement, "offsetLeft" | "offsetWidth">,
) {
  track.scrollLeft = Math.max(
    0,
    active.offsetLeft - (track.clientWidth - active.offsetWidth) / 2,
  );
}
