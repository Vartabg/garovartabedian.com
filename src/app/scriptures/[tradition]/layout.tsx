import type { Metadata } from "next";
import canonsData from "../../../../public/scriptures/canons.json";

const canons = canonsData as { traditions: { id: string; name: string }[] };

export async function generateMetadata({
  params,
}: {
  params: Promise<{ tradition: string }>;
}): Promise<Metadata> {
  const { tradition } = await params;
  const t = canons.traditions.find((x) => x.id === tradition);
  return t ? { title: t.name } : {};
}

export default function Layout({ children }: { children: React.ReactNode }) {
  return children;
}
