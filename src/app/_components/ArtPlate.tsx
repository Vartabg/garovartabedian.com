"use client";

import Image from "next/image";
import { useRef, useState, type PointerEvent as ReactPointerEvent } from "react";

/**
 * A public-domain artwork in a reserved frame. The box holds its space before
 * the image decodes, so nothing reflows. Every source is a file on this site
 * (see scripts/site/vendor-museum-art.mjs); the caption still credits and
 * links the museum the work belongs to, which is where the plate falls back to
 * if its file ever goes missing.
 */
export default function ArtPlate({
  src,
  alt,
  title,
  sub,
  museum,
  objectUrl,
}: {
  src: string;
  alt: string;
  title: string;
  sub: string;
  museum: string;
  objectUrl: string;
}) {
  const [failed, setFailed] = useState(false);
  const frameRef = useRef<HTMLDivElement>(null);
  const loupeRef = useRef<HTMLSpanElement>(null);

  // The glass: on a fine pointer, a loupe follows the hand across the plate and
  // shows the work at two and a half times, in its true colour. It maps the
  // pointer to the painted area of the contained image, not the whole frame.
  const moveGlass = (event: ReactPointerEvent<HTMLDivElement>) => {
    const frame = frameRef.current;
    const loupe = loupeRef.current;
    const image = frame?.querySelector("img");
    if (!frame || !loupe || !image || event.pointerType !== "mouse") return;
    const box = frame.getBoundingClientRect();
    const natural = image.naturalWidth / (image.naturalHeight || 1);
    const scale = Math.min(box.width / natural, box.height);
    const painted = { w: scale * natural, h: scale };
    const offset = { x: (box.width - painted.w) / 2, y: (box.height - painted.h) / 2 };
    const x = event.clientX - box.left;
    const y = event.clientY - box.top;
    if (x < offset.x || x > offset.x + painted.w || y < offset.y || y > offset.y + painted.h) {
      loupe.style.opacity = "0";
      return;
    }
    const zoom = 2.5;
    const radius = loupe.offsetWidth / 2;
    loupe.style.left = `${x - radius}px`;
    loupe.style.top = `${y - radius}px`;
    loupe.style.backgroundSize = `${painted.w * zoom}px ${painted.h * zoom}px`;
    loupe.style.backgroundPosition = `${-((x - offset.x) * zoom - radius)}px ${-((y - offset.y) * zoom - radius)}px`;
    loupe.style.opacity = "1";
  };
  const hideGlass = () => {
    if (loupeRef.current) loupeRef.current.style.opacity = "0";
  };

  return (
    <figure className="artplate">
      <div
        className="artplate-frame"
        ref={frameRef}
        onPointerMove={moveGlass}
        onPointerLeave={hideGlass}
      >
        {failed ? (
          <a
            className="artplate-missing"
            href={objectUrl}
            target="_blank"
            rel="noopener noreferrer"
          >
            <span className="artplate-missing-title">{title}</span>
            <span className="artplate-missing-cta">View at {museum} ↗</span>
          </a>
        ) : (
          <Image
            src={src}
            alt={alt}
            fill
            sizes="(min-width: 900px) 220px, (min-width: 600px) 33vw, 100vw"
            loading="lazy"
            onError={() => setFailed(true)}
          />
        )}
        {!failed && (
          <span
            ref={loupeRef}
            className="artplate-loupe"
            aria-hidden="true"
            style={{ backgroundImage: `url(${src})` }}
          />
        )}
      </div>
      <figcaption>
        <strong>{title}</strong>
        <span>{sub}</span>
        <a href={objectUrl} target="_blank" rel="noopener noreferrer" className="textlink">
          {museum}
        </a>
      </figcaption>
    </figure>
  );
}
