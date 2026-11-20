import { createHash } from "node:crypto";
import { readFile } from "node:fs/promises";
import path from "node:path";
import { EARLY_FIGURES, earlyFigureParts, originalEarlyContinuation, validOriginalEarlyReader, type EarlyFigure } from "./early-figures";
import { EARLY_TEXTS } from "@/lib/early/client";

export type EarlyFigureTexts = Record<string, string[] | null>;

function partIsInvalidExcerpt(figure: EarlyFigure): boolean {
  return !["eusebius-lee-audit-armor-righteousness", "eusebius-lee-audit-birth-nurture", "eusebius-lee-audit-birth-two-outcomes", "eusebius-lee-audit-body-divided", "eusebius-lee-audit-body-instrument", "eusebius-lee-audit-body-one-soul", "eusebius-lee-audit-body-wild-beast", "eusebius-lee-audit-church-rock-3", "eusebius-lee-audit-church-rock-4", "eusebius-lee-audit-city-lamp-interpretation", "eusebius-lee-audit-coming-lightning", "eusebius-lee-audit-cornerstone-interpretation", "eusebius-lee-audit-crafts-teachers", "eusebius-lee-audit-death-ruler", "eusebius-lee-audit-death-theatre", "eusebius-lee-audit-difficult-birth", "eusebius-lee-audit-discipline-bridle", "eusebius-lee-audit-discipline-calamities", "eusebius-lee-audit-division-sword", "eusebius-lee-audit-earth-rational-seed", "eusebius-lee-audit-east-west-feast", "eusebius-lee-audit-east-west-feast-luke", "eusebius-lee-audit-eye-and-yoke", "eusebius-lee-audit-father-gifts-seed", "eusebius-lee-audit-feast-invitations", "eusebius-lee-audit-feast-servants", "eusebius-lee-audit-fishers-3", "eusebius-lee-audit-fishers-catch-life", "eusebius-lee-audit-fishers-gospels", "eusebius-lee-audit-fishers-net", "eusebius-lee-audit-flock-evil-beasts", "eusebius-lee-audit-food-of-soul", "eusebius-lee-audit-fountain-mind-messenger", "eusebius-lee-audit-good-shepherd-4", "eusebius-lee-audit-good-shepherd-wheat-3", "eusebius-lee-audit-harvest-after-sower", "eusebius-lee-audit-harvest-and-fields", "eusebius-lee-audit-healing-souls-bodies", "eusebius-lee-audit-heart-tablets", "eusebius-lee-audit-hen-interpretation", "eusebius-lee-audit-hidden-interpretation", "eusebius-lee-audit-imperial-city-application", "eusebius-lee-audit-imperial-city-heavens", "eusebius-lee-audit-imperial-city-ranks", "eusebius-lee-audit-infant-adult-soul", "eusebius-lee-audit-isaiah-vineyard-reading", "eusebius-lee-audit-king-interpreter", "eusebius-lee-audit-lamb-flock", "eusebius-lee-audit-light-and-housetops", "eusebius-lee-audit-light-city-lamp", "eusebius-lee-audit-lightning-interpretation", "eusebius-lee-audit-lyre-sunlight", "eusebius-lee-audit-lyre-warrior-city", "eusebius-lee-audit-lyre-world", "eusebius-lee-audit-maker-made", "eusebius-lee-audit-mind-rock-fruit", "eusebius-lee-audit-moses-accusation", "eusebius-lee-audit-musician-lyre", "eusebius-lee-audit-net-fishers", "eusebius-lee-audit-one-modeller", "eusebius-lee-audit-one-sun-word", "eusebius-lee-audit-parent-child", "eusebius-lee-audit-philosopher-mind", "eusebius-lee-audit-philosophers-war", "eusebius-lee-audit-philosophers-war-giants", "eusebius-lee-audit-physician-remedies", "eusebius-lee-audit-physicians-consulted", "eusebius-lee-audit-plato-chariot", "eusebius-lee-audit-plato-shipmaster", "eusebius-lee-audit-plato-storm", "eusebius-lee-audit-punishment-rains", "eusebius-lee-audit-pythian-oracle", "eusebius-lee-audit-rock-keys-5", "eusebius-lee-audit-seed-coat", "eusebius-lee-audit-seed-cultivated-soul", "eusebius-lee-audit-seed-future-fruit", "eusebius-lee-audit-seed-herbs-fountain", "eusebius-lee-audit-seed-tablets", "eusebius-lee-audit-sheep-wolves-voice", "eusebius-lee-audit-shepherd-lost-sheep", "eusebius-lee-audit-shepherd-physician-care", "eusebius-lee-audit-shepherd-wolves", "eusebius-lee-audit-ship-soul-body", "eusebius-lee-audit-soul-body", "eusebius-lee-audit-soul-healing", "eusebius-lee-audit-sower-harvest-soul", "eusebius-lee-audit-storm-peace", "eusebius-lee-audit-stream-and-family", "eusebius-lee-audit-strong-man", "eusebius-lee-audit-sun-clay", "eusebius-lee-audit-sun-doctrine", "eusebius-lee-audit-sun-fire-many-effects", "eusebius-lee-audit-sun-rational-light", "eusebius-lee-audit-sun-rays", "eusebius-lee-audit-swords-ploughshares", "eusebius-lee-audit-teacher-hidden", "eusebius-lee-audit-teachers-and-pupils", "eusebius-lee-audit-tree-fruit", "eusebius-lee-audit-vineyard-feast-comparison", "eusebius-lee-audit-vineyard-tenants", "eusebius-lee-audit-vipers-interpretation", "eusebius-lee-audit-war-engine", "eusebius-lee-audit-watering-husbandman", "eusebius-lee-audit-wheat-interpretation", "eusebius-lee-audit-wickedness-nets", "eusebius-lee-audit-wilderness-wild-beasts", "eusebius-lee-audit-winnowing-floor", "eusebius-lee-audit-wolves-trees", "eusebius-lee-audit-word-sown", "eusebius-lee-audit-word-world-lyre", "eusebius-lee-audit-world-family", "eusebius-lee-audit-world-storm", "eusebius-lee-house-ship-city", "eusebius-lee-architect-house", "eusebius-lee-imperial-city", "eusebius-lee-birth-life", "eusebius-lee-seed-corruption", "eusebius-lee-physician-souls", "eusebius-lee-shepherd-physician", "eusebius-lee-vessel-fire", "eusebius-lee-vineyard-isaiah", "eusebius-lee-vineyard-explanation", "eusebius-lee-wedding-feast", "eusebius-lee-marriage-feast-interpretation", "eusebius-lee-serpents-vipers", "eusebius-lee-hen-chickens", "eusebius-lee-grain-wheat", "eusebius-lee-family-persecution", "eusebius-lee-net", "eusebius-lee-sower-interpretation", "eusebius-lee-weeds-interpretation", "eusebius-lee-fishers", "eusebius-lee-sower-quotation", "eusebius-lee-sower-explanation", "eusebius-lee-weeds-quotation", "eusebius-lee-weeds-explanation", "eusebius-lee-vineyard-quotation", "eusebius-lee-wedding-garment", "lightfoot-second-clement-small-great", "lightfoot-second-clement-house-robbers", "lightfoot-second-clement-barren", "lightfoot-second-clement-lips-heart", "lightfoot-second-clement-waiting-fruit", "lightfoot-hermas-tower-explanation", "lightfoot-hermas-three-forms", "lightfoot-hermas-beast-colors", "lightfoot-hermas-two-paths", "lightfoot-hermas-empty-vessels", "lightfoot-hermas-vineyard-servant-explanation", "lightfoot-hermas-clean-house", "lightfoot-barnabas-goats-thorns", "lightfoot-barnabas-thorns-heart", "lightfoot-first-clement-sheep-lamb", "lightfoot-barnabas-two-peoples", "lightfoot-first-clement-aaron-rod", "lightfoot-first-clement-pillars", "lightfoot-first-clement-dust-smoke", "lightfoot-first-clement-wisdom-fruit", "lightfoot-first-clement-pasture-prayer", "lightfoot-barnabas-yoke-sacrifice", "lightfoot-barnabas-fast-light", "lightfoot-barnabas-beast-covenant", "lightfoot-barnabas-sheep-sun", "lightfoot-barnabas-vessel-body", "acts-thomas-groom-prayer", "acts-thomas-creditor", "acts-thomas-youth-light", "acts-thomas-desert-temple", "acts-thomas-oil-121", "acts-thomas-open-treasury", "acts-thomas-prayer-opening", "acts-thomas-four-one", "acts-thomas-mother-houses", "acts-thomas-good-shepherd", "acts-thomas-spirit-return", "acts-thomas-hidden-mother", "acts-thomas-dwelling-places", "acts-thomas-eagle-dream", "acts-thomas-life-loan", "acts-thomas-bread-life", "acts-thomas-crown", "eusebius-talents", "acts-thomas-hymn", "acts-thomas-bride", "acts-thomas-palace", "acts-thomas-prayer", "acts-thomas-marriage", "acts-thomas-bride-response", "acts-thomas-shepherd", "acts-thomas-crowd", "acts-thomas-bitter-tree", "acts-thomas-yoke", "acts-thomas-seed", "acts-thomas-mygdonia-marriage", "acts-thomas-soldiers", "acts-thomas-tower", "acts-thomas-oil", "acts-thomas-physician-10", "acts-thomas-birds", "acts-thomas-wealth", "acts-thomas-ask", "acts-thomas-physician-95", "acts-thomas-physician-143", "acts-thomas-physician-156", "acts-thomas-wedding-invitation", "acts-thomas-old-new-48", "acts-thomas-lost-sheep", "acts-thomas-old-new-58", "acts-thomas-heat-day", "acts-thomas-flock-wolves", "acts-thomas-wolves-clothing", "acts-thomas-stolen-thoughts"].includes(figure.edition) || figure.legacy === true || figure.section !== "excerpt" || figure.start !== 1 || figure.end !== 1;
}

/** Each literal path is deliberate: the Parables trace must not package unrelated editions. */
const sourceFiles: Record<string, string> = {
  "eusebius-lee-audit-lyre-warrior-city/excerpt": path.join(process.cwd(), "content/jesus/early-excerpts/eusebius-lee-audit-lyre-warrior-city.json"),
  "eusebius-lee-audit-philosopher-mind/excerpt": path.join(process.cwd(), "content/jesus/early-excerpts/eusebius-lee-audit-philosopher-mind.json"),
  "eusebius-lee-audit-watering-husbandman/excerpt": path.join(process.cwd(), "content/jesus/early-excerpts/eusebius-lee-audit-watering-husbandman.json"),
  "eusebius-lee-audit-fountain-mind-messenger/excerpt": path.join(process.cwd(), "content/jesus/early-excerpts/eusebius-lee-audit-fountain-mind-messenger.json"),
  "eusebius-lee-audit-ship-soul-body/excerpt": path.join(process.cwd(), "content/jesus/early-excerpts/eusebius-lee-audit-ship-soul-body.json"),
  "eusebius-lee-audit-body-divided/excerpt": path.join(process.cwd(), "content/jesus/early-excerpts/eusebius-lee-audit-body-divided.json"),
  "eusebius-lee-audit-lyre-world/excerpt": path.join(process.cwd(), "content/jesus/early-excerpts/eusebius-lee-audit-lyre-world.json"),
  "eusebius-lee-audit-body-one-soul/excerpt": path.join(process.cwd(), "content/jesus/early-excerpts/eusebius-lee-audit-body-one-soul.json"),
  "eusebius-lee-audit-one-sun-word/excerpt": path.join(process.cwd(), "content/jesus/early-excerpts/eusebius-lee-audit-one-sun-word.json"),
  "eusebius-lee-audit-one-modeller/excerpt": path.join(process.cwd(), "content/jesus/early-excerpts/eusebius-lee-audit-one-modeller.json"),
  "eusebius-lee-audit-sun-fire-many-effects/excerpt": path.join(process.cwd(), "content/jesus/early-excerpts/eusebius-lee-audit-sun-fire-many-effects.json"),
  "eusebius-lee-audit-word-world-lyre/excerpt": path.join(process.cwd(), "content/jesus/early-excerpts/eusebius-lee-audit-word-world-lyre.json"),
  "eusebius-lee-audit-imperial-city-heavens/excerpt": path.join(process.cwd(), "content/jesus/early-excerpts/eusebius-lee-audit-imperial-city-heavens.json"),
  "eusebius-lee-audit-imperial-city-ranks/excerpt": path.join(process.cwd(), "content/jesus/early-excerpts/eusebius-lee-audit-imperial-city-ranks.json"),
  "eusebius-lee-audit-imperial-city-application/excerpt": path.join(process.cwd(), "content/jesus/early-excerpts/eusebius-lee-audit-imperial-city-application.json"),
  "eusebius-lee-audit-heart-tablets/excerpt": path.join(process.cwd(), "content/jesus/early-excerpts/eusebius-lee-audit-heart-tablets.json"),
  "eusebius-lee-audit-earth-rational-seed/excerpt": path.join(process.cwd(), "content/jesus/early-excerpts/eusebius-lee-audit-earth-rational-seed.json"),
  "eusebius-lee-audit-sower-harvest-soul/excerpt": path.join(process.cwd(), "content/jesus/early-excerpts/eusebius-lee-audit-sower-harvest-soul.json"),
  "eusebius-lee-audit-birth-nurture/excerpt": path.join(process.cwd(), "content/jesus/early-excerpts/eusebius-lee-audit-birth-nurture.json"),
  "eusebius-lee-audit-difficult-birth/excerpt": path.join(process.cwd(), "content/jesus/early-excerpts/eusebius-lee-audit-difficult-birth.json"),
  "eusebius-lee-audit-birth-two-outcomes/excerpt": path.join(process.cwd(), "content/jesus/early-excerpts/eusebius-lee-audit-birth-two-outcomes.json"),
  "eusebius-lee-audit-seed-cultivated-soul/excerpt": path.join(process.cwd(), "content/jesus/early-excerpts/eusebius-lee-audit-seed-cultivated-soul.json"),
  "eusebius-lee-audit-infant-adult-soul/excerpt": path.join(process.cwd(), "content/jesus/early-excerpts/eusebius-lee-audit-infant-adult-soul.json"),
  "eusebius-lee-audit-body-wild-beast/excerpt": path.join(process.cwd(), "content/jesus/early-excerpts/eusebius-lee-audit-body-wild-beast.json"),
  "eusebius-lee-audit-seed-future-fruit/excerpt": path.join(process.cwd(), "content/jesus/early-excerpts/eusebius-lee-audit-seed-future-fruit.json"),
  "eusebius-lee-audit-wickedness-nets/excerpt": path.join(process.cwd(), "content/jesus/early-excerpts/eusebius-lee-audit-wickedness-nets.json"),
  "eusebius-lee-audit-world-storm/excerpt": path.join(process.cwd(), "content/jesus/early-excerpts/eusebius-lee-audit-world-storm.json"),
  "eusebius-lee-audit-plato-shipmaster/excerpt": path.join(process.cwd(), "content/jesus/early-excerpts/eusebius-lee-audit-plato-shipmaster.json"),
  "eusebius-lee-audit-plato-storm/excerpt": path.join(process.cwd(), "content/jesus/early-excerpts/eusebius-lee-audit-plato-storm.json"),
  "eusebius-lee-audit-plato-chariot/excerpt": path.join(process.cwd(), "content/jesus/early-excerpts/eusebius-lee-audit-plato-chariot.json"),
  "eusebius-lee-audit-maker-made/excerpt": path.join(process.cwd(), "content/jesus/early-excerpts/eusebius-lee-audit-maker-made.json"),
  "eusebius-lee-audit-philosophers-war-giants/excerpt": path.join(process.cwd(), "content/jesus/early-excerpts/eusebius-lee-audit-philosophers-war-giants.json"),
  "eusebius-lee-audit-philosophers-war/excerpt": path.join(process.cwd(), "content/jesus/early-excerpts/eusebius-lee-audit-philosophers-war.json"),
  "eusebius-lee-audit-physicians-consulted/excerpt": path.join(process.cwd(), "content/jesus/early-excerpts/eusebius-lee-audit-physicians-consulted.json"),
  "eusebius-lee-audit-soul-healing/excerpt": path.join(process.cwd(), "content/jesus/early-excerpts/eusebius-lee-audit-soul-healing.json"),
  "eusebius-lee-audit-sun-clay/excerpt": path.join(process.cwd(), "content/jesus/early-excerpts/eusebius-lee-audit-sun-clay.json"),
  "eusebius-lee-audit-pythian-oracle/excerpt": path.join(process.cwd(), "content/jesus/early-excerpts/eusebius-lee-audit-pythian-oracle.json"),
  "eusebius-lee-audit-tree-fruit/excerpt": path.join(process.cwd(), "content/jesus/early-excerpts/eusebius-lee-audit-tree-fruit.json"),
  "eusebius-lee-audit-storm-peace/excerpt": path.join(process.cwd(), "content/jesus/early-excerpts/eusebius-lee-audit-storm-peace.json"),
  "eusebius-lee-audit-shepherd-lost-sheep/excerpt": path.join(process.cwd(), "content/jesus/early-excerpts/eusebius-lee-audit-shepherd-lost-sheep.json"),
  "eusebius-lee-audit-shepherd-physician-care/excerpt": path.join(process.cwd(), "content/jesus/early-excerpts/eusebius-lee-audit-shepherd-physician-care.json"),
  "eusebius-lee-audit-discipline-calamities/excerpt": path.join(process.cwd(), "content/jesus/early-excerpts/eusebius-lee-audit-discipline-calamities.json"),
  "eusebius-lee-audit-discipline-bridle/excerpt": path.join(process.cwd(), "content/jesus/early-excerpts/eusebius-lee-audit-discipline-bridle.json"),
  "eusebius-lee-audit-seed-herbs-fountain/excerpt": path.join(process.cwd(), "content/jesus/early-excerpts/eusebius-lee-audit-seed-herbs-fountain.json"),
  "eusebius-lee-audit-punishment-rains/excerpt": path.join(process.cwd(), "content/jesus/early-excerpts/eusebius-lee-audit-punishment-rains.json"),
  "eusebius-lee-audit-father-gifts-seed/excerpt": path.join(process.cwd(), "content/jesus/early-excerpts/eusebius-lee-audit-father-gifts-seed.json"),
  "eusebius-lee-audit-war-engine/excerpt": path.join(process.cwd(), "content/jesus/early-excerpts/eusebius-lee-audit-war-engine.json"),
  "eusebius-lee-audit-stream-and-family/excerpt": path.join(process.cwd(), "content/jesus/early-excerpts/eusebius-lee-audit-stream-and-family.json"),
  "eusebius-lee-audit-world-family/excerpt": path.join(process.cwd(), "content/jesus/early-excerpts/eusebius-lee-audit-world-family.json"),
  "eusebius-lee-audit-swords-ploughshares/excerpt": path.join(process.cwd(), "content/jesus/early-excerpts/eusebius-lee-audit-swords-ploughshares.json"),
  "eusebius-lee-audit-sun-rational-light/excerpt": path.join(process.cwd(), "content/jesus/early-excerpts/eusebius-lee-audit-sun-rational-light.json"),
  "eusebius-lee-audit-flock-evil-beasts/excerpt": path.join(process.cwd(), "content/jesus/early-excerpts/eusebius-lee-audit-flock-evil-beasts.json"),
  "eusebius-lee-audit-food-of-soul/excerpt": path.join(process.cwd(), "content/jesus/early-excerpts/eusebius-lee-audit-food-of-soul.json"),
  "eusebius-lee-audit-eye-and-yoke/excerpt": path.join(process.cwd(), "content/jesus/early-excerpts/eusebius-lee-audit-eye-and-yoke.json"),
  "eusebius-lee-audit-mind-rock-fruit/excerpt": path.join(process.cwd(), "content/jesus/early-excerpts/eusebius-lee-audit-mind-rock-fruit.json"),
  "eusebius-lee-audit-church-rock-3/excerpt": path.join(process.cwd(), "content/jesus/early-excerpts/eusebius-lee-audit-church-rock-3.json"),
  "eusebius-lee-audit-fishers-3/excerpt": path.join(process.cwd(), "content/jesus/early-excerpts/eusebius-lee-audit-fishers-3.json"),
  "eusebius-lee-audit-armor-righteousness/excerpt": path.join(process.cwd(), "content/jesus/early-excerpts/eusebius-lee-audit-armor-righteousness.json"),
  "eusebius-lee-audit-word-sown/excerpt": path.join(process.cwd(), "content/jesus/early-excerpts/eusebius-lee-audit-word-sown.json"),
  "eusebius-lee-audit-sun-doctrine/excerpt": path.join(process.cwd(), "content/jesus/early-excerpts/eusebius-lee-audit-sun-doctrine.json"),
  "eusebius-lee-audit-king-interpreter/excerpt": path.join(process.cwd(), "content/jesus/early-excerpts/eusebius-lee-audit-king-interpreter.json"),
  "eusebius-lee-audit-sun-rays/excerpt": path.join(process.cwd(), "content/jesus/early-excerpts/eusebius-lee-audit-sun-rays.json"),
  "eusebius-lee-audit-musician-lyre/excerpt": path.join(process.cwd(), "content/jesus/early-excerpts/eusebius-lee-audit-musician-lyre.json"),
  "eusebius-lee-audit-lyre-sunlight/excerpt": path.join(process.cwd(), "content/jesus/early-excerpts/eusebius-lee-audit-lyre-sunlight.json"),
  "eusebius-lee-audit-seed-tablets/excerpt": path.join(process.cwd(), "content/jesus/early-excerpts/eusebius-lee-audit-seed-tablets.json"),
  "eusebius-lee-audit-healing-souls-bodies/excerpt": path.join(process.cwd(), "content/jesus/early-excerpts/eusebius-lee-audit-healing-souls-bodies.json"),
  "eusebius-lee-audit-good-shepherd-wheat-3/excerpt": path.join(process.cwd(), "content/jesus/early-excerpts/eusebius-lee-audit-good-shepherd-wheat-3.json"),
  "eusebius-lee-audit-wilderness-wild-beasts/excerpt": path.join(process.cwd(), "content/jesus/early-excerpts/eusebius-lee-audit-wilderness-wild-beasts.json"),
  "eusebius-lee-audit-strong-man/excerpt": path.join(process.cwd(), "content/jesus/early-excerpts/eusebius-lee-audit-strong-man.json"),
  "eusebius-lee-audit-lamb-flock/excerpt": path.join(process.cwd(), "content/jesus/early-excerpts/eusebius-lee-audit-lamb-flock.json"),
  "eusebius-lee-audit-death-ruler/excerpt": path.join(process.cwd(), "content/jesus/early-excerpts/eusebius-lee-audit-death-ruler.json"),
  "eusebius-lee-audit-death-theatre/excerpt": path.join(process.cwd(), "content/jesus/early-excerpts/eusebius-lee-audit-death-theatre.json"),
  "eusebius-lee-audit-body-instrument/excerpt": path.join(process.cwd(), "content/jesus/early-excerpts/eusebius-lee-audit-body-instrument.json"),
  "eusebius-lee-audit-parent-child/excerpt": path.join(process.cwd(), "content/jesus/early-excerpts/eusebius-lee-audit-parent-child.json"),
  "eusebius-lee-audit-east-west-feast/excerpt": path.join(process.cwd(), "content/jesus/early-excerpts/eusebius-lee-audit-east-west-feast.json"),
  "eusebius-lee-audit-east-west-feast-luke/excerpt": path.join(process.cwd(), "content/jesus/early-excerpts/eusebius-lee-audit-east-west-feast-luke.json"),
  "eusebius-lee-audit-fishers-gospels/excerpt": path.join(process.cwd(), "content/jesus/early-excerpts/eusebius-lee-audit-fishers-gospels.json"),
  "eusebius-lee-audit-fishers-net/excerpt": path.join(process.cwd(), "content/jesus/early-excerpts/eusebius-lee-audit-fishers-net.json"),
  "eusebius-lee-audit-fishers-catch-life/excerpt": path.join(process.cwd(), "content/jesus/early-excerpts/eusebius-lee-audit-fishers-catch-life.json"),
  "eusebius-lee-audit-light-city-lamp/excerpt": path.join(process.cwd(), "content/jesus/early-excerpts/eusebius-lee-audit-light-city-lamp.json"),
  "eusebius-lee-audit-city-lamp-interpretation/excerpt": path.join(process.cwd(), "content/jesus/early-excerpts/eusebius-lee-audit-city-lamp-interpretation.json"),
  "eusebius-lee-audit-light-and-housetops/excerpt": path.join(process.cwd(), "content/jesus/early-excerpts/eusebius-lee-audit-light-and-housetops.json"),
  "eusebius-lee-audit-church-rock-4/excerpt": path.join(process.cwd(), "content/jesus/early-excerpts/eusebius-lee-audit-church-rock-4.json"),
  "eusebius-lee-audit-division-sword/excerpt": path.join(process.cwd(), "content/jesus/early-excerpts/eusebius-lee-audit-division-sword.json"),
  "eusebius-lee-audit-isaiah-vineyard-reading/excerpt": path.join(process.cwd(), "content/jesus/early-excerpts/eusebius-lee-audit-isaiah-vineyard-reading.json"),
  "eusebius-lee-audit-vineyard-tenants/excerpt": path.join(process.cwd(), "content/jesus/early-excerpts/eusebius-lee-audit-vineyard-tenants.json"),
  "eusebius-lee-audit-cornerstone-interpretation/excerpt": path.join(process.cwd(), "content/jesus/early-excerpts/eusebius-lee-audit-cornerstone-interpretation.json"),
  "eusebius-lee-audit-vineyard-feast-comparison/excerpt": path.join(process.cwd(), "content/jesus/early-excerpts/eusebius-lee-audit-vineyard-feast-comparison.json"),
  "eusebius-lee-audit-feast-servants/excerpt": path.join(process.cwd(), "content/jesus/early-excerpts/eusebius-lee-audit-feast-servants.json"),
  "eusebius-lee-audit-feast-invitations/excerpt": path.join(process.cwd(), "content/jesus/early-excerpts/eusebius-lee-audit-feast-invitations.json"),
  "eusebius-lee-audit-vipers-interpretation/excerpt": path.join(process.cwd(), "content/jesus/early-excerpts/eusebius-lee-audit-vipers-interpretation.json"),
  "eusebius-lee-audit-hen-interpretation/excerpt": path.join(process.cwd(), "content/jesus/early-excerpts/eusebius-lee-audit-hen-interpretation.json"),
  "eusebius-lee-audit-good-shepherd-4/excerpt": path.join(process.cwd(), "content/jesus/early-excerpts/eusebius-lee-audit-good-shepherd-4.json"),
  "eusebius-lee-audit-shepherd-wolves/excerpt": path.join(process.cwd(), "content/jesus/early-excerpts/eusebius-lee-audit-shepherd-wolves.json"),
  "eusebius-lee-audit-wheat-interpretation/excerpt": path.join(process.cwd(), "content/jesus/early-excerpts/eusebius-lee-audit-wheat-interpretation.json"),
  "eusebius-lee-audit-harvest-and-fields/excerpt": path.join(process.cwd(), "content/jesus/early-excerpts/eusebius-lee-audit-harvest-and-fields.json"),
  "eusebius-lee-audit-winnowing-floor/excerpt": path.join(process.cwd(), "content/jesus/early-excerpts/eusebius-lee-audit-winnowing-floor.json"),
  "eusebius-lee-audit-net-fishers/excerpt": path.join(process.cwd(), "content/jesus/early-excerpts/eusebius-lee-audit-net-fishers.json"),
  "eusebius-lee-audit-wolves-trees/excerpt": path.join(process.cwd(), "content/jesus/early-excerpts/eusebius-lee-audit-wolves-trees.json"),
  "eusebius-lee-audit-sheep-wolves-voice/excerpt": path.join(process.cwd(), "content/jesus/early-excerpts/eusebius-lee-audit-sheep-wolves-voice.json"),
  "eusebius-lee-audit-teacher-hidden/excerpt": path.join(process.cwd(), "content/jesus/early-excerpts/eusebius-lee-audit-teacher-hidden.json"),
  "eusebius-lee-audit-hidden-interpretation/excerpt": path.join(process.cwd(), "content/jesus/early-excerpts/eusebius-lee-audit-hidden-interpretation.json"),
  "eusebius-lee-audit-harvest-after-sower/excerpt": path.join(process.cwd(), "content/jesus/early-excerpts/eusebius-lee-audit-harvest-after-sower.json"),
  "eusebius-lee-audit-coming-lightning/excerpt": path.join(process.cwd(), "content/jesus/early-excerpts/eusebius-lee-audit-coming-lightning.json"),
  "eusebius-lee-audit-lightning-interpretation/excerpt": path.join(process.cwd(), "content/jesus/early-excerpts/eusebius-lee-audit-lightning-interpretation.json"),
  "eusebius-lee-audit-teachers-and-pupils/excerpt": path.join(process.cwd(), "content/jesus/early-excerpts/eusebius-lee-audit-teachers-and-pupils.json"),
  "eusebius-lee-audit-crafts-teachers/excerpt": path.join(process.cwd(), "content/jesus/early-excerpts/eusebius-lee-audit-crafts-teachers.json"),
  "eusebius-lee-audit-moses-accusation/excerpt": path.join(process.cwd(), "content/jesus/early-excerpts/eusebius-lee-audit-moses-accusation.json"),
  "eusebius-lee-audit-rock-keys-5/excerpt": path.join(process.cwd(), "content/jesus/early-excerpts/eusebius-lee-audit-rock-keys-5.json"),
  "eusebius-lee-audit-soul-body/excerpt": path.join(process.cwd(), "content/jesus/early-excerpts/eusebius-lee-audit-soul-body.json"),
  "eusebius-lee-audit-seed-coat/excerpt": path.join(process.cwd(), "content/jesus/early-excerpts/eusebius-lee-audit-seed-coat.json"),
  "eusebius-lee-audit-physician-remedies/excerpt": path.join(process.cwd(), "content/jesus/early-excerpts/eusebius-lee-audit-physician-remedies.json"),
  "eusebius-lee-house-ship-city/excerpt": path.join(process.cwd(), "content/jesus/early-excerpts/eusebius-lee-house-ship-city.json"),
  "eusebius-lee-architect-house/excerpt": path.join(process.cwd(), "content/jesus/early-excerpts/eusebius-lee-architect-house.json"),
  "eusebius-lee-imperial-city/excerpt": path.join(process.cwd(), "content/jesus/early-excerpts/eusebius-lee-imperial-city.json"),
  "eusebius-lee-birth-life/excerpt": path.join(process.cwd(), "content/jesus/early-excerpts/eusebius-lee-birth-life.json"),
  "eusebius-lee-seed-corruption/excerpt": path.join(process.cwd(), "content/jesus/early-excerpts/eusebius-lee-seed-corruption.json"),
  "eusebius-lee-physician-souls/excerpt": path.join(process.cwd(), "content/jesus/early-excerpts/eusebius-lee-physician-souls.json"),
  "eusebius-lee-shepherd-physician/excerpt": path.join(process.cwd(), "content/jesus/early-excerpts/eusebius-lee-shepherd-physician.json"),
  "eusebius-lee-vessel-fire/excerpt": path.join(process.cwd(), "content/jesus/early-excerpts/eusebius-lee-vessel-fire.json"),
  "eusebius-lee-vineyard-isaiah/excerpt": path.join(process.cwd(), "content/jesus/early-excerpts/eusebius-lee-vineyard-isaiah.json"),
  "eusebius-lee-vineyard-explanation/excerpt": path.join(process.cwd(), "content/jesus/early-excerpts/eusebius-lee-vineyard-explanation.json"),
  "eusebius-lee-wedding-feast/excerpt": path.join(process.cwd(), "content/jesus/early-excerpts/eusebius-lee-wedding-feast.json"),
  "eusebius-lee-marriage-feast-interpretation/excerpt": path.join(process.cwd(), "content/jesus/early-excerpts/eusebius-lee-marriage-feast-interpretation.json"),
  "eusebius-lee-serpents-vipers/excerpt": path.join(process.cwd(), "content/jesus/early-excerpts/eusebius-lee-serpents-vipers.json"),
  "eusebius-lee-hen-chickens/excerpt": path.join(process.cwd(), "content/jesus/early-excerpts/eusebius-lee-hen-chickens.json"),
  "eusebius-lee-grain-wheat/excerpt": path.join(process.cwd(), "content/jesus/early-excerpts/eusebius-lee-grain-wheat.json"),
  "eusebius-lee-family-persecution/excerpt": path.join(process.cwd(), "content/jesus/early-excerpts/eusebius-lee-family-persecution.json"),
  "eusebius-lee-net/excerpt": path.join(process.cwd(), "content/jesus/early-excerpts/eusebius-lee-net.json"),
  "eusebius-lee-sower-interpretation/excerpt": path.join(process.cwd(), "content/jesus/early-excerpts/eusebius-lee-sower-interpretation.json"),
  "eusebius-lee-weeds-interpretation/excerpt": path.join(process.cwd(), "content/jesus/early-excerpts/eusebius-lee-weeds-interpretation.json"),
  "eusebius-lee-fishers/excerpt": path.join(process.cwd(), "content/jesus/early-excerpts/eusebius-lee-fishers.json"),
  "eusebius-lee-sower-quotation/excerpt": path.join(process.cwd(), "content/jesus/early-excerpts/eusebius-lee-sower-quotation.json"),
  "eusebius-lee-sower-explanation/excerpt": path.join(process.cwd(), "content/jesus/early-excerpts/eusebius-lee-sower-explanation.json"),
  "eusebius-lee-weeds-quotation/excerpt": path.join(process.cwd(), "content/jesus/early-excerpts/eusebius-lee-weeds-quotation.json"),
  "eusebius-lee-weeds-explanation/excerpt": path.join(process.cwd(), "content/jesus/early-excerpts/eusebius-lee-weeds-explanation.json"),
  "eusebius-lee-vineyard-quotation/excerpt": path.join(process.cwd(), "content/jesus/early-excerpts/eusebius-lee-vineyard-quotation.json"),
  "eusebius-lee-wedding-garment/excerpt": path.join(process.cwd(), "content/jesus/early-excerpts/eusebius-lee-wedding-garment.json"),
  "2-clement/2-clem-6": path.join(process.cwd(), "content/early-library/readings/2-clement/2-clem-6.json"),
  "lightfoot-second-clement-small-great/excerpt": path.join(process.cwd(), "content/jesus/early-excerpts/lightfoot-second-clement-small-great.json"),
  "2-clement/2-clem-9": path.join(process.cwd(), "content/early-library/readings/2-clement/2-clem-9.json"),
  "lightfoot-second-clement-house-robbers/excerpt": path.join(process.cwd(), "content/jesus/early-excerpts/lightfoot-second-clement-house-robbers.json"),
  "2-clement/2-clem-14": path.join(process.cwd(), "content/early-library/readings/2-clement/2-clem-14.json"),
  "2-clement/2-clem-1": path.join(process.cwd(), "content/early-library/readings/2-clement/2-clem-1.json"),
  "lightfoot-second-clement-barren/excerpt": path.join(process.cwd(), "content/jesus/early-excerpts/lightfoot-second-clement-barren.json"),
  "2-clement/2-clem-2": path.join(process.cwd(), "content/early-library/readings/2-clement/2-clem-2.json"),
  "lightfoot-second-clement-lips-heart/excerpt": path.join(process.cwd(), "content/jesus/early-excerpts/lightfoot-second-clement-lips-heart.json"),
  "2-clement/2-clem-3": path.join(process.cwd(), "content/early-library/readings/2-clement/2-clem-3.json"),
  "2-clement/2-clem-16": path.join(process.cwd(), "content/early-library/readings/2-clement/2-clem-16.json"),
  "2-clement/2-clem-19": path.join(process.cwd(), "content/early-library/readings/2-clement/2-clem-19.json"),
  "lightfoot-second-clement-waiting-fruit/excerpt": path.join(process.cwd(), "content/jesus/early-excerpts/lightfoot-second-clement-waiting-fruit.json"),
  "2-clement/2-clem-20": path.join(process.cwd(), "content/early-library/readings/2-clement/2-clem-20.json"),
  "lightfoot-hermas-tower-explanation/excerpt": path.join(process.cwd(), "content/jesus/early-excerpts/lightfoot-hermas-tower-explanation.json"),
  "shepherd-hermas/vision-3-part-2": path.join(process.cwd(), "content/early-library/readings/shepherd-hermas/vision-3-part-2.json"),
  "shepherd-hermas/another-parable-part-2": path.join(process.cwd(), "content/early-library/readings/shepherd-hermas/another-parable-part-2.json"),
  "lightfoot-hermas-three-forms/excerpt": path.join(process.cwd(), "content/jesus/early-excerpts/lightfoot-hermas-three-forms.json"),
  "lightfoot-hermas-beast-colors/excerpt": path.join(process.cwd(), "content/jesus/early-excerpts/lightfoot-hermas-beast-colors.json"),
  "shepherd-hermas/vision-4": path.join(process.cwd(), "content/early-library/readings/shepherd-hermas/vision-4.json"),
  "lightfoot-hermas-two-paths/excerpt": path.join(process.cwd(), "content/jesus/early-excerpts/lightfoot-hermas-two-paths.json"),
  "shepherd-hermas/mandate-6": path.join(process.cwd(), "content/early-library/readings/shepherd-hermas/mandate-6.json"),
  "shepherd-hermas/mandate-10": path.join(process.cwd(), "content/early-library/readings/shepherd-hermas/mandate-10.json"),
  "lightfoot-hermas-empty-vessels/excerpt": path.join(process.cwd(), "content/jesus/early-excerpts/lightfoot-hermas-empty-vessels.json"),
  "shepherd-hermas/mandate-12": path.join(process.cwd(), "content/early-library/readings/shepherd-hermas/mandate-12.json"),
  "lightfoot-hermas-vineyard-servant-explanation/excerpt": path.join(process.cwd(), "content/jesus/early-excerpts/lightfoot-hermas-vineyard-servant-explanation.json"),
  "shepherd-hermas/vision-1": path.join(process.cwd(), "content/early-library/readings/shepherd-hermas/vision-1.json"),
  "lightfoot-hermas-clean-house/excerpt": path.join(process.cwd(), "content/jesus/early-excerpts/lightfoot-hermas-clean-house.json"),
  "shepherd-hermas/parable-10": path.join(process.cwd(), "content/early-library/readings/shepherd-hermas/parable-10.json"),
  "gospel-philip/baptism-chrism-eucharist-bridal-chamber": path.join(process.cwd(), "content/early-library/readings/gospel-philip/baptism-chrism-eucharist-bridal-chamber.json"),
  "gospel-philip/conclusion": path.join(process.cwd(), "content/early-library/readings/gospel-philip/conclusion.json"),
  "gospel-philip/the-rulers": path.join(process.cwd(), "content/early-library/readings/gospel-philip/the-rulers.json"),
  "gospel-philip/the-resurrection": path.join(process.cwd(), "content/early-library/readings/gospel-philip/the-resurrection.json"),
  "gospel-philip/father-son-and-holy-spirit": path.join(process.cwd(), "content/early-library/readings/gospel-philip/father-son-and-holy-spirit.json"),
  "gospel-philip/humans-and-animals": path.join(process.cwd(), "content/early-library/readings/gospel-philip/humans-and-animals.json"),
  "gospel-philip/adam-eve-and-the-bridal-chamber": path.join(process.cwd(), "content/early-library/readings/gospel-philip/adam-eve-and-the-bridal-chamber.json"),
  "gospel-philip/overcoming-the-world": path.join(process.cwd(), "content/early-library/readings/gospel-philip/overcoming-the-world.json"),
  "gospel-philip/seeing-jesus": path.join(process.cwd(), "content/early-library/readings/gospel-philip/seeing-jesus.json"),
  "gospel-philip/the-mystery-of-marriage": path.join(process.cwd(), "content/early-library/readings/gospel-philip/the-mystery-of-marriage.json"),
  "gospel-truth/restoring-what-was-needed": path.join(process.cwd(), "content/early-library/readings/gospel-truth/restoring-what-was-needed.json"),
  "gospel-truth/the-father-s-paradise": path.join(process.cwd(), "content/early-library/readings/gospel-truth/the-father-s-paradise.json"),
  "gospel-truth/the-book-of-the-living": path.join(process.cwd(), "content/early-library/readings/gospel-truth/the-book-of-the-living.json"),
  "gospel-truth/the-return-to-unity": path.join(process.cwd(), "content/early-library/readings/gospel-truth/the-return-to-unity.json"),
  "gospel-truth/error-and-forgetfulness": path.join(process.cwd(), "content/early-library/readings/gospel-truth/error-and-forgetfulness.json"),
  "epistula-apostolorum/chapter-24": path.join(process.cwd(), "public/early/texts/epistula-apostolorum.json"),
  "epistula-apostolorum/chapter-31": path.join(process.cwd(), "public/early/texts/epistula-apostolorum.json"),
  "epistula-apostolorum/chapter-49": path.join(process.cwd(), "public/early/texts/epistula-apostolorum.json"),
  "barnabas/barn-7": path.join(process.cwd(), "content/early-library/readings/barnabas/barn-7.json"),
  "1-clement/1-clem-16": path.join(process.cwd(), "content/early-library/readings/1-clement/1-clem-16.json"),
  "barnabas/barn-13": path.join(process.cwd(), "content/early-library/readings/barnabas/barn-13.json"),
  "1-clement/1-clem-43": path.join(process.cwd(), "content/early-library/readings/1-clement/1-clem-43.json"),
  "1-clement/1-clem-5": path.join(process.cwd(), "content/early-library/readings/1-clement/1-clem-5.json"),
  "1-clement/1-clem-17": path.join(process.cwd(), "content/early-library/readings/1-clement/1-clem-17.json"),
  "1-clement/1-clem-57": path.join(process.cwd(), "content/early-library/readings/1-clement/1-clem-57.json"),
  "1-clement/1-clem-59": path.join(process.cwd(), "content/early-library/readings/1-clement/1-clem-59.json"),
  "barnabas/barn-2": path.join(process.cwd(), "content/early-library/readings/barnabas/barn-2.json"),
  "barnabas/barn-3": path.join(process.cwd(), "content/early-library/readings/barnabas/barn-3.json"),
  "barnabas/barn-21": path.join(process.cwd(), "content/early-library/readings/barnabas/barn-21.json"),
  "lightfoot-barnabas-goats-thorns/excerpt": path.join(process.cwd(), "content/jesus/early-excerpts/lightfoot-barnabas-goats-thorns.json"),
  "lightfoot-barnabas-thorns-heart/excerpt": path.join(process.cwd(), "content/jesus/early-excerpts/lightfoot-barnabas-thorns-heart.json"),
  "lightfoot-first-clement-sheep-lamb/excerpt": path.join(process.cwd(), "content/jesus/early-excerpts/lightfoot-first-clement-sheep-lamb.json"),
  "lightfoot-barnabas-two-peoples/excerpt": path.join(process.cwd(), "content/jesus/early-excerpts/lightfoot-barnabas-two-peoples.json"),
  "lightfoot-first-clement-aaron-rod/excerpt": path.join(process.cwd(), "content/jesus/early-excerpts/lightfoot-first-clement-aaron-rod.json"),
  "lightfoot-first-clement-pillars/excerpt": path.join(process.cwd(), "content/jesus/early-excerpts/lightfoot-first-clement-pillars.json"),
  "lightfoot-first-clement-dust-smoke/excerpt": path.join(process.cwd(), "content/jesus/early-excerpts/lightfoot-first-clement-dust-smoke.json"),
  "lightfoot-first-clement-wisdom-fruit/excerpt": path.join(process.cwd(), "content/jesus/early-excerpts/lightfoot-first-clement-wisdom-fruit.json"),
  "lightfoot-first-clement-pasture-prayer/excerpt": path.join(process.cwd(), "content/jesus/early-excerpts/lightfoot-first-clement-pasture-prayer.json"),
  "lightfoot-barnabas-yoke-sacrifice/excerpt": path.join(process.cwd(), "content/jesus/early-excerpts/lightfoot-barnabas-yoke-sacrifice.json"),
  "lightfoot-barnabas-fast-light/excerpt": path.join(process.cwd(), "content/jesus/early-excerpts/lightfoot-barnabas-fast-light.json"),
  "lightfoot-barnabas-beast-covenant/excerpt": path.join(process.cwd(), "content/jesus/early-excerpts/lightfoot-barnabas-beast-covenant.json"),
  "lightfoot-barnabas-sheep-sun/excerpt": path.join(process.cwd(), "content/jesus/early-excerpts/lightfoot-barnabas-sheep-sun.json"),
  "lightfoot-barnabas-vessel-body/excerpt": path.join(process.cwd(), "content/jesus/early-excerpts/lightfoot-barnabas-vessel-body.json"),
  "acts-thomas-groom-prayer/excerpt": path.join(process.cwd(), "content/jesus/early-excerpts/acts-thomas-groom-prayer.json"),
  "acts-thomas-creditor/excerpt": path.join(process.cwd(), "content/jesus/early-excerpts/acts-thomas-creditor.json"),
  "acts-thomas-youth-light/excerpt": path.join(process.cwd(), "content/jesus/early-excerpts/acts-thomas-youth-light.json"),
  "acts-thomas-desert-temple/excerpt": path.join(process.cwd(), "content/jesus/early-excerpts/acts-thomas-desert-temple.json"),
  "acts-thomas-oil-121/excerpt": path.join(process.cwd(), "content/jesus/early-excerpts/acts-thomas-oil-121.json"),
  "acts-thomas-open-treasury/excerpt": path.join(process.cwd(), "content/jesus/early-excerpts/acts-thomas-open-treasury.json"),
  "acts-thomas-prayer-opening/excerpt": path.join(process.cwd(), "content/jesus/early-excerpts/acts-thomas-prayer-opening.json"),
  "acts-thomas-four-one/excerpt": path.join(process.cwd(), "content/jesus/early-excerpts/acts-thomas-four-one.json"),
  "1-clement/1-clem-10": path.join(process.cwd(), "content/early-library/readings/1-clement/1-clem-10.json"),
  "1-clement/1-clem-14": path.join(process.cwd(), "content/early-library/readings/1-clement/1-clem-14.json"),
  "1-clement/1-clem-18": path.join(process.cwd(), "content/early-library/readings/1-clement/1-clem-18.json"),
  "1-clement/1-clem-2": path.join(process.cwd(), "content/early-library/readings/1-clement/1-clem-2.json"),
  "1-clement/1-clem-21": path.join(process.cwd(), "content/early-library/readings/1-clement/1-clem-21.json"),
  "1-clement/1-clem-27": path.join(process.cwd(), "content/early-library/readings/1-clement/1-clem-27.json"),
  "1-clement/1-clem-29": path.join(process.cwd(), "content/early-library/readings/1-clement/1-clem-29.json"),
  "1-clement/1-clem-3": path.join(process.cwd(), "content/early-library/readings/1-clement/1-clem-3.json"),
  "1-clement/1-clem-32": path.join(process.cwd(), "content/early-library/readings/1-clement/1-clem-32.json"),
  "1-clement/1-clem-35": path.join(process.cwd(), "content/early-library/readings/1-clement/1-clem-35.json"),
  "1-clement/1-clem-39": path.join(process.cwd(), "content/early-library/readings/1-clement/1-clem-39.json"),
  "1-clement/1-clem-44": path.join(process.cwd(), "content/early-library/readings/1-clement/1-clem-44.json"),
  "1-clement/1-clem-49": path.join(process.cwd(), "content/early-library/readings/1-clement/1-clem-49.json"),
  "1-clement/1-clem-50": path.join(process.cwd(), "content/early-library/readings/1-clement/1-clem-50.json"),
  "1-clement/1-clem-51": path.join(process.cwd(), "content/early-library/readings/1-clement/1-clem-51.json"),
  "1-clement/1-clem-52": path.join(process.cwd(), "content/early-library/readings/1-clement/1-clem-52.json"),
  "1-clement/1-clem-53": path.join(process.cwd(), "content/early-library/readings/1-clement/1-clem-53.json"),
  "1-clement/1-clem-54": path.join(process.cwd(), "content/early-library/readings/1-clement/1-clem-54.json"),
  "barnabas/barn-15": path.join(process.cwd(), "content/early-library/readings/barnabas/barn-15.json"),
  "diognetus/diogn-11": path.join(process.cwd(), "content/early-library/readings/diognetus/diogn-11.json"),
  "diognetus/diogn-2": path.join(process.cwd(), "content/early-library/readings/diognetus/diogn-2.json"),
  "acts-thomas-mother-houses/excerpt": path.join(process.cwd(), "content/jesus/early-excerpts/acts-thomas-mother-houses.json"),
  "acts-thomas-good-shepherd/excerpt": path.join(process.cwd(), "content/jesus/early-excerpts/acts-thomas-good-shepherd.json"),
  "acts-thomas-spirit-return/excerpt": path.join(process.cwd(), "content/jesus/early-excerpts/acts-thomas-spirit-return.json"),
  "acts-thomas-hidden-mother/excerpt": path.join(process.cwd(), "content/jesus/early-excerpts/acts-thomas-hidden-mother.json"),
  "acts-thomas-dwelling-places/excerpt": path.join(process.cwd(), "content/jesus/early-excerpts/acts-thomas-dwelling-places.json"),
  "acts-thomas-eagle-dream/excerpt": path.join(process.cwd(), "content/jesus/early-excerpts/acts-thomas-eagle-dream.json"),
  "acts-thomas-life-loan/excerpt": path.join(process.cwd(), "content/jesus/early-excerpts/acts-thomas-life-loan.json"),
  "acts-thomas-bread-life/excerpt": path.join(process.cwd(), "content/jesus/early-excerpts/acts-thomas-bread-life.json"),
  "acts-thomas-crown/excerpt": path.join(process.cwd(), "content/jesus/early-excerpts/acts-thomas-crown.json"),
  "1-clement/1-clem-11": path.join(process.cwd(), "content/early-library/readings/1-clement/1-clem-11.json"),
  "1-clement/1-clem-15": path.join(process.cwd(), "content/early-library/readings/1-clement/1-clem-15.json"),
  "1-clement/1-clem-30": path.join(process.cwd(), "content/early-library/readings/1-clement/1-clem-30.json"),
  "1-clement/1-clem-56": path.join(process.cwd(), "content/early-library/readings/1-clement/1-clem-56.json"),
  "barnabas/barn-14": path.join(process.cwd(), "content/early-library/readings/barnabas/barn-14.json"),
  "acts-thomas-wedding-invitation/excerpt": path.join(process.cwd(), "content/jesus/early-excerpts/acts-thomas-wedding-invitation.json"),
  "acts-thomas-old-new-48/excerpt": path.join(process.cwd(), "content/jesus/early-excerpts/acts-thomas-old-new-48.json"),
  "acts-thomas-lost-sheep/excerpt": path.join(process.cwd(), "content/jesus/early-excerpts/acts-thomas-lost-sheep.json"),
  "acts-thomas-old-new-58/excerpt": path.join(process.cwd(), "content/jesus/early-excerpts/acts-thomas-old-new-58.json"),
  "acts-thomas-heat-day/excerpt": path.join(process.cwd(), "content/jesus/early-excerpts/acts-thomas-heat-day.json"),
  "acts-thomas-flock-wolves/excerpt": path.join(process.cwd(), "content/jesus/early-excerpts/acts-thomas-flock-wolves.json"),
  "acts-thomas-wolves-clothing/excerpt": path.join(process.cwd(), "content/jesus/early-excerpts/acts-thomas-wolves-clothing.json"),
  "acts-thomas-stolen-thoughts/excerpt": path.join(process.cwd(), "content/jesus/early-excerpts/acts-thomas-stolen-thoughts.json"),
  "barnabas/barn-4": path.join(process.cwd(), "content/early-library/readings/barnabas/barn-4.json"),
  "barnabas/barn-5": path.join(process.cwd(), "content/early-library/readings/barnabas/barn-5.json"),
  "barnabas/barn-8": path.join(process.cwd(), "content/early-library/readings/barnabas/barn-8.json"),
  "barnabas/barn-9": path.join(process.cwd(), "content/early-library/readings/barnabas/barn-9.json"),
  "1-clement/1-clem-8": path.join(process.cwd(), "content/early-library/readings/1-clement/1-clem-8.json"),
  "1-clement/1-clem-12": path.join(process.cwd(), "content/early-library/readings/1-clement/1-clem-12.json"),
  "didache/did-10": path.join(process.cwd(), "content/early-library/readings/didache/did-10.json"),
  "diognetus/diogn-5": path.join(process.cwd(), "content/early-library/readings/diognetus/diogn-5.json"),
  "acts-thomas-physician-10/excerpt": path.join(process.cwd(), "content/jesus/early-excerpts/acts-thomas-physician-10.json"),
  "acts-thomas-birds/excerpt": path.join(process.cwd(), "content/jesus/early-excerpts/acts-thomas-birds.json"),
  "acts-thomas-wealth/excerpt": path.join(process.cwd(), "content/jesus/early-excerpts/acts-thomas-wealth.json"),
  "acts-thomas-ask/excerpt": path.join(process.cwd(), "content/jesus/early-excerpts/acts-thomas-ask.json"),
  "acts-thomas-physician-95/excerpt": path.join(process.cwd(), "content/jesus/early-excerpts/acts-thomas-physician-95.json"),
  "acts-thomas-physician-143/excerpt": path.join(process.cwd(), "content/jesus/early-excerpts/acts-thomas-physician-143.json"),
  "acts-thomas-physician-156/excerpt": path.join(process.cwd(), "content/jesus/early-excerpts/acts-thomas-physician-156.json"),
  "barnabas/s5": path.join(process.cwd(), "public/early/texts/barnabas.json"),
  "1-clement/1-clem-34": path.join(process.cwd(), "content/early-library/readings/1-clement/1-clem-34.json"),
  "1-clement/1-clem-36": path.join(process.cwd(), "content/early-library/readings/1-clement/1-clem-36.json"),
  "barnabas/barn-6": path.join(process.cwd(), "content/early-library/readings/barnabas/barn-6.json"),
  "diognetus/diogn-10": path.join(process.cwd(), "content/early-library/readings/diognetus/diogn-10.json"),

  "didache/s13": path.join(process.cwd(), "public/early/texts/didache.json"),
  "1-clement/s19": path.join(process.cwd(), "public/early/texts/1clement.json"),
  "1-clement/s45": path.join(process.cwd(), "public/early/texts/1clement.json"),
  "1-clement/1-clem-13": path.join(process.cwd(), "content/early-library/readings/1-clement/1-clem-13.json"),
  "1-clement/1-clem-6": path.join(process.cwd(), "content/early-library/readings/1-clement/1-clem-6.json"),
  "1-clement/1-clem-7": path.join(process.cwd(), "content/early-library/readings/1-clement/1-clem-7.json"),
  "1-clement/1-clem-38": path.join(process.cwd(), "content/early-library/readings/1-clement/1-clem-38.json"),
  "barnabas/barn-12": path.join(process.cwd(), "content/early-library/readings/barnabas/barn-12.json"),
  "diognetus/diogn-9": path.join(process.cwd(), "content/early-library/readings/diognetus/diogn-9.json"),
  "acts-thomas-marriage/excerpt": path.join(process.cwd(), "content/jesus/early-excerpts/acts-thomas-marriage.json"),
  "acts-thomas-bride-response/excerpt": path.join(process.cwd(), "content/jesus/early-excerpts/acts-thomas-bride-response.json"),
  "acts-thomas-shepherd/excerpt": path.join(process.cwd(), "content/jesus/early-excerpts/acts-thomas-shepherd.json"),
  "acts-thomas-crowd/excerpt": path.join(process.cwd(), "content/jesus/early-excerpts/acts-thomas-crowd.json"),
  "acts-thomas-bitter-tree/excerpt": path.join(process.cwd(), "content/jesus/early-excerpts/acts-thomas-bitter-tree.json"),
  "acts-thomas-yoke/excerpt": path.join(process.cwd(), "content/jesus/early-excerpts/acts-thomas-yoke.json"),
  "acts-thomas-seed/excerpt": path.join(process.cwd(), "content/jesus/early-excerpts/acts-thomas-seed.json"),
  "acts-thomas-mygdonia-marriage/excerpt": path.join(process.cwd(), "content/jesus/early-excerpts/acts-thomas-mygdonia-marriage.json"),
  "acts-thomas-soldiers/excerpt": path.join(process.cwd(), "content/jesus/early-excerpts/acts-thomas-soldiers.json"),
  "acts-thomas-tower/excerpt": path.join(process.cwd(), "content/jesus/early-excerpts/acts-thomas-tower.json"),
  "acts-thomas-oil/excerpt": path.join(process.cwd(), "content/jesus/early-excerpts/acts-thomas-oil.json"),

  "didache/s16": path.join(process.cwd(), "public/early/texts/didache.json"),
  "barnabas/s9": path.join(process.cwd(), "public/early/texts/barnabas.json"),
  "barnabas/barn-11": path.join(process.cwd(), "content/early-library/readings/barnabas/barn-11.json"),
  "barnabas/barn-16": path.join(process.cwd(), "content/early-library/readings/barnabas/barn-16.json"),
  "1-clement/1-clem-25": path.join(process.cwd(), "content/early-library/readings/1-clement/1-clem-25.json"),
  "1-clement/1-clem-26": path.join(process.cwd(), "content/early-library/readings/1-clement/1-clem-26.json"),
  "1-clement/1-clem-48": path.join(process.cwd(), "content/early-library/readings/1-clement/1-clem-48.json"),
  "diognetus/diogn-7": path.join(process.cwd(), "content/early-library/readings/diognetus/diogn-7.json"),
  "diognetus/diogn-12": path.join(process.cwd(), "content/early-library/readings/diognetus/diogn-12.json"),
  "acts-thomas-bride/excerpt": path.join(process.cwd(), "content/jesus/early-excerpts/acts-thomas-bride.json"),
  "acts-thomas-palace/excerpt": path.join(process.cwd(), "content/jesus/early-excerpts/acts-thomas-palace.json"),
  "acts-thomas-prayer/excerpt": path.join(process.cwd(), "content/jesus/early-excerpts/acts-thomas-prayer.json"),
  "didache/s1": path.join(process.cwd(), "public/early/texts/didache.json"),
  "didache/s2": path.join(process.cwd(), "public/early/texts/didache.json"),
  "didache/s3": path.join(process.cwd(), "public/early/texts/didache.json"),
  "didache/s4": path.join(process.cwd(), "public/early/texts/didache.json"),
  "didache/s5": path.join(process.cwd(), "public/early/texts/didache.json"),
  "didache/s6": path.join(process.cwd(), "public/early/texts/didache.json"),
  "didache/did-9": path.join(process.cwd(), "content/early-library/readings/didache/did-9.json"),
  "barnabas/barn-18": path.join(process.cwd(), "content/early-library/readings/barnabas/barn-18.json"),
  "barnabas/barn-19": path.join(process.cwd(), "content/early-library/readings/barnabas/barn-19.json"),
  "barnabas/barn-20": path.join(process.cwd(), "content/early-library/readings/barnabas/barn-20.json"),
  "1-clement/1-clem-23": path.join(process.cwd(), "content/early-library/readings/1-clement/1-clem-23.json"),
  "1-clement/1-clem-24": path.join(process.cwd(), "content/early-library/readings/1-clement/1-clem-24.json"),
  "1-clement/1-clem-37": path.join(process.cwd(), "content/early-library/readings/1-clement/1-clem-37.json"),
  "diognetus/diogn-6": path.join(process.cwd(), "content/early-library/readings/diognetus/diogn-6.json"),
  "eusebius-talents/excerpt": path.join(process.cwd(), "content/jesus/early-excerpts/eusebius-talents.json"),
  "acts-thomas-hymn/excerpt": path.join(process.cwd(), "content/jesus/early-excerpts/acts-thomas-hymn.json"),
  "2-clement/2-clem-7": path.join(process.cwd(), "content/early-library/readings/2-clement/2-clem-7.json"),
  "2-clement/2-clem-8": path.join(process.cwd(), "content/early-library/readings/2-clement/2-clem-8.json"),
  "2-clement/2-clem-11": path.join(process.cwd(), "content/early-library/readings/2-clement/2-clem-11.json"),
  "2-clement/2-clem-12": path.join(process.cwd(), "content/early-library/readings/2-clement/2-clem-12.json"),
  "gospel-philip/spiritual-growth": path.join(process.cwd(), "content/early-library/readings/gospel-philip/spiritual-growth.json"),
  "gospel-philip/life-death-light-and-darkness": path.join(process.cwd(), "content/early-library/readings/gospel-philip/life-death-light-and-darkness.json"),
  "gospel-philip/uprooting-evil": path.join(process.cwd(), "content/early-library/readings/gospel-philip/uprooting-evil.json"),
  "gospel-truth/the-gospel": path.join(process.cwd(), "content/early-library/readings/gospel-truth/the-gospel.json"),
  "gospel-truth/doing-the-father-s-will": path.join(process.cwd(), "content/early-library/readings/gospel-truth/doing-the-father-s-will.json"),
  "shepherd-hermas/parables-which-he-spake-with-me": path.join(process.cwd(), "content/early-library/readings/shepherd-hermas/parables-which-he-spake-with-me.json"),
  "shepherd-hermas/parable-6": path.join(process.cwd(), "content/early-library/readings/shepherd-hermas/parable-6.json"),
  "shepherd-hermas/parable-8": path.join(process.cwd(), "content/early-library/readings/shepherd-hermas/parable-8.json"),
  "shepherd-hermas/parable-8-part-2": path.join(process.cwd(), "content/early-library/readings/shepherd-hermas/parable-8-part-2.json"),
  "shepherd-hermas/parable-9": path.join(process.cwd(), "content/early-library/readings/shepherd-hermas/parable-9.json"),
  "shepherd-hermas/parable-9-part-2": path.join(process.cwd(), "content/early-library/readings/shepherd-hermas/parable-9-part-2.json"),
  "shepherd-hermas/parable-9-part-3": path.join(process.cwd(), "content/early-library/readings/shepherd-hermas/parable-9-part-3.json"),
  "shepherd-hermas/parable-9-part-4": path.join(process.cwd(), "content/early-library/readings/shepherd-hermas/parable-9-part-4.json"),
  "shepherd-hermas/mandate-5": path.join(process.cwd(), "content/early-library/readings/shepherd-hermas/mandate-5.json"),
  "shepherd-hermas/mandate-11": path.join(process.cwd(), "content/early-library/readings/shepherd-hermas/mandate-11.json"),
  "epistula-apostolorum/chapter-32": path.join(process.cwd(), "public/early/texts/epistula-apostolorum.json"),
  "epistula-apostolorum/chapter-44": path.join(process.cwd(), "public/early/texts/epistula-apostolorum.json"),
  "epistula-apostolorum/chapter-45": path.join(process.cwd(), "public/early/texts/epistula-apostolorum.json"),
  "epistula-apostolorum/chapter-47": path.join(process.cwd(), "public/early/texts/epistula-apostolorum.json"),
  "epistula-apostolorum/chapter-43": path.join(process.cwd(), "public/early/texts/epistula-apostolorum.json"),
  "2-clement/2-clem-5": path.join(process.cwd(), "content/early-library/readings/2-clement/2-clem-5.json"),
  "gospel-philip/becoming-christians": path.join(process.cwd(), "content/early-library/readings/gospel-philip/becoming-christians.json"),
  "gospel-truth/the-parable-of-the-sheep": path.join(process.cwd(), "content/early-library/readings/gospel-truth/the-parable-of-the-sheep.json"),
  "gospel-truth/the-parable-of-the-jars": path.join(process.cwd(), "content/early-library/readings/gospel-truth/the-parable-of-the-jars.json"),
  "gospel-truth/the-parable-of-the-nightmares": path.join(process.cwd(), "content/early-library/readings/gospel-truth/the-parable-of-the-nightmares.json"),
  "shepherd-hermas/another-parable": path.join(process.cwd(), "content/early-library/readings/shepherd-hermas/another-parable.json"),
  "shepherd-hermas/vision-3": path.join(process.cwd(), "content/early-library/readings/shepherd-hermas/vision-3.json"),
};

export async function getEarlyFigureTexts(
  figures: EarlyFigure[] = EARLY_FIGURES,
  load: (file: string) => Promise<string> = file => readFile(file, "utf8"),
  report: (message: string) => void = console.error,
): Promise<EarlyFigureTexts> {
  const result: EarlyFigureTexts = Object.fromEntries(figures.map(figure => [figure.id, null]));
  try {
    const catalog = JSON.parse(await load(path.join(process.cwd(), "content/early-library/catalog.json")));
    if (!Array.isArray(catalog)) throw new Error("invalid catalog");
    for (const figure of figures) {
      try {
        const parts = earlyFigureParts(figure);
        if (!parts.length || parts[0].section !== figure.section || parts[0].start !== figure.start || parts[0].end !== figure.end || parts[0].joinPrevious || !/^[a-f0-9]{64}$/.test(figure.sha256)) throw new Error("invalid mapping");
        const records = catalog.filter(record => record?.id === figure.edition);
        if (!figure.excerpt && (records.length !== 1 || records[0].publicationStatus !== "published")) throw new Error("edition unavailable");
        if (figure.excerpt && (parts.length !== 1 || partIsInvalidExcerpt(figure))) throw new Error("invalid excerpt");
        if (figure.edition.startsWith("lightfoot-") && !figure.originalReader) throw new Error("missing original reader");
        if (figure.originalReader && !validOriginalEarlyReader(figure)) throw new Error("invalid original reader");
        const paragraphs: string[] = [];
        for (const part of parts) {
          const file = sourceFiles[`${figure.edition}/${part.section}`];
          if (!file || !Number.isSafeInteger(part.start) || part.start < 1 || !Number.isSafeInteger(part.end) || part.end < part.start) throw new Error("invalid part");
          const page = JSON.parse(await load(file));
          let blocks: string[];
          if (figure.excerpt) {
            if (page.id !== figure.edition || part.section !== "excerpt" || !Array.isArray(page.blocks) || page.blocks.length !== 1 || page.blocks.some((block: {kind?: unknown; text?: unknown}) => block.kind !== "primary-text" || typeof block.text !== "string" || !block.text.trim())) throw new Error("invalid excerpt source");
            blocks = page.blocks.slice(part.start - 1, part.end).map((block: {text: string}) => block.text);
          } else if (figure.legacy && figure.edition === "1-clement" && figure.legacyText === "1clement" && /^(?:s19|s45)$/.test(part.section)) {
            const index = Number(part.section.slice(1));
            const heading = index === 19 ? "Chapter XX." : "Chapter XLVI.";
            if (page.id !== "1clement" || !Array.isArray(page.sections) || !page.sections[index]?.heading?.startsWith(heading) || !Array.isArray(page.sections[index]?.paragraphs) || page.sections[index].paragraphs.some((text: unknown) => typeof text !== "string" || !text.trim())) throw new Error("invalid 1 Clement source");
            blocks = page.sections[index].paragraphs.slice(part.start - 1, part.end);
          } else if (figure.legacy && figure.edition === "barnabas" && /^(?:s5|s9)$/.test(part.section)) {
            const index = Number(part.section.slice(1));
            const heading = index === 5 ? "Chapter VI." : "Chapter X.";
            if (page.id !== "barnabas" || !Array.isArray(page.sections) || !page.sections[index]?.heading?.startsWith(heading) || !Array.isArray(page.sections[index]?.paragraphs) || page.sections[index].paragraphs.some((text: unknown) => typeof text !== "string" || !text.trim())) throw new Error("invalid Barnabas source");
            blocks = page.sections[index].paragraphs.slice(part.start - 1, part.end);
          } else if (figure.legacy && figure.edition === "didache") {
            const index = /^(?:s[1-6]|s13|s16)$/.test(part.section) ? Number(part.section.slice(1)) : -1;
            const headings = ["", "Chapter I.", "Chapter II.", "Chapter III.", "Chapter IV.", "Chapter V.", "Chapter VI.", ...Array(6).fill(""), "Chapter XIII.", ...Array(2).fill(""), "Chapter XVI."];
            if (page.id !== "didache" || !Array.isArray(page.sections) || index < 1 || typeof page.sections[index]?.heading !== "string" || !page.sections[index].heading.startsWith(headings[index]) || !Array.isArray(page.sections[index]?.paragraphs) || page.sections[index].paragraphs.some((text: unknown) => typeof text !== "string" || !text.trim())) throw new Error("invalid Didache source");
            blocks = page.sections[index].paragraphs.slice(part.start - 1, part.end);
          } else if (figure.legacy) {
            if (figure.edition !== "epistula-apostolorum" || !/^chapter-(24|31|32|43|44|45|47|49)$/.test(part.section) || records[0].reuseExistingText !== true || !EARLY_TEXTS.some(text => text.id === figure.edition) || page.id !== figure.edition || !Array.isArray(page.sections)) throw new Error("invalid legacy edition");
            const heading = `Chapter ${part.section.slice(8)}`;
            const chapters = page.sections.filter((section: { heading?: unknown }) => section.heading === heading);
            if (chapters.length !== 1 || !Array.isArray(chapters[0].paragraphs) || chapters[0].paragraphs.some((text: unknown) => typeof text !== "string" || !text.trim())) throw new Error("invalid chapter");
            blocks = chapters[0].paragraphs.slice(part.start - 1, part.end);
          } else {
            const matches = Array.isArray(records[0].sections) ? records[0].sections.filter((section: { id?: unknown }) => section.id === part.section) : [];
            if (matches.length !== 1 || matches[0].kind !== "primary-text" || page.id !== part.section || page.kind !== "primary-text" || !Array.isArray(page.blocks) || page.chars !== matches[0].chars ||
                page.blocks.some((block: { kind?: unknown; text?: unknown }) => block.kind !== "primary-text" || typeof block.text !== "string" || !block.text.trim()) ||
                page.chars !== page.blocks.reduce((sum: number, block: { text: string }) => sum + block.text.length, 0)) throw new Error("invalid section");
            blocks = page.blocks.slice(part.start - 1, part.end).map((block: { text: string }) => block.text);
          }
          if (blocks.length !== part.end - part.start + 1) throw new Error("invalid range");
          paragraphs.push(...blocks);
        }
        if (createHash("sha256").update(paragraphs.join("\n\n")).digest("hex") !== figure.sha256) throw new Error("paragraph identity mismatch");
        result[figure.id] = paragraphs;
      } catch (error) {
        report(`[parables] ${figure.id}: ${error instanceof Error ? error.message : "source unavailable"}`);
      }
    }
  } catch (error) {
    report(`[parables] Early catalog: ${error instanceof Error ? error.message : "source unavailable"}`);
  }
  return result;
}

/** A corrected excerpt remains available even when its separately linked reader is not. */
export async function getEarlyOriginalReaderAvailability(
  figures: EarlyFigure[] = EARLY_FIGURES,
  load: (file: string) => Promise<string> = file => readFile(file, "utf8"),
): Promise<Record<string, boolean>> {
  const result: Record<string, boolean> = {};
  try {
    const catalog = JSON.parse(await load(path.join(process.cwd(), "content/early-library/catalog.json")));
    if (!Array.isArray(catalog)) return result;
    for (const figure of figures.filter(item => item.originalReader)) {
      result[figure.id] = false;
      const continuation = originalEarlyContinuation(figure);
      if (continuation) {
        const key = `${figure.id}:continuation`;
        result[key] = false;
        try {
          const records = catalog.filter(record => record?.id === continuation.edition);
          const sections = records.length === 1 && records[0].publicationStatus === "published"
            ? records[0].sections?.filter((section: { id?: unknown; kind?: unknown }) => section.id === continuation.section && section.kind === "primary-text") : [];
          const file = sourceFiles[`${continuation.edition}/${continuation.section}`];
          if (sections?.length === 1 && file) {
            const page = JSON.parse(await load(file));
            const blocks = Array.isArray(page.blocks) ? page.blocks.slice(continuation.start - 1, continuation.end) : [];
            result[key] = page.id === continuation.section && page.kind === "primary-text" && page.chars === sections[0].chars &&
              Array.isArray(page.blocks) && page.blocks.every((block: { kind?: unknown; text?: unknown }) => block.kind === "primary-text" && typeof block.text === "string" && Boolean(block.text.trim())) &&
              page.chars === page.blocks.reduce((sum: number, block: { text: string }) => sum + block.text.length, 0) &&
              blocks.length === continuation.end - continuation.start + 1 &&
              createHash("sha256").update(blocks.map((block: { text: string }) => block.text).join("\n\n")).digest("hex") === continuation.sha256;
          }
        } catch { /* A missing continuation does not hide the first reader. */ }
      }
      if (!validOriginalEarlyReader(figure)) continue;
      const original = figure.originalReader!;
      const matches = catalog.filter(record => record?.id === original.edition);
      if (matches.length !== 1 || matches[0].publicationStatus !== "published" || !matches[0].sections?.some((section: { id?: unknown; kind?: unknown }) => section.id === original.section && section.kind === "primary-text")) continue;
      try {
        const file = sourceFiles[`${original.edition}/${original.section}`];
        if (!file) continue;
        const page = JSON.parse(await load(file));
        const blocks = page.blocks?.slice(original.start - 1, original.end);
        result[figure.id] = page.id === original.section && page.kind === "primary-text" && Array.isArray(blocks) && blocks.length === original.end - original.start + 1 && blocks.every((block: { kind?: unknown; text?: unknown }) => block.kind === "primary-text" && typeof block.text === "string" && Boolean(block.text.trim()));
      } catch { /* Keep the corrected excerpt and its scan link available. */ }
    }
  } catch { /* No reader is advertised when the catalog is unavailable. */ }
  return result;
}
