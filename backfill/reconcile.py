import json, re, hashlib, unicodedata
from pathlib import Path
from datetime import datetime, timezone
from zoneinfo import ZoneInfo
from deduplicate import consolidate

ROOT = Path(__file__).resolve().parents[1]
WORK = ROOT / 'backfill'
def read(path): return json.loads(path.read_text())
def write(path, obj):
    path.parent.mkdir(parents=True, exist_ok=True)
    path.write_text(json.dumps(obj, ensure_ascii=False, indent=2) + '\n')
def decode(text):
    # LinkedIn commentary serialization, not editorial rewriting.
    text = re.sub(r'\{hashtag\|\\#\|([^{}]+)\}', lambda m: '#' + m[1], text)
    return re.sub(r'\\([\\_*~\[\](){}<>#|])', r'\1', text)
def digest(text): return hashlib.sha256(text.encode()).hexdigest()
def slug(text, identifier):
    text = unicodedata.normalize('NFKD', text).encode('ascii','ignore').decode().lower()
    return re.sub(r'[^a-z0-9]+','-',text).strip('-')[:72].rstrip('-') + '-' + identifier

corpus = read(ROOT/'data/corpus.json')
routes = read(ROOT/'data/article-routes.json')
registry = read(ROOT/'data/voce-index-registry.json')
source_corrections = {}
for correction_path in sorted((WORK/'source-corrections').glob('*.json')):
    for correction in read(correction_path)['corrections']:
        packet = read(ROOT/correction['source_packet'])
        source = next(p for p in packet['verified_posts'] if 'linkedin:' + p['linkedin_id'].rsplit(':', 1)[-1] == correction['id'])
        if not source.get('url_resolved') or not source.get('linebreaks_preserved') or digest(source['text']) != correction['source_text_sha256']:
            raise ValueError('Invalid verified transcription correction: ' + correction['id'])
        source_corrections[correction['id']] = (correction, source)

def restore_verified_transcription(item):
    if item['id'] not in source_corrections:
        return
    correction, source = source_corrections[item['id']]
    current_hash = digest(item['text'])
    if current_hash == correction['source_text_sha256']:
        return
    if current_hash != correction['expected_existing_sha256'] or item.get('source_url') != source['source_url']:
        raise ValueError('Unexpected existing transcription: ' + item['id'])
    if item['title'] != source['text'].splitlines()[0]:
        raise ValueError('Transcription correction must preserve the title and route')
    item['text'] = source['text']
    item.setdefault('provenance', {})['transcription_correction'] = correction

for item in corpus['items']:
    restore_verified_transcription(item)
original = {x['id']: x for x in corpus['items']}
existing = dict(original)
histories = {}
for p in sorted((ROOT/'data/history').glob('*.json')):
    day = read(p); histories[day['date']] = day
    for item in day['items']:
        restore_verified_transcription(item)
        if item['id'] in existing and existing[item['id']]['text'] != item['text']:
            raise ValueError('Conflicting existing records: ' + item['id'])
        existing.setdefault(item['id'], item)
route_by_id = {x['id']:x for x in routes['items']}
consolidated_aliases = consolidate(existing, histories, route_by_id)
text_owner = {}
for item in existing.values():
    text_owner.setdefault(digest(item['text']), item)
records, conflicts, scan, seen = [], [], {}, {}
new_count = 0
source_packets = list((WORK/'raw').glob('*.json')) + list((WORK/'raw'/'browser').glob('*.json'))
for path in sorted(source_packets, key=lambda p: (p.stem, str(p))):
    # Dated connector packets and verified browser captures belong to this pass.
    # Adobe/Facebook evidence files share the raw directory but use other schemas.
    if not re.fullmatch(r'\d{4}-\d{2}-\d{2}\.json', path.name):
        continue
    packet = read(path)
    browser = packet.get('schema') == 'voce.linkedin-browser-source.v1'
    browser_records = {}
    if browser:
        day = packet['date']; rows = []
        if not packet.get('access_verified'):
            scan[day] = {'status':'browser_verification_required'}; continue
        for post in packet.get('verified_posts', []):
            if not post.get('url_resolved') or not post.get('linebreaks_preserved'):
                raise ValueError('Unverified browser source: ' + post.get('linkedin_id', 'unknown'))
            text = post['text']
            if len(text) > 1000 and '\n' not in text:
                raise ValueError('Browser text lost paragraph structure')
            published = post['publication_date']
            if post.get('date_precision') != 'day' or not re.fullmatch(r'\d{4}-\d{2}-\d{2}', published):
                raise ValueError('Browser source requires an explicit verified civil date')
            if published != day:
                raise ValueError('Browser packet date mismatch')
            browser_records[post['linkedin_id']] = post
            rows.append((published, text, post['linkedin_id'], post['source_url']))
    else:
        if 'response' not in packet or 'date' not in packet:
            continue
        response = packet['response']; day = packet['date']
        if response.get('isError'):
            scan[day] = {'status':'retry_required'}; continue
        rows = json.loads(response['content'][0]['text'])['rows']
    previous_scan = scan.get(day)
    scan[day] = {'status':'rows_returned' if rows else 'no_rows_not_proof_of_absence', 'rows':len(rows), 'source_packets':[str(path.relative_to(ROOT))]}
    if browser:
        scan[day].update(source='authenticated_linkedin_browser', coverage_complete=bool(packet.get('coverage_complete')))
    if previous_scan:
        scan[day]['rows'] += previous_scan.get('rows', 0)
        scan[day]['source_packets'] = previous_scan.get('source_packets', []) + scan[day]['source_packets']
        if scan[day]['rows']:
            scan[day]['status'] = 'rows_returned'
        scan[day]['source'] = 'historical_connector_and_authenticated_linkedin_browser'
    for created, raw, urn, url in rows:
        ident = urn.rsplit(':',1)[-1]; key = 'linkedin:' + ident
        if not re.fullmatch(r'\d+',ident) or not url.startswith('https://www.linkedin.com/feed/update/'+urn):
            conflicts.append({'id':key,'reason':'invalid_identifier_or_url'}); continue
        text = raw if browser else decode(raw)
        if key in seen:
            if seen[key] != raw: conflicts.append({'id':key,'reason':'different_connector_texts'})
            continue
        seen[key] = raw
        # Connector timestamps agree with the UTC time encoded by LinkedIn IDs.
        if browser:
            local = datetime.fromisoformat(created).replace(tzinfo=ZoneInfo('Europe/Podgorica'))
            published = created  # Date precision is a day; do not invent a publication hour.
        else:
            dt = datetime.strptime(created,'%Y%m%d%H%M%S').replace(tzinfo=timezone.utc)
            local = dt.astimezone(ZoneInfo('Europe/Podgorica'))
            published = local.isoformat()
        local_day = local.date().isoformat()
        record = {'id':key,'platform_id':urn,'source_url':url,'date_published':published,
                  'connector_created':created,'connector_text':raw,'text':text,
                  'text_sha256':digest(text),'connector_text_sha256':digest(raw),
                  'adobe_provenance':{'status':'pending','evidence':[]}}
        if browser:
            evidence = browser_records[urn]
            record.pop('connector_created', None); record.pop('connector_text', None); record.pop('connector_text_sha256', None)
            record.update(source='authenticated_linkedin_browser', date_precision='day', retrieved_at=evidence['retrieved_at'], date_basis=evidence['date_basis'])
        records.append(record)
        if key in existing:
            if existing[key]['text'] != text:
                conflicts.append({'id':key,'reason':'existing_text_differs','existing_sha256':digest(existing[key]['text']),
                                  'retrieved_sha256':digest(text),'resolution':'existing_text_preserved_pending_review'})
            continue
        text_key = digest(text)
        canonical = text_owner.get(text_key)
        if canonical:
            publication = {'platform':'linkedin','platform_id':urn,'date_published':published,'source_url':url}
            alternates = canonical.setdefault('alternate_publications', [])
            if not any(x.get('platform_id') == urn for x in alternates):
                alternates.append(publication)
            title = next((s for s in text.splitlines() if s.strip()), 'Publication VOCE')
            redirect_slug = slug(title, ident)
            redirect_path = '/archive/' + local_day.replace('-','/') + '/' + redirect_slug
            canonical_path = canonical['canonical_url'].removeprefix('https://voce.life')
            route_by_id['redirect:' + key] = {'id':'redirect:' + key,'post_id':ident,'date':local_day,
                'path':redirect_path,'redirect_to':canonical_path,'canonical_id':canonical['id']}
            record['duplicate_of'] = canonical['id']
            continue
        title = next((s for s in text.splitlines() if s.strip()), 'Publication VOCE')
        item_slug = slug(title, ident)
        canonical_path = '/archive/' + local_day.replace('-','/') + '/' + item_slug
        item = {'id':key,'platform':'linkedin','platform_id':urn,'date_published':published,
                'title':title,'slug':item_slug,'canonical_url':'https://voce.life'+canonical_path,
                'source_url':url,'language':'fr','text':text,'adobe_provenance':{'status':'pending'}}
        if browser:
            item.update(date_precision='day', provenance={'source':'authenticated_linkedin_browser','retrieved_at':record['retrieved_at'],'visible_relative_time':browser_records[urn]['visible_relative_time'],'date_basis':record['date_basis']})
        existing[key] = item; text_owner[text_key] = item; new_count += 1
        target = histories.setdefault(local_day,{'schema':1,'owner':'VOCE Association','source':('LinkedIn authenticated browser' if browser else 'Metricool / LinkedIn'),'date':local_day,'item_count':0,'items':[]})
        target['items'].append(item)

# Integrate existing historical records into the Academy corpus without modifying them.
for key,item in existing.items():
    if key not in route_by_id:
        route_by_id[key] = {'id':key,'post_id':item['platform_id'].rsplit(':',1)[-1],
                            'date':item['date_published'][:10],
                            'path':item['canonical_url'].removeprefix('https://voce.life')}
corpus['items'] = list(existing.values())
corpus['item_count'] = len(corpus['items'])
corpus['generated_at'] = datetime.now(timezone.utc).isoformat()
routes['items'] = list(route_by_id.values()); routes['generated_at'] = corpus['generated_at']
for day,obj in histories.items():
    obj['item_count'] = len(obj['items']); write(ROOT/'data/history'/f'{day}.json',obj)
    registry['archived_days'][day] = {'count':len(obj['items']),'source':'linkedin','page':'/archive/'+day,
                                     'post_ids':[x['platform_id'] for x in obj['items']]}
write(ROOT/'data/corpus.json', corpus)
(ROOT/'data/corpus.ndjson').write_text(''.join(json.dumps(x,ensure_ascii=False)+'\n' for x in corpus['items']))
write(ROOT/'data/article-routes.json',routes)
registry['backfill']['complete'] = False
registry['backfill']['requested_window'] = {'from':'2026-03-01','through':'2026-09-30'}
registry['backfill']['checkpoint'] = 'backfill/checkpoint.json'
registry['backfill']['status'] = 'partial_connector_history_requires_linkedin_verification'
write(ROOT/'data/voce-index-registry.json',registry)
write(WORK/'publications.json',{'source':'LinkedIn original publications: historical connector packets and verified browser captures','items':records})
write(WORK/'conflicts.json',{'items':conflicts})
previous_checkpoint = read(WORK/'checkpoint.json') if (WORK/'checkpoint.json').exists() else {}
checkpoint = {'schema':1,'updated_at':corpus['generated_at'],'complete':False,'window':{'from':'2026-03-01','through':'2026-09-30'},
              'daily_scans':scan,'retrieved_unique_publications':len(records),'newly_archived':new_count,
              'academy_corpus_items':len(corpus['items']),'text_conflicts':len(conflicts),
              'adobe_provenance_verified':0,'adobe_provenance_status':'candidates_only',
              'resume':['Obtain authenticated LinkedIn history for dates with no connector rows.',
                        'Compare connector text against LinkedIn originals and review conflicts without overwriting.',
                        'Verify Adobe provenance with exact publication/asset evidence.',
                        'Recheck September 29–30 for connector lag.']}
if previous_checkpoint.get('integration'):
    checkpoint['integration'] = previous_checkpoint['integration']
write(WORK/'checkpoint.json',checkpoint)

# Extend discoverability using existing XML conventions; never replace existing canonical URLs.
import xml.etree.ElementTree as ET
ns='http://www.sitemaps.org/schemas/sitemap/0.9'; ET.register_namespace('',ns)
sitemap_path=ROOT/'sitemap.xml'; tree=ET.parse(sitemap_path); root=tree.getroot()
locations={x.text for x in root.findall('{'+ns+'}url/{'+ns+'}loc')}
redirect_urls = {'https://voce.life'+x['path'] for x in routes['items'] if x.get('redirect_to')}
for node in list(root):
    if node.find('{'+ns+'}loc').text in redirect_urls:
        root.remove(node)
for route in routes['items']:
    if route.get('redirect_to'):
        continue
    url='https://voce.life'+route['path']
    if url not in locations:
        node=ET.SubElement(root,'{'+ns+'}url'); ET.SubElement(node,'{'+ns+'}loc').text=url
        locations.add(url)
tree.write(sitemap_path,encoding='utf-8',xml_declaration=True)
print(json.dumps({k:v for k,v in checkpoint.items() if k!='daily_scans'},ensure_ascii=False,indent=2))
