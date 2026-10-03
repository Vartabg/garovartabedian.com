import Link from "next/link";
import { textLengthLabel, type EarlyTextMeta } from "@/lib/early/client";
import { plateForText } from "@/lib/early/plates";
import EarlyCardPlate from "./EarlyCardPlate";

/** One writing on the shelf — plate, title, blurb, date + length. */
export default function EarlyTextCard({ text }: { text: EarlyTextMeta }) {
  const plate = plateForText(text.id);
  const length = textLengthLabel(text);

  return (
    <Link href={`/early/${text.id}`} className="scr-card">
      {plate ? <EarlyCardPlate plate={plate} /> : null}
      <h2>{text.title}</h2>
      {text.blurb && <p>{text.blurb}</p>}
      <p className="scr-count">
        {text.date}
        {length ? ` · ${length}` : ""}
      </p>
    </Link>
  );
}
