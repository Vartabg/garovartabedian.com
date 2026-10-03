import type { Metadata } from "next";
import canonsData from "../../../../../../public/scriptures/canons.json";

const canons = canonsData as { books: Record<string, { name: string }> };

export async function generateMetadata({
  params,
}: {
  params: Promise<{ book: string; chapter: string }>;
}): Promise<Metadata> {
  const { book, chapter } = await params;
  const meta = canons.books[book.toUpperCase()];
  return meta ? { title: `${meta.name} ${chapter}` } : {};
}

export default function Layout({ children }: { children: React.ReactNode }) {
  return children;
}
