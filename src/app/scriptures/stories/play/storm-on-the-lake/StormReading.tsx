import Link from "next/link";
import mark from "../../../../../../public/scriptures/text/web/MRK.json";

export const markPassage = "/scriptures/protestant/MRK/4?t=web#v35";
export const matthewPassage = "/scriptures/protestant/MAT/8?t=web#v23";
export const lukePassage = "/scriptures/protestant/LUK/8?t=web#v22";
export const stormPainting = "/jesus/life/calming-the-storm.jpg";

export default function StormReading() {
  return (
    <details className="storm-reading">
      <summary>Read the Gospel accounts</summary>
      <div>
        <h2>Calming the storm on the Sea of Galilee</h2>
        <p>
          Mark describes Jesus telling his disciples at evening, “Let’s go over to the other side.” Other small boats went with them. When a fierce wind storm arose and waves filled the boat, Jesus was asleep on the cushion in the stern until they woke him, and he rebuked the wind and the sea.
        </p>
        <blockquote>{mark.chapters[3][38]}</blockquote>
        <blockquote>{mark.chapters[3][40]}</blockquote>
        <p>
          Matthew and Luke tell the same crossing, noting the water filling the boat and the disciples’ awe at seeing even wind and water obey him. The cedar boat layout, sail reefing, bailing stations, headwind pacing, and moonlit stillness are imagined for play.
        </p>
        <p className="storm-reading-links">
          <Link href={markPassage}>Read Mark 4:35–41</Link>
          <Link href={matthewPassage}>Read Matthew 8:23–27</Link>
          <Link href={lukePassage}>Read Luke 8:22–25</Link>
        </p>
      </div>
    </details>
  );
}
