/** Lane B illustration plates for Angels & Demons fall fragments, encounters, and named demons. */

export type AngelsPlateMeta = {
  src: string;
  alt: string;
  caption: string;
  title: string;
  kind: "fall" | "appearance" | "exorcism" | "demon";
};

export const angelPlateSlug = (s: string) =>
  s
    .toLowerCase()
    .replace(/[^a-z0-9]+/g, "-")
    .replace(/(^-|-$)/g, "");

export const angelFallPlateId = (stepId: string) => `fall-${angelPlateSlug(stepId)}`;
export const angelAppearancePlateId = (ref: string) => `appearance-${angelPlateSlug(ref)}`;
export const angelExorcismPlateId = (ref: string) => `exorcism-${angelPlateSlug(ref)}`;
export const angelDemonPlateId = (id: string) => `demon-${angelPlateSlug(id)}`;

export function angelPlateSrc(plateId: string): string {
  return `/angels/plates/${plateId}.jpg`;
}
