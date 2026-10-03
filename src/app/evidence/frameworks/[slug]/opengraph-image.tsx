import { renderOgImage, OG_SIZE } from "@/lib/og";
import { WORLD_REGISTRY } from "@/lib/world-registry";
import {
  getAllBeliefSystems,
  getBeliefSystem,
  TRADITION_FAMILY_LABELS,
  formatAntiquityAge,
} from "@/lib/evidence/afterlife";

export const alt = "A comparative afterlife tradition dossier";
export const size = OG_SIZE;
export const contentType = "image/png";

const EVIDENCE = WORLD_REGISTRY.find((w) => w.id === "evidence")!;

export function generateStaticParams() {
  return getAllBeliefSystems().map((belief) => ({ slug: belief.id }));
}

export default async function Image({
  params,
}: {
  params: Promise<{ slug: string }>;
}) {
  const { slug } = await params;
  const belief = getBeliefSystem(slug);

  if (!belief) {
    return renderOgImage({
      kicker: "The Afterlife Atlas",
      title: "Tradition Not Found",
      bg: EVIDENCE.bg,
      ink: EVIDENCE.ink,
      accent: EVIDENCE.accent,
    });
  }

  const family = TRADITION_FAMILY_LABELS[belief.taxonomy.family] || belief.taxonomy.family;
  const age = formatAntiquityAge(belief.tactics.antiquityAge);

  return renderOgImage({
    kicker: `The Afterlife Atlas · ${family} · ${age}`,
    title: belief.name,
    line: belief.primaryDoctrine,
    bg: EVIDENCE.bg,
    ink: EVIDENCE.ink,
    accent: EVIDENCE.accent,
  });
}
