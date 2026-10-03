import Image from "next/image";

export type InlineMediaPlateMeta = {
  src: string;
  alt: string;
  caption: string;
};

/**
 * Reading-unit illustration. Next/Image's native lazy loading keeps below-fold
 * media off the early network path while the server-rendered figure preserves
 * captions and layout space.
 */
export default function InlineMediaPlate({
  plate,
}: {
  plate: InlineMediaPlateMeta;
}) {
  return (
    <figure className="ew-section-plate">
      <span className="ew-section-plate-media">
        <Image
          src={plate.src}
          alt={plate.alt}
          fill
          sizes="(min-width: 1100px) 640px, (min-width: 861px) 48vw, 100vw"
          quality={70}
        />
      </span>
      <figcaption>{plate.caption}</figcaption>
    </figure>
  );
}
