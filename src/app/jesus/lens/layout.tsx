import { createJesusRoomMetadata } from "@/lib/jesus/metadata";

const DESCRIPTION =
  "Eight sourced perspectives on Jesus across faith, historical inquiry, later tradition, and lore—kept distinct from one another and from the evidence.";

export const metadata = createJesusRoomMetadata({
  title: "World views",
  description: DESCRIPTION,
  path: "/jesus/lens",
});

export default function Layout({ children }: { children: React.ReactNode }) {
  return children;
}
