import { createJesusRoomMetadata } from "@/lib/jesus/metadata";

const DESCRIPTION =
  "Interactive side-by-side synoptic harmony and word-level pericope diffing across Matthew, Mark, Luke, and John in English (WEB) and Greek (SBLGNT), revealing Triple Tradition, Q-Source agreements, and Sondergut.";

export const metadata = createJesusRoomMetadata({
  title: "Synoptic Harmony & Pericope Diffing",
  description: DESCRIPTION,
  path: "/jesus/harmony",
});

export default function Layout({ children }: { children: React.ReactNode }) {
  return children;
}
