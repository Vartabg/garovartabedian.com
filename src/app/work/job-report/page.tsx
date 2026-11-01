import type { Metadata } from "next";
import Link from "next/link";
import CleanChrome from "@/app/_components/CleanChrome";
import { JOB_REPORT_OFFER as offer } from "@/lib/portfolio-content";
import JobReportDemo from "./JobReportDemo";
import JobReportOffer from "./JobReportOffer";
import styles from "./page.module.css";

export const metadata: Metadata = {
  title: "Job report — try the mobile demo",
  description: offer.description,
  alternates: { canonical: offer.href },
  openGraph: { title: "A job report, made on your phone", description: offer.description, url: offer.href },
};

export default function JobReportPage() {
  return (
    <CleanChrome activeHref="/work" showWorldSwitcher={false}>
      <header className={styles.intro}>
        <p className="kicker">Work / A tool to try</p>
        <h1>{offer.headline}</h1>
        <p className="lede">Before-and-after photos, a checklist, and your notes — together in a report you can save or share from your phone.</p>
        <p className={styles.privacy}>Free to try. No account. Your report fields and photos stay in this open page. Save your PDF before refreshing or closing it.</p>
      </header>
      <JobReportDemo />
      <JobReportOffer expanded />
      <p className="note"><Link href="/work">Back to the work</Link> · <Link href="/services">Explore larger projects</Link></p>
    </CleanChrome>
  );
}
