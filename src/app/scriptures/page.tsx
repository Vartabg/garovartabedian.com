import ResearchAudio from "../_components/ResearchAudio";
import Link from "next/link";
import doorwaysData from "../../../public/scriptures/doorways.json";
import type { DoorwaysData } from "@/lib/scriptures/doorways";
import { scriptureDestination, scriptureStudyCatalog } from "@/lib/scriptures/study-catalog";
import { SCRIPTURE_STORIES, scriptureStoryPath } from "@/lib/scriptures/stories";
import ContinueCard from "./_components/ContinueCard";
import Doorways from "./_components/doorways/Doorways";

const doorways = doorwaysData as DoorwaysData;

/** Readers choose their own passage, tradition, and translation. */
export default function ScripturesHome() {
  const search = scriptureDestination("/scriptures/search");
  const wordBridge = scriptureDestination("/scriptures/word-bridge");
  const compare = scriptureDestination("/scriptures/polyglot");
  const groups = scriptureStudyCatalog();

  return (
    <div className="scr-hub">
      <header className="scr-hub-intro">
        <p className="scr-hub-eyebrow">The living codex</p>
        <h1 className="scr-hub-title" data-hand="capitals">Read the Bible.</h1>
        <p className="scr-hub-lede">Choose a passage. Look closely at its words. Follow the questions it opens.</p>
      </header>

      <section className="scr-hub-stories" aria-labelledby="scr-hub-stories-title">
        <div className="scr-hub-section-head">
          <h2 id="scr-hub-stories-title">Begin with a story</h2>
          <p>Some accounts run through many chapters. Read the turns together, in the words of the text.</p>
        </div>
        <nav className="scr-hub-group" aria-label="Stories">
          <ul>
            {SCRIPTURE_STORIES.map((story) => (
              <li key={story.slug}>
                <Link href={scriptureStoryPath(story.slug)}>
                  <span><strong>{story.title}</strong><span>{story.reference}. {story.summary}</span></span>
                  <span aria-hidden="true">↗</span>
                </Link>
              </li>
            ))}
          </ul>
        </nav>
      </section>

      <nav className="scr-hub-start" aria-label="Start studying">
        <a href="#read">
          <span className="scr-hub-start-mark" aria-hidden="true">01</span>
          <span><strong>Read</strong><span>Choose a book and chapter</span></span>
          <span aria-hidden="true">↓</span>
        </a>
        {[search, wordBridge, compare].map((tool, index) => (
          <Link href={tool.href} key={tool.href}>
            <span className="scr-hub-start-mark" aria-hidden="true">0{index + 2}</span>
            <span><strong>{tool.label}</strong><span>{tool.href === wordBridge.href ? "Connect English to Hebrew and Greek" : tool.href === search.href ? "Find words, phrases, or a reference" : "Read editions side by side"}</span></span>
            <span aria-hidden="true">↗</span>
          </Link>
        ))}
      </nav>

      <p className="scr-hub-source-note"><a href="#audio-scripture-reading">Listen to the research overview</a></p>
      <ContinueCard />
      <section className="scr-hub-reading" aria-labelledby="scr-hub-reading-title" id="read" tabIndex={-1}>
        <div className="scr-hub-section-head">
          <h2 id="scr-hub-reading-title">Where would you like to read?</h2>
          <p>Your choice of tradition, translation, book, and chapter.</p>
        </div>
        <Doorways data={doorways} />
      </section>

      <ResearchAudio id="scripture-reading" />

      <section className="scr-hub-catalog" aria-labelledby="scr-hub-catalog-title">
        <header className="scr-hub-section-head">
          <div>
            <p className="scr-hub-eyebrow">Keep asking</p>
            <h2 id="scr-hub-catalog-title">Find a way into your question.</h2>
          </div>
          <p>Each tool shows its sources and limits. Start with the question you have.</p>
        </header>
        <div className="scr-hub-groups">
          {groups.map((group) => (
            <nav className="scr-hub-group" aria-labelledby={`scr-hub-${group.id}`} key={group.id}>
              <h3 id={`scr-hub-${group.id}`}>{group.title}</h3>
              <p>{group.question}</p>
              <ul>
                {group.tools.map((tool) => (
                  <li key={tool.href}>
                    <Link href={tool.href}>
                      <span><strong>{tool.label}</strong><span>{tool.note}</span></span>
                      <span aria-hidden="true">↗</span>
                    </Link>
                  </li>
                ))}
              </ul>
            </nav>
          ))}
        </div>
        <p className="scr-hub-source-note">Hosted texts are public-domain or open-licensed. <Link href="/sources#scripture-texts">See the editions and sources<span aria-hidden="true"> →</span></Link></p>
      </section>
    </div>
  );
}
