import { createJesusRoomMetadata } from "@/lib/jesus/metadata";

const DESCRIPTION =
  "Seventeen early Christian, Jewish, Roman, and archaeological records, dated and separated by what each can and cannot establish about Jesus.";

export const metadata = createJesusRoomMetadata({
  title: "What history can establish",
  description: DESCRIPTION,
  path: "/jesus/history",
});

export default function Layout({ children }: { children: React.ReactNode }) {
  return children;
}
