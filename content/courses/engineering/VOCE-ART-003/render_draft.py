from pathlib import Path
root=Path(__file__).resolve().parent
print('<!doctype html><html lang="fr"><meta charset="utf-8"><meta name="robots" content="noindex,nofollow"><title>ART-003 — Brouillon</title><main><article><h1>Un inventaire décrit aussi les catégories d’une époque</h1><p>Brouillon incomplet.</p>')
for p in sorted(root.glob("[0-9][0-9]-*.html")): print(p.read_text(encoding="utf-8"))
print((root/"references.html").read_text(encoding="utf-8"))
print("</article></main></html>")
