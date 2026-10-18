"""Check targeted pedagogical additions and their rendering, independently of the renderer."""
from pathlib import Path
import json,re,html,subprocess,hashlib
R=Path(__file__).resolve().parents[1]
r=json.loads((R/'data/voce-vclf-public.json').read_text());courses={c['id']:c for c in r['courses']};refs={x['id'] for x in r['references']}
unique=[set() for _ in range(5)];pages=[]
for pillar,count in [('ai',60),('art',30),('cog',30)]:
 rows=(R/f'content/courses/{pillar}-depth.txt').read_text().splitlines();assert len(rows)==count
 for line in rows:
  a=line.split('|');assert len(a)==6
  c=courses[f'VOCE-{pillar.upper()}-{a[0]}'];p=R/(c['url'].split('https://voce.life/')[1]+'.html');s=p.read_text();pages.append(p)
  for i,t in enumerate(a[1:]):
   assert t and t not in unique[i],(c['id'],'duplicate',i)
   unique[i].add(t);assert html.escape(t) in s,(c['id'],'missing rendered text',i)
  for rid in re.findall(r'\b[A-Z][A-Z0-9]+\b',a[5]):
   if rid in refs:assert rid in c['references'],(c['id'],rid)
  assert 'Version pédagogique 0.4.0' in s
  assert '<h2>Correction du transfert</h2>' in s
  assert 'Critère propre à ce module:' in s
  assert len(re.findall(r'<h1\b',s))==1
  assert 'Pour la variante, le résultat attendu est une révision explicite' not in s
# Selected worked calculations, independent of prose generation.
assert 50*8*90==36000
assert 16*7*50==5600
assert 50*8*90+16*7*50==41600
assert 4*(4096*4096*2)==128*1024*1024
assert (32*(4096+4096))/(4096*4096)==1/64
assert abs(80/(80+360)*100-18.181818)<.000001
assert abs((100-85)/100-.15)<.000001
assert 4+14+1+1==20
before={p:hashlib.sha256(p.read_bytes()).hexdigest() for p in pages+[R/'data/voce-vclf-public.json']}
subprocess.run(['python','scripts/build-course-workshops.py'],cwd=R,check=True)
assert all(hashlib.sha256(p.read_bytes()).hexdigest()==h for p,h in before.items()),'Non-idempotent renderer'
print('PASS: 120 unique demonstrations, transfer corrections, criteria and source guides; rendering, reference membership, selected arithmetic and idempotence.')
