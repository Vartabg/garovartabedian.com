import { I18nProvider } from "@/lib/i18n/context";
import { createJesusRoomMetadata } from "@/lib/jesus/metadata";

const DESCRIPTION =
  "Forty Gospel events from Bethlehem to the ascension, placed on a coordinate-based map with 68 source references and careful location notes.";

export const metadata = createJesusRoomMetadata({
  title: "His life on the map",
  description: DESCRIPTION,
  path: "/jesus/life",
});

export default function Layout({ children }: { children: React.ReactNode }) {
  return <I18nProvider>{children}</I18nProvider>;
}
