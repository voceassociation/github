"""Rendu local hors publication : python render_draft.py > /tmp/ai055.html"""
from pathlib import Path

directory = Path(__file__).resolve().parent
print('<!doctype html><html lang="fr"><meta charset="utf-8"><meta name="robots" content="noindex,nofollow"><title>VOCE-AI-055 — Brouillon</title><main><article>')
print("<h1>Un robot réussi en laboratoire peut échouer au poste</h1><p>Brouillon incomplet.</p>")
for chapter in sorted(directory.glob("[0-9][0-9]-*.html")):
    print(chapter.read_text(encoding="utf-8"))
print((directory / "references.html").read_text(encoding="utf-8"))
print("</article></main></html>")
