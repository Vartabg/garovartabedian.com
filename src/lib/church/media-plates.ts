/** Lane B illustration plates for Church council entries. */

export type CouncilPlateMeta = {
  src: string;
  alt: string;
  caption: string;
  title: string;
  kind: "council";
};

export function councilPlateSrc(councilId: string): string {
  return `/church/councils/${councilId}.jpg`;
}
