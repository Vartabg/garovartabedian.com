import { createJesusRoomMetadata } from "@/lib/jesus/metadata";

const DESCRIPTION =
  "Explore 2,059 verses marked as Jesus speaking across nine New Testament books, with chapter filters, word studies, and direct links to context.";

export const metadata = createJesusRoomMetadata({
  title: "His words",
  description: DESCRIPTION,
  path: "/jesus/words",
});

export default function Layout({ children }: { children: React.ReactNode }) {
  return children;
}
