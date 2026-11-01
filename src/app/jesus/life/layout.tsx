import { I18nProvider } from "@/lib/i18n/context";
import { createJesusRoomMetadata } from "@/lib/jesus/metadata";
import { getLife } from "@/lib/jesus/server";

/** Counted from the data the room renders, so the numbers cannot drift (it said 68 references when there were 93). */
const { events } = getLife();
const EVENTS = events.length;
const REFS = events.reduce((total, event) => total + event.refs.length, 0);

const DESCRIPTION = `${EVENTS} Gospel events from Bethlehem to the ascension, placed on a coordinate-based map with ${REFS} source references and careful location notes.`;

export const metadata = createJesusRoomMetadata({
  title: "His life on the map",
  description: DESCRIPTION,
  path: "/jesus/life",
});

export default function Layout({ children }: { children: React.ReactNode }) {
  return <I18nProvider>{children}</I18nProvider>;
}
