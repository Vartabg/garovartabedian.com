import type { Metadata } from "next";
import { notFound } from "next/navigation";
import { headers } from "next/headers";
import Link from "next/link";
import ResearchWorkspace from "./ResearchWorkspace";
import styles from "./research.module.css";

export const metadata: Metadata = { title: "Jev research workspace", robots: { index: false, follow: false } };

export default async function ResearchPage() {
  if (process.env.NODE_ENV !== "development" || !process.env.JEV_RESEARCH_BRIDGE_PORT) notFound();
  const requestHeaders = await headers(), port = process.env.JEV_RESEARCH_SITE_PORT;
  if (![`127.0.0.1:${port}`, `localhost:${port}`].includes(requestHeaders.get("host") ?? "")) notFound();
  return (
    <article className={styles.workspace}>
      <p className="kicker"><Link href="/scriptures">Scriptures</Link> / Local research · Experimental</p>
      <h1>Read the evidence together.</h1>
      <p className={styles.lede}>Compare passages, explore possible connections, or check a supplied claim. Keep the source text beside every judgment.</p>
      <p><Link className="textlink" href="/scriptures/find">Find: Evidence Explorer →</Link></p>
      <ResearchWorkspace />
    </article>
  );
}
