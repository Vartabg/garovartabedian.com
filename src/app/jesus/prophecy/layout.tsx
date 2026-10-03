import { createJesusRoomMetadata } from "@/lib/jesus/metadata";

const DESCRIPTION =
  "Fifty-four Old Testament passages set beside New Testament readings, with every connection labeled as explicit claim, echo, or Christian typology.";

export const metadata = createJesusRoomMetadata({
  title: "Prophecy and fulfillment",
  description: DESCRIPTION,
  path: "/jesus/prophecy",
});

export default function Layout({ children }: { children: React.ReactNode }) {
  return children;
}
