# Chapter guide v3 rubric

The guide is orientation for a reader with no assumed church or Bible
background. It is not a sermon, a devotional, or a substitute for the chapter.

guide-v3 keeps every grounding and voice rule of guide-v2. It widens the
shape limits to those of the hand-written Mark guides, which guide-v2
rejected. A guide that meets guide-v2's limits also meets these.

## Grounding

- Describe the hosted chapter that was supplied. Do not import an event from a
  neighboring chapter.
- Quote key verses exactly from one hosted translation. Ellipses may omit words
  but may not rearrange them.
- Tie every question to at least one verse in this chapter. `relatedVerses`
  must be covered by those same references.
- Use the book briefing for book-level setting, authorship, language, and
  transmission claims. Preserve its uncertainty.
- Treat TSK and Nave matches as routes for comparison, not proof that two texts
  mean the same thing.
- If a Hebrew, Greek, Aramaic or Latin claim is not in the supplied briefing,
  leave it out.
- If a claim about history, law, custom or geography is in neither the hosted
  text nor the supplied briefing, leave it out.

### Claims kept at review

The two rules above bind a draft. A reviewer may keep or add such a claim
only when the book's source check record names what it rests on. The record
is the file or files named
`docs/reviews/<date>-<book name, lower case>-source-check.json`. It is not
part of the supplied grounding, so a drafter cannot use it.

A kept claim carries its source in the record. Where it helps the reader,
the sentence also names the source, as in “(Josephus, Antiquities
17.10.10)”.

No machine check ties a sentence to the record. That a claim is covered is
the reviewer's judgment, and the record states what the review read and
what it did not.

## Shape

- `summary`: two or three concrete sentences naming the chapter's movement.
- `whyItMatters`: one or two bounded sentences explaining its role in the book.
- `context`: concise book-level orientation consistent with the briefing.
- `outline`: three to nine non-overlapping movements that together cover every
  verse in the chapter.
- `keyVerses`: two to five exact quotations with a plain explanation of why
  each anchors this chapter.
- `themes`: three to six short, chapter-specific phrases.
- `questions`: seven to fourteen questions a first-time reader is likely to
  ask. Include at least one `hard_verse` question. Include a `word` question
  where the chapter turns on a word. Answers should be factual and plain.
- `glossary`: at least two terms that actually help with this chapter. A term
  is normally a word in the chapter. A term the chapter shows without
  spelling it, such as “Crucifixion” or “the longer ending”, carries `verses`:
  the verse or verses it names.

The machine check on a glossary `verses` tie is only that each reference
resolves inside this chapter. That the term belongs to those verses is the
reviewer's judgment.

## Voice and interpretive restraint

- Say what the text depicts before explaining what a tradition later does with
  it.
- Name meaningful disagreement with phrases such as “readers differ” or
  “interpreters debate,” then state the main options without staging a winner.
  Where one reading is given alone, say it is a reading, with words such as
  “most readers take it as” or “on one common reading”.
- Do not call ritual impurity moral guilt. Do not treat narrative description
  as permission. Do not turn an ancient law into a direct modern policy without
  explaining the historical distance.
- Avoid invented motives, dates, archaeological claims, scientific claims, and
  claims that “the Hebrew literally means” something unsupported by the
  grounding or the book's source check record.
- Use “Yahweh” when quoting the hosted World English Bible; otherwise “God” is
  usually clearer for a first-time reader.

## Review tiers

Passing machine checks means references, quotations, structure, and template
removal were checked. `agent-reviewed` means an automated editorial panel also
examined the prose. Only `human-reviewed` means a named person approved it.
