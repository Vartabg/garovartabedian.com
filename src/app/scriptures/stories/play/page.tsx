import type { Metadata } from "next";
import Image from "next/image";
import Link from "next/link";
import { scriptureStoryPath } from "@/lib/scriptures/stories";
import { passageHref } from "@/lib/scriptures/story-text";
import { scriptureDestination } from "@/lib/scriptures/study-catalog";
import styles from "./page.module.css";

const hub = scriptureDestination("/scriptures/stories/play");
const temple = scriptureDestination("/scriptures/stories/play/overturned-tables");
const description = "Play as Jesus in the temple court or take flight over Mount Hermon. Read the passages behind the games.";

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

      <section className={styles.reading} aria-labelledby="david-title">
        <h2 id="david-title">David and Goliath</h2>
        <p>Follow David from Saul’s camp to the valley in the illustrated reading.</p>
        <div className={styles.actions}>
          <Link href={scriptureStoryPath("david")}>Read David’s story</Link>
          <Link href={passageHref("1SA", 17)}>Read 1 Samuel 17</Link>
        </div>
      </section>
    </article>
  );
}
