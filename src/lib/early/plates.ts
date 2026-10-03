/** Illustration plates for Early Writings texts — one visual identity per theme. */

export type EarlyPlate = {
  src: string;
  alt: string;
  caption: string;
};

const PLATES: Record<string, EarlyPlate> = {
  didache: {
    src: "/early/plates/didache.jpg",
    alt: "A forked path at dusk — one road rising toward light, one descending into shadow",
    caption: "The Two Ways — the opening image of the church's oldest manual.",
  },
  "1clement": {
    src: "/early/plates/1clement.jpg",
    alt: "A parchment map connecting Rome and Corinth by sea, a letter carried between them",
    caption: "Rome writes to a divided Corinth, within living memory of the apostles.",
  },
  "2clement": {
    src: "/early/plates/2clement.jpg",
    alt: "A preacher addressing a small congregation from an open scroll in a lamplit house-church",
    caption: "Neither letter nor Clement — a sermon read aloud to a congregation.",
  },
  barnabas: {
    src: "/early/plates/barnabas.jpg",
    alt: "An ancient scroll unrolling into a luminous cross while a second path forks into shadow",
    caption: "Hebrew Scripture read as a cipher for Christ — once bound after the New Testament.",
  },
  diognetus: {
    src: "/early/plates/diognetus.jpg",
    alt: "A luminous inner figure standing within a crowded ancient city — soul within body",
    caption: "Christians in the world as the soul lives in the body.",
  },
  papias: {
    src: "/early/plates/papias.jpg",
    alt: "An elderly bishop under a plane tree speaking to listeners while parchment fragments float around them",
    caption: "Lost books survive only as quotations — and a preference for the living voice.",
  },
  "3corinthians": {
    src: "/early/plates/3corinthians.jpg",
    alt: "Two sealed scrolls crossing a water path between a prison window and a Corinthian assembly, with a rising figure of light",
    caption: "Corinth writes in alarm; a reply defends the resurrection of the flesh.",
  },
  quadratus: {
    src: "/early/plates/quadratus.jpg",
    alt: "A single luminous parchment scrap offered toward an imperial throne, healed figures standing as witnesses",
    caption: "One sentence to an emperor — some Jesus healed were still alive to be asked.",
  },
  "ignatius-ephesians": {
    src: "/early/plates/ignatius-ephesians.jpg",
    alt: "A congregation gathered in unity around a bishop's chair among the columns of Ephesus",
    caption: "Unity under the bishop — and a warning against false teachers.",
  },
  "ignatius-magnesians": {
    src: "/early/plates/ignatius-magnesians.jpg",
    alt: "A young bishop seated with elder advisors, the Maeander valley beyond an arched window",
    caption: "Unity under a bishop young enough that some doubted him.",
  },
  "ignatius-trallians": {
    src: "/early/plates/ignatius-trallians.jpg",
    alt: "A solid cross with real shadow beside a hollow phantom passing through without touching",
    caption: "A warning against the teaching that Christ only seemed to suffer.",
  },
  "ignatius-romans": {
    src: "/early/plates/ignatius-romans.jpg",
    alt: "A chained bishop refusing rescuing hands, the amphitheater of Rome ahead at sunset",
    caption: "The letter that begs Rome not to save him.",
  },
  "ignatius-philadelphians": {
    src: "/early/plates/ignatius-philadelphians.jpg",
    alt: "A cracked church wall repaired with golden seams, believers reaching across the fracture",
    caption: "A plea against schism, written from personal experience of one.",
  },
  "ignatius-smyrnaeans": {
    src: "/early/plates/ignatius-smyrnaeans.jpg",
    alt: "Many church lamps across Asia Minor connected by one golden thread toward Smyrna",
    caption: "The first time anyone wrote the words \"the catholic Church.\"",
  },
  "ignatius-polycarp": {
    src: "/early/plates/ignatius-polycarp.jpg",
    alt: "Two bishops meeting at a roadside milestone, a personal letter passed hand to hand",
    caption: "One bishop to another, weeks from death.",
  },
  "polycarp-philippians": {
    src: "/early/plates/polycarp-philippians.jpg",
    alt: "An elderly bishop writing by lamplight in a humble stone room",
    caption: "The disciple of John writes to Paul's church.",
  },
  "martyrdom-polycarp": {
    src: "/early/plates/martyrdom-polycarp.jpg",
    alt: "A robed figure standing calmly at the stake in a Roman arena, crowd as silhouettes",
    caption: "The earliest martyrdom account outside the New Testament.",
  },
  "epistula-apostolorum": {
    src: "/early/plates/epistula-apostolorum.jpg",
    alt: "A luminous robed figure in dialogue with seated apostle silhouettes in an upper room",
    caption: "The risen Christ in dialogue with the apostles.",
  },
  abgar: {
    src: "/early/plates/abgar.jpg",
    alt: "A royal messenger carrying a sealed scroll along a desert road toward a distant palace city",
    caption: "A king's letter to Jesus, and the reply tradition preserved.",
  },
  "ascension-isaiah": {
    src: "/early/plates/ascension-isaiah.jpg",
    alt: "Seven concentric heaven bands above the earth, a faint light descending through each layer",
    caption: "The Beloved descends through seven heavens in disguise — and rises again.",
  },
  enoch: {
    src: "/early/plates/enoch.jpg",
    alt: "Luminous beings descending from a star-filled sky toward a mountain peak at night",
    caption: "The oldest book in this room — watchers, apocalypse, and the verse Jude quotes.",
  },
  "shepherd-hermas": {
    src: "/early/plates/shepherd-hermas.jpg",
    alt: "A shepherd with staff beside an allegorical elderly woman representing the Church",
    caption: "A Roman book of visions — the Church as an aging woman.",
  },
  "apocalypse-paul": {
    src: "/early/plates/apocalypse-paul.jpg",
    alt: "Manuscript illumination of Paul and an angel on a parchment ridge between a golden heavenly city and a dark fiery underworld",
    caption: "Paul's tour of heaven and hell — the text behind Dante's Inferno.",
  },
};

export const IGNATIUS_ROAD_PLATE: EarlyPlate = {
  src: "/early/plates/ignatius-road.jpg",
  alt: "A storyteller's map of the eastern Mediterranean — Antioch to Rome with letter arcs at each stop",
  caption: "Solid line: his escorted road. Thin arcs: the seven letters.",
};

/** Plate for a hosted text id, or null when the text has no illustration yet. */
export function plateForText(id: string): EarlyPlate | null {
  return PLATES[id] ?? null;
}