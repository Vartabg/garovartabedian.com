import { NEGATION_WORDS, wordingTokens } from "./search-wording";

/** Versioned vocabulary bridges, never query-to-verse answers. Expansion is
 * supplemental and visible; a negated question is never expanded automatically. */
export const SEARCH_EXPANSION_VERSION = 1;
const concepts = [
  { words: ["loneliness", "lonely", "isolated", "isolation"], related: ["alone", "forsaken", "friend", "companionship"], topics: ["FRIENDSHIP", "COMFORT"] },
  { words: ["anxiety", "anxious", "worry", "worried"], related: ["worry", "care", "fear", "trust"], topics: ["CARE"] },
  { words: ["grief", "grieving", "bereavement"], related: ["mourning", "sorrow", "comfort"], topics: ["MOURNING", "COMFORT"] },
  { words: ["sadness", "sad", "discouraged", "discouragement"], related: ["sorrow", "hope", "comfort"], topics: ["SORROW", "HOPE"] },
  { words: ["afraid", "frightened", "fearful"], related: ["fear", "courage", "trust"], topics: ["FEAR", "COURAGE"] },
  { words: ["abandoned", "rejected", "rejection"], related: ["forsaken", "comfort", "friend"], topics: ["COMFORT", "FRIENDSHIP"] },
  { words: ["anger", "angry", "frustrated", "frustration"], related: ["wrath", "patience", "injustice"], topics: ["ANGER", "PATIENCE"] },
  { words: ["forgive", "forgiving", "forgiveness"], related: ["forgive", "mercy", "pardon"], topics: ["FORGIVENESS", "MERCY"] },
  { words: ["guilt", "guilty", "remorse"], related: ["repentance", "forgiveness", "conscience"], topics: ["REPENTANCE", "CONSCIENCE"] },
  { words: ["shame", "ashamed", "humiliation"], related: ["disgrace", "honor", "mercy"], topics: ["SHAME", "MERCY"] },
  { words: ["doubt", "doubting", "uncertain", "uncertainty"], related: ["doubt", "faith", "understanding"], topics: ["DOUBT", "FAITH"] },
  { words: ["tired", "exhausted", "exhaustion", "burnout"], related: ["weary", "rest", "burden"], topics: ["REST"] },
  { words: ["jealous", "jealousy", "envious", "envy"], related: ["envy", "jealousy", "contentment"], topics: ["ENVY", "JEALOUSY"] },
  { words: ["wealth", "wealthy", "rich", "prosperity"], related: ["riches", "wealth", "possessions"], topics: ["RICHES"] },
  { words: ["poverty", "poor", "hungry", "hunger"], related: ["poor", "hunger", "generosity"], topics: ["POOR", "HUNGER"] },
  { words: ["generous", "generosity", "charitable", "charity"], related: ["giving", "generosity", "poor"], topics: ["LIBERALITY", "CHARITY"] },
  { words: ["injustice", "unfair", "unfairness", "oppression"], related: ["justice", "oppression", "judgment"], topics: ["JUSTICE", "OPPRESSION"] },
  { words: ["conflict", "conflicts", "quarrel", "quarrels"], related: ["strife", "peace", "reconciliation"], topics: ["STRIFE", "PEACE"] },
  { words: ["hospitality", "guests", "travelers", "strangers"], related: ["stranger", "hospitality", "welcome"], topics: ["HOSPITALITY", "STRANGERS"] },
  { words: ["betrayal", "betrayed", "deception", "deceived"], related: ["betrayal", "deceit", "trust"], topics: ["TREACHERY", "DECEIT"] },
  { words: ["pride", "proud", "arrogance", "arrogant"], related: ["pride", "humility", "boasting"], topics: ["PRIDE", "HUMILITY"] },
  { words: ["patience", "patient", "enduring", "endurance"], related: ["patience", "steadfast", "suffering"], topics: ["PATIENCE", "PERSEVERANCE"] },
  { words: ["persecution", "persecuted", "hostility"], related: ["persecution", "enemies", "suffering"], topics: ["PERSECUTION"] },
  { words: ["afterlife", "dying", "die", "death"], related: ["death", "resurrection", "life"], topics: ["DEATH", "RESURRECTION"] },
  { words: ["save", "saved", "salvation"], related: ["salvation", "deliverance", "rescue"], topics: ["SALVATION"] },
  { words: ["wisdom", "wise", "decision", "decisions"], related: ["wisdom", "counsel", "understanding"], topics: ["WISDOM", "COUNSEL"] },
  { words: ["temptation", "tempted", "selfcontrol"], related: ["temptation", "desire", "restraint"], topics: ["TEMPTATION", "TEMPERANCE"] },
  { words: ["thankful", "thankfulness", "gratitude", "grateful"], related: ["thanksgiving", "thanks", "praise"], topics: ["THANKFULNESS", "PRAISE"] },
] as const;

export function searchExpansion(query: string) {
  const tokens = wordingTokens(query);
  const negated = tokens.some(t => NEGATION_WORDS.has(t));
  const matches = concepts.filter(c => c.words.some(word => tokens.includes(word)));
  const terms = [...new Set(matches.flatMap(c => [...c.related]))].filter(t => !tokens.includes(t)).slice(0, 6);
  const topics = [...new Set(matches.flatMap(c => [...c.topics]))];
  return { terms: negated ? [] : terms, topics: negated ? [] : topics, negated, query: !negated && terms.length ? `${query}. Related wording: ${terms.join(", ")}.` : null };
}
