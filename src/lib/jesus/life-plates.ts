/** Lane B illustration plates for Jesus life events — one image per harmony event. */

export type LifePlateMeta = {
  src: string;
  alt: string;
  caption: string;
  title: string;
  era: string;
};

export function lifeImageSrc(eventId: string): string {
  return `/jesus/life/${eventId}.jpg`;
}