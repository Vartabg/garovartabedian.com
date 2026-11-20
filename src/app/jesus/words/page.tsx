import { getWordCounts, getWordsBook } from "@/lib/jesus/server";
import { wordStudyFromQuery } from "@/lib/jesus/word-studies";
import { sayingStudyLinks } from "@/lib/jesus/saying-study-links";
import { canons } from "@/lib/scriptures/server/canons";
import { originalManifest } from "@/lib/scriptures/server";
import WordsRoom from "./WordsRoom";

/** His words — red-letter index from the server. */
export default async function WordsPage({
  searchParams,
}: {
  searchParams: Promise<{ study?: string | string[] }>;
}) {
  const requested = wordStudyFromQuery((await searchParams).study);
  const initialBook = requested?.anchor.book ?? "MAT";
  return (
    <WordsRoom
      initialBook={initialBook}
      initialStudy={requested?.id}
      initialVerses={getWordsBook(initialBook)}
      counts={getWordCounts()}
      canons={canons}
      originalEditions={originalManifest.books}
      studyLinks={sayingStudyLinks()}
    />
  );
}
