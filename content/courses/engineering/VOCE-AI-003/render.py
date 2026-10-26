"""Deterministic draft only: output must be outside this Git repository."""
import argparse
import hashlib
import json
import re
from html.parser import HTMLParser
from pathlib import Path

ROOT = Path(__file__).resolve().parent
REPO = ROOT.parents[3]


class LessonText(HTMLParser):
    def __init__(self):
        super().__init__(convert_charrefs=True)
        self.text = []

    def handle_data(self, data):
        self.text.append(data)


def render():
    chapters = sorted(ROOT.glob('[0-9][0-9]-*.html'))
    body = '\n'.join(p.read_text() for p in chapters)
    parser = LessonText()
    parser.feed(body)
    count = len(re.sub(r'\s+', ' ', ' '.join(parser.text)).strip())
    html = '<!doctype html><html lang="fr"><meta charset="utf-8"><meta name="robots" content="noindex,nofollow"><title>AI-003 — brouillon incomplet</title><main><h1>VOCE-AI-003 — brouillon incomplet</h1><p>Chapitre de travail non publié. Édition publique existante préservée.</p>' + body + (ROOT / 'references.html').read_text() + '</main></html>\n'
    return html, {'lesson_characters': count, 'chapters': [p.name for p in chapters], 'sha256': hashlib.sha256(html.encode()).hexdigest()}


if __name__ == '__main__':
    ap = argparse.ArgumentParser()
    ap.add_argument('--output', type=Path, required=True)
    args = ap.parse_args()
    output = args.output.resolve()
    if output == REPO or REPO in output.parents:
        ap.error('Draft output must stay outside repository; no public route overwrite')
    html, report = render()
    output.write_text(html)
    print(json.dumps(report, ensure_ascii=False, indent=2))
