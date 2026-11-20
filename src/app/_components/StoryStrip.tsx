import Image from "next/image";
import Link from "next/link";
import { HOME } from "@/lib/portfolio-content";
import { SHELF_STORIES } from "@/lib/story-shelf";

/** Where the keyboard skip link lands: the link to the whole shelf, after the pictures. */
const ALL_STORIES_ID = "home-all-stories";

/**
 * The front door's way into the stories: every told story as a picture, in
 * shelf order, in one row that scrolls sideways. Plain HTML and CSS, no client
 * script. The pictures are the ones the shelf at /scriptures/stories shows.
 */
export default function StoryStrip({
  allStoriesId = ALL_STORIES_ID,
}: {
  allStoriesId?: string;
} = {}) {
  return (
    <div className="st-stories">
      <a className="skip-link st-stories-skip" href={`#${allStoriesId}`}>
        {HOME.storiesSkipLabel}
      </a>
      <ul className="st-stories-strip" aria-label={HOME.storiesListLabel}>
        {SHELF_STORIES.map((story, index) => (
          <li key={story.id}>
            <Link href={story.href}>
              <span className="st-stories-picture">
                {/* The title follows in the same link, so the picture adds no second name. */}
                <Image
                  src={story.picture}
                  alt=""
                  fill
                  sizes="6.2rem"
                  quality={70}
                  loading={index < 4 ? "eager" : "lazy"}
                />
              </span>
              <span className="st-stories-title">{story.title}</span>
            </Link>
          </li>
        ))}
      </ul>
      <Link className="st-stories-all" id={allStoriesId} href={HOME.storiesHref}>
        {`${HOME.storiesLinkStart} ${SHELF_STORIES.length} ${HOME.storiesLinkEnd}`}
        <span aria-hidden="true">→</span>
      </Link>
    </div>
  );
}
