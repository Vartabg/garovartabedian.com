import type { Metadata } from "next";
import Image from "next/image";
import Link from "next/link";
import { scriptureStoryPath } from "@/lib/scriptures/stories";
import { passageHref } from "@/lib/scriptures/story-text";
import { scriptureDestination } from "@/lib/scriptures/study-catalog";
import styles from "./page.module.css";

const hub = scriptureDestination("/scriptures/stories/play");
const temple = scriptureDestination("/scriptures/stories/play/overturned-tables");
const elah = scriptureDestination("/scriptures/stories/play/valley-of-elah");
const storm = scriptureDestination("/scriptures/stories/play/storm-on-the-lake");
const description = "Play as Jesus in the temple court, step into the Valley of Elah as David, cross the Sea of Galilee in a rising squall, or take flight over Mount Hermon. Read the passages behind the games.";

export const metadata: Metadata = {
  title: hub.label,
  description,
  alternates: { canonical: hub.href },
  openGraph: { title: hub.label, description, type: "website", url: hub.href },
};

export default function PlayableStoriesPage() {
  return (
    <article className={styles.collection} aria-labelledby="playable-stories">
      <header className={styles.heading}>
        <h1 id="playable-stories">{hub.label}</h1>
        <Link href="/scriptures/stories">All illustrated stories</Link>
      </header>
      <section className={styles.episode} aria-labelledby="temple-title">
        <Image
          className={styles.illustration}
          src="/jesus/life/temple-cleansing.jpg"
          alt="An illustration of a table tipping as coins fall and doves take flight."
          loading="eager"
          width={1280} height={720} sizes="(max-width: 38rem) 100vw, 20rem" quality={70}
        />
        <div>
          <h2 id="temple-title">{temple.label}</h2>
          <p>Play as Jesus in an imagined Jerusalem courtyard. Overturn the money changers’ tables and the dove sellers’ seats, and bar the passage. When the court clears, read his teaching about a house of prayer.</p>
          <div className={styles.actions}>
            <a className={styles.play} href={temple.href}>Enter the temple court</a>
            <Link href="/scriptures/protestant/MRK/11?t=web#v15">Read Mark 11:15–18</Link>
            <Link href="/scriptures/protestant/JHN/2?t=web#v13">Read John 2:13–17</Link>
          </div>
        </div>
      </section>

      <section className={styles.episode} aria-labelledby="hermon-title">
        <Image
          className={styles.illustration}
          src="/angels/plates/fall-enoch-6-3-6.jpg"
          alt="An illustration of the Watchers gathered on a snowy mountain."
          width={1280} height={720} sizes="(max-width: 38rem) 100vw, 20rem" quality={70}
        />
        <div>
          <h2 id="hermon-title">Mount Hermon</h2>
          <p>In 1 Enoch, the Watchers swear an oath on Hermon in the days of Jared. Fly over the mountain at dawn or enter <i>The Cloven Arch</i>, an imagined crossing where two shepherds carry a coal for a warning fire.</p>
          <div className={styles.actions}>
            <a className={styles.play} href="/play/hermon">Start free flight over Hermon</a>
            <a className={styles.play} href="/play/hermon/crossing">Play The Cloven Arch</a>
          </div>
          <div className={styles.actions}>
            <a href="/play/hermon/crossing/account">Read the crossing</a>
            <Link href="/scriptures/ethiopian/ENO/6?t=charles#v4">Read 1 Enoch 6 in the Ethiopian canon</Link>
          </div>
        </div>
      </section>

      <section className={styles.episode} aria-labelledby="elah-title">
        <Image
          className={styles.illustration}
          src="/scriptures/stories/david/name.jpg"
          alt="David standing with a shepherd’s staff and sling in the Valley of Elah."
          width={880} height={660} sizes="(max-width: 38rem) 100vw, 20rem" quality={70}
        />
        <div>
          <h2 id="elah-title">{elah.label}</h2>
          <p>Play as David between the two hillside lines. Feel the weight of Saul’s bronze armor, set it aside piece by piece, choose five smooth stones from the brook, and face Goliath with a sling and a stone.</p>
          <div className={styles.actions}>
            <a className={styles.play} href={elah.href}>Enter the Valley of Elah</a>
            <Link href={scriptureStoryPath("david")}>Read David’s story</Link>
            <Link href={passageHref("1SA", 17)}>Read 1 Samuel 17</Link>
          </div>
        </div>
      </section>

      <section className={styles.episode} aria-labelledby="storm-title">
        <Image
          className={styles.illustration}
          src="/jesus/life/calming-the-storm.jpg"
          alt="Jesus standing in the stern of a wooden fishing boat on the Sea of Galilee, rebuking the wind and waves."
          width={1280} height={720} sizes="(max-width: 38rem) 100vw, 20rem" quality={70}
        />
        <div>
          <h2 id="storm-title">{storm.label}</h2>
          <p>Board a Galilean fishing boat at dusk while Jesus sleeps on a cushion in the stern. Set sail, fight the rising squall and bailing water, and wake him before the sea goes glassy and still.</p>
          <div className={styles.actions}>
            <a className={styles.play} href={storm.href}>Board the Galilee boat</a>
            <Link href="/scriptures/protestant/MRK/4?t=web#v35">Read Mark 4:35–41</Link>
            <Link href="/scriptures/protestant/LUK/8?t=web#v22">Read Luke 8:22–25</Link>
          </div>
        </div>
      </section>
    </article>
  );
}
