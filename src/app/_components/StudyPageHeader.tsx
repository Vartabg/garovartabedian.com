import { getSiteLocation } from "@/lib/site-navigation";

/** One name and purpose from the same index that visitors use to find a tool. */
export default function StudyPageHeader({ path, action }: { path: string; action: string }) {
  const page = getSiteLocation(path);
  return (
    <header className="study-page-header">
      <p className="kicker">Scripture study</p>
      <h1 data-hand="capitals">{page.label}</h1>
      <p className="lede">{page.note}</p>
      <p className="study-page-hint">{action}</p>
    </header>
  );
}
