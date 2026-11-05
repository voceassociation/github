"""Rendu de lecture local : python render_draft.py > /tmp/ai035.html"""
from pathlib import Path

directory = Path(__file__).resolve().parent
print('<!doctype html><html lang="fr"><head><meta charset="utf-8"><meta name="robots" content="noindex,nofollow"><title>VOCE-AI-035 — Brouillon</title></head><body><main><article>')
print('<h1>Une moyenne masque les erreurs rares</h1><p>Brouillon incomplet.</p>')
for chapter in sorted(directory.glob("[0-9][0-9]-*.html")):
    print(chapter.read_text(encoding="utf-8"))
print((directory / "exercices.html").read_text(encoding="utf-8"))
print((directory / "references.html").read_text(encoding="utf-8"))
print("</article></main></body></html>")
