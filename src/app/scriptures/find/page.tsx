import type { Metadata } from "next";
import { notFound } from "next/navigation";
import { headers } from "next/headers";
import Explorer from "./Explorer";
export const metadata: Metadata = {
  title: "Find · Evidence Explorer",
  robots: { index: false, follow: false },
};
export default async function FindPage({
  searchParams,
}: {
  searchParams: Promise<{ q?: string; trans?: string; run?: string }>;
}) {
  if (
    process.env.NODE_ENV !== "development" ||
    !process.env.JEV_RESEARCH_BRIDGE_PORT
  )
    notFound();
  const host = (await headers()).get("host"),
    port = process.env.JEV_RESEARCH_SITE_PORT;
  if (![`127.0.0.1:${port}`, `localhost:${port}`].includes(host ?? ""))
    notFound();
  const params = await searchParams;
  return (
    <Explorer
      key={
        (params.q ?? "") +
        ":" +
        (params.run ?? "") +
        ":" +
        (params.trans ?? "web")
      }
      initialQuery={params.q ?? ""}
      initialTranslation={params.trans ?? "web"}
      initialRun={params.run ?? ""}
    />
  );
}
