#!/usr/bin/env python3
"""Extract Mattison's Salutation–Conclusion snapshot without altering paragraph order."""
from html.parser import HTMLParser
from pathlib import Path
import sys

ROOT = Path(__file__).resolve().parents[2]
SNAPSHOT = ROOT / 'scripts/early/sources/secret-book-james-source.html'
DESTINATION = ROOT / 'scripts/early/sources/secret-book-james.md'
HEADINGS = ['Salutation', 'Prologue', 'The Savior Appears', 'Being Filled', 'The Cross and Death',
            'Prophecies and Parables', 'Be Saved', 'Few Have Found the Kingdom', 'Know Yourselves',
            'Final Words', 'Heavenly Ascent', 'Conclusion']

class Extractor(HTMLParser):
    def __init__(self):
        super().__init__(convert_charrefs=True)
        self.in_paragraph = False
        self.heading = False
        self.text = ''
        self.rows = []

    def handle_starttag(self, tag, attrs):
        if tag == 'p':
            if self.in_paragraph:
                raise ValueError('Nested paragraph')
            self.in_paragraph = True
            self.heading = 'text-align:center' in dict(attrs).get('style', '')
            self.text = ''
        elif tag == 'br' and self.in_paragraph:
            self.text += ' '

    def handle_data(self, data):
        if self.in_paragraph:
            self.text += data

    def handle_endtag(self, tag):
        if tag == 'p' and self.in_paragraph:
            text = ' '.join(self.text.split())
            if text:
                self.rows.append(('heading' if self.heading else 'paragraph', text))
            self.in_paragraph = False


def extract(snapshot):
    parser = Extractor()
    parser.feed(snapshot)
    parser.close()
    if parser.in_paragraph or [text for kind, text in parser.rows if kind == 'heading'] != HEADINGS:
        raise ValueError('Unexpected source heading sequence')
    if sum(kind == 'paragraph' for kind, _ in parser.rows) != 59:
        raise ValueError('Unexpected source paragraph count')
    body = '\n\n'.join(('### ' if kind == 'heading' else '') + text for kind, text in parser.rows)
    return '# The Secret Book of James\n\nSource: https://www.gospels.net/james\n\n---\n\n' + body + '\n'


def main():
    output = extract(SNAPSHOT.read_text(encoding='utf-8'))
    if sys.argv[1:] == ['--check']:
        if DESTINATION.read_text(encoding='utf-8') != output:
            raise SystemExit('Secret Book of James source differs from the pinned snapshot')
        print('Secret Book of James: 12 headings and 59 paragraphs match the pinned snapshot.')
    elif sys.argv[1:]:
        raise SystemExit('Usage: extract-secret-book-james.py [--check]')
    else:
        DESTINATION.write_text(output, encoding='utf-8')
        print('Extracted 12 headings and 59 paragraphs.')

if __name__ == '__main__':
    main()
