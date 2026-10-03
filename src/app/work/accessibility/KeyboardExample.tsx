"use client";

import { useState } from "react";
import { buttonClassName } from "@/app/_components/Button";
import styles from "./page.module.css";

export default function KeyboardExample() {
  const [saved, setSaved] = useState(false);
  const [touched, setTouched] = useState(false);
  return (
    <section aria-labelledby="try-keyboard">
      <h2 id="try-keyboard">One small repair, experienced directly</h2>
      <p>This illustrates a recurring repair pattern. It is not an archived product screen.</p>
      <div className={styles.comparison}>
        <div className={styles.panel}>
          <p className="kicker">Before / the barrier</p>
          <h3>An icon with a click handler</h3>
          <pre className={styles.code}><code>{'<span onClick={save}>☆</span>'}</code></pre>
          <p>A pointer can activate it, but the control has no useful name, native keyboard behavior, or announced result. The broken pattern is shown as text here.</p>
        </div>
        <div className={styles.panel}>
          <p className="kicker">After / try it</p>
          <h3>A button with a name and a result</h3>
          <p id="keyboard-help">Tab to the button. Press Enter or Space to save; press again to remove it.</p>
          <button
            type="button"
            className={buttonClassName({ variant: "primary" })}
            aria-pressed={saved}
            aria-describedby="keyboard-help"
            onClick={() => { setSaved(!saved); setTouched(true); }}
          >Save sample passage</button>
          <p role="status" aria-live="polite" aria-atomic="true" className={styles.result}>
            {touched ? saved ? "Sample passage saved. It stays here until you leave this page." : "Sample passage removed." : "The result will appear here and be announced by a screen reader."}
          </p>
        </div>
      </div>
      <p className="note">The same control supports pointer, touch, and keyboard input. Its pressed state and status message expose what happened without relying on color.</p>
    </section>
  );
}
