import type {
  EncountersData,
  Evidence,
  FallData,
  OrderData,
  TeachingData,
} from "./types";

/**
 * The whole story — a chronological spine across records this world already
 * publishes. This module holds only keys and editorial lines; every quote,
 * citation, and evidence grade resolves from the source record, so a stop
 * can never present a claim more strongly than its room does.
 */

export type ArcStopKind = "band" | "fall" | "appearance" | "exorcism" | "teaching";

export type ArcStop = {
  kind: ArcStopKind;
  /** Band/fall/teaching id, or an encounter/exorcism ref such as "GEN 28:12". */
  key: string;
  /** One editorial line connecting the record to its era. */
  note: string;
};

export type ArcEra = {
  id: string;
  when: string;
  title: string;
  claim: string;
  claimEvidence: Evidence;
  stops: ArcStop[];
};

export const ANGEL_ARC: ArcEra[] = [
  {
    id: "throne",
    when: "Before history",
    title: "The throne",
    claim:
      "Before any rebellion is mentioned, the text shows a throne already occupied and a court already worshipping. Angels are creatures, made through the Son — not eternal rivals of God.",
    claimEvidence: {
      status: "inferred",
      note: "The passages are direct; their placement before the fall follows the record's own order, not a dated chronology.",
    },
    stops: [
      { kind: "band", key: "throne-seraphim", note: "Isaiah and John see the same throne room, centuries apart." },
      { kind: "band", key: "cherubim", note: "Guardians at Eden's gate, and woven over the ark." },
      { kind: "teaching", key: "col-1-16", note: "Every rank named later in this room was created through him." },
    ],
  },
  {
    id: "fall",
    when: "The rebellion",
    title: "The fall",
    claim:
      "Scripture never tells the fall as one story. It leaves fragments — a taunt, a poem, a war in heaven — and the joining of them is interpretation, marked at each step.",
    claimEvidence: {
      status: "inferred",
      note: "Each fragment is labelled where it lives; the single storyline readers often imagine is an editorial arrangement.",
    },
    stops: [
      { kind: "fall", key: "gen-6-1-4", note: "The sons of God and the Nephilim — the oldest fragment, and the most disputed." },
      { kind: "fall", key: "isa-14-12-15", note: "A taunt against Babylon's king, later read as the adversary's pride." },
      { kind: "fall", key: "ezk-28-12-17", note: "A lament for Tyre's king, in language that seems to reach behind him." },
      { kind: "fall", key: "rev-12-7-9", note: "The fullest picture of the war — placed here as a picture, not as the earliest text." },
    ],
  },
  {
    id: "israel",
    when: "Israel's story",
    title: "Encounters before Christ",
    claim:
      "Through Israel's story the unseen keeps stepping into view: a stairway at Bethel, an army around Dothan, a prince resisted on the road to Daniel — and an accuser who must ask permission.",
    claimEvidence: {
      status: "inferred",
      note: "The encounters are stated directly; gathering them into one era is the editorial step.",
    },
    stops: [
      { kind: "appearance", key: "GEN 28:12", note: "Jacob dreams of a stairway busy with angels." },
      { kind: "appearance", key: "2KI 6:17", note: "A servant's eyes are opened to the army already there." },
      { kind: "appearance", key: "DAN 10:4-14", note: "A messenger delayed by the prince of Persia." },
      { kind: "fall", key: "job-1-6-12", note: "The accuser appears in the council — and can go only so far." },
    ],
  },
  {
    id: "christ",
    when: "Christ",
    title: "Confrontation and triumph",
    claim:
      "The encounters change key when Jesus comes: angels announce and attend him, demons name him and beg, and the cross is spoken of as the powers disarmed.",
    claimEvidence: {
      status: "inferred",
      note: "Each episode is stated in its Gospel; the change of key across them is the editorial reading.",
    },
    stops: [
      { kind: "appearance", key: "LUK 1:26-38", note: "Gabriel announces a son to Mary in Nazareth." },
      { kind: "exorcism", key: "MRK 5:1-20", note: "Legion begs not to be sent out of the country." },
      { kind: "fall", key: "jhn-12-31", note: "On the way to the cross, the ruler of this world is cast out." },
      { kind: "teaching", key: "col-2-15", note: "The cross read back: rulers and authorities disarmed." },
      { kind: "appearance", key: "MAT 28:2-7", note: "An angel rolls the stone back and speaks first of the resurrection." },
    ],
  },
  {
    id: "now",
    when: "Now",
    title: "The church age",
    claim:
      "The same record speaks into the present without spectacle: a struggle not against flesh and blood, spirits to be tested, strangers who may be angels. Where Acts shows a confrontation, it is shown as Acts history — not as a promise about today.",
    claimEvidence: {
      status: "inferred",
      note: "The teachings are quoted directly; applying them to the present age is the interpretive step, and it is labelled as such.",
    },
    stops: [
      { kind: "teaching", key: "eph-6-12", note: "The struggle is named — and its target is not people." },
      { kind: "teaching", key: "1jn-4-1", note: "Test the spirits: not every voice is believed." },
      { kind: "teaching", key: "heb-13-2", note: "Hospitality, with the possibility left open." },
      { kind: "teaching", key: "mat-18-10", note: "The little ones have angels who see the Father's face." },
      { kind: "exorcism", key: "ACT 16:16-18", note: "In the Acts record: a spirit of divination confronted at Philippi." },
    ],
  },
  {
    id: "end",
    when: "The end",
    title: "The end of the adversary",
    claim:
      "The text speaks of the end as settled, though it does not date it: the accuser bound and thrown down, fire prepared for the devil and his angels, and every power finally made subject. His story ends in defeat, not in a rival kingdom that lasts.",
    claimEvidence: {
      status: "inferred",
      note: "The prophetic passages state the end directly; their timing is left unresolved, and this room does not resolve it either.",
    },
    stops: [
      { kind: "fall", key: "rev-20-abyss-end", note: "An angel binds the dragon for a thousand years." },
      { kind: "band", key: "lake-of-fire", note: "The fire prepared for the devil and his angels." },
      { kind: "teaching", key: "1co-6-3", note: "The saints will judge angels — the judged become judges' charge." },
      { kind: "teaching", key: "1pe-3-22", note: "Angels, authorities, and powers made subject to him." },
    ],
  },
];

export type AngelsArcData = {
  order: OrderData;
  fall: FallData;
  encounters: EncountersData;
  teaching: TeachingData;
};

export type ResolvedArcStop = {
  kind: ArcStopKind;
  key: string;
  note: string;
  title: string;
  line?: string;
  quote?: string;
  cite?: string;
  evidence?: Evidence;
  roomHref: string;
  roomLabel: string;
  readerRef?: string;
};

const encounterSlug = (ref: string) => `enc-${ref.replace(/[^A-Za-z0-9]+/g, "-")}`;

/** Resolve a stop against the source records; null when the key no longer exists. */
export function resolveArcStop(stop: ArcStop, data: AngelsArcData): ResolvedArcStop | null {
  switch (stop.kind) {
    case "band": {
      const band = data.order.bands.find((item) => item.id === stop.key);
      if (!band) return null;
      return {
        ...stop,
        title: band.name,
        line: band.line,
        evidence: band.evidence,
        roomHref: `/angels#band-${band.id}`,
        roomLabel: "Open in the order",
        readerRef: band.refs[0],
      };
    }
    case "fall": {
      const step = data.fall.steps.find((item) => item.id === stop.key);
      if (!step) return null;
      return {
        ...stop,
        title: step.title,
        quote: step.quote,
        cite: step.cite,
        evidence: step.evidence,
        roomHref: `/angels/fall#${step.id}`,
        roomLabel: "Open in the fall",
        readerRef: step.ref || undefined,
      };
    }
    case "appearance": {
      const appearance = data.encounters.appeared.find((item) => item.ref === stop.key);
      if (!appearance) return null;
      return {
        ...stop,
        title: appearance.event,
        line: appearance.line,
        quote: appearance.quote,
        roomHref: `/angels/encounters#${encounterSlug(appearance.ref)}`,
        roomLabel: "Open in the encounters",
        readerRef: appearance.ref,
      };
    }
    case "exorcism": {
      const exorcism = data.encounters.castOut.find((item) => item.ref === stop.key);
      if (!exorcism) return null;
      return {
        ...stop,
        title: exorcism.event,
        line: exorcism.line,
        quote: exorcism.theySaid || undefined,
        roomHref: `/angels/encounters#${encounterSlug(exorcism.ref)}`,
        roomLabel: "Open in the encounters",
        readerRef: exorcism.ref,
      };
    }
    case "teaching": {
      const entry = data.teaching.entries.find((item) => item.id === stop.key);
      if (!entry) return null;
      return {
        ...stop,
        title: entry.title,
        line: entry.line,
        quote: entry.quote,
        roomHref: `/angels#${entry.id}`,
        roomLabel: "Open in the teaching",
        readerRef: entry.ref,
      };
    }
  }
}
