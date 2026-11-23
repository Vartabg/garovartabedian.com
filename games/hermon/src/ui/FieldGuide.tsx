import { TERMINALS, nearestTerminal, terminalById } from '@/game/navigation';
import { persistGame, useGame } from '@/game/store';
import { runtime } from '@/game/runtime';
import Modal from './Modal';
import styles from './Experience.module.css';
import { ACCOUNT_PATH, BUILD_STAMP, CROSSING_PATH, ENOCH_SIX, HERMON_PATH, PUBLIC_HERMON_URL, STORIES_PATH } from '@/paths';

export default function FieldGuide({ onClose }: { onClose: () => void }) {
  const discoveredTablets = useGame(s => s.discoveredTablets);
  const journalTerminalId = useGame(s => s.journalTerminalId);
  const focused = terminalById(journalTerminalId) ?? nearestTerminal(runtime.position) ?? TERMINALS[0];

  const recover = (id: string) => {
    const g = useGame.getState();
    const next = g.discoveredTablets.includes(id) ? g.discoveredTablets : [...g.discoveredTablets, id];
    useGame.setState({ discoveredTablets: next, discovered: next.length > 0, journalTerminalId: id });
    persistGame();
  };

  return <Modal title="Field guide" onClose={onClose}>
    <p className={styles.eyebrow}>MOUNT HERMON AT DAWN · INSPIRED BY 1 ENOCH</p>
    <p>Mount Hermon at dawn, inspired by the Book of the Watchers (1 Enoch 6–21). In the days of Jared, two hundred Watchers descended on this summit and swore their oath here (<a href={ENOCH_SIX}>1 Enoch 6:6</a>). First light catches the snow while the valley sleeps in mist below. The stone tablets quote 1 Enoch word for word; the terraces, winged flight, and encounters are game fiction.</p>

    <h3>The five stone tablets ({discoveredTablets.length} / {TERMINALS.length} found)</h3>
    <p>Golden beacons mark five stone tablets across Hermon’s ridges and sanctuaries. Fly close and press <strong>E</strong> to read them in the world, or read any tablet here without navigating the 3D scene.</p>
    <article>
      <p className={styles.eyebrow}>{focused.record.kind}</p>
      <h3>{focused.location} — {focused.record.title}</h3>
      <p className={styles.muted}>{focused.record.place}</p>
      {discoveredTablets.includes(focused.id) ? <>
        <p>{focused.record.body}</p>
        <p className={styles.muted}>{focused.record.note}</p>
      </> : <>
        <button type="button" className={styles.secondary} onClick={() => recover(focused.id)}>Recover tablet record</button>
      </>}
    </article>
    <details>
      <summary>All five tablets on Hermon</summary>
      {TERMINALS.map(t => {
        const found = discoveredTablets.includes(t.id);
        return <article key={t.id}>
          <p className={styles.eyebrow}>{t.record.date} · {found ? 'Found' : 'Unfound'}</p>
          <h3>{t.location} — {t.record.title}</h3>
          <p className={styles.muted}>{t.record.place}</p>
          {found
            ? <><p>{t.record.body}</p><p className={styles.muted}>{t.record.note}</p></>
            : <button type="button" className={styles.secondary} onClick={() => recover(t.id)}>Read tablet record</button>}
        </article>;
      })}
    </details>

    <h3>How to fly</h3>
    <p><strong>Desktop:</strong> Press <strong>Space</strong> to lift off and hold it to climb. Hold <strong>W/A/S/D</strong> to fly with momentum — pitch down to dive for speed, pull up to soar into a climb, and release keys to flare your wings into a hover. Hold <strong>Shift</strong> to surge faster, hold <strong>F</strong> (or <strong>Ctrl</strong>) to descend and touch down on flat ground, press <strong>L</strong> to glide-land on a targeted ledge, and press <strong>B</strong> to brake into hover. Drag anywhere on the scene to look freely, or click the open sky to lock mouse look (<strong>Esc</strong> pauses and frees the cursor). Arrow keys also steer the camera.</p>
    <p><strong>Touch screens:</strong> Drag the open scene to look, hold <strong>Fly</strong> to travel (drag the held button to steer), and release to hover. Tap a Watcher to strike when the battle is active, or hold a second finger for the shield. Twin-stick touch remains available under Controls on touch devices.</p>

    <h3>The Watchers’ host (optional battle)</h3>
    <p>Free flight opens into a calm dawn sky so you can explore the mountain at your own pace. Choose <strong>Watchers</strong> in the top bar (or Pause menu) whenever you want to confront the host patrolling the gorge. Click (while mouse-locked) or press <strong>C</strong> to dive with the flaming sword — three cuts cast a Watcher down and bind it. Hold <strong>Right-click</strong> or <strong>V</strong> to raise the shield against fiery darts, and press <strong>1</strong> to rebuke (Jude 9). Toggle back to a calm sky at any time.</p>
    <p className={styles.muted}>Imagery notes: rebuke (Mark 1:25, Jude 9), flaming sword (Genesis 3:24), binding and abyss (Revelation 20:1–3, 1 Enoch 10:4), shield of faith (Ephesians 6:16). None of these texts prescribes game rules; the angel, demons, and combat are fiction.</p>

    <h3>Your route &amp; The Cloven Arch</h3>
    <p>In <a href={CROSSING_PATH}>The Cloven Arch</a>, two fictional shepherds carry a warning coal down the pass. You can also <a href={ACCOUNT_PATH}>follow the crossing in text and read its source</a>.</p>
    <ol>
      <li>Take wing from the Threshold of Hermon (Tablet of Semjaza).</li>
      <li>Dive into the Lower Gorge and pass beneath the Cloven Arch.</li>
      <li>Climb the eastern peak to the Sanctuary of the Throne.</li>
      <li>Follow the golden beacons to the outer ridges (Seven Stars, Azazel, Kokabiel, Michael).</li>
    </ol>
    <img className={styles.districtMap} src={`${HERMON_PATH}/district-map.svg`} width="450" height="336" alt="Mount Hermon flight map. The gold route runs north from the Threshold of Hermon through the lower gorge and Cloven Arch, then east to the Sanctuary of the Throne." />
    <p className={styles.muted}>Regional relief uses <a href="https://registry.opendata.aws/terrain-tiles/">Mapzen Terrain Tiles</a>. SRTM data courtesy of the U.S. Geological Survey.</p>

    <h3>Play on a phone</h3>
    <p>Scan the code to open Mount Hermon on another device.</p>
    <img className={styles.qrHandoff} src={`${HERMON_PATH}/phone-qr.svg`} width="150" height="150" alt="QR code for Mount Hermon at dawn" />
    <p><a href={PUBLIC_HERMON_URL}>Open Mount Hermon at dawn</a> · <a href={STORIES_PATH}>All playable stories</a></p>
    <p className={styles.muted}>Build {BUILD_STAMP}. Local location: {runtime.location}.</p>
  </Modal>;
}
