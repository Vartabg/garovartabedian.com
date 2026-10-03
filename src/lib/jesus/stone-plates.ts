/** Lane B reconstruction plates for Jesus History stone/artifact entries. */

export type StonePlateMeta = {
  src: string;
  alt: string;
  caption: string;
  title: string;
};

export function stonePlateSrc(stoneId: string): string {
  return `/jesus/stones/${stoneId}.jpg`;
}
