import json, re, hashlib, unicodedata
from pathlib import Path
from datetime import datetime, timezone
from zoneinfo import ZoneInfo
import xml.etree.ElementTree as ET

ROOT=Path(__file__).resolve().parents[1]
def read(p): return json.loads((ROOT/p).read_text())
def write(p,v): (ROOT/p).write_text(json.dumps(v,ensure_ascii=False,indent=2)+'\n')
now=datetime.now(timezone.utc).isoformat()
corpus=read('data/corpus.json'); routes=read('data/article-routes.json'); registry=read('data/voce-index-registry.json')
before={x['id']:x['text'] for x in corpus['items']}
added=[]
for created,raw,urn,url in read('backfill/raw/linkedin-catchup-2026-10-02.json')['rows']:
    ident=urn.rsplit(':',1)[-1]; key='linkedin:'+ident
    assert url=='https://www.linkedin.com/feed/update/'+urn
    if key in before: continue
    text=re.sub(r'\{hashtag\|\\#\|([^{}]+)\}',lambda m:'#'+m[1],raw)
    text=re.sub(r'\\([\\_*~\[\](){}<>#|])',r'\1',text)
    dt=datetime.strptime(created,'%Y%m%d%H%M%S').replace(tzinfo=timezone.utc).astimezone(ZoneInfo('Europe/Podgorica'))
    title=next(s for s in text.splitlines() if s.strip())
    slug=re.sub(r'[^a-z0-9]+','-',unicodedata.normalize('NFKD',title).encode('ascii','ignore').decode().lower()).strip('-')[:72].rstrip('-')+'-'+ident
    path='/archive/'+dt.date().isoformat().replace('-','/')+'/'+slug
    item=dict(id=key,platform='linkedin',platform_id=urn,date_published=dt.isoformat(),title=title,slug=slug,canonical_url='https://voce.life'+path,source_url=url,language='fr',text=text,adobe_provenance={'status':'pending'})
    corpus['items'].append(item);added.append(item)
    routes['items'].append(dict(id=key,post_id=ident,date=dt.date().isoformat(),path=path))

keep='linkedin:7510307518246559744'; drop='linkedin:7510307538911862784'
byid={x['id']:x for x in corpus['items']};assert byid[keep]['text']==byid[drop]['text']
old=byid[drop]['canonical_url']; target=byid[keep]['canonical_url']
byid[keep]['alternate_publications']=[{k:byid[drop][k] for k in ['id','platform_id','date_published','source_url','canonical_url']}]
corpus['items']=[x for x in corpus['items'] if x['id']!=drop]
routes['items']=[x for x in routes['items'] if x['id']!=drop]
worker=(ROOT/'worker.js').read_text(); marker='    const legacyScholarRedirects = {'
redirect=f'    if (pathname === {json.dumps(old.removeprefix("https://voce.life"))} || pathname === {json.dumps(old.removeprefix("https://voce.life")+".html")}) {{\n      return Response.redirect({json.dumps(target)}, 308);\n    }}\n\n'
assert marker in worker; (ROOT/'worker.js').write_text(worker.replace(marker,redirect+marker,1))
alias=ROOT/(old.removeprefix('https://voce.life/')+'.html')
alias.write_text('<!doctype html><html lang="fr"><head><meta charset="utf-8"><link rel="canonical" href="'+target+'"><meta http-equiv="refresh" content="0;url='+target+'"></head><body><a href="'+target+'">Publication VOCE</a></body></html>')
for day in sorted({x['date_published'][:10] for x in added}|{'2026-09-28'}):
    hp='data/history/'+day+'.json'
    history=read(hp) if (ROOT/hp).exists() else {'schema':1,'owner':'VOCE Association','source':'Metricool / LinkedIn','date':day,'items':[]}
    history['items']=[byid.get(x['id'],x) for x in history['items'] if x['id']!=drop]
    ids={x['id'] for x in history['items']}
    history['items'] += [x for x in added if x['date_published'][:10]==day and x['id'] not in ids]
    history['item_count']=len(history['items']);write(hp,history)
    registry['archived_days'][day]={'count':len(history['items']),'source':'linkedin','page':'/archive/'+day,'post_ids':[x['platform_id'] for x in history['items']]}
corpus['item_count']=len(corpus['items']);corpus['generated_at']=now;routes['generated_at']=now
write('data/corpus.json',corpus);write('data/article-routes.json',routes);write('data/voce-index-registry.json',registry)
publisher=(ROOT/'backfill/publish_current.py').read_text()
for day in sorted({x['date_published'][:10] for x in added}|{'2026-09-28'}):
    label={'2026-09-28':'28 septembre 2026','2026-10-01':'1 octobre 2026','2026-10-02':'2 octobre 2026'}[day]
    source=publisher.replace('2026-09-30',day).replace('30 septembre 2026',label)
    exec(compile(source,'publish_current.py','exec'),{'__file__':str(ROOT/'backfill/publish_current.py')})
ns='http://www.sitemaps.org/schemas/sitemap/0.9';ET.register_namespace('',ns)
tree=ET.parse(ROOT/'sitemap.xml');root=tree.getroot()
for node in list(root):
    if node.find('{'+ns+'}loc').text==old: root.remove(node)
locations={n.text for n in root.findall('{'+ns+'}url/{'+ns+'}loc')}
for url in [x['canonical_url'] for x in added]+['https://voce.life/archive/'+x['date_published'][:10] for x in added]:
    if url not in locations:
        node=ET.SubElement(root,'{'+ns+'}url');ET.SubElement(node,'{'+ns+'}loc').text=url;locations.add(url)
tree.write(ROOT/'sitemap.xml',encoding='utf-8',xml_declaration=True)
cp=read('backfill/checkpoint.json');cp['updated_at']=now;cp['academy_corpus_items']=len(corpus['items'])
cp['integration']['catchup']={'checked_at':now,'added_ids':[x['id'] for x in added],'latest_publication':max(x['date_published'] for x in corpus['items']),'october_2':'no_connector_rows_not_proof_of_absence','duplicate':{'kept':keep,'alias':drop,'old_url':old,'canonical_url':target,'text_sha256':hashlib.sha256(byid[keep]['text'].encode()).hexdigest()},'deployment':'pending_verification'}
write('backfill/checkpoint.json',cp)
final=read('data/corpus.json')['items'];assert all(x['text']==before[x['id']] for x in final if x['id'] in before)
assert len({x['id'] for x in final})==len(final)
assert len({x['text'] for x in final})==len(final)
print(json.dumps({'added':len(added),'count':len(final),'text_preservation':'passed'}))
