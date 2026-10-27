"""Deterministic review preview only. Never writes a production course route."""
from pathlib import Path
import re,sys
HERE=Path(__file__).resolve().parent
ROOT=HERE.parents[3]
def render():
    shell=(ROOT/'cours/tsinghua-agibot-robot-production.html').read_text()
    body='<h1>Tsinghua et AGIBOT: passer de la simulation à un robot au travail</h1><p>Brouillon de révision, non publié. Contrôle pédagogique incomplet.</p>'
    body+='\n'.join(p.read_text() for p in sorted(HERE.glob('[0-9][0-9]-*.html')))
    body+=(HERE/'references.html').read_text()
    shell=re.sub(r'(<article\b[^>]*>).*?(</article>)',lambda m:m[1]+body+m[2],shell,flags=re.S)
    shell=re.sub(r'<script\b[^>]*type=["\']application/ld\+json["\'][^>]*>.*?</script>','',shell,flags=re.S)
    shell=re.sub(r'<meta\b[^>]*name=["\']robots["\'][^>]*>','',shell)
    return shell.replace('</head>','<meta name="robots" content="noindex,nofollow"></head>')
if __name__=='__main__':
    out=Path(sys.argv[1]).resolve()
    if out.is_relative_to(ROOT):raise SystemExit('Preview must be outside repository')
    out.write_text(render())
