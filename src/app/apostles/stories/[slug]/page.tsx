import type { Metadata } from "next";
import { notFound } from "next/navigation";
import { APOSTLE_STORIES, getApostleStory } from "@/lib/apostles/stories";
import StoryArticle from "../StoryArticle";

export const dynamicParams = false;
export function generateStaticParams() {
  return APOSTLE_STORIES.map(({ slug }) => ({ slug }));
}

export async function generateMetadata({ params }: { params: Promise<{ slug: string }> }): Promise<Metadata> {
  const story = getApostleStory((await params).slug);
  if (!story) return {};
  return {
    title: story.title,
    description: `${story.description} An illustrated reading of ${story.reference}.`,
    alternates: { canonical: `/apostles/stories/${story.slug}` },
    openGraph: {
      title: `${story.title} — The Apostles`, description: story.description,
      type: "article", url: `/apostles/stories/${story.slug}`,
      images: [{ url: story.encounterImage, width: 1536, height: 1024, alt: story.encounterAlt }],
    },
    twitter: { card: "summary_large_image", title: story.title, description: story.description, images: [story.encounterImage] },
  };
}

export default async function ApostleStoryPage({ params }: { params: Promise<{ slug: string }> }) {
  const story = getApostleStory((await params).slug);
  if (!story) notFound();
  return <StoryArticle story={story} />;
}
