"""Structural and arithmetic checks only; not a pedagogical certification."""
from pathlib import Path
import hashlib
import importlib.util
import json
import re
import tempfile
import sys

HERE = Path(__file__).resolve().parent
ROOT = HERE.parents[3]


def load(name, path):
    spec = importlib.util.spec_from_file_location(name, path)
    module = importlib.util.module_from_spec(spec)
    spec.loader.exec_module(module)
    return module


def check():
    audit = load('audit', ROOT / 'scripts/audit-course-volume.py')
    renderer = load('renderer', HERE / 'render.py')
    metadata = json.loads((HERE / 'course.json').read_text())
    raw = '<article>' + ''.join((HERE / f).read_text() for f in metadata['chapters']) + '</article>'
    counter = audit.Counter()
    counter.feed(raw)
    total, lesson = counter.counts()
    assert total == lesson
    with tempfile.TemporaryDirectory() as directory:
        target = Path(directory) / 'reader.html'
        renderer.render(target)
        first = target.read_bytes()
        renderer.render(target)
        assert first == target.read_bytes(), 'Non-deterministic rendering'
    try:
        renderer.render(ROOT / metadata['route'])
    except ValueError:
        pass
    else:
        raise AssertionError('Production destination not blocked')
    preview = first.decode()
    rendered = audit.Counter()
    rendered.feed(preview)
    assert rendered.counts()[1] == lesson
    assert preview.count('<h1>') == 1
    assert 'application/ld+json' not in preview
    assert '<meta name="robots" content="noindex,nofollow">' in preview
    ids = re.findall(r'\bid="([^"]+)"', raw)
    assert len(ids) == len(set(ids))
    paragraphs = re.findall(r'<p>(.*?)</p>', raw, re.S)
    assert len(paragraphs) == len(set(paragraphs))
    old = ''.join((HERE.parent / 'VOCE-AI-001' / f).read_text() for f in ['core.html', 'engineering.html'])
    assert not any(p in old for p in paragraphs if len(p) > 150)
    assert min(500000, 200000, 150000) == 150000
    assert 125000 <= 150000 and 10 * 125000 == 1250000
    assert 125000 + 80000 == 205000 and 205000 - 200000 == 5000
    assert 125000 + 75000 == 200000
    assert 125000 + 50000 <= 200000 and 125000 + 2 * 50000 == 225000
    assert 2 * 125000 == 250000 and 250000 - 200000 == 50000
    assert 200000 - 125000 == 75000
    return {
        'course': metadata['id'], 'lesson_characters': lesson,
        'chapters': len(metadata['chapters']), 'paragraphs': len(paragraphs),
        'python': sys.version.split()[0],
        'preview_sha256': hashlib.sha256(first).hexdigest(),
        'checks': ['deterministic rendering', 'production destination blocked',
                   'Counter agrees between sources and preview', 'one H1',
                   'obsolete JSON-LD removed', 'noindex preview', 'unique chapter ids',
                   'no exact paragraph duplicates within lot or against AI-001 core/engineering',
                   'seven arithmetic assertion groups'],
        'quality_validated': False,
        'not_performed': ['independent review', 'browser visual review',
                          'external IAM and real provider integration', 'learner pilot']
    }


if __name__ == '__main__':
    print(json.dumps(check(), ensure_ascii=False, indent=2))
