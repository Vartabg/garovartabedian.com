import type { Metadata } from "next";

const JESUS_ROOM_IMAGE = {
  url: "/worlds/jesus.jpg",
  width: 1200,
  height: 800,
  alt: "The stone rolled away from an open garden tomb at dawn, folded linen resting on the rock",
};

export function createJesusRoomMetadata({
  title,
  description,
  path,
}: {
  title: string;
  description: string;
  path: `/jesus/${string}`;
}): Metadata {
  const socialTitle = `${title} — Jesus Christ`;

  return {
    title,
    description,
    alternates: { canonical: path },
    openGraph: {
      title: socialTitle,
      description,
      siteName: "Garo Vartabedian",
      type: "article",
      url: path,
      images: [JESUS_ROOM_IMAGE],
    },
    twitter: {
      card: "summary_large_image",
      title: socialTitle,
      description,
      images: [JESUS_ROOM_IMAGE.url],
    },
  };
}
