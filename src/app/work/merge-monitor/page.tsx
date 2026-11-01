import type { Metadata } from "next";
import Link from "next/link";
import CleanChrome from "@/app/_components/CleanChrome";
import { ButtonAnchor, ButtonLink } from "@/app/_components/Button";
import { MERGE_MONITOR_CASE_STUDY as study } from "@/lib/portfolio-content";
import HandoffDemo from "./HandoffDemo";
import styles from "./page.module.css";

export const metadata: Metadata = {
  title: study.title,
  description: study.description,
  alternates: { canonical: "/work/merge-monitor" },
  openGraph: { title: study.title, description: study.description, url: "/work/merge-monitor", type: "article" },
};

export default function MergeMonitorCaseStudy() {
  return (
    <CleanChrome activeHref="/work" showWorldSwitcher={false}>
      <p className="kicker">Work / Agent coordination</p>
      <h1>{study.title}</h1>
      <p className="lede">{study.lede}</p>
      <p className="cta-row">
        <ButtonAnchor variant="primary" href="#handoff-demo">Try the handoff</ButtonAnchor>
        <ButtonAnchor variant="ghost" href={study.walkthrough}>Watch the original walkthrough</ButtonAnchor>
        <ButtonAnchor variant="ghost" href={study.source}>View the MIT source</ButtonAnchor>
      </p>
      <p className="note">{study.availability}</p>
      <h2>A question worth building around</h2>
      <p>{study.question}</p>
      <p><Link href="/work/telemetry">Read the Agent Telemetry case study</Link></p>
      <HandoffDemo />
      <section aria-labelledby="handoff-fields">
        <h2 id="handoff-fields">Five things the next agent needs</h2>
        <dl className={styles.fields}>
          {study.fields.map((field, index) => <div key={field.name}>
            <dt><span aria-hidden="true">0{index + 1} / </span>{field.name}</dt>
            <dd>{field.detail}</dd>
          </div>)}
        </dl>
        <p><a href="/merge-monitor/handoff-template.txt" download>Download the handoff template</a></p>
      </section>
      <section aria-labelledby="pilot-evidence">
        <h2 id="pilot-evidence">What happened in the original pilot</h2>
        <p>{study.pilot}</p>
        <p>{study.lesson}</p>
        <p><a href="/merge-monitor/pilot-record.json" download>Download the curated pilot record</a> · <a href={study.walkthrough}>Watch the recorded walkthrough</a></p>
        <p className="note">{study.limits}</p>
      </section>
      <h2>Why share the work?</h2>
      <p>{study.openness}</p>
      <p>{study.sourceInvitation}</p>
      <p><a href={study.source}>Explore the Merge Monitor source on GitHub</a></p>
      <p className="cta-row">
        <ButtonLink variant="primary" href="/contact">Discuss your agent workflow</ButtonLink>
        <ButtonLink variant="ghost" href="/work">Explore more work</ButtonLink>
      </p>
    </CleanChrome>
  );
}
