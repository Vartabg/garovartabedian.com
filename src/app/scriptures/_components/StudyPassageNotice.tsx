import { resolveStudyContext } from "@/lib/scriptures/server/study-context";
import type { StudySearchParams } from "@/lib/scriptures/study-context";
import StudyContextBanner from "./StudyContextBanner";

export default async function StudyPassageNotice({ searchParams, note }: {
  searchParams?: Promise<StudySearchParams>;
  note: string;
}) {
  const resolved = await resolveStudyContext(await searchParams ?? {});
  return <StudyContextBanner {...resolved} note={note} />;
}
