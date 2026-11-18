from pathlib import Path
root = Path(__file__).resolve().parent
print('<!doctype html><html lang="fr"><meta charset="utf-8"><meta name="robots" content="noindex,nofollow"><title>ART-012 — Brouillon</title><main><article><h1>L’état d’une œuvre doit survivre à son transport</h1><p>Brouillon incomplet, non publié.</p>')
for p in sorted(root.glob('[0-9][0-9]-*.html')):
    print(p.read_text(encoding='utf-8'))
print((root / 'references.html').read_text(encoding='utf-8'))
print('</article></main></html>')
