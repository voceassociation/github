"""Rendu local déterministe du brouillon AI-059 ; aucune page publique modifiée."""
from pathlib import Path
root = Path(__file__).resolve().parent
print('<!doctype html><html lang="fr"><meta charset="utf-8"><meta name="robots" content="noindex,nofollow"><title>AI-059 — Brouillon</title><main><article>')
print('<h1>La mobilité électrique se juge sur le service rendu</h1><p>Brouillon incomplet.</p>')
for chapter in sorted(root.glob('[0-9][0-9]-*.html')):
    print(chapter.read_text(encoding='utf-8'))
print((root / 'references.html').read_text(encoding='utf-8'))
print('</article></main></html>')
