import Image from "next/image";
import type { InlineMediaPlateMeta } from "../_components/InlineMediaPlate";

/** Full manuscript leaf, with its reading caption outside the painted border. */
export default function ApostlesStoryPlate({ plate }: { plate: InlineMediaPlateMeta }) {
  return (
    <figure className="ap-story-plate">
      <Image
        src={plate.src}
        alt={plate.alt}
        width={1280}
        height={720}
        sizes="(min-width: 752px) 704px, calc(100vw - 48px)"
        quality={70}
      />
      <figcaption>{plate.caption}</figcaption>
    </figure>
  );
}
