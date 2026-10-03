import Image from "next/image";

type WorldImagePlateProps = {
  alt: string;
  caption: string;
  src: string;
};

export default function WorldImagePlate({
  alt,
  caption,
  src,
}: WorldImagePlateProps) {
  return (
    <figure className="world-image-plate">
      <span className="world-image-plate-media">
        <Image src={src} alt={alt} fill sizes="(min-width: 900px) 760px, 100vw" />
      </span>
      <figcaption>{caption}</figcaption>
    </figure>
  );
}
