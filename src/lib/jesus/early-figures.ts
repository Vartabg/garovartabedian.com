import data from "../../../public/jesus/early-figures.json";
import originalReaders from "./lightfoot-original-readers.json";

export type EarlyFigurePart = { section: string; start: number; end: number; joinPrevious?: boolean };

export type EarlyFigure = {
  id: string; title: string; work: string; edition: string; section: string;
  locator: string; start: number; end: number; legacy?: boolean; legacyText?: "1clement"; speaker: string;
  translator: string; sha256: string; related?: string; relatedAlso?: string[]; note?: string;
  excerpt?: boolean; poetry?: boolean; preserveLines?: boolean; earlyComparisons?: string[]; compareFrom?: string;
  originalReader?: { edition: string; section: string; start: number; end: number };
  parts?: EarlyFigurePart[]; thomas?: { saying: number; note?: string }[];
};

export const EARLY_FIGURES: EarlyFigure[] = data as EarlyFigure[];
export const earlyFigureParts = (figure: EarlyFigure): EarlyFigurePart[] => figure.parts ?? [{ section: figure.section, start: figure.start, end: figure.end }];
export const EARLY_EXCERPT_URLS: Record<string, string> = {
  "eusebius-lee-audit-lyre-warrior-city": "https://archive.org/download/eusebiusbishopof00euse/eusebiusbishopof00euse.pdf#page=174",
  "eusebius-lee-audit-philosopher-mind": "https://archive.org/download/eusebiusbishopof00euse/eusebiusbishopof00euse.pdf#page=174",
  "eusebius-lee-audit-watering-husbandman": "https://archive.org/download/eusebiusbishopof00euse/eusebiusbishopof00euse.pdf#page=180",
  "eusebius-lee-audit-fountain-mind-messenger": "https://archive.org/download/eusebiusbishopof00euse/eusebiusbishopof00euse.pdf#page=182",
  "eusebius-lee-audit-ship-soul-body": "https://archive.org/download/eusebiusbishopof00euse/eusebiusbishopof00euse.pdf#page=184",
  "eusebius-lee-audit-body-divided": "https://archive.org/download/eusebiusbishopof00euse/eusebiusbishopof00euse.pdf#page=186",
  "eusebius-lee-audit-lyre-world": "https://archive.org/download/eusebiusbishopof00euse/eusebiusbishopof00euse.pdf#page=188",
  "eusebius-lee-audit-body-one-soul": "https://archive.org/download/eusebiusbishopof00euse/eusebiusbishopof00euse.pdf#page=189",
  "eusebius-lee-audit-one-sun-word": "https://archive.org/download/eusebiusbishopof00euse/eusebiusbishopof00euse.pdf#page=189",
  "eusebius-lee-audit-one-modeller": "https://archive.org/download/eusebiusbishopof00euse/eusebiusbishopof00euse.pdf#page=192",
  "eusebius-lee-audit-sun-fire-many-effects": "https://archive.org/download/eusebiusbishopof00euse/eusebiusbishopof00euse.pdf#page=193",
  "eusebius-lee-audit-word-world-lyre": "https://archive.org/download/eusebiusbishopof00euse/eusebiusbishopof00euse.pdf#page=194",
  "eusebius-lee-audit-imperial-city-heavens": "https://archive.org/download/eusebiusbishopof00euse/eusebiusbishopof00euse.pdf#page=196",
  "eusebius-lee-audit-imperial-city-ranks": "https://archive.org/download/eusebiusbishopof00euse/eusebiusbishopof00euse.pdf#page=198",
  "eusebius-lee-audit-imperial-city-application": "https://archive.org/download/eusebiusbishopof00euse/eusebiusbishopof00euse.pdf#page=200",
  "eusebius-lee-audit-heart-tablets": "https://archive.org/download/eusebiusbishopof00euse/eusebiusbishopof00euse.pdf#page=200",
  "eusebius-lee-audit-earth-rational-seed": "https://archive.org/download/eusebiusbishopof00euse/eusebiusbishopof00euse.pdf#page=203",
  "eusebius-lee-audit-sower-harvest-soul": "https://archive.org/download/eusebiusbishopof00euse/eusebiusbishopof00euse.pdf#page=205",
  "eusebius-lee-audit-birth-nurture": "https://archive.org/download/eusebiusbishopof00euse/eusebiusbishopof00euse.pdf#page=222",
  "eusebius-lee-audit-difficult-birth": "https://archive.org/download/eusebiusbishopof00euse/eusebiusbishopof00euse.pdf#page=223",
  "eusebius-lee-audit-birth-two-outcomes": "https://archive.org/download/eusebiusbishopof00euse/eusebiusbishopof00euse.pdf#page=223",
  "eusebius-lee-audit-seed-cultivated-soul": "https://archive.org/download/eusebiusbishopof00euse/eusebiusbishopof00euse.pdf#page=226",
  "eusebius-lee-audit-infant-adult-soul": "https://archive.org/download/eusebiusbishopof00euse/eusebiusbishopof00euse.pdf#page=227",
  "eusebius-lee-audit-body-wild-beast": "https://archive.org/download/eusebiusbishopof00euse/eusebiusbishopof00euse.pdf#page=230",
  "eusebius-lee-audit-seed-future-fruit": "https://archive.org/download/eusebiusbishopof00euse/eusebiusbishopof00euse.pdf#page=232",
  "eusebius-lee-audit-wickedness-nets": "https://archive.org/download/eusebiusbishopof00euse/eusebiusbishopof00euse.pdf#page=234",
  "eusebius-lee-audit-world-storm": "https://archive.org/download/eusebiusbishopof00euse/eusebiusbishopof00euse.pdf#page=248",
  "eusebius-lee-audit-plato-shipmaster": "https://archive.org/download/eusebiusbishopof00euse/eusebiusbishopof00euse.pdf#page=261",
  "eusebius-lee-audit-plato-storm": "https://archive.org/download/eusebiusbishopof00euse/eusebiusbishopof00euse.pdf#page=269",
  "eusebius-lee-audit-plato-chariot": "https://archive.org/download/eusebiusbishopof00euse/eusebiusbishopof00euse.pdf#page=270",
  "eusebius-lee-audit-maker-made": "https://archive.org/download/eusebiusbishopof00euse/eusebiusbishopof00euse.pdf#page=278",
  "eusebius-lee-audit-philosophers-war-giants": "https://archive.org/download/eusebiusbishopof00euse/eusebiusbishopof00euse.pdf#page=278",
  "eusebius-lee-audit-philosophers-war": "https://archive.org/download/eusebiusbishopof00euse/eusebiusbishopof00euse.pdf#page=280",
  "eusebius-lee-audit-physicians-consulted": "https://archive.org/download/eusebiusbishopof00euse/eusebiusbishopof00euse.pdf#page=282",
  "eusebius-lee-audit-soul-healing": "https://archive.org/download/eusebiusbishopof00euse/eusebiusbishopof00euse.pdf#page=284",
  "eusebius-lee-audit-sun-clay": "https://archive.org/download/eusebiusbishopof00euse/eusebiusbishopof00euse.pdf#page=287",
  "eusebius-lee-audit-pythian-oracle": "https://archive.org/download/eusebiusbishopof00euse/eusebiusbishopof00euse.pdf#page=299",
  "eusebius-lee-audit-tree-fruit": "https://archive.org/download/eusebiusbishopof00euse/eusebiusbishopof00euse.pdf#page=302",
  "eusebius-lee-audit-storm-peace": "https://archive.org/download/eusebiusbishopof00euse/eusebiusbishopof00euse.pdf#page=304",
  "eusebius-lee-audit-shepherd-lost-sheep": "https://archive.org/download/eusebiusbishopof00euse/eusebiusbishopof00euse.pdf#page=313",
  "eusebius-lee-audit-shepherd-physician-care": "https://archive.org/download/eusebiusbishopof00euse/eusebiusbishopof00euse.pdf#page=314",
  "eusebius-lee-audit-discipline-calamities": "https://archive.org/download/eusebiusbishopof00euse/eusebiusbishopof00euse.pdf#page=316",
  "eusebius-lee-audit-discipline-bridle": "https://archive.org/download/eusebiusbishopof00euse/eusebiusbishopof00euse.pdf#page=316",
  "eusebius-lee-audit-seed-herbs-fountain": "https://archive.org/download/eusebiusbishopof00euse/eusebiusbishopof00euse.pdf#page=321",
  "eusebius-lee-audit-punishment-rains": "https://archive.org/download/eusebiusbishopof00euse/eusebiusbishopof00euse.pdf#page=323",
  "eusebius-lee-audit-father-gifts-seed": "https://archive.org/download/eusebiusbishopof00euse/eusebiusbishopof00euse.pdf#page=323",
  "eusebius-lee-audit-war-engine": "https://archive.org/download/eusebiusbishopof00euse/eusebiusbishopof00euse.pdf#page=325",
  "eusebius-lee-audit-stream-and-family": "https://archive.org/download/eusebiusbishopof00euse/eusebiusbishopof00euse.pdf#page=326",
  "eusebius-lee-audit-world-family": "https://archive.org/download/eusebiusbishopof00euse/eusebiusbishopof00euse.pdf#page=327",
  "eusebius-lee-audit-swords-ploughshares": "https://archive.org/download/eusebiusbishopof00euse/eusebiusbishopof00euse.pdf#page=327",
  "eusebius-lee-audit-sun-rational-light": "https://archive.org/download/eusebiusbishopof00euse/eusebiusbishopof00euse.pdf#page=331",
  "eusebius-lee-audit-flock-evil-beasts": "https://archive.org/download/eusebiusbishopof00euse/eusebiusbishopof00euse.pdf#page=331",
  "eusebius-lee-audit-food-of-soul": "https://archive.org/download/eusebiusbishopof00euse/eusebiusbishopof00euse.pdf#page=338",
  "eusebius-lee-audit-eye-and-yoke": "https://archive.org/download/eusebiusbishopof00euse/eusebiusbishopof00euse.pdf#page=338",
  "eusebius-lee-audit-mind-rock-fruit": "https://archive.org/download/eusebiusbishopof00euse/eusebiusbishopof00euse.pdf#page=339",
  "eusebius-lee-audit-church-rock-3": "https://archive.org/download/eusebiusbishopof00euse/eusebiusbishopof00euse.pdf#page=339",
  "eusebius-lee-audit-fishers-3": "https://archive.org/download/eusebiusbishopof00euse/eusebiusbishopof00euse.pdf#page=340",
  "eusebius-lee-audit-armor-righteousness": "https://archive.org/download/eusebiusbishopof00euse/eusebiusbishopof00euse.pdf#page=340",
  "eusebius-lee-audit-word-sown": "https://archive.org/download/eusebiusbishopof00euse/eusebiusbishopof00euse.pdf#page=341",
  "eusebius-lee-audit-sun-doctrine": "https://archive.org/download/eusebiusbishopof00euse/eusebiusbishopof00euse.pdf#page=342",
  "eusebius-lee-audit-king-interpreter": "https://archive.org/download/eusebiusbishopof00euse/eusebiusbishopof00euse.pdf#page=345",
  "eusebius-lee-audit-sun-rays": "https://archive.org/download/eusebiusbishopof00euse/eusebiusbishopof00euse.pdf#page=347",
  "eusebius-lee-audit-musician-lyre": "https://archive.org/download/eusebiusbishopof00euse/eusebiusbishopof00euse.pdf#page=347",
  "eusebius-lee-audit-lyre-sunlight": "https://archive.org/download/eusebiusbishopof00euse/eusebiusbishopof00euse.pdf#page=349",
  "eusebius-lee-audit-seed-tablets": "https://archive.org/download/eusebiusbishopof00euse/eusebiusbishopof00euse.pdf#page=351",
  "eusebius-lee-audit-healing-souls-bodies": "https://archive.org/download/eusebiusbishopof00euse/eusebiusbishopof00euse.pdf#page=352",
  "eusebius-lee-audit-good-shepherd-wheat-3": "https://archive.org/download/eusebiusbishopof00euse/eusebiusbishopof00euse.pdf#page=354",
  "eusebius-lee-audit-wilderness-wild-beasts": "https://archive.org/download/eusebiusbishopof00euse/eusebiusbishopof00euse.pdf#page=358",
  "eusebius-lee-audit-strong-man": "https://archive.org/download/eusebiusbishopof00euse/eusebiusbishopof00euse.pdf#page=361",
  "eusebius-lee-audit-lamb-flock": "https://archive.org/download/eusebiusbishopof00euse/eusebiusbishopof00euse.pdf#page=363",
  "eusebius-lee-audit-death-ruler": "https://archive.org/download/eusebiusbishopof00euse/eusebiusbishopof00euse.pdf#page=367",
  "eusebius-lee-audit-death-theatre": "https://archive.org/download/eusebiusbishopof00euse/eusebiusbishopof00euse.pdf#page=369",
  "eusebius-lee-audit-body-instrument": "https://archive.org/download/eusebiusbishopof00euse/eusebiusbishopof00euse.pdf#page=375",
  "eusebius-lee-audit-parent-child": "https://archive.org/download/eusebiusbishopof00euse/eusebiusbishopof00euse.pdf#page=379",
  "eusebius-lee-audit-east-west-feast": "https://archive.org/download/eusebiusbishopof00euse/eusebiusbishopof00euse.pdf#page=381",
  "eusebius-lee-audit-east-west-feast-luke": "https://archive.org/download/eusebiusbishopof00euse/eusebiusbishopof00euse.pdf#page=384",
  "eusebius-lee-audit-fishers-gospels": "https://archive.org/download/eusebiusbishopof00euse/eusebiusbishopof00euse.pdf#page=385",
  "eusebius-lee-audit-fishers-net": "https://archive.org/download/eusebiusbishopof00euse/eusebiusbishopof00euse.pdf#page=387",
  "eusebius-lee-audit-fishers-catch-life": "https://archive.org/download/eusebiusbishopof00euse/eusebiusbishopof00euse.pdf#page=388",
  "eusebius-lee-audit-light-city-lamp": "https://archive.org/download/eusebiusbishopof00euse/eusebiusbishopof00euse.pdf#page=390",
  "eusebius-lee-audit-city-lamp-interpretation": "https://archive.org/download/eusebiusbishopof00euse/eusebiusbishopof00euse.pdf#page=391",
  "eusebius-lee-audit-light-and-housetops": "https://archive.org/download/eusebiusbishopof00euse/eusebiusbishopof00euse.pdf#page=392",
  "eusebius-lee-audit-church-rock-4": "https://archive.org/download/eusebiusbishopof00euse/eusebiusbishopof00euse.pdf#page=400",
  "eusebius-lee-audit-division-sword": "https://archive.org/download/eusebiusbishopof00euse/eusebiusbishopof00euse.pdf#page=402",
  "eusebius-lee-audit-isaiah-vineyard-reading": "https://archive.org/download/eusebiusbishopof00euse/eusebiusbishopof00euse.pdf#page=406",
  "eusebius-lee-audit-vineyard-tenants": "https://archive.org/download/eusebiusbishopof00euse/eusebiusbishopof00euse.pdf#page=406",
  "eusebius-lee-audit-cornerstone-interpretation": "https://archive.org/download/eusebiusbishopof00euse/eusebiusbishopof00euse.pdf#page=407",
  "eusebius-lee-audit-vineyard-feast-comparison": "https://archive.org/download/eusebiusbishopof00euse/eusebiusbishopof00euse.pdf#page=409",
  "eusebius-lee-audit-feast-servants": "https://archive.org/download/eusebiusbishopof00euse/eusebiusbishopof00euse.pdf#page=410",
  "eusebius-lee-audit-feast-invitations": "https://archive.org/download/eusebiusbishopof00euse/eusebiusbishopof00euse.pdf#page=412",
  "eusebius-lee-audit-vipers-interpretation": "https://archive.org/download/eusebiusbishopof00euse/eusebiusbishopof00euse.pdf#page=413",
  "eusebius-lee-audit-hen-interpretation": "https://archive.org/download/eusebiusbishopof00euse/eusebiusbishopof00euse.pdf#page=415",
  "eusebius-lee-audit-good-shepherd-4": "https://archive.org/download/eusebiusbishopof00euse/eusebiusbishopof00euse.pdf#page=428",
  "eusebius-lee-audit-shepherd-wolves": "https://archive.org/download/eusebiusbishopof00euse/eusebiusbishopof00euse.pdf#page=430",
  "eusebius-lee-audit-wheat-interpretation": "https://archive.org/download/eusebiusbishopof00euse/eusebiusbishopof00euse.pdf#page=431",
  "eusebius-lee-audit-harvest-and-fields": "https://archive.org/download/eusebiusbishopof00euse/eusebiusbishopof00euse.pdf#page=432",
  "eusebius-lee-audit-winnowing-floor": "https://archive.org/download/eusebiusbishopof00euse/eusebiusbishopof00euse.pdf#page=432",
  "eusebius-lee-audit-net-fishers": "https://archive.org/download/eusebiusbishopof00euse/eusebiusbishopof00euse.pdf#page=437",
  "eusebius-lee-audit-wolves-trees": "https://archive.org/download/eusebiusbishopof00euse/eusebiusbishopof00euse.pdf#page=437",
  "eusebius-lee-audit-sheep-wolves-voice": "https://archive.org/download/eusebiusbishopof00euse/eusebiusbishopof00euse.pdf#page=439",
  "eusebius-lee-audit-teacher-hidden": "https://archive.org/download/eusebiusbishopof00euse/eusebiusbishopof00euse.pdf#page=440",
  "eusebius-lee-audit-hidden-interpretation": "https://archive.org/download/eusebiusbishopof00euse/eusebiusbishopof00euse.pdf#page=441",
  "eusebius-lee-audit-harvest-after-sower": "https://archive.org/download/eusebiusbishopof00euse/eusebiusbishopof00euse.pdf#page=444",
  "eusebius-lee-audit-coming-lightning": "https://archive.org/download/eusebiusbishopof00euse/eusebiusbishopof00euse.pdf#page=448",
  "eusebius-lee-audit-lightning-interpretation": "https://archive.org/download/eusebiusbishopof00euse/eusebiusbishopof00euse.pdf#page=450",
  "eusebius-lee-audit-teachers-and-pupils": "https://archive.org/download/eusebiusbishopof00euse/eusebiusbishopof00euse.pdf#page=462",
  "eusebius-lee-audit-crafts-teachers": "https://archive.org/download/eusebiusbishopof00euse/eusebiusbishopof00euse.pdf#page=466",
  "eusebius-lee-audit-moses-accusation": "https://archive.org/download/eusebiusbishopof00euse/eusebiusbishopof00euse.pdf#page=487",
  "eusebius-lee-audit-rock-keys-5": "https://archive.org/download/eusebiusbishopof00euse/eusebiusbishopof00euse.pdf#page=494",
  "eusebius-lee-audit-soul-body": "https://archive.org/download/eusebiusbishopof00euse/eusebiusbishopof00euse.pdf#page=185",
  "eusebius-lee-audit-seed-coat": "https://archive.org/download/eusebiusbishopof00euse/eusebiusbishopof00euse.pdf#page=231",
  "eusebius-lee-audit-physician-remedies": "https://archive.org/download/eusebiusbishopof00euse/eusebiusbishopof00euse.pdf#page=322",
  "eusebius-lee-house-ship-city": "https://archive.org/download/eusebiusbishopof00euse/eusebiusbishopof00euse.pdf#page=171",
  "eusebius-lee-architect-house": "https://archive.org/download/eusebiusbishopof00euse/eusebiusbishopof00euse.pdf#page=173",
  "eusebius-lee-imperial-city": "https://archive.org/download/eusebiusbishopof00euse/eusebiusbishopof00euse.pdf#page=195",
  "eusebius-lee-birth-life": "https://archive.org/download/eusebiusbishopof00euse/eusebiusbishopof00euse.pdf#page=222",
  "eusebius-lee-seed-corruption": "https://archive.org/download/eusebiusbishopof00euse/eusebiusbishopof00euse.pdf#page=232",
  "eusebius-lee-physician-souls": "https://archive.org/download/eusebiusbishopof00euse/eusebiusbishopof00euse.pdf#page=315",
  "eusebius-lee-shepherd-physician": "https://archive.org/download/eusebiusbishopof00euse/eusebiusbishopof00euse.pdf#page=323",
  "eusebius-lee-vessel-fire": "https://archive.org/download/eusebiusbishopof00euse/eusebiusbishopof00euse.pdf#page=362",
  "eusebius-lee-vineyard-isaiah": "https://archive.org/download/eusebiusbishopof00euse/eusebiusbishopof00euse.pdf#page=406",
  "eusebius-lee-vineyard-explanation": "https://archive.org/download/eusebiusbishopof00euse/eusebiusbishopof00euse.pdf#page=407",
  "eusebius-lee-wedding-feast": "https://archive.org/download/eusebiusbishopof00euse/eusebiusbishopof00euse.pdf#page=409",
  "eusebius-lee-marriage-feast-interpretation": "https://archive.org/download/eusebiusbishopof00euse/eusebiusbishopof00euse.pdf#page=410",
  "eusebius-lee-serpents-vipers": "https://archive.org/download/eusebiusbishopof00euse/eusebiusbishopof00euse.pdf#page=413",
  "eusebius-lee-hen-chickens": "https://archive.org/download/eusebiusbishopof00euse/eusebiusbishopof00euse.pdf#page=415",
  "eusebius-lee-grain-wheat": "https://archive.org/download/eusebiusbishopof00euse/eusebiusbishopof00euse.pdf#page=431",
  "eusebius-lee-family-persecution": "https://archive.org/download/eusebiusbishopof00euse/eusebiusbishopof00euse.pdf#page=435",
  "eusebius-lee-net": "https://archive.org/download/eusebiusbishopof00euse/eusebiusbishopof00euse.pdf#page=436",
  "eusebius-lee-sower-interpretation": "https://archive.org/download/eusebiusbishopof00euse/eusebiusbishopof00euse.pdf#page=444",
  "eusebius-lee-weeds-interpretation": "https://archive.org/download/eusebiusbishopof00euse/eusebiusbishopof00euse.pdf#page=447",
  "eusebius-lee-fishers": "https://archive.org/download/eusebiusbishopof00euse/eusebiusbishopof00euse.pdf#page=502",
  "eusebius-lee-sower-quotation": "https://archive.org/download/eusebiusbishopof00euse/eusebiusbishopof00euse.pdf#page=443",
  "eusebius-lee-sower-explanation": "https://archive.org/download/eusebiusbishopof00euse/eusebiusbishopof00euse.pdf#page=443",
  "eusebius-lee-weeds-quotation": "https://archive.org/download/eusebiusbishopof00euse/eusebiusbishopof00euse.pdf#page=445",
  "eusebius-lee-weeds-explanation": "https://archive.org/download/eusebiusbishopof00euse/eusebiusbishopof00euse.pdf#page=446",
  "eusebius-lee-vineyard-quotation": "https://archive.org/download/eusebiusbishopof00euse/eusebiusbishopof00euse.pdf#page=405",
  "eusebius-lee-wedding-garment": "https://archive.org/download/eusebiusbishopof00euse/eusebiusbishopof00euse.pdf#page=413",
  "lightfoot-second-clement-small-great": "https://archive.org/download/apostolicfathers00lighuoft/apostolicfathers00lighuoft.pdf#page=105",
  "lightfoot-second-clement-house-robbers": "https://archive.org/download/apostolicfathers00lighuoft/apostolicfathers00lighuoft.pdf#page=107",
  "lightfoot-second-clement-barren": "https://archive.org/download/apostolicfathers00lighuoft/apostolicfathers00lighuoft.pdf#page=102",
  "lightfoot-second-clement-lips-heart": "https://archive.org/download/apostolicfathers00lighuoft/apostolicfathers00lighuoft.pdf#page=103",
  "lightfoot-second-clement-waiting-fruit": "https://archive.org/download/apostolicfathers00lighuoft/apostolicfathers00lighuoft.pdf#page=110",
  "lightfoot-hermas-tower-explanation": "https://archive.org/download/apostolicfathers00lighuoft/apostolicfathers00lighuoft.pdf#page=428",
  "lightfoot-hermas-three-forms": "https://archive.org/download/apostolicfathers00lighuoft/apostolicfathers00lighuoft.pdf#page=433",
  "lightfoot-hermas-beast-colors": "https://archive.org/download/apostolicfathers00lighuoft/apostolicfathers00lighuoft.pdf#page=435",
  "lightfoot-hermas-two-paths": "https://archive.org/download/apostolicfathers00lighuoft/apostolicfathers00lighuoft.pdf#page=444",
  "lightfoot-hermas-empty-vessels": "https://archive.org/download/apostolicfathers00lighuoft/apostolicfathers00lighuoft.pdf#page=451",
  "lightfoot-hermas-vineyard-servant-explanation": "https://archive.org/download/apostolicfathers00lighuoft/apostolicfathers00lighuoft.pdf#page=461",
  "lightfoot-hermas-clean-house": "https://archive.org/download/apostolicfathers00lighuoft/apostolicfathers00lighuoft.pdf#page=498",
  "lightfoot-barnabas-goats-thorns": "https://archive.org/download/apostolicfathers00lighuoft/apostolicfathers00lighuoft.pdf",
  "lightfoot-barnabas-thorns-heart": "https://archive.org/download/apostolicfathers00lighuoft/apostolicfathers00lighuoft.pdf",
  "lightfoot-first-clement-sheep-lamb": "https://archive.org/download/apostolicfathers00lighuoft/apostolicfathers00lighuoft.pdf",
  "lightfoot-barnabas-two-peoples": "https://archive.org/download/apostolicfathers00lighuoft/apostolicfathers00lighuoft.pdf",
  "lightfoot-first-clement-aaron-rod": "https://archive.org/download/apostolicfathers00lighuoft/apostolicfathers00lighuoft.pdf",
  "lightfoot-first-clement-pillars": "https://archive.org/download/apostolicfathers00lighuoft/apostolicfathers00lighuoft.pdf",
  "lightfoot-first-clement-dust-smoke": "https://archive.org/download/apostolicfathers00lighuoft/apostolicfathers00lighuoft.pdf",
  "lightfoot-first-clement-wisdom-fruit": "https://archive.org/download/apostolicfathers00lighuoft/apostolicfathers00lighuoft.pdf",
  "lightfoot-first-clement-pasture-prayer": "https://archive.org/download/apostolicfathers00lighuoft/apostolicfathers00lighuoft.pdf",
  "lightfoot-barnabas-yoke-sacrifice": "https://archive.org/download/apostolicfathers00lighuoft/apostolicfathers00lighuoft.pdf",
  "lightfoot-barnabas-fast-light": "https://archive.org/download/apostolicfathers00lighuoft/apostolicfathers00lighuoft.pdf",
  "lightfoot-barnabas-beast-covenant": "https://archive.org/download/apostolicfathers00lighuoft/apostolicfathers00lighuoft.pdf",
  "lightfoot-barnabas-sheep-sun": "https://archive.org/download/apostolicfathers00lighuoft/apostolicfathers00lighuoft.pdf",
  "lightfoot-barnabas-vessel-body": "https://archive.org/download/apostolicfathers00lighuoft/apostolicfathers00lighuoft.pdf",
  "acts-thomas-groom-prayer": "https://www.biblicalstudies.org.uk/pdf/e-books/james_m-r/apocryphal-new-testament_james.pdf",
  "acts-thomas-creditor": "https://www.biblicalstudies.org.uk/pdf/e-books/james_m-r/apocryphal-new-testament_james.pdf",
  "acts-thomas-youth-light": "https://www.biblicalstudies.org.uk/pdf/e-books/james_m-r/apocryphal-new-testament_james.pdf",
  "acts-thomas-desert-temple": "https://www.biblicalstudies.org.uk/pdf/e-books/james_m-r/apocryphal-new-testament_james.pdf",
  "acts-thomas-oil-121": "https://www.biblicalstudies.org.uk/pdf/e-books/james_m-r/apocryphal-new-testament_james.pdf",
  "acts-thomas-open-treasury": "https://www.biblicalstudies.org.uk/pdf/e-books/james_m-r/apocryphal-new-testament_james.pdf",
  "acts-thomas-prayer-opening": "https://www.biblicalstudies.org.uk/pdf/e-books/james_m-r/apocryphal-new-testament_james.pdf",
  "acts-thomas-four-one": "https://www.biblicalstudies.org.uk/pdf/e-books/james_m-r/apocryphal-new-testament_james.pdf",
  "acts-thomas-mother-houses": "https://www.biblicalstudies.org.uk/pdf/e-books/james_m-r/apocryphal-new-testament_james.pdf",
  "acts-thomas-good-shepherd": "https://www.biblicalstudies.org.uk/pdf/e-books/james_m-r/apocryphal-new-testament_james.pdf",
  "acts-thomas-spirit-return": "https://www.biblicalstudies.org.uk/pdf/e-books/james_m-r/apocryphal-new-testament_james.pdf",
  "acts-thomas-hidden-mother": "https://www.biblicalstudies.org.uk/pdf/e-books/james_m-r/apocryphal-new-testament_james.pdf",
  "acts-thomas-dwelling-places": "https://www.biblicalstudies.org.uk/pdf/e-books/james_m-r/apocryphal-new-testament_james.pdf",
  "acts-thomas-eagle-dream": "https://www.biblicalstudies.org.uk/pdf/e-books/james_m-r/apocryphal-new-testament_james.pdf",
  "acts-thomas-life-loan": "https://www.biblicalstudies.org.uk/pdf/e-books/james_m-r/apocryphal-new-testament_james.pdf",
  "acts-thomas-bread-life": "https://www.biblicalstudies.org.uk/pdf/e-books/james_m-r/apocryphal-new-testament_james.pdf",
  "acts-thomas-crown": "https://www.biblicalstudies.org.uk/pdf/e-books/james_m-r/apocryphal-new-testament_james.pdf",
  "acts-thomas-wedding-invitation": "https://www.biblicalstudies.org.uk/pdf/e-books/james_m-r/apocryphal-new-testament_james.pdf",
  "acts-thomas-old-new-48": "https://www.biblicalstudies.org.uk/pdf/e-books/james_m-r/apocryphal-new-testament_james.pdf",
  "acts-thomas-lost-sheep": "https://www.biblicalstudies.org.uk/pdf/e-books/james_m-r/apocryphal-new-testament_james.pdf",
  "acts-thomas-old-new-58": "https://www.biblicalstudies.org.uk/pdf/e-books/james_m-r/apocryphal-new-testament_james.pdf",
  "acts-thomas-heat-day": "https://www.biblicalstudies.org.uk/pdf/e-books/james_m-r/apocryphal-new-testament_james.pdf",
  "acts-thomas-flock-wolves": "https://www.biblicalstudies.org.uk/pdf/e-books/james_m-r/apocryphal-new-testament_james.pdf",
  "acts-thomas-wolves-clothing": "https://www.biblicalstudies.org.uk/pdf/e-books/james_m-r/apocryphal-new-testament_james.pdf",
  "acts-thomas-stolen-thoughts": "https://www.biblicalstudies.org.uk/pdf/e-books/james_m-r/apocryphal-new-testament_james.pdf",
  "acts-thomas-physician-10": "https://www.biblicalstudies.org.uk/pdf/e-books/james_m-r/apocryphal-new-testament_james.pdf",
  "acts-thomas-birds": "https://www.biblicalstudies.org.uk/pdf/e-books/james_m-r/apocryphal-new-testament_james.pdf",
  "acts-thomas-wealth": "https://www.biblicalstudies.org.uk/pdf/e-books/james_m-r/apocryphal-new-testament_james.pdf",
  "acts-thomas-ask": "https://www.biblicalstudies.org.uk/pdf/e-books/james_m-r/apocryphal-new-testament_james.pdf",
  "acts-thomas-physician-95": "https://www.biblicalstudies.org.uk/pdf/e-books/james_m-r/apocryphal-new-testament_james.pdf",
  "acts-thomas-physician-143": "https://www.biblicalstudies.org.uk/pdf/e-books/james_m-r/apocryphal-new-testament_james.pdf",
  "acts-thomas-physician-156": "https://www.biblicalstudies.org.uk/pdf/e-books/james_m-r/apocryphal-new-testament_james.pdf",

  "eusebius-talents": "https://en.wikisource.org/wiki/Page:The_Apocryphal_New_Testament_(1924).djvu/41",
  "acts-thomas-bride": "https://www.biblicalstudies.org.uk/pdf/e-books/james_m-r/apocryphal-new-testament_james.pdf",
  "acts-thomas-palace": "https://www.biblicalstudies.org.uk/pdf/e-books/james_m-r/apocryphal-new-testament_james.pdf",
  "acts-thomas-prayer": "https://www.biblicalstudies.org.uk/pdf/e-books/james_m-r/apocryphal-new-testament_james.pdf",
  "acts-thomas-marriage": "https://www.biblicalstudies.org.uk/pdf/e-books/james_m-r/apocryphal-new-testament_james.pdf",
  "acts-thomas-bride-response": "https://www.biblicalstudies.org.uk/pdf/e-books/james_m-r/apocryphal-new-testament_james.pdf",
  "acts-thomas-shepherd": "https://www.biblicalstudies.org.uk/pdf/e-books/james_m-r/apocryphal-new-testament_james.pdf",
  "acts-thomas-crowd": "https://www.biblicalstudies.org.uk/pdf/e-books/james_m-r/apocryphal-new-testament_james.pdf",
  "acts-thomas-bitter-tree": "https://www.biblicalstudies.org.uk/pdf/e-books/james_m-r/apocryphal-new-testament_james.pdf",
  "acts-thomas-yoke": "https://www.biblicalstudies.org.uk/pdf/e-books/james_m-r/apocryphal-new-testament_james.pdf",
  "acts-thomas-seed": "https://www.biblicalstudies.org.uk/pdf/e-books/james_m-r/apocryphal-new-testament_james.pdf",
  "acts-thomas-mygdonia-marriage": "https://www.biblicalstudies.org.uk/pdf/e-books/james_m-r/apocryphal-new-testament_james.pdf",
  "acts-thomas-soldiers": "https://www.biblicalstudies.org.uk/pdf/e-books/james_m-r/apocryphal-new-testament_james.pdf",
  "acts-thomas-tower": "https://www.biblicalstudies.org.uk/pdf/e-books/james_m-r/apocryphal-new-testament_james.pdf",
  "acts-thomas-oil": "https://www.biblicalstudies.org.uk/pdf/e-books/james_m-r/apocryphal-new-testament_james.pdf",
  "acts-thomas-hymn": "https://www.biblicalstudies.org.uk/pdf/e-books/james_m-r/apocryphal-new-testament_james.pdf",
};
export const earlyFigureHref = (figure: EarlyFigure, part: EarlyFigurePart = earlyFigureParts(figure)[0]) => figure.excerpt
  ? EARLY_EXCERPT_URLS[figure.edition] ?? "#parables-early-writings"
  : figure.legacy
  ? `/early/${figure.legacyText ?? figure.edition}#${part.section}`
  : `/early/library/${figure.edition}/${part.section}#p${part.start}`;

export function validOriginalEarlyReader(figure: EarlyFigure): boolean {
  const expected = (originalReaders as Record<string, { edition: string; section: string; start: number; end: number }>)[figure.id];
  const actual = figure.originalReader;
  return Boolean(figure.excerpt && figure.edition === `lightfoot-${figure.id}` && expected && actual &&
    actual.edition === expected.edition && actual.section === expected.section && actual.start === expected.start && actual.end === expected.end);
}

export const originalEarlyReaderHref = (figure: EarlyFigure) => validOriginalEarlyReader(figure)
  ? `/early/library/${figure.originalReader!.edition}/${figure.originalReader!.section}#p${figure.originalReader!.start}`
  : null;

// These two corrected excerpts span hosted sections. Never derive a continuation
// path from untrusted figure data; keep the range and identity pinned here.
const ORIGINAL_CONTINUATIONS: Record<string, { edition: string; section: string; start: number; end: number; sha256: string }> = {
  "hermas-tower-explanation": { edition: "shepherd-hermas", section: "vision-3-part-2", start: 1, end: 1, sha256: "f061d421367fbc3aebc9603323f48de0b6f722a1a12936ccb3da2e4806cdd69c" },
  "hermas-vineyard-servant-explanation": { edition: "shepherd-hermas", section: "another-parable-part-2", start: 1, end: 16, sha256: "7292491ca6cf5e34abef27737d473180c70da60b6964826ffd56f34c0d3e7258" },
};

export function originalEarlyContinuation(figure: EarlyFigure) {
  const source = validOriginalEarlyReader(figure) ? ORIGINAL_CONTINUATIONS[figure.id] : undefined;
  return source ? { ...source } : null;
}

export function originalEarlyContinuationHref(figure: EarlyFigure): string | null {
  const continuation = originalEarlyContinuation(figure);
  return continuation ? `/early/library/${continuation.edition}/${continuation.section}#p${continuation.start}` : null;
}

/** Join only source blocks split in the middle of a sentence by the edition importer. */
export function earlyDisplayBlocks(figure: EarlyFigure, blocks: string[]): string[] {
  const result: string[] = []; let offset = 0;
  for (const part of earlyFigureParts(figure)) {
    for (let i = 0; i <= part.end - part.start; i++) {
      const text = blocks[offset++];
      if (i === 0 && part.joinPrevious && result.length) result[result.length - 1] += text;
      else result.push(text);
    }
  }
  return result;
}
