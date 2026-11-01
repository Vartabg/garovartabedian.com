import type { Metadata } from "next";
import StudyPageHeader from "@/app/_components/StudyPageHeader";
import CanonsMatrix from "../_components/CanonsMatrix";

export const metadata: Metadata = {
  title: "Canons & traditions",
  description:
    "Interactive comparative matrix of biblical canons across Protestant, Catholic, Eastern Orthodox, Ethiopian Tewahedo, Armenian, and Jewish Tanakh traditions with manuscript witness data.",
  alternates: { canonical: "/scriptures/canons" },
  openGraph: { title: "Canons & traditions", url: "/scriptures/canons", images: ["/worlds/scriptures.jpg"] },
};

export default function CanonsPage() {
  return (
    <div className="scr-canons-page">
      <StudyPageHeader path="/scriptures/canons" action="Choose a tradition or compare two collections. Open a book for its hosted editions and source witnesses." />

      <CanonsMatrix />
    </div>
  );
}
