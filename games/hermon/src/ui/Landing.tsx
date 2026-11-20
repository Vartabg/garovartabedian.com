import type { ReactNode } from 'react';
import styles from './Experience.module.css';
import entry from './mountainEntry.module.css';
import { CROSSING_PATH, STORIES_PATH } from '@/paths';
// The landing page's static words (the brand, the title, the start card and the footer) and the failed world's card, split out of Experience so
// that file stays under its line budget. Everything here is plain DOM over the Canvas: no three.js, no store, no lazy chunk of its own (the
// first-visit demo note comes in through `children`, from the one ControlsEntry call site in Experience).
type Props = { started: boolean; failed: boolean; ready: boolean; zoomNote: boolean; note: string; onEnter: () => void; onRetry: () => void; children?: ReactNode };

/** The brand mark and wordmark in the top row (landing and the failed world only). */
export function Brand() {
  return <a className={styles.brand} href={STORIES_PATH}>Playable stories</a>;
}

export default function Landing({ started, failed, ready, zoomNote, note, onEnter, onRetry, children }: Props) {
  const off = started || failed;
  return <>
    {/* The title and the start card are one bottom-anchored column (Experience.module.css .hero): a taller card pushes the title up, never into it. */}
    <div className={off ? styles.heroOff : styles.hero}><h1 className={off ? 'sr-only' : styles.heroTitle}>Hermon <br /><em>at dawn.</em></h1>
      {failed && <div className={styles.recovery} role="alert"><h2>The world needs a moment.</h2><p>Your field guide remains available. Reload the scene to continue from your saved landing.</p>{note && <p>{note}</p>}<button type="button" className={styles.primary} onClick={onRetry}>Reload scene</button></div>}
      {!off && <section className={styles.intro} aria-label="Ascend Mount Hermon">
        <p className={styles.eyebrow}><span className={styles.statusDot} /> BOOK OF ENOCH <span>/</span> MOUNT HERMON</p>
        <p className={styles.introCopy}>Two hundred Watchers swear an oath. Two shepherds carry the warning down the mountain.</p>
        <div className={entry.choices}>
          <a className={entry.chapter} href={CROSSING_PATH}>Play The Cloven Arch</a>
          <button type="button" className={entry.free} disabled={!ready} onClick={onEnter}>{ready ? 'Ascend Mount Hermon' : 'Calling your angel…'}</button>
        </div>
        <p className={styles.introHint} role="status">{note || (zoomNote ? 'Pinch out to normal size, then tap Ascend.' : 'Ascend for free flight.')}</p>
        {children}
      </section>}</div>
    {!started && <footer className={styles.introFooter}><span>1 ENOCH VI <small>THE WATCHERS</small><b>—</b> HERMON <small>AT DAWN</small></span><span>ARCHANGEL <small>OF THE COVENANT</small></span></footer>}
  </>;
}
