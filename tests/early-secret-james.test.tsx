import test from "node:test";
import assert from "node:assert/strict";
import { readFile, readFileSync } from "node:fs";
import { createHash } from "node:crypto";
import { promisify } from "node:util";
import { execFile } from "node:child_process";
import { renderToStaticMarkup } from "react-dom/server";
import { JSDOM } from "jsdom";
import { getLibraryPage, getLibraryRecord, searchLibrary } from "../src/lib/early/library-server";
import { JAMES_PARABLES, jamesHref } from "../src/lib/jesus/james-parables";
import { getJamesTexts } from "../src/lib/jesus/james-parables-server";
import { LIBRARY_FIND } from "../src/lib/early/library-find";
import { FIND_CATALOG } from "../src/lib/site/find-catalog";
import sitemap from "../src/app/early/library/sitemap";
import Edition from "../src/app/early/library/[edition]/page";
import Reading from "../src/app/early/library/[edition]/[section]/page";
import { verifyJamesPanel, mappedJamesParagraphs } from "../scripts/release/check-staged-thomas.mjs";
import { parseFragment } from "parse5";

const render = async (element: Promise<React.ReactElement>) => new JSDOM(renderToStaticMarkup(await element)).window.document;

test("the edition preserves the checked translation and opens at its first section", async () => {
  const { stdout } = await promisify(execFile)("python3", ["scripts/early/extract-secret-book-james.py", "--check"]);
  assert.match(stdout, /12 headings and 59 paragraphs/);
  const record = (await getLibraryRecord("secret-book-james"))!;
  assert.equal(record.sections.length, 12);
  assert.match(record.sourceRights, /public domain.*2026|2026.*public domain/i);
  assert.match(record.canonStatus!, /^Outside the canon/);
  assert.match(record.witnesses[0], /fourth\/fifth century/);
  assert.match(record.compositionDate!, /Debated/);
  const edition = await render(Edition({ params: Promise.resolve({ edition: record.id }) }));
  assert.match(edition.querySelector(".ew-canon-status")?.textContent ?? "", /Outside the canon/);
  assert.equal(edition.querySelector('#read-james')?.parentElement?.querySelector('a')?.getAttribute('href'), '/early/library/secret-book-james/salutation');
  assert.ok(LIBRARY_FIND.some(item => item.href === '/early/library/secret-book-james'));
  assert.ok((await sitemap()).some(item => item.url.endsWith('/early/library/secret-book-james/know-yourselves')));
  assert.ok((await searchLibrary('date palm shoot', 'primary-text', record.id)).total > 0);
});

test("every pinned source heading and paragraph survives the independent import", async () => {
  const raw = readFileSync('scripts/early/sources/secret-book-james-source.html', 'utf8');
  assert.equal(createHash('sha256').update(raw).digest('hex'), '1afd3abd5d79bd5ff63e88e4583c57b5ec9172ac92b75e26168b37ea9b06f458');
  type Node = { nodeName: string; value?: string; attrs?: { name: string; value: string }[]; childNodes?: Node[] };
  const fragment = parseFragment(raw) as unknown as Node;
  const text = (node: Node): string => node.nodeName === '#text' ? node.value ?? '' : (node.childNodes ?? []).map(text).join('');
  const paragraphs = (fragment.childNodes ?? []).filter(node => node.nodeName === 'p').map(node => ({
    heading: node.attrs?.some(attr => attr.name === 'style' && attr.value.includes('text-align:center')) ?? false,
    text: text(node).replace(/\s+/g, ' ').trim(),
  })).filter(row => row.text);
  const record = (await getLibraryRecord('secret-book-james'))!;
  const imported: { heading: boolean; text: string }[] = [];
  for (const section of record.sections) {
    const page = (await getLibraryPage(record.id, section.id))!;
    imported.push({ heading: true, text: page.label });
    imported.push(...page.blocks.map(block => ({ heading: false, text: block.text })));
  }
  assert.equal(paragraphs.length, 71);
  assert.deepEqual(imported, paragraphs);
});

test("all mapped source paragraphs, locators and reader anchors agree", async () => {
  const texts = await getJamesTexts();
  assert.equal(JAMES_PARABLES.length, 13);
  assert.equal(JAMES_PARABLES.filter(story => story.kind === 'figure').length, 10);
  for (const story of JAMES_PARABLES) {
    const page = (await getLibraryPage('secret-book-james', story.section))!;
    const blocks = page.blocks.slice(story.paragraph - 1, story.endParagraph ?? story.paragraph);
    assert.deepEqual(texts[story.id], blocks.map(block => block.text));
    const document = await render(Reading({ params: Promise.resolve({ edition: 'secret-book-james', section: story.section }) }));
    assert.match(document.querySelector('.ew-canon-status')?.textContent ?? '', /Outside the canon/);
    for (const [index, block] of blocks.entries()) {
      const reader = document.querySelector(`#p${story.paragraph + index}`);
      assert.ok(reader, `${story.id} paragraph ${story.paragraph + index}`);
      assert.equal([...reader.querySelectorAll('p[data-reading-fragment]')].map(part => part.textContent).join(''), block.text);
    }
    assert.equal(jamesHref(story), `/early/library/secret-book-james/${story.section}#p${story.paragraph}`);
    assert.ok(FIND_CATALOG.some(item => item.href === `/jesus/parables#parable-${story.id}`));
  }
  const release = await mappedJamesParagraphs();
  for (const story of release) {
    assert.doesNotThrow(() => verifyJamesPanel(`outside the canon ${story.note ?? ''} ${story.text}`, story.href, story));
    assert.throws(() => verifyJamesPanel('outside the canon This passage could not be loaded here.', story.href, story), /missing/);
    assert.throws(() => verifyJamesPanel(`outside the canon ${story.note ?? ''} ${story.text}`, '/incorrect', story), /missing/);
  }
});

test("invalid ranges fail closed", async () => {
  const story = JAMES_PARABLES.find(item => item.id === 'james-fullness-sobriety')!;
  const texts = await getJamesTexts([{ ...story, endParagraph: 99 }, { ...story, id: 'bad-range', endParagraph: 0 }], undefined, () => {});
  assert.equal(texts[story.id], null);
  assert.equal(texts['bad-range'], null);
});

test("a changed paragraph fails closed without hiding other James passages", async () => {
  const load = async (file: string) => {
    const raw = await promisify(readFile)(file, 'utf8');
    if (!file.endsWith('prophecies-and-parables.json')) return raw;
    const page = JSON.parse(raw);
    page.blocks[6].text = page.blocks[6].text.replace('date palm', 'different');
    page.chars = page.blocks.reduce((sum: number, block: { text: string }) => sum + block.text.length, 0);
    return JSON.stringify(page);
  };
  const texts = await getJamesTexts(JAMES_PARABLES, load, () => {});
  assert.equal(texts['james-date-palm'], null);
  assert.ok(texts['james-ear-grain']);
  assert.ok(readFileSync('scripts/early/sources/secret-book-james-source.html', 'utf8').includes('Salutation'));
});
