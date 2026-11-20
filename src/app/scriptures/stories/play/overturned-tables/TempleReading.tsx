import Link from "next/link";
import mark from "../../../../../../public/scriptures/text/web/MRK.json";

export const markPassage = "/scriptures/protestant/MRK/11?t=web#v15";
export const johnPassage = "/scriptures/protestant/JHN/2?t=web#v13";
export const templePainting = "/play/temple/christ-cleansing-the-temple.jpg";

export default function TempleReading() {
  return (
    <details className="court-reading">
      <summary>Read the Gospel accounts</summary>
      <div>
        <h2>Jesus in the temple court</h2>
        <p>Mark describes Jesus driving out buyers and sellers, overturning the money changers’ tables and the dove sellers’ seats, and stopping people from carrying containers through the temple. Then he teaches the people gathered there.</p>
        <blockquote>{mark.chapters[10][16]}</blockquote>
        <p>John describes Jesus pouring out the changers’ money. The court layout, the five stalls, the birds’ flight and the way people move are imagined for play.</p>
        <p className="court-reading-links"><Link href={markPassage}>Read Mark 11:15–18</Link><Link href={johnPassage}>Read John 2:13–17</Link></p>
        <p className="court-art-credit"><a href={templePainting}>View El Greco’s painting of the scene</a> (probably before 1570). National Gallery of Art, Samuel H. Kress Collection. <a href="https://www.nga.gov/artworks/43723-christ-cleansing-temple">Museum record</a>.</p>
      </div>
    </details>
  );
}
