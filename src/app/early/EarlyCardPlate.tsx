import Image from "next/image";
import type { EarlyPlate } from "@/lib/early/plates";

/**
 * Card thumbnail — reuses the text's hero plate at postcard scale.
 * Decorative: the parent card already names the work in its heading.
 */
export default function EarlyCardPlate({ plate }: { plate: EarlyPlate }) {
  return (
    <span className="scr-card-visual ew-card-plate" aria-hidden="true">
      <Image
        src={plate.src}
        alt=""
        width={640}
        height={360}
        sizes="(min-width: 960px) 230px, 45vw"
        loading="lazy"
      />
    </span>
  );
}
