"""Render only AI-002 from a captured main shell; no other course is regenerated."""
from pathlib import Path
import argparse
import html
import json
import re
HERE=Path(__file__).resolve().parent
DESCRIPTION='Droits des agents IA pour ingénieurs : délégation, approbation, révocation et laboratoire transactionnel SQLite avec exercices corrigés.'

def render(output):
    meta=json.loads((HERE/'course.json').read_text())
    chapters=''.join((HERE/name).read_text() for name in meta['chapters'])
    headings=re.findall(r'<section[^>]+id="([^"]+)"[^>]*>\s*<h2>(.*?)</h2>',chapters,re.S)
    toc='<nav aria-label="Sommaire du cours">'+''.join('<p><a href="#'+i+'">'+t+'</a></p>' for i,t in headings)+'</nav>'
    intro='<h1>'+html.escape(meta['title'])+'</h1><section data-voce-count="metadata"><p>VOCE-AI-002 · Édition ingénieur 0.8.0 · 26 octobre 2026</p><p>Public : '+html.escape(meta['audience'])+'. Prérequis : '+html.escape(meta['prerequisites'])+'.</p><p>Huit chapitres, modèles exécutables et cinq exercices corrigés. Les scénarios sont fictifs. Les tests portent sur des modèles locaux et un fournisseur simulé, sans intégration OAuth ni paiement réel. Rédaction avec assistance IA ; relecture indépendante et pilote apprenant non réalisés.</p><p>Parcours complet estimé : six à neuf heures, lecture, expériences et corrections comprises. Estimation non mesurée auprès d’apprenants.</p></section>'
    body=intro+toc+chapters+(HERE/'exercises.html').read_text()+(HERE/'references.html').read_text()
    s=(HERE/'shell.html').read_text().replace('<!-- AI002_CONTENT -->',body).replace('<!-- AI002_ASIDE -->','<h2>Repères</h2><p>VOCE-AI-002 · Édition ingénieur 0.8.0 · Français</p><p>Laboratoire local SQLite : onze tests transactionnels. Trente-deux tests avec les modèles de politique, révocation, outils et traces.</p><p>Relecture indépendante et pilote apprenant non réalisés. Six à neuf heures estimées, non mesurées.</p><a href="#evaluation-transactionnelle">Atelier et corrections</a><a href="/cours/preuves-controle">Preuves de contrôle</a><a href="/cours">Catalogue</a>')
    def schema(m):
        d=json.loads(m[1])
        if d.get('@type')=='Course':
            d.update(version='0.8.0',dateModified='2026-10-26',description=DESCRIPTION,educationalLevel='Ingénieurs et architectes logiciels ; aucun niveau officiel attribué',coursePrerequisites=meta['prerequisites'])
            d.pop('timeRequired',None)
        return '<script type="application/ld+json">'+json.dumps(d,ensure_ascii=False).replace('</','<\\/')+'</script>'
    s=re.sub(r'<script type="application/ld\+json">(.*?)</script>',schema,s,flags=re.S)
    s=re.sub(r'(<meta (?:name="description"|property="og:description"|name="twitter:description") content=")[^"]*(")',lambda m:m[1]+html.escape(DESCRIPTION,quote=True)+m[2],s)
    s=s.replace('</head>','<style>.course-written pre{max-width:100%;overflow-x:auto}.course-written code{overflow-wrap:anywhere}.course-written nav{margin-block:2rem}</style></head>')
    output=Path(output);output.parent.mkdir(parents=True,exist_ok=True);output.write_text(s)
    return s

if __name__=='__main__':
    parser=argparse.ArgumentParser();parser.add_argument('--output',required=True,type=Path)
    render(parser.parse_args().output)
