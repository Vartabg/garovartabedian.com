import snapshot from "../../../public/meta/corpus-health.json";

export type CorpusHealth = {
  schemaVersion: number;
  generatedBy: string;
  corpus: {
    books: {
      hostedIds: number;
      unionChapterSlots: number;
      sourceBackedBriefings: number;
    };
    traditions: {
      count: number;
      shelves: { id: string; hostedBookIds: number }[];
    };
    translations: { count: number; ids: string[] };
    guides: {
      files: number;
      questions: number;
      questionsWithVerseRefs: number;
      questionsWithoutVerseRefs: number;
      batchTemplateGuides: number;
      customStructuredGuides: number;
      review: {
        agentReviewed: number;
        humanReviewed: number;
        untracked: number;
      };
      v2: {
        rubricVersion: string;
        provenance: number;
        passing: number;
        failing: number;
      };
    };
    crossReferences: { sourceVerses: number; targets: number };
    topics: { count: number; references: number };
    originals: {
      editions: { id: string; name: string; revision: string }[];
      books: number;
      chapters: number;
      verses: number;
      wordTokens: number;
      versesWithSourceReferenceMappings: number;
      sourceReferenceMappings: number;
    };
    earlyWritings: { texts: number; sections: number };
  };
  validation: {
    guides: {
      coverage: {
        status: string;
        guides: number;
        chapterSlots: number;
        scope: string;
      };
      referencesAndQuotations: {
        status: string;
        scope: string;
        test: string;
      };
      v2Rubric: {
        status: string;
        rubricVersion: string;
        guidesWithProvenance: number;
        passing: number;
        failing: number;
        scope: string;
      };
      editorialReview: {
        status: string;
        agentReviewed: number;
        humanReviewed: number;
        untracked: number;
        note: string;
      };
    };
  };
  coverage: {
    /** Present when the semantic index has been built; null otherwise. */
    semanticSearch?: {
      model: string;
      dims: number;
      quantization: string;
      translation: string;
      books: number;
      chapters: number;
      verses: number;
      verseShardBytes: number;
    } | null;
    search: {
      translationIds: string[];
      availableTranslationIds: string[];
      scope: string;
    };
    originalLanguages: {
      editionIds: string[];
      hasGreekSeptuagint: boolean;
      hasTextualApparatus: boolean;
    };
  };
};

export const CORPUS_HEALTH = snapshot as CorpusHealth;

export const coveragePercent = (part: number, whole: number) =>
  whole === 0 ? "0.0%" : `${((part / whole) * 100).toFixed(1)}%`;
