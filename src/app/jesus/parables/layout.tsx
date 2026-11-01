import { createJesusRoomMetadata } from "@/lib/jesus/metadata";
const DESCRIPTION = "Parables and figures of speech from the Gospels, with related accounts side by side and stories in the Gospel of Thomas.";

export const metadata = createJesusRoomMetadata({
  title: "Parables",
  description: DESCRIPTION,
  path: "/jesus/parables",
});

export default function Layout({ children }: { children: React.ReactNode }) {
  return children;
}
