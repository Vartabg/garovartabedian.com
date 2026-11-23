import Link from "next/link";
import mark from "../../../../../../public/scriptures/text/web/MRK.json";

export const markPassage = "/scriptures/protestant/MRK/11?t=web#v15";
export const matthewPassage = "/scriptures/protestant/MAT/21?t=web#v12";
export const johnPassage = "/scriptures/protestant/JHN/2?t=web#v13";
export const templePainting = "/play/temple/christ-cleansing-the-temple.jpg";

export default function TempleReading() {
  return (
    <details className="court-reading">
      <summary>Read the Gospel accounts</summary>
      <div>
        <h2>Jesus in the temple court</h2>
        <p>Mark describes Jesus driving out buyers and sellers, overturning the money changers’ tables and the dove sellers’ seats, stopping people from carrying containers through the temple, teaching the crowd, and leaving the city at evening.</p>
        <blockquote>{mark.chapters[10][16]}</blockquote>
        <p>Matthew adds the blind and the lame coming to him in the temple to be healed, children crying “Hosanna to the son of David!”, his reply to the chief priests and scribes, and his departure to Bethany. John describes pouring out the changers’ money. The court layout, five stalls, fallen scales, birds’ flight, gestures and dusk light are imagined for play.</p>
        <p className="court-reading-links">
          <Link href={markPassage}>Read Mark 11:15–19</Link>
          <Link href={matthewPassage}>Read Matthew 21:12–17</Link>
          <Link href={johnPassage}>Read John 2:13–17</Link>
        </p>
        <p className="court-art-credit"><a href={templePainting}>View El Greco’s painting of the scene</a> (probably before 1570). National Gallery of Art, Samuel H. Kress Collection. <a href="https://www.nga.gov/artworks/43723-christ-cleansing-temple">Museum record</a>.</p>
      </div>
    </details>
  );
}
