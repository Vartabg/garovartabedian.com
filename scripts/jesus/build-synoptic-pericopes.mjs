#!/usr/bin/env node
/**
 * Generate public/jesus/synoptic-pericopes.json.
 *
 * Extracts exact English (WEB) and Greek (SBLGNT) verses for the 12 landmark
 * pericopes comparing Matthew, Mark, Luke, and John.
 *
 * Usage:
 *   node scripts/jesus/build-synoptic-pericopes.mjs
 */

import fs from "node:fs";
import path from "node:path";
import { fileURLToPath } from "node:url";

const ROOT = path.join(path.dirname(fileURLToPath(import.meta.url)), "../..");
const WEB_DIR = path.join(ROOT, "public/scriptures/text/web");
const ORIG_DIR = path.join(ROOT, "public/scriptures/original");
const OUT_FILE = path.join(ROOT, "public/jesus/synoptic-pericopes.json");

const PERICOPES = [
  {
    id: "beatitudes",
    title: "The Beatitudes",
    category: "Sayings & Discourses",
    tradition: "double-tradition-q",
    traditionLabel: "Double Tradition / Q-Source (Matthew & Luke)",
    synopsis:
      "Matthew's Sermon on the Mount spiritualizes the blessings ('poor in spirit', 'hunger for righteousness'), whereas Luke's Sermon on the Plain delivers direct social antitheses ('blessed are you who are poor') accompanied by four solemn woes ('woe to you who are rich').",
    witnesses: {
      MAT: { ref: "5:3-12", bookName: "Matthew" },
      LUK: { ref: "6:20-26", bookName: "Luke" },
    },
  },
  {
    id: "lords-prayer",
    title: "The Lord's Prayer",
    category: "Sayings & Discourses",
    tradition: "double-tradition-q",
    traditionLabel: "Double Tradition / Q-Source (Matthew & Luke)",
    synopsis:
      "The fundamental disciples' prayer from Q. Matthew preserves the complete liturgical form with seven petitions including the deliverance from the evil one; Luke provides a concise five-petition structure focusing on daily sustenance and forgiveness.",
    witnesses: {
      MAT: { ref: "6:9-13", bookName: "Matthew" },
      LUK: { ref: "11:2-4", bookName: "Luke" },
    },
  },
  {
    id: "temptation",
    title: "The Temptation in the Wilderness",
    category: "Sayings & Discourses",
    tradition: "triple-tradition",
    traditionLabel: "Triple Tradition + Q Expansion (Matthew, Mark, Luke)",
    synopsis:
      "Mark provides the primitive core narrative (forty days in the wilderness, tested by Satan, living among wild animals, attended by angels). Matthew and Luke independently expand this with the three detailed dialogue tests citing Deuteronomy, but invert the second and third temptations.",
    witnesses: {
      MAT: { ref: "4:1-11", bookName: "Matthew" },
      MRK: { ref: "1:12-13", bookName: "Mark" },
      LUK: { ref: "4:1-13", bookName: "Luke" },
    },
  },
  {
    id: "stilling-the-storm",
    title: "Stilling the Storm",
    category: "Miracles & Signs",
    tradition: "triple-tradition",
    traditionLabel: "Triple Tradition / Markan Priority (Matthew, Mark, Luke)",
    synopsis:
      "Classic evidence for Markan priority: Mark contains vivid eyewitness touches ('in the stern, asleep on the cushion') and raw disciple panic ('Teacher, don\\'t you care that we are dying?'). Matthew and Luke omit the blunt question, softening it into reverent cries for rescue ('Lord, save us, we are perishing!').",
    witnesses: {
      MAT: { ref: "8:23-27", bookName: "Matthew" },
      MRK: { ref: "4:35-41", bookName: "Mark" },
      LUK: { ref: "8:22-25", bookName: "Luke" },
    },
  },
  {
    id: "healing-paralytic",
    title: "Healing of the Paralytic",
    category: "Miracles & Signs",
    tradition: "triple-tradition",
    traditionLabel: "Triple Tradition / Verbatim Parenthesis (Matthew, Mark, Luke)",
    synopsis:
      "One of the most famous textual agreements in New Testament scholarship: all three synoptics interrupt Jesus' sentence at the exact same word with the identical parenthetical comment: 'that you may know that the Son of Man has authority on earth to forgive sins (he said to the paralytic)...'.",
    witnesses: {
      MAT: { ref: "9:2-8", bookName: "Matthew" },
      MRK: { ref: "2:1-12", bookName: "Mark" },
      LUK: { ref: "5:17-26", bookName: "Luke" },
    },
  },
  {
    id: "feeding-5000",
    title: "Feeding of the Five Thousand",
    category: "Miracles & Signs",
    tradition: "quadruple-attestation",
    traditionLabel: "Quadruple Attestation (All Four Gospels)",
    synopsis:
      "The only miracle account recorded in all four canonical Gospels. All four agree on the five loaves, two fish, twelve baskets of leftovers, and five thousand men. John introduces dialogue with Philip and Andrew, identifies the source as a young boy with barley loaves, and notes the crowd's attempt to make Jesus king by force.",
    witnesses: {
      MAT: { ref: "14:13-21", bookName: "Matthew" },
      MRK: { ref: "6:32-44", bookName: "Mark" },
      LUK: { ref: "9:10-17", bookName: "Luke" },
      JHN: { ref: "6:1-14", bookName: "John" },
    },
  },
  {
    id: "peters-confession",
    title: "Peter's Confession of Christ",
    category: "Identity & Ministry",
    tradition: "special-matthew",
    traditionLabel: "Triple Tradition + M-Sondergut (Matthew, Mark, Luke)",
    synopsis:
      "Mark records Peter's concise declaration: 'You are the Christ.' Luke writes: 'The Christ of God.' Matthew preserves the extended confession ('You are the Christ, the Son of the living God') and the uniquely Matthean blessing: 'You are Peter, and upon this rock I will build my church.'",
    witnesses: {
      MAT: { ref: "16:13-20", bookName: "Matthew" },
      MRK: { ref: "8:27-30", bookName: "Mark" },
      LUK: { ref: "9:18-21", bookName: "Luke" },
    },
  },
  {
    id: "transfiguration",
    title: "The Transfiguration",
    category: "Identity & Ministry",
    tradition: "triple-tradition",
    traditionLabel: "Triple Tradition (Matthew, Mark, Luke)",
    synopsis:
      "The luminous manifestation on the holy mountain before Peter, James, and John. Luke uniquely adds that Moses and Elijah spoke of Jesus' 'exodus' (departure) which he was to fulfill in Jerusalem, and notes that Peter and his companions were weighed down with sleep.",
    witnesses: {
      MAT: { ref: "17:1-9", bookName: "Matthew" },
      MRK: { ref: "9:2-10", bookName: "Mark" },
      LUK: { ref: "9:28-36", bookName: "Luke" },
    },
  },
  {
    id: "greatest-commandment",
    title: "The Greatest Commandment",
    category: "Sayings & Discourses",
    tradition: "triple-tradition",
    traditionLabel: "Triple Tradition (Matthew, Mark, Luke)",
    synopsis:
      "In Matthew and Mark, Jesus answers a scribe's question by combining the Shema (Deuteronomy 6:4-5) with the love of neighbor (Leviticus 19:18). In Luke, the lawyer himself recites the twin commandments, prompting Jesus to confirm the answer and subsequently narrate the Parable of the Good Samaritan.",
    witnesses: {
      MAT: { ref: "22:34-40", bookName: "Matthew" },
      MRK: { ref: "12:28-34", bookName: "Mark" },
      LUK: { ref: "10:25-28", bookName: "Luke" },
    },
  },
  {
    id: "last-supper",
    title: "The Institution of the Lord's Supper",
    category: "Passion & Resurrection",
    tradition: "triple-tradition",
    traditionLabel: "Triple Tradition (Matthew, Mark, Luke)",
    synopsis:
      "The eucharistic words over bread and wine at Passover. Luke includes the command 'do this in remembrance of me' (mirroring Paul in 1 Corinthians 11), while Matthew uniquely includes 'for the forgiveness of sins' regarding the cup.",
    witnesses: {
      MAT: { ref: "26:26-29", bookName: "Matthew" },
      MRK: { ref: "14:22-25", bookName: "Mark" },
      LUK: { ref: "22:15-20", bookName: "Luke" },
    },
  },
  {
    id: "gethsemane",
    title: "The Agony in Gethsemane",
    category: "Passion & Resurrection",
    tradition: "triple-tradition",
    traditionLabel: "Triple Tradition (Matthew, Mark, Luke)",
    synopsis:
      "Jesus' soul-sorrowing prayer beneath the olive trees. Mark uniquely preserves the Aramaic intimacy 'Abba, Father.' Luke records Jesus kneeling rather than falling prostrate, with unique witness to an angel strengthening him and sweat becoming like great drops of blood.",
    witnesses: {
      MAT: { ref: "26:36-46", bookName: "Matthew" },
      MRK: { ref: "14:32-42", bookName: "Mark" },
      LUK: { ref: "22:39-46", bookName: "Luke" },
    },
  },
  {
    id: "empty-tomb",
    title: "The Empty Tomb at Dawn",
    category: "Passion & Resurrection",
    tradition: "quadruple-attestation",
    traditionLabel: "Quadruple Attestation (All Four Gospels)",
    synopsis:
      "The women at dawn on the first day of the week. All four agree Mary Magdalene came to the tomb and found the stone moved away. Matthew records an earthquake and angel like lightning; Mark notes one young man in white; Luke records two men in dazzling apparel; John focuses on Mary Magdalene alerting Peter and the beloved disciple.",
    witnesses: {
      MAT: { ref: "28:1-8", bookName: "Matthew" },
      MRK: { ref: "16:1-8", bookName: "Mark" },
      LUK: { ref: "24:1-10", bookName: "Luke" },
      JHN: { ref: "20:1-10", bookName: "John" },
    },
  },
];

const ORDER = { MAT: 1, MRK: 2, LUK: 3, JHN: 4 };

function parseRef(ref) {
  const [ch, vRange] = ref.split(":");
  const [sV, eV] = vRange.split("-").map(Number);
  return { chapter: Number(ch), startVerse: sV, endVerse: eV ?? sV };
}

function extractWebVerses(book, chapter, startVerse, endVerse) {
  const webFile = path.join(WEB_DIR, `${book}.json`);
  const data = JSON.parse(fs.readFileSync(webFile, "utf8"));
  const chVerses = data.chapters[chapter - 1];
  const out = [];
  for (let v = startVerse; v <= endVerse; v++) {
    out.push({
      number: v,
      text: chVerses[v - 1] ?? "",
    });
  }
  return out;
}

function extractGreekVerses(book, chapter, startVerse, endVerse) {
  const origFile = path.join(ORIG_DIR, book, `${chapter}.json`);
  if (!fs.existsSync(origFile)) return [];
  const data = JSON.parse(fs.readFileSync(origFile, "utf8"));
  const out = [];
  for (const v of data.verses) {
    if (v.number >= startVerse && v.number <= endVerse) {
      out.push({
        number: v.number,
        words: v.words.map((w) => ({
          text: w.text,
          lemma: w.lemma,
          morph: w.morph,
        })),
      });
    }
  }
  return out;
}

const pericopes = PERICOPES.map((p) => {
  const witnesses = {};
  for (const [book, wMeta] of Object.entries(p.witnesses)) {
    const { chapter, startVerse, endVerse } = parseRef(wMeta.ref);
    const verses = extractWebVerses(book, chapter, startVerse, endVerse);
    const greekVerses = extractGreekVerses(book, chapter, startVerse, endVerse);
    witnesses[book] = {
      book,
      bookName: wMeta.bookName,
      ref: `${book} ${wMeta.ref}`,
      order: ORDER[book] ?? 9,
      verses,
      greekVerses,
    };
  }
  return {
    id: p.id,
    title: p.title,
    category: p.category,
    tradition: p.tradition,
    traditionLabel: p.traditionLabel,
    synopsis: p.synopsis,
    witnesses,
  };
});

fs.writeFileSync(OUT_FILE, JSON.stringify({ pericopes }, null, 2) + "\n", "utf8");
console.log(`Generated ${OUT_FILE} with ${pericopes.length} landmark pericopes.`);
