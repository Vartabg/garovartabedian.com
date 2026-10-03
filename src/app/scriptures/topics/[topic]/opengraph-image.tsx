import { renderOgImage, OG_SIZE } from "@/lib/og";
import { WORLD_REGISTRY } from "@/lib/world-registry";
import { ssgTopicIds } from "@/lib/scriptures/canonical";
import { getNaveTopic, topicTitle } from "@/lib/scriptures/server";

export const alt = "A topic in the Bible";
export const size = OG_SIZE;
export const contentType = "image/png";

const SCRIPTURES = WORLD_REGISTRY.find((world) => world.id === "scriptures")!;

/**
 * The same 300 topics the pages themselves prerender, so a shared topic link
 * unfurls as that topic instead of the generic card. The line counts the
 * topic's own references rather than describing it, since counting is
 * something the data can be held to and description is not.
 */
export function generateStaticParams() {
  return ssgTopicIds().map((topic) => ({ topic }));
}

export default async function Image({ params }: { params: Promise<{ topic: string }> }) {
  const { topic } = await params;
  const id = decodeURIComponent(topic);
  const data = await getNaveTopic(id);
  const title = topicTitle(id);

  const references = data
    ? data.items.reduce((sum, item) => sum + item.refs.length, 0)
    : 0;

  return renderOgImage({
    kicker: "Bible topics",
    title,
    line: references
      ? `${references} scripture references, from Nave's Topical Bible.`
      : "Nave's Topical Bible — every scripture reference on this subject.",
    bg: SCRIPTURES.bg,
    ink: SCRIPTURES.ink,
    accent: SCRIPTURES.accent,
  });
}
