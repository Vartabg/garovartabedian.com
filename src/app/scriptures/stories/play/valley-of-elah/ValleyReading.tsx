import Link from "next/link";
import samuel1 from "../../../../../../public/scriptures/text/web/1SA.json";

export const samuelPassage = "/scriptures/protestant/1SA/17?t=web#v38";
export const davidStory = "/scriptures/stories/david";
export const davidIllustration = "/scriptures/stories/david/name.jpg";

export default function ElahReading() {
  return (
    <details className="elah-reading">
      <summary>Read 1 Samuel 17</summary>
      <div>
        <h2>David in the Valley of Elah</h2>
        <p>
          First Samuel describes Saul dressing David in his own bronze helmet, coat of mail, and sword, and David taking them off because he had not tested them. Taking only his shepherd’s staff, he chose five smooth stones from the brook and went out with his sling to meet the Philistine.
        </p>
        <blockquote>{samuel1.chapters[16][38]}</blockquote>
        <blockquote>{samuel1.chapters[16][49]}</blockquote>
        <p>
          When the Philistines saw that their champion had fallen, they fled, and the men of Israel and Judah arose and pursued them across the valley. The terraced slopes, armor walking weights, stream pebbles, and watching lines are imagined for play; the scene renders the champion’s fall in silhouette and omits verse 51’s sword-beheading visually so the contrast remains between borrowed armor and a shepherd’s sling.
        </p>
        <p className="elah-reading-links">
          <Link href={samuelPassage}>Read 1 Samuel 17:38–52</Link>
          <Link href={davidStory}>Read the illustrated story of David</Link>
        </p>
      </div>
    </details>
  );
}
