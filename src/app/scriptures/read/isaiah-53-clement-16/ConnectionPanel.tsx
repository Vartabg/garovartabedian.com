"use client";
import type { ReadingJourney } from "@/lib/evidence/reading-journey";
import PublicAssessment, { PublicAssessmentEnabled } from "../../search/PublicAssessment";
import styles from "./reading.module.css";
import PassageComparison from "@/app/_components/reading/PassageComparison";

export type ConnectionPanelProps = { journey: ReadingJourney; assessmentsEnabled: boolean };

export default function ConnectionPanel({ journey, assessmentsEnabled }: ConnectionPanelProps) {
  const { packet } = journey;
  return <div className={styles.connection}>
    <p className={styles.muted}>Isaiah 53:5 ↔ 1 Clement 16 · Two hosted English translations</p>
    <PassageComparison passages={packet.excerpts.slice(0, 2)} />
    <section className={styles.editorial} data-kind="interpretation">
      <p className={styles.role}>Editorial interpretation · Unreviewed draft</p>
      <p>{packet.claims[0].statement}</p>
      <p>{packet.claims[0].limits}</p>
      <details><summary>What this connection does and does not establish</summary><p>{packet.relationship.limits}</p></details>
    </section>
    <section className={styles.editorial} data-kind="question">
      <p className={styles.role}>Open question</p>
      <p>{packet.openQuestions[0]}</p>
    </section>
    {assessmentsEnabled ? <div className={styles.aiCheck} data-kind="interpretation">
      <PublicAssessmentEnabled.Provider value={true}>
        <PublicAssessment query={packet.question} anchor={journey.anchor} sources={[journey.candidate]} />
      </PublicAssessmentEnabled.Provider>
      <p className={styles.muted}>The AI checks Isaiah 53:5 against the complete first paragraph of 1 Clement 16, including its introduction and conclusion. Its suggestion remains unreviewed until an editor assesses the sources. A match never establishes historical borrowing, agreement, or proof.</p>
    </div> : <p className={styles.muted}>AI connection checks are unavailable here. You can still read and compare both sources.</p>}
  </div>;
}
