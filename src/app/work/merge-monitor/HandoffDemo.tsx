"use client";

import { useState } from "react";
import { buttonClassName } from "@/app/_components/Button";
import { HANDOFF_DEMO_STAGES, type HandoffDemoStage } from "@/lib/merge-monitor-case-study";
import styles from "./page.module.css";

export default function HandoffDemo() {
  const [stage, setStage] = useState<HandoffDemoStage>("request");
  const current = HANDOFF_DEMO_STAGES[stage];
  const steps = ["Request", "Acknowledgment", "Evidence", "Resolution"];
  const activeStep = stage === "request" ? 0 : stage === "acknowledged" ? 1 : stage === "resolved" ? 3 : 2;

  return (
    <section id="handoff-demo" aria-labelledby="demo-title" className={styles.demo}>
      <p className="kicker">Interactive illustration</p>
      <h2 id="demo-title">Follow one request through the board</h2>
      <p id="demo-description">Explore prepared examples at your own pace. These controls illustrate the workflow; they do not run agents or tests. The original pilot is documented below.</p>
      <ol className={styles.steps} aria-label="Handoff stages">
        {steps.map((step, index) => <li key={step} aria-current={index === activeStep ? "step" : undefined}>
          <span aria-hidden="true">{index + 1}</span> {step}
        </li>)}
      </ol>
      <div className={styles.panels}>
        <article className={styles.message}>
          <p className="kicker">{current.speaker}</p>
          <h3>{current.title}</h3>
          <p>{current.message}</p>
        </article>
        <aside className={styles.explanation} aria-label="What this step means">
          <p role="status" aria-live="polite" aria-atomic="true" className={styles.status}>{current.status}</p>
          <p>{current.lesson}</p>
        </aside>
      </div>
      <div className={styles.controls} aria-describedby="demo-description">
        <button type="button" className={buttonClassName({ variant: "primary" })} disabled={stage !== "request"} onClick={() => setStage("acknowledged")}>Acknowledge receipt</button>
        <button type="button" className={buttonClassName({ variant: "ghost" })} disabled={stage !== "acknowledged" && stage !== "passed"} onClick={() => setStage("failed")}>Show a failing check</button>
        <button type="button" className={buttonClassName({ variant: "ghost" })} disabled={stage !== "acknowledged" && stage !== "failed"} onClick={() => setStage("passed")}>Show a passing check</button>
        <button type="button" className={buttonClassName({ variant: "primary" })} disabled={stage !== "passed"} onClick={() => setStage("resolved")}>Record resolution</button>
        <button type="button" className={buttonClassName({ variant: "ghost" })} disabled={stage === "request"} onClick={() => setStage("request")}>Start again</button>
      </div>
      <noscript><p>The five handoff fields and original pilot record below are available without JavaScript.</p></noscript>
    </section>
  );
}
