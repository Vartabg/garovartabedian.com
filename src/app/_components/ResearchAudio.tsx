import Link from "next/link";
import episodes from "@/lib/research-audio/episodes.json";
import manifest from "../../../public/research-audio/manifest.json";
import { audioTime } from "@/lib/research-audio/time";
import ResearchAudioPlayer from "./ResearchAudioPlayer";

export type ResearchAudioId = keyof typeof manifest;

export default function ResearchAudio({ id }: { id: ResearchAudioId }) {
  const episode = episodes.find((item) => item.id === id)!;
  const recording = manifest[id];
  return (
    <aside className="research-audio" aria-labelledby={`audio-${id}`}>
      <div className="research-audio-heading">
        <p className="research-audio-kicker">A listening companion <span>· {audioTime(recording.durationSeconds)}</span></p>
        <h2 id={`audio-${id}`}>{episode.title}</h2>
        <p>{episode.description}</p>
      </div>
      <ResearchAudioPlayer src={recording.src} title={episode.title} chapters={episode.sections.map((section, index) => ({ title: section.title, startSeconds: recording.chapters[index].startSeconds }))} />
      <p className="research-audio-provenance">Editorial synthesis · AI narration · Sources checked October 19, 2026</p>
      <details className="research-audio-transcript">
        <summary>Read the transcript &amp; sources</summary>
        <p>These are authored overviews, narrated locally with the site’s approved synthetic voice. Interpretive connections are identified in the script. Each section links to the evidence it discusses.</p>
        {episode.sections.map((section, index) => <section key={section.title} aria-labelledby={`audio-${id}-section-${index}`}>
          <h3 id={`audio-${id}-section-${index}`}><span>{audioTime(recording.chapters[index].startSeconds)}</span> {section.title}</h3>
          <p>{section.text}</p>
          <ul aria-label={`Sources for ${section.title}`}>
            {section.sourceIds.map((sourceId) => {
              const source = episode.sources.find((item) => item.id === sourceId)!;
              return <li key={source.id}><Link href={source.href}>{source.label}</Link></li>;
            })}
          </ul>
        </section>)}
        <h3>Source notes</h3>
        <ul>{episode.sources.map((source) => <li key={source.id}><Link href={source.href}>{source.label}</Link><p>{source.note}</p></li>)}</ul>
        <p><a href={recording.src} download>Download audio</a> · <Link href={episode.dossierHref}>{episode.dossierLabel}</Link></p>
      </details>
    </aside>
  );
}
