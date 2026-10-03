import { createJesusRoomMetadata } from "@/lib/jesus/metadata";

const DESCRIPTION =
  "The death, the three days in the tomb, the forty days of appearances, and the ascension — every moment labelled with the sources that report it, and the differences between them left visible.";

export const metadata = createJesusRoomMetadata({
  title: "From the cross to the ascension",
  description: DESCRIPTION,
  path: "/jesus/risen",
});

export default function Layout({ children }: { children: React.ReactNode }) {
  return children;
}
