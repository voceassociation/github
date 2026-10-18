from pathlib import Path
from html.parser import HTMLParser
from urllib.parse import urlsplit
import json,re,subprocess,xml.etree.ElementTree as ET
R=Path(__file__).resolve().parents[1]
class Page(HTMLParser):
 def __init__(self,s):
  super().__init__();self.h1=0;self.links=[];self.ids=set();self.headings=[];self.canonical=[];self.lang=None;self.feed(s)
 def handle_starttag(self,t,attrs):
  a=dict(attrs)
  if t=='h1':self.h1+=1
  if t in ['h1','h2','h3']:self.headings.append(int(t[1]))
  if t=='a' and a.get('href'):self.links.append(a['href'])
  if a.get('id'):self.ids.add(a['id'])
  if t=='link' and a.get('rel')=='canonical':self.canonical.append(a['href'])
  if t=='html':self.lang=a.get('lang')
registry=json.loads((R/'data/voce-vclf-public.json').read_text())
base=json.loads(subprocess.check_output(['git','show','HEAD:data/voce-vclf-public.json'],cwd=R))
old={x['id']:x for x in base['courses']}
errors=[];checked=[];cases=set()
sitemap=ET.parse(R/'sitemap.xml');urls={n.text for n in sitemap.findall('.//{*}loc')}
for c in registry['courses']:
 if c['id'] not in old:continue
 assert c['url']==old[c['id']]['url']
 assert c['publication_status']==old[c['id']]['publication_status']
 assert c['competence_id']==old[c['id']]['competence_id']
 assert c['references']==list(dict.fromkeys(old[c['id']]['references']+json.loads((R/'content/courses/reference-additions.json').read_text())['course_additions'].get(c['id'],[])))
 p=R/(urlsplit(c['url']).path.lstrip('/')+'.html');s=p.read_text();parsed=Page(s)
 if parsed.h1!=1:errors.append((str(p),'H1'))
 if parsed.canonical!=[c['url']]:errors.append((str(p),'canonical'))
 if c.get('indexing_policy',{}).get('eligible',True) and c['url'] not in urls:errors.append((str(p),'sitemap'))
 if not c.get('indexing_policy',{}).get('eligible',True) and c['url'] in urls:errors.append((str(p),'noindex in sitemap'))
 if 'Lecture indicative de la section pédagogique:' in s:errors.append((str(p),'stale timing'))
 if '35 à 45 minutes' not in s:errors.append((str(p),'timing'))
 if '<summary>Ouvrir le corrigé argumenté</summary>' not in s:errors.append((str(p),'correction'))
 for m in re.findall(r'<script type="application/ld\+json">(.*?)</script>',s,re.S):json.loads(m)
 checked.append(c['id'])
for pillar,n in [('ai',60),('art',30),('cog',30)]:
 rows=(R/f'content/courses/{pillar}-workshops.txt').read_text().splitlines();assert len(rows)==n
 assert {x.split('|')[0] for x in rows}=={str(i).zfill(3) for i in range(1,n+1)}
 for row in rows:
  a=row.split('|');assert len(a)==6
  assert a[3] not in cases;cases.add(a[3])
for lang in ['en','fr','it']:
 for route in ['academy/virtual-faculty','applied/education-systems']:
  path=('/' if lang=='en' else '/'+lang+'/')+route;p=R/(path.lstrip('/')+'.html');s=p.read_text();a=Page(s)
  assert a.h1==1 and a.lang==lang and a.canonical==['https://voce.life'+path]
  assert '"@type": "Course"' not in s
  assert len(re.findall('hreflang=',s))==3
  assert 'https://voce.life'+path in urls
  for link in a.links:
   if not link.startswith('/'):continue
   u=urlsplit(link).path
   if u=='/' or (R/u.lstrip('/')).exists() or (R/(u.lstrip('/')+'.html')).exists():continue
   errors.append((str(p),'missing local '+u))
assert len(checked)==120
assert not errors,errors
# Independently recompute numerical examples used in the cases.
assert round((120+300+180*12/60*40)/900,2)==2.07
assert 1000*.90*.95*.92==786.6
assert 90/(90+45)==2/3
assert 68/19*100>357 and 68*.9/19*100<323
assert 4096*4096*2==32*1024*1024
assert 8*(4096+4096)==65536
print('PASS: 120 IDs/routes/statuses/competences preserved; 120 distinct cases; six trilingual concept pages; JSON-LD, canonical, sitemap, local links and selected arithmetic checked.')
print('NOT VALIDATED: learner timings, independent scientific review, all source full texts, browser layout/accessibility.')
