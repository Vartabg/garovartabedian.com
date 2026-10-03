import type { VideoExcerpt } from "../site/excerpt-video";

type EssayParagraph = {
  text: string;
  sources?: { label: string; href: string }[];
};

export type DiamondEssaySection = VideoExcerpt & {
  context: string;
  paragraphs: EssayParagraph[];
};

/**
 * Timings belong to PowerfulJRE's YouTube upload, not the ad-inserted podcast.
 * Short quotations were cross-checked against the video's English automatic
 * captions and the independent Podscripts transcript on 2026-09-07.
 * See docs/research/diamond-christianity-excerpts.md for provenance and limits.
 */
export const DIAMOND_ESSAY_SECTIONS: DiamondEssaySection[] = [
  {
    id: "paul",
    title: "Paul joined a movement that already existed",
    quote: "Paul was the great organizer.",
    start: 790,
    end: 830,
    context: "Diamond assigns Paul an organizing role while also crediting the appeal and reach of Jesus’ message. The excerpt preserves both parts of his answer.",
    paragraphs: [
      {
        text: "Paul’s importance is clear, but his own letters resist a story in which Christianity begins with him. In Galatians, he describes persecuting the church before joining it and later meeting Cephas, or Peter, and James, whom he identifies as the Lord’s brother. Paul insists that his gospel came through revelation; those meetings do not establish that he received every teaching from Jerusalem. They do place him within a movement that preceded his participation.",
        sources: [{ label: "Galatians 1:11–24", href: "https://bible.usccb.org/bible/galatians/1" }],
      },
      {
        text: "Nor should we defend Paul by denying that he organized. He coordinated collections, travel, and fellow workers. Expecting Christ’s return did not prevent practical planning. The historical question is how his religious commitments shaped that work and how it related to the work of others.",
        sources: [{ label: "1 Corinthians 16:1–12", href: "https://bible.usccb.org/bible/1corinthians/16" }],
      },
    ],
  },
  {
    id: "mark",
    title: "The evidence begins before Mark",
    quote: "something like 20 years",
    start: 851,
    end: 865,
    context: "Diamond estimates the interval between Jesus’ death and the writing of Mark. This short phrase comes from his dating claim, which the player supplies in full.",
    paragraphs: [
      {
        text: "Around 70 CE is a conventional date for Mark, with disagreement about the precise timing. That places the Gospel roughly four decades after the crucifixion. Correcting the interval matters, but a later date does not itself answer questions about historical reliability. We still have to examine the sources and traditions behind the narrative.",
        sources: [{ label: "Dale Martin, Yale lecture on Mark", href: "https://oyc.yale.edu/religious-studies/rlst-152/lecture-6" }],
      },
      {
        text: "Paul’s First Letter to the Corinthians takes us back to the 50s CE. In chapter 15, he presents the proclamation of Christ’s death, burial, resurrection, and appearances as something he received and passed on. This is early evidence of resurrection belief. It does not supply a precise date for the tradition’s formation or independently verify the event it describes.",
        sources: [
          { label: "Dating 1 Corinthians", href: "https://bible.usccb.org/bible/1corinthians/0" },
          { label: "1 Corinthians 15:3–11", href: "https://bible.usccb.org/bible/1corinthians/15" },
        ],
      },
    ],
  },
  {
    id: "belief",
    title: "Growth and truth are different questions",
    quote: "stretching … scientific understanding.",
    start: 1215,
    end: 1243,
    context: "Diamond expresses skepticism about the virgin birth and ascension, then questions whether belief in the virgin birth drove Christian expansion.",
    paragraphs: [
      {
        text: "Whether a claim is true, whether people believe it, and what their belief leads them to do require different kinds of evidence. A historian can investigate the effects of a conviction without accepting its truth. A Christian can recognize the role of social conditions without treating them as a disproof of faith.",
      },
      {
        text: "The virgin birth is also a particular doctrine. An argument about its role in conversion cannot automatically stand for every Christian conviction. Paul makes the resurrection indispensable to his own account of faith: without it, he says, the preaching and belief would be empty. That tells us something about his understanding of the movement, even while readers disagree about his central claim.",
        sources: [{ label: "1 Corinthians 15:12–19", href: "https://bible.usccb.org/bible/1corinthians/15" }],
      },
    ],
  },
  {
    id: "care",
    title: "The reasons people gave for caring matter",
    quote: "taking care of the sick",
    start: 1243,
    end: 1316,
    context: "Diamond connects Christian expansion with family life, the position of women, and care for the sick. He also makes claims about comparative longevity.",
    paragraphs: [
      {
        text: "A surviving account of epidemic care comes from Dionysius of Alexandria, whose letter Eusebius preserves. It describes Christians nursing the sick and some caregivers becoming infected and dying. Dionysius understands their service in Christian terms. His testimony records costly care and the religious meaning he assigned to it.",
        sources: [{ label: "Eusebius, Church History 7.22", href: "https://www.newadvent.org/fathers/250107.htm" }],
      },
      {
        text: "A bishop praising his community is a committed witness. The letter does not establish that every Christian stayed, that every non-Christian fled, or that we can calculate an empire-wide survival advantage. Rodney Stark’s influential demographic reconstruction remains contested; precise mortality reductions should not be presented as measured ancient statistics.",
        sources: [{ label: "Bart Ehrman on the limits of the nursing argument", href: "https://ehrmanblog.org/did-superior-health-care-lead-to-the-dominance-of-christianity/" }],
      },
      {
        text: "Paul supplies an earlier and more direct connection between belief and generosity. In 2 Corinthians 8, he appeals to Christ’s self-giving to encourage a collection for others. This does not reveal every donor’s private motives. It does establish that a theological conviction was part of the explicit appeal for material help. An explanation of the practice should account for that evidence.",
        sources: [{ label: "2 Corinthians 8:1–15", href: "https://www.biblegateway.com/passage/?search=2+Corinthians+8%3A1-15&version=NRSVUE" }],
      },
    ],
  },
  {
    id: "growth",
    title: "A social explanation still needs historical evidence",
    quote: "nothing to do with the virgin birth.",
    start: 1316,
    end: 1337,
    context: "Diamond adds a claim about literacy and Constantine’s bureaucracy before returning to his conclusion about the virgin birth.",
    paragraphs: [
      {
        text: "The literacy contrast needs correction. Pliny’s correspondence with Trajan is itself evidence of literate, non-Christian Roman administrators long before Constantine. Broad claims about Christian and non-Christian literacy require comparative evidence; the existence of Christian readers does not establish that their neighbors could not read.",
        sources: [{ label: "Pliny and Trajan, Letters 10.96–97", href: "https://www.earlychristianwritings.com/text/pliny.html" }],
      },
      {
        text: "The larger question remains worth asking. Belief, organization, and circumstance can interact: a conviction may encourage a practice, a community may sustain it, and its effects may attract others. Identifying those relationships neither proves nor disproves Christian faith. It helps explain how people lived it. The historical account should include what Christians did, the conditions that made their actions possible, and the reasons they gave for doing them.",
      },
    ],
  },
];
