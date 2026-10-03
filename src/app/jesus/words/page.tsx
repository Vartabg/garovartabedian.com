import { getWordCounts, getWordsBook } from "@/lib/jesus/server";
import { canons } from "@/lib/scriptures/server/canons";
import { originalManifest } from "@/lib/scriptures/server";
import WordsRoom from "./WordsRoom";

/** His words — red-letter index from the server. */
export default function WordsPage() {
  const initialBook = "MAT";
  return (
    <WordsRoom
      initialBook={initialBook}
      initialVerses={getWordsBook(initialBook)}
      counts={getWordCounts()}
      canons={canons}
      originalEditions={originalManifest.books}
    />
  );
}
