export type ApostleStory = {
  slug: string;
  kind: "peter" | "thomas" | "pentecost";
  title: string;
  reference: string;
  eyebrow: string;
  description: string;
  person: string;
  recordHref: string;
  image: string;
  alt: string;
  encounterImage: string;
  encounterAlt: string;
  book: "JHN" | "ACT";
  chapter: number;
  start: number;
  end: number;
  opening: { title: string; text: string; reference: string };
  encounter: { title: string; text: string; reference: string };
  after: { title: string; text: string; href: string; label: string };
};

export const APOSTLE_STORIES = [
  {
    slug: "come-and-eat", kind: "peter", title: "Come and eat.",
    reference: "John 21:1–19", eyebrow: "Peter · The shore",
    description: "An empty night. A fire on the shore. A calling spoken again.",
    person: "Peter", recordHref: "/apostles/twelve#peter",
    image: "/apostles/stories/peter-night.jpg",
    alt: "Disciples tend an empty fishing net on a quiet lake before dawn. Interpretive illustration.",
    encounterImage: "/apostles/stories/peter-breakfast.jpg",
    encounterAlt: "Jesus offers bread beside a charcoal fire as Peter sits with him on the shore. Interpretive illustration.",
    book: "JHN", chapter: 21, start: 1, end: 19,
    opening: {
      title: "A night with nothing to show.",
      text: "Peter goes fishing, and the others go with him. Through the night, they catch nothing. At daybreak Jesus stands on the beach, but they do not recognize him. He tells them where to cast the net. The catch comes before the recognition.",
      reference: "John 21:1–8",
    },
    encounter: {
      title: "Breakfast is already waiting.",
      text: "On shore there is a charcoal fire, fish, and bread. Jesus invites them to eat. After breakfast, he turns to Peter with a question about love—and a charge to care for his sheep.",
      reference: "John 21:9–17",
    },
    after: {
      title: "The call still has a cost.",
      text: "The story does not end at the warmth of the fire. Jesus speaks of Peter being led where he does not want to go; John explains this as a sign of his death. Then comes the invitation again: “Follow me.”",
      href: "/scriptures/protestant/JHN/21#v18", label: "Read John 21:18–19",
    },
  },
  {
    slug: "peace-be-with-you", kind: "thomas", title: "Peace be with you.",
    reference: "John 20:24–29", eyebrow: "Thomas · The room",
    description: "The others have seen him. Thomas has not. Eight days later, Jesus speaks.",
    person: "Thomas", recordHref: "/apostles/twelve#thomas",
    image: "/apostles/stories/thomas-waiting.jpg",
    alt: "Thomas listens at the edge of a lamplit room while other disciples gather nearby. Interpretive illustration.",
    encounterImage: "/apostles/stories/thomas-peace.jpg",
    encounterAlt: "Jesus stands with open hands before Thomas, with space between them and no touch depicted. Interpretive illustration.",
    book: "JHN", chapter: 20, start: 24, end: 29,
    opening: {
      title: "Someone was missing.",
      text: "Thomas was not with the disciples when Jesus came. They tell him they have seen the Lord. He answers with a demand to see and touch for himself. John lets his words stand.",
      reference: "John 20:24–25",
    },
    encounter: {
      title: "Eight days later.",
      text: "The disciples are inside again. This time Thomas is with them. The doors are locked, yet Jesus comes and stands among them. He speaks peace, then addresses Thomas directly. The invitation is followed by a confession.",
      reference: "John 20:26–28",
    },
    after: {
      title: "A word for those who have not seen.",
      text: "Jesus’s reply reaches beyond the room: “Blessed are those who have not seen and have believed.” The story names Thomas’s confession without narrating whether he touched Jesus.",
      href: "/scriptures/protestant/JHN/20#v29", label: "Read John 20:29",
    },
  },
  {
    slug: "every-language", kind: "pentecost", title: "In our own languages.",
    reference: "Acts 2:1–13", eyebrow: "Pentecost · The gathering",
    description: "One gathered community. A sound like wind. Many hearers, hearing home.",
    person: "The gathered community", recordHref: "/apostles/sent",
    image: "/apostles/stories/pentecost-gathering.jpg",
    alt: "A community sits together in a simple Jerusalem house, with small forms like flame above them. Interpretive illustration.",
    encounterImage: "/apostles/stories/pentecost-hearers.jpg",
    encounterAlt: "People of different ages gather to listen in a Jerusalem street. Interpretive illustration.",
    book: "ACT", chapter: 2, start: 1, end: 13,
    opening: {
      title: "All together in one place.",
      text: "Acts describes a sound like a mighty wind filling the house, tongues like fire resting on each of them, and the Holy Spirit giving them speech in other languages. The gift comes to the gathered community; the account does not reduce that community to a list of twelve men.",
      reference: "Acts 2:1–4",
    },
    encounter: {
      title: "The hearers recognize their own words.",
      text: "Devout Jews from many places are in Jerusalem. A crowd gathers, bewildered: each hears the speakers in their own language. Acts names a wide world of hearers, including visitors from Rome, both Jews and proselytes.",
      reference: "Acts 2:5–11",
    },
    after: {
      title: "What does this mean?",
      text: "Amazement is not the only response. Some ask what it means; others mock. Then Peter stands with the eleven and speaks to the crowd. Follow his explanation before turning to the later roads of the apostles.",
      href: "/scriptures/protestant/ACT/2#v14", label: "Continue with Peter’s speech",
    },
  },
] as const satisfies readonly ApostleStory[];

export function getApostleStory(slug: string): ApostleStory | undefined {
  return APOSTLE_STORIES.find((story) => story.slug === slug);
}
