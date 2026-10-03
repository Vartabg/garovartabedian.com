import type { Metadata } from "next";
import { topicCanonicalPath } from "@/lib/scriptures/canonical";

export async function generateMetadata({
  params,
}: {
  params: Promise<{ topic: string }>;
}): Promise<Metadata> {
  const { topic } = await params;
  const id = decodeURIComponent(topic);
  const title = id.charAt(0) + id.slice(1).toLowerCase();
  const description = `Nave's Topical Bible: every scripture reference on "${title}."`;
  const url = topicCanonicalPath(id);
  return {
    title,
    description,
    alternates: { canonical: url },
    openGraph: {
      title: `${title} — Bible Topics`,
      description,
      type: "article",
      url,
    },
  };
}

export default function Layout({ children }: { children: React.ReactNode }) {
  return children;
}
