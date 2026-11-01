import { createJesusRoomMetadata } from "@/lib/jesus/metadata";
import { getChristianWitnesses, getHistory, getStones } from "@/lib/jesus/server";

/** Counted from the shelves the room renders, so the number cannot drift (it said seventeen when there were twenty). */
const RECORDS = getChristianWitnesses().length + getHistory().length + getStones().length;

const DESCRIPTION = `${RECORDS} early Christian, Jewish, Roman, and archaeological records, dated and separated by what each can and cannot establish about Jesus.`;

export const metadata = createJesusRoomMetadata({
  title: "What history can establish",
  description: DESCRIPTION,
  path: "/jesus/history",
});

export default function Layout({ children }: { children: React.ReactNode }) {
  return children;
}
