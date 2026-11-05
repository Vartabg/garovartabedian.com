import type { Metadata } from "next";
import { notFound } from "next/navigation";
import { SCRIPTURE_STORIES, getScriptureStory, scriptureStoryPath } from "@/lib/scriptures/stories";
import StoryReading from "../StoryReading";

export const dynamicParams = false;

export function generateStaticParams() {
  return SCRIPTURE_STORIES.map(({ slug }) => ({ slug }));
}

export async function generateMetadata({
  params,
}: {
  params: Promise<{ slug: string }>;
}): Promise<Metadata> {
  const story = getScriptureStory((await params).slug);
  if (!story) return {};
  const description = `${story.summary} ${story.reference}, World English Bible.`;
  return {
    title: story.title,
    description,
    alternates: { canonical: scriptureStoryPath(story.slug) },
    openGraph: {
      title: `${story.title} — Scriptures`,
      description,
      type: "article",
      url: scriptureStoryPath(story.slug),
    },
  };
}

export default async function ScriptureStoryPage({
  params,
}: {
  params: Promise<{ slug: string }>;
}) {
  const story = getScriptureStory((await params).slug);
  if (!story) notFound();
  return <StoryReading story={story} />;
}
