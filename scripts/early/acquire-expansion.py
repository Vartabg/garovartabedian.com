#!/usr/bin/env python3
"""Extract reviewed editions from a local acquisition cache (requires lxml).

Raw responses are never deployed. sources/acquisitions.json locks the inputs;
the publication manifest separately locks the resulting individual editions.
Run: python3 scripts/early/acquire-expansion.py /path/to/acquisition-cache
"""
import hashlib
import json
import re
import sys
from pathlib import Path

from lxml import etree, html

ROOT = Path(__file__).resolve().parents[2]
SOURCES = ROOT / "scripts/early/sources"
LINE_BREAK = '\ue000'


def normalized(value):
    return re.sub(r"\s+", " ", value).strip()


def digest(data):
    return hashlib.sha256(data).hexdigest()


def lineated(value):
    # XML indentation is not poetry; only explicit line elements supply breaks.
    return '\n'.join(part for line in value.split(LINE_BREAK) if (part := normalized(line)))


def ccel(source, spec):
    tree = etree.fromstring(source)
    assert tree.xpath('//DC.Rights/text()') == ['Public Domain']
    notes, blocks, selected = {}, [], []

    def inline(element):
        if element.tag in ('pb', 'hr'):
            return ''
        if element.tag == 'note':
            ident = 'n' + element.get('n', element.get('id'))
            text = normalized(''.join(element.itertext()))
            assert ident not in notes or notes[ident] == text
            notes[ident] = text
            return f'[^{ident}]'
        result = element.text or ''
        for child in element:
            result += inline(child) + (child.tail or '')
            if child.tag in ('p', 'l', 'br'):
                result += LINE_BREAK
        return result

    def visit(element):
        if not isinstance(element.tag, str):
            return
        if element.tag.startswith('div'):
            ident = element.get('id')
            if ident in spec.get('omit', []):
                return
            title = element.get('shorttitle') or element.get('title')
            title = spec.get('headings', {}).get(ident, title)
            if ident in spec.get('collections', {}):
                title = 'Collection: ' + spec['collections'][ident]
            if title:
                blocks.append('### ' + normalized(title))
            for child in element:
                visit(child)
        elif element.tag == 'p':
            text = lineated(inline(element))
            if text and not re.fullmatch(r'[—\-\s]+', text):
                # Edition summaries and repeated titles are catalog structure,
                # not words attributed to the ancient author.
                if element.get('id') in spec.get('editorialParagraphs', []):
                    ident = 'editorial-' + element.get('id').replace('.', '-')
                    notes[ident] = text
                    heading = next(i for i in range(len(blocks) - 1, -1, -1) if blocks[i].startswith('### '))
                    blocks[heading] += f' [^{ident}]'
                else:
                    blocks.append(text)
        elif element.tag in ('verse', 'l'):
            text = lineated(inline(element))
            if text:
                blocks.append(text)
        elif re.fullmatch(r'h[1-6]', element.tag):
            text = normalized(inline(element))
            if text:
                blocks.append('### ' + text)
        elif element.tag not in ('pb', 'hr'):
            for child in element:
                visit(child)

    for ident in spec['nodes']:
        elements = tree.xpath('//*[@id=$id]', id=ident)
        assert len(elements) == 1, ident
        element = elements[0]
        selected.append(ident)
        visit(element)
    if notes:
        blocks.extend(['## Translator and historical edition notes',
                       'These notes belong to the source edition; they are not part of the ancient work.'])
        blocks.extend(f'[^{ident}]: {value}' for ident, value in notes.items())
    return blocks, {'selectedXmlIds': selected, 'notes': len(notes)}


def mattison(source, spec):
    tree = html.fromstring(source)
    containers = tree.xpath('//*[contains(@class,"sqs-html-content")]')
    assert len(containers) == 1
    children = list(containers[0])
    assert 'committed to the public domain' in children[2].text_content()
    start = next(i for i, el in enumerate(children) if normalized(el.text_content()) == spec['start'])
    end = next(i for i, el in enumerate(children) if normalized(el.text_content()) == 'Notes on Translation')
    blocks = []
    for el in children[start:end]:
        text = normalized(el.text_content())
        if not text:
            continue
        # Mattison's section headings are bold paragraphs in these editions.
        if len(el) == 1 and el[0].tag == 'strong' and normalized(el[0].text_content()) == text:
            blocks.append('### ' + text)
        else:
            blocks.append(text)
    return blocks, {'firstSourceChild': start, 'excludedNotesFromChild': end}


def other_gospels(source, spec):
    data = json.loads(source)
    assert data['translation'] == 'OGV'
    blocks, counts = [], []

    def verse(text):
        # Decode the translation's text notation, preserving all gap marks,
        # supplements and manuscript page numbers. Exclude commentary pointers,
        # proprietary renderer code and linked manuscript images.
        text = re.sub(r'\{([^{}]*?):\d+\}', r'\1', text)
        text = re.sub(r'\{([^{}]*?)\s*\|\s*[^{}]*\}', r'\1', text)
        text = re.sub(r'⦅(.*?):\d+(?:,\d+)*⦆', r'\1', text)
        text = re.sub(r'«([^|»]+)(?:\|[^»]*)?»', r'⟦page \1⟧', text)
        text = text.replace('**', '').replace('⸨', '(').replace('⸩', ')').replace('〚', '[').replace('〛', ']')
        text = html.fromstring('<div>' + text + '</div>').text_content()
        return normalized(text)

    for number, chapter in enumerate(data['chapters'], 1):
        # Source-site introductions and descriptive chapter titles are excluded.
        blocks.append(f'### Chapter {number}')
        if 'bodies' in chapter:
            for column, body in enumerate(chapter['bodies'], 1):
                classes = body.get('classes', [])
                if isinstance(classes, str):
                    classes = [classes]
                names = {'codex-ii': 'Codex II', 'codex-iii': 'Codex III', 'codex-iv': 'Codex IV', 'berlin-codex': 'Berlin Codex'}
                name = body.get('name') or ' & '.join(names[c] for c in classes)
                assert name, (number, column)
                blocks.append(f'### Chapter {number} — {name}')
                text = [verse(v) for v in body['body']]
                blocks.extend(v for v in text if v)
                counts.append({'chapter': number, 'witness': name, 'sourceRows': len(text), 'nonemptyRows': sum(bool(v) for v in text)})
        else:
            text = [verse(v) for v in chapter['body']]
            blocks.extend(v for v in text if v)
            counts.append({'chapter': number, 'sourceRows': len(text), 'nonemptyRows': sum(bool(v) for v in text)})
    return blocks, {'chapterRows': counts}


def main():
    cache = Path(sys.argv[1])
    records = json.loads((SOURCES / 'acquisitions.json').read_text())
    manifest = json.loads((ROOT / 'scripts/early/library-import-manifest.json').read_text())
    audits = []
    for spec in records:
        source = (cache / spec['cacheFile']).read_bytes()
        assert digest(source) == spec['sha256'], f'Acquisition changed: {spec["id"]}'
        blocks, audit = {'ccel': ccel, 'mattison': mattison, 'other-gospels': other_gospels}[spec['format']](source, spec)
        output = '# ' + spec['title'] + '\n\nSource: ' + spec['url'] + '\n\n---\n\n' + '\n\n'.join(blocks) + '\n'
        destination = SOURCES / (spec['id'] + '.md')
        destination.write_text(output)
        metadata = next(r for r in manifest['records'] if r['id'] == spec['id'])
        metadata['sourceRepositoryPath'] = str(destination.relative_to(ROOT))
        metadata['sourceSha256'] = digest(output.encode())
        metadata['sourceWords'] = len(output.split())
        audits.append({'id': spec['id'], 'sourceUrl': spec['url'], 'sourceSha256': spec['sha256'],
                       'editionSha256': metadata['sourceSha256'], 'blocks': len(blocks), **audit})
        print(spec['id'], len(blocks), 'blocks', metadata['sourceWords'], 'words')
    (ROOT / 'scripts/early/library-import-manifest.json').write_text(json.dumps(manifest, indent=2, ensure_ascii=False) + '\n')
    (SOURCES / 'extraction-audit.json').write_text(json.dumps(audits, indent=2, ensure_ascii=False) + '\n')


if __name__ == '__main__':
    main()
