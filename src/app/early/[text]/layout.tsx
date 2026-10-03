import type { Metadata } from "next";
import { EARLY_TEXTS } from "@/lib/early/client";

export async function generateMetadata({
  params,
}: {
  params: Promise<{ text: string }>;
}): Promise<Metadata> {
  const { text } = await params;
  const t = EARLY_TEXTS.find((x) => x.id === text);
  if (!t) return {};
  const description = t.blurb || undefined;
  const url = `/early/${t.id}`;
  return {
    title: t.title,
    description,
    alternates: { canonical: url },
    openGraph: {
      title: `${t.title} — The Writings`,
      description,
      type: "article",
      url,
    },
  };
}

export default function Layout({ children }: { children: React.ReactNode }) {
  return children;
}
