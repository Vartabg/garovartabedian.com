import StudyContextBanner from "../_components/StudyContextBanner";
import { resolveStudyContext } from "@/lib/scriptures/server/study-context";
import type { StudySearchParams } from "@/lib/scriptures/study-context";
import type { Metadata } from "next";
import Link from "next/link";
import StudyPageHeader from "@/app/_components/StudyPageHeader";
import { listParallelMatrices } from "@/lib/parallels/server";
import ParallelsShelf from "./ParallelsShelf";

export const metadata: Metadata = {
  title: "Parallel claims",
  description: "Compare cited passages across Jewish, Christian, and Islamic sources, with differences, source editions, and later interpretations kept in view.",
  alternates: { canonical: "/scriptures/parallels" },
  openGraph: { title: "Parallel claims", url: "/scriptures/parallels", images: ["/worlds/scriptures.jpg"] },
};

export default async function ParallelsIndexPage({ searchParams }: { searchParams: Promise<StudySearchParams> }) {
  const [matrices, params] = await Promise.all([listParallelMatrices(), searchParams ?? {}]);
  const study = await resolveStudyContext(params);
  return (
    <div className="scr-parallels">
      <StudyPageHeader path="/scriptures/parallels" action="Choose a comparison below. Read the passages side by side, then inspect the sources and interpretations behind each claim." />
      <p className="scr-parallels-related">Looking for the four Gospels? <Link href="/jesus/harmony">Compare Gospel accounts<span aria-hidden="true"> →</span></Link></p>
      <StudyContextBanner {...study} note="These comparisons use selected passages and themes. Your starting verse is kept above; choose a comparison below or return to reading." />

      <ParallelsShelf matrices={matrices} context={study.context} />
      <details className="scr-parallels-method">
        <summary>How these comparisons work</summary>
        <p>Each comparison groups cited excerpts by a shared theme. Similar language does not by itself establish literary dependence or agreement in belief. Read each relationship claim alongside its citations, evidence label, and stated limits.</p>
        <p>Source editions, rights notices, review history, and downloadable records are available inside each comparison. The recorded content digest checks file integrity; it does not establish scholarly agreement.</p>
      </details>
    </div>
  );
}
