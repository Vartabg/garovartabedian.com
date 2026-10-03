import type { Metadata } from "next";
import Link from "next/link";
import CanonsMatrix from "../_components/CanonsMatrix";

export const metadata: Metadata = {
  title: "Multi-Canonicity & Tradition Matrix · Scriptures",
  description:
    "Interactive comparative matrix of biblical canons across Protestant, Catholic, Eastern Orthodox, Ethiopian Tewahedo, Armenian, and Jewish Tanakh traditions with manuscript witness data.",
};

export default function CanonsPage() {
  return (
    <div className="scr-canons-page">
      <p className="kicker">
        <Link href="/scriptures">Scriptures</Link> · <Link href="/scriptures/search">Search</Link>
      </p>
      <h1>The Canons of Scripture</h1>
      <p className="lede">
        Compare which books each historical tradition receives as sacred Scripture,
        examine manuscript witnesses from Qumran to the Septuagint, and inspect
        the conciliar decrees that shaped the biblical canon.
      </p>

      <CanonsMatrix />
    </div>
  );
}
