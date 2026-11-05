export type StoryCite = {
  chapter: number;
  verse: number;
};

export type StoryPlace = {
  /** Percent across the picture. */
  x: number;
  /** Percent down the picture. Larger means lower, the pit. */
  y: number;
  side: "left" | "right";
};

export type StoryStop = {
  id: string;
  title: string;
  /** Short name drawn on the picture. */
  mark: string;
  /** One short guide line. The verse itself stays on the cite. */
  line: string;
  cites: readonly StoryCite[];
  place: StoryPlace;
  /** Show the hosted words of the first cite on the path. */
  words?: boolean;
};

export type StoryMove = {
  id: string;
  label: string;
  stops: readonly StoryStop[];
};

export type ScriptureStory = {
  slug: string;
  title: string;
  reference: string;
  book: "GEN" | "EXO" | "RUT" | "1SA" | "1KI" | "EST" | "DAN" | "JON" | "LUK";
  fromChapter: number;
  toChapter: number;
  summary: string;
  moves: readonly StoryMove[];
};

/**
 * Joseph as a short path. Each stop is one plain line. The cites point at
 * the hosted World English Bible. Only the last stop prints the verse,
 * because that sentence is the message of the story.
 */
function placeColumn(stops: Omit<StoryStop, "place">[], side: "left" | "right"): StoryStop[] {
  const top = 20;
  const bottom = side === "left" ? 86 : 78;
  return stops.map((stop, index) => {
    const y = stops.length === 1 ? top : Math.round(top + ((bottom - top) * index) / (stops.length - 1));
    return { ...stop, place: { x: side === "left" ? 4 : 52, y, side } };
  });
}

function pathStory(
  story: Omit<ScriptureStory, "moves" | "summary"> & { down: Omit<StoryStop, "place">[]; up: Omit<StoryStop, "place">[] },
): ScriptureStory {
  const { down, up, ...rest } = story;
  return {
    ...rest,
    summary: "Tap a point. One stop at a time.",
    moves: [
      { id: "down", label: "Down", stops: placeColumn(down, "left") },
      { id: "up", label: "Up", stops: placeColumn(up, "right") },
    ],
  };
}

const noah = pathStory({
  slug: "noah",
  title: "Noah",
  reference: "Genesis 6–9",
  book: "GEN",
  fromChapter: 6,
  toChapter: 9,
  down: [
    { id: "favor", title: "Favor", mark: "Favor", line: "Noah found favor in Yahweh’s eyes.", cites: [{ chapter: 6, verse: 8 }] },
    { id: "ship", title: "The ship", mark: "Ship", line: "He was told to make a ship of gopher wood.", cites: [{ chapter: 6, verse: 14 }] },
    { id: "rain", title: "The rain", mark: "Rain", line: "It rained forty days and forty nights.", cites: [{ chapter: 7, verse: 12 }] },
    { id: "waters", title: "The waters", mark: "Waters", line: "The waters lifted the ship.", cites: [{ chapter: 7, verse: 17 }] },
  ],
  up: [
    { id: "remembered", title: "Remembered", mark: "Remembered", line: "God remembered Noah.", cites: [{ chapter: 8, verse: 1 }] },
    { id: "leaf", title: "The leaf", mark: "Leaf", line: "The dove brought an olive leaf.", cites: [{ chapter: 8, verse: 11 }] },
    { id: "rainbow", title: "The rainbow", mark: "Rainbow", line: "Then God said this.", cites: [{ chapter: 9, verse: 13 }], words: true },
  ],
});

const mountain = pathStory({
  slug: "mountain",
  title: "The mountain",
  reference: "Genesis 22",
  book: "GEN",
  fromChapter: 22,
  toChapter: 22,
  down: [
    { id: "isaac", title: "Isaac", mark: "Isaac", line: "Take your son, Isaac, whom you love.", cites: [{ chapter: 22, verse: 2 }] },
    { id: "wood", title: "The wood", mark: "Wood", line: "Abraham laid the wood on Isaac.", cites: [{ chapter: 22, verse: 6 }] },
    { id: "lamb", title: "The lamb", mark: "Lamb", line: "Isaac asked where the lamb was.", cites: [{ chapter: 22, verse: 7 }] },
    { id: "knife", title: "The knife", mark: "Knife", line: "Abraham took the knife to kill his son.", cites: [{ chapter: 22, verse: 10 }] },
  ],
  up: [
    { id: "angel", title: "The angel", mark: "Angel", line: "Yahweh’s angel called, Abraham, Abraham.", cites: [{ chapter: 22, verse: 11 }] },
    { id: "ram", title: "The ram", mark: "Ram", line: "A ram was offered instead of his son.", cites: [{ chapter: 22, verse: 13 }] },
    { id: "provide", title: "The name", mark: "Provide", line: "Then he named that place.", cites: [{ chapter: 22, verse: 14 }], words: true },
  ],
});

const ruth = pathStory({
  slug: "ruth",
  title: "Ruth",
  reference: "Ruth",
  book: "RUT",
  fromChapter: 1,
  toChapter: 4,
  down: [
    { id: "famine", title: "The famine", mark: "Famine", line: "A famine sent them to Moab.", cites: [{ chapter: 1, verse: 1 }] },
    { id: "loss", title: "The loss", mark: "Loss", line: "Her husband and both sons died.", cites: [{ chapter: 1, verse: 5 }] },
    { id: "stay", title: "I will go", mark: "Ruth", line: "Where you go, I will go.", cites: [{ chapter: 1, verse: 16 }] },
  ],
  up: [
    { id: "field", title: "The field", mark: "Field", line: "Ruth went to glean in the field.", cites: [{ chapter: 2, verse: 2 }] },
    { id: "kinsman", title: "A kinsman", mark: "Kinsman", line: "Boaz was one of their near kinsmen.", cites: [{ chapter: 2, verse: 20 }] },
    { id: "cover", title: "Cover me", mark: "Cover", line: "She asked the near kinsman to cover her.", cites: [{ chapter: 3, verse: 9 }] },
    { id: "obed", title: "Obed", mark: "Obed", line: "Then they named him.", cites: [{ chapter: 4, verse: 17 }], words: true },
  ],
});

const sea = pathStory({
  slug: "sea",
  title: "The sea",
  reference: "Exodus 14–15",
  book: "EXO",
  fromChapter: 14,
  toChapter: 15,
  down: [
    { id: "afraid", title: "Afraid", mark: "Afraid", line: "They saw Egypt and were afraid.", cites: [{ chapter: 14, verse: 10 }] },
    { id: "still", title: "Stand still", mark: "Still", line: "Moses told them to stand still.", cites: [{ chapter: 14, verse: 13 }] },
    { id: "wind", title: "The wind", mark: "Wind", line: "Yahweh drove the sea back by a strong wind.", cites: [{ chapter: 14, verse: 21 }] },
  ],
  up: [
    { id: "walls", title: "The walls", mark: "Walls", line: "The waters were a wall on both sides.", cites: [{ chapter: 14, verse: 22 }] },
    { id: "morning", title: "Morning", mark: "Morning", line: "The sea returned in the morning.", cites: [{ chapter: 14, verse: 27 }] },
    { id: "song", title: "The song", mark: "Song", line: "Then they sang this.", cites: [{ chapter: 15, verse: 2 }], words: true },
  ],
});

const david = pathStory({
  slug: "david",
  title: "David",
  reference: "1 Samuel 17",
  book: "1SA",
  fromChapter: 17,
  toChapter: 17,
  down: [
    { id: "giant", title: "The giant", mark: "Giant", line: "A champion came out, Goliath of Gath.", cites: [{ chapter: 17, verse: 4 }] },
    { id: "afraid", title: "Afraid", mark: "Afraid", line: "Saul and Israel were greatly afraid.", cites: [{ chapter: 17, verse: 11 }] },
  ],
  up: [
    { id: "stones", title: "Five stones", mark: "Stones", line: "David chose five smooth stones.", cites: [{ chapter: 17, verse: 40 }] },
    { id: "name", title: "The name", mark: "Name", line: "He came in the name of Yahweh of Armies.", cites: [{ chapter: 17, verse: 45 }] },
    { id: "battle", title: "The battle", mark: "Battle", line: "Then David said this.", cites: [{ chapter: 17, verse: 47 }], words: true },
    { id: "stone", title: "The stone", mark: "Stone", line: "The stone sank into his forehead.", cites: [{ chapter: 17, verse: 49 }] },
  ],
});

const fire = pathStory({
  slug: "fire",
  title: "The fire",
  reference: "1 Kings 18",
  book: "1KI",
  fromChapter: 18,
  toChapter: 18,
  down: [
    { id: "two", title: "Two sides", mark: "Two", line: "How long will you waver between the two sides?", cites: [{ chapter: 18, verse: 21 }] },
    { id: "call", title: "By fire", mark: "Fire", line: "The God who answers by fire, let him be God.", cites: [{ chapter: 18, verse: 24 }] },
    { id: "silent", title: "No voice", mark: "Silent", line: "They called to Baal. There was no voice.", cites: [{ chapter: 18, verse: 26 }] },
  ],
  up: [
    { id: "fell", title: "The fire", mark: "Fell", line: "Yahweh’s fire fell and consumed the offering.", cites: [{ chapter: 18, verse: 38 }] },
    { id: "god", title: "He is God", mark: "God", line: "Then the people said this.", cites: [{ chapter: 18, verse: 39 }], words: true },
    { id: "rain", title: "The rain", mark: "Rain", line: "The sky grew black, and there was a great rain.", cites: [{ chapter: 18, verse: 45 }] },
  ],
});

const jonah = pathStory({
  slug: "jonah",
  title: "Jonah",
  reference: "Jonah",
  book: "JON",
  fromChapter: 1,
  toChapter: 4,
  down: [
    { id: "fled", title: "He fled", mark: "Fled", line: "Jonah fled from the presence of Yahweh.", cites: [{ chapter: 1, verse: 3 }] },
    { id: "storm", title: "The storm", mark: "Storm", line: "Yahweh sent a great wind on the sea.", cites: [{ chapter: 1, verse: 4 }] },
    { id: "sea", title: "The sea", mark: "Sea", line: "They threw Jonah into the sea.", cites: [{ chapter: 1, verse: 15 }] },
    { id: "fish", title: "The fish", mark: "Fish", line: "A huge fish swallowed him.", cites: [{ chapter: 1, verse: 17 }] },
  ],
  up: [
    { id: "land", title: "Dry land", mark: "Land", line: "The fish put him on dry land.", cites: [{ chapter: 2, verse: 10 }] },
    { id: "nineveh", title: "Nineveh", mark: "Nineveh", line: "The people of Nineveh believed God.", cites: [{ chapter: 3, verse: 5 }] },
    { id: "spared", title: "Spared", mark: "Spared", line: "God relented and did not do it.", cites: [{ chapter: 3, verse: 10 }] },
    { id: "city", title: "The city", mark: "City", line: "Then Yahweh said this.", cites: [{ chapter: 4, verse: 11 }], words: true },
  ],
});

const furnace = pathStory({
  slug: "furnace",
  title: "The furnace",
  reference: "Daniel 3",
  book: "DAN",
  fromChapter: 3,
  toChapter: 3,
  down: [
    { id: "image", title: "The image", mark: "Image", line: "The king set up an image of gold.", cites: [{ chapter: 3, verse: 1 }] },
    { id: "refuse", title: "They refused", mark: "Refuse", line: "These men would not serve his gods.", cites: [{ chapter: 3, verse: 12 }] },
    { id: "able", title: "Our God", mark: "Able", line: "Then they said this.", cites: [{ chapter: 3, verse: 17 }], words: true },
    { id: "if-not", title: "But if not", mark: "If not", line: "But if not, they still would not worship it.", cites: [{ chapter: 3, verse: 18 }] },
  ],
  up: [
    { id: "four", title: "Four men", mark: "Four", line: "The king saw four men in the fire.", cites: [{ chapter: 3, verse: 25 }] },
    { id: "safe", title: "No power", mark: "Safe", line: "The fire had no power on their bodies.", cites: [{ chapter: 3, verse: 27 }] },
  ],
});

const lions = pathStory({
  slug: "lions",
  title: "The lions",
  reference: "Daniel 6",
  book: "DAN",
  fromChapter: 6,
  toChapter: 6,
  down: [
    { id: "decree", title: "The decree", mark: "Decree", line: "Pray to no one but the king for thirty days.", cites: [{ chapter: 6, verse: 7 }] },
    { id: "prayed", title: "He prayed", mark: "Prayed", line: "Daniel prayed three times a day, as before.", cites: [{ chapter: 6, verse: 10 }] },
    { id: "den", title: "The den", mark: "Den", line: "They cast Daniel into the den of lions.", cites: [{ chapter: 6, verse: 16 }] },
  ],
  up: [
    { id: "angel", title: "The angel", mark: "Angel", line: "Then Daniel said this.", cites: [{ chapter: 6, verse: 22 }], words: true },
    { id: "safe", title: "No harm", mark: "Safe", line: "No harm was found on him.", cites: [{ chapter: 6, verse: 23 }] },
  ],
});

const esther = pathStory({
  slug: "esther",
  title: "Esther",
  reference: "Esther",
  book: "EST",
  fromChapter: 2,
  toChapter: 8,
  down: [
    { id: "queen", title: "The crown", mark: "Queen", line: "The king set the royal crown on Esther.", cites: [{ chapter: 2, verse: 17 }] },
    { id: "decree", title: "The letters", mark: "Decree", line: "Letters went out to destroy the Jews.", cites: [{ chapter: 3, verse: 13 }] },
    { id: "time", title: "This time", mark: "Time", line: "Then Mordecai said this.", cites: [{ chapter: 4, verse: 14 }], words: true },
  ],
  up: [
    { id: "scepter", title: "The scepter", mark: "Scepter", line: "The king held out the golden scepter.", cites: [{ chapter: 5, verse: 2 }] },
    { id: "gallows", title: "The gallows", mark: "Gallows", line: "They hanged Haman on his own gallows.", cites: [{ chapter: 7, verse: 10 }] },
    { id: "light", title: "Light", mark: "Light", line: "The Jews had light, gladness, joy, and honor.", cites: [{ chapter: 8, verse: 16 }] },
  ],
});

const manger = pathStory({
  slug: "manger",
  title: "The manger",
  reference: "Luke 2",
  book: "LUK",
  fromChapter: 2,
  toChapter: 2,
  down: [
    { id: "decree", title: "The decree", mark: "Decree", line: "Caesar sent out a decree to enroll the world.", cites: [{ chapter: 2, verse: 1 }] },
    { id: "trough", title: "The trough", mark: "Trough", line: "She laid him in a feeding trough.", cites: [{ chapter: 2, verse: 7 }] },
    { id: "field", title: "The field", mark: "Field", line: "Shepherds kept watch over their flock by night.", cites: [{ chapter: 2, verse: 8 }] },
  ],
  up: [
    { id: "joy", title: "Good news", mark: "Joy", line: "The angel brought good news of great joy.", cites: [{ chapter: 2, verse: 10 }] },
    { id: "savior", title: "A Savior", mark: "Savior", line: "Then the angel said this.", cites: [{ chapter: 2, verse: 11 }], words: true },
    { id: "glory", title: "Glory", mark: "Glory", line: "Glory to God in the highest.", cites: [{ chapter: 2, verse: 14 }] },
  ],
});

const son = pathStory({
  slug: "lost-son",
  title: "The lost son",
  reference: "Luke 15",
  book: "LUK",
  fromChapter: 15,
  toChapter: 15,
  down: [
    { id: "far", title: "A far country", mark: "Far", line: "The younger son traveled into a far country.", cites: [{ chapter: 15, verse: 13 }] },
    { id: "pigs", title: "The pigs", mark: "Pigs", line: "He wanted the pods that the pigs ate.", cites: [{ chapter: 15, verse: 16 }] },
    { id: "himself", title: "He came to himself", mark: "Himself", line: "He came to himself.", cites: [{ chapter: 15, verse: 17 }] },
  ],
  up: [
    { id: "ran", title: "He ran", mark: "Ran", line: "His father saw him, ran, and kissed him.", cites: [{ chapter: 15, verse: 20 }] },
    { id: "robe", title: "The robe", mark: "Robe", line: "The father called for the best robe.", cites: [{ chapter: 15, verse: 22 }] },
    { id: "alive", title: "Alive", mark: "Alive", line: "Then the father said this.", cites: [{ chapter: 15, verse: 24 }], words: true },
  ],
});

const tomb = pathStory({
  slug: "tomb",
  title: "The tomb",
  reference: "Luke 22–24",
  book: "LUK",
  fromChapter: 22,
  toChapter: 24,
  down: [
    { id: "bread", title: "The bread", mark: "Bread", line: "This is my body, which is given for you.", cites: [{ chapter: 22, verse: 19 }] },
    { id: "cup", title: "The cup", mark: "Cup", line: "Not my will, but yours, be done.", cites: [{ chapter: 22, verse: 42 }] },
    { id: "look", title: "The look", mark: "Look", line: "The Lord turned and looked at Peter.", cites: [{ chapter: 22, verse: 61 }] },
    { id: "cross", title: "The Skull", mark: "Cross", line: "They crucified him at the place called The Skull.", cites: [{ chapter: 23, verse: 33 }] },
  ],
  up: [
    { id: "hands", title: "Into your hands", mark: "Hands", line: "Father, into your hands I commit my spirit.", cites: [{ chapter: 23, verse: 46 }] },
    { id: "stone", title: "The tomb", mark: "Tomb", line: "They laid him in a tomb cut in stone.", cites: [{ chapter: 23, verse: 53 }] },
    { id: "risen", title: "Risen", mark: "Risen", line: "Then they said this.", cites: [{ chapter: 24, verse: 6 }], words: true },
  ],
});

export const SCRIPTURE_STORIES: readonly ScriptureStory[] = [
  {
    slug: "joseph",
    title: "Joseph",
    reference: "Genesis 37–50",
    book: "GEN",
    fromChapter: 37,
    toChapter: 50,
    summary: "Tap a point. One stop at a time.",
    moves: [
      {
        id: "down",
        label: "Down",
        stops: [
          {
            id: "tunic",
            title: "The tunic",
            mark: "Tunic",
            line: "His father loved him more. His brothers hated him.",
            cites: [{ chapter: 37, verse: 3 }],
            place: { x: 4, y: 20, side: "left" },
          },
          {
            id: "sold",
            title: "Sold",
            mark: "Sold",
            line: "They sold him for twenty pieces of silver.",
            cites: [{ chapter: 37, verse: 28 }],
            place: { x: 4, y: 42, side: "left" },
          },
          {
            id: "prison",
            title: "Prison",
            mark: "Prison",
            line: "He refused Potiphar's wife. He was put in prison.",
            cites: [{ chapter: 39, verse: 20 }],
            place: { x: 4, y: 64, side: "left" },
          },
          {
            id: "forgotten",
            title: "Forgotten",
            mark: "Forgotten",
            line: "The cupbearer forgot him.",
            cites: [{ chapter: 40, verse: 23 }],
            place: { x: 4, y: 86, side: "left" },
          },
        ],
      },
      {
        id: "up",
        label: "Up",
        stops: [
          {
            id: "egypt",
            title: "Over Egypt",
            mark: "Egypt",
            line: "Pharaoh set him over all of Egypt.",
            cites: [{ chapter: 41, verse: 41 }],
            place: { x: 52, y: 20, side: "right" },
          },
        ],
      },
      {
        id: "meeting",
        label: "Face to face",
        stops: [
          {
            id: "bow",
            title: "They bowed",
            mark: "Bowed",
            line: "His brothers bowed down. They did not know him.",
            cites: [{ chapter: 42, verse: 6 }],
            place: { x: 52, y: 42, side: "right" },
          },
          {
            id: "name",
            title: "I am Joseph",
            mark: "Joseph",
            line: "He told them who he was.",
            cites: [{ chapter: 45, verse: 4 }],
            place: { x: 52, y: 62, side: "right" },
          },
          {
            id: "good",
            title: "What he said",
            mark: "His words",
            line: "Then he said this.",
            cites: [{ chapter: 50, verse: 20 }],
            place: { x: 52, y: 82, side: "right" },
            words: true,
          },
        ],
      },
    ],
  },
  noah,
  mountain,
  ruth,
  sea,
  david,
  fire,
  jonah,
  furnace,
  lions,
  esther,
  manger,
  son,
  tomb,
];

export function getScriptureStory(slug: string): ScriptureStory | undefined {
  return SCRIPTURE_STORIES.find((story) => story.slug === slug);
}

export function scriptureStoryPath(slug: string): string {
  return `/scriptures/stories/${slug}`;
}

export function storyStops(story: ScriptureStory): StoryStop[] {
  return story.moves.flatMap((move) => [...move.stops]);
}
