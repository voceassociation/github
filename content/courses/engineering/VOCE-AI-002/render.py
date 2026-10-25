"""Render the partial AI-002 reader to an explicit non-production preview path."""
from pathlib import Path
import argparse
import html
import json
import re

HERE = Path(__file__).resolve().parent
ROOT = HERE.parents[3]


def render(output):
    metadata = json.loads((HERE / 'course.json').read_text())
    target = output.resolve()
    # Partial sources may never replace any public route or source input.
    if target.is_relative_to(ROOT):
        raise ValueError('Preview must be outside the repository; publication is disabled.')
    source = (ROOT / metadata['route']).read_text()
    content = (
        '<h1>' + html.escape(metadata['title']) + '</h1>'
        '<section data-voce-count="metadata"><p>VOCE-AI-002 · Édition ingénieur en rédaction · '
        'Quatre chapitres, cours incomplet, diffusion non autorisée.</p><p>Public : '
        + html.escape(metadata['audience']) + '.</p><p>Prérequis : '
        + html.escape(metadata['prerequisites']) + '.</p></section>'
        + ''.join((HERE / name).read_text() for name in metadata['chapters'])
        + (HERE / 'references.html').read_text()
    )
    source, count = re.subn(
        r'(<article\b[^>]*>).*?(</article>)',
        lambda match: match[1] + content + match[2], source, count=1, flags=re.S
    )
    if count != 1:
        raise ValueError('Expected one course article in the current official shell.')
    source, count = re.subn(
        r'(<aside\b[^>]*>).*?(</aside>)',
        lambda match: match[1] + '<h2>Édition en préparation</h2><p>Chapitres 1 à 4 rédigés. '
        'Volume encore inférieur à 75 000 caractères. Relecture indépendante et contrôle visuel '
        'non réalisés. Aucun temps de formation validé.</p>' + match[2],
        source, count=1, flags=re.S
    )
    if count != 1:
        raise ValueError('Expected one course sidebar.')
    # A local preview must not retain publication claims from old JSON-LD.
    source = re.sub(r'<script\b[^>]*type=["\']application/ld\+json["\'][^>]*>.*?</script>', '', source, flags=re.S)
    source = re.sub(r'<meta\b[^>]*name=["\']robots["\'][^>]*>', '', source, flags=re.I)
    source = source.replace('</head>', '<meta name="robots" content="noindex,nofollow"></head>')
    target.parent.mkdir(parents=True, exist_ok=True)
    target.write_text(source)


if __name__ == '__main__':
    parser = argparse.ArgumentParser()
    parser.add_argument('--output', required=True, type=Path)
    render(parser.parse_args().output)
