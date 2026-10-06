"""Consolidate exact texts without losing publication provenance or URLs."""
def consolidate(existing, histories, route_by_id):
    owners = {}
    aliases = {}
    # Retain the earliest original publication. A previous consolidation's
    # alternate IDs must not become independent articles when histories reload.
    for item in sorted(existing.values(), key=lambda x: (x['date_published'], x['id'])):
        canonical = owners.setdefault(item['text'], item)
        if canonical['id'] == item['id']:
            continue
        alternates = canonical.setdefault('alternate_publications', [])
        for publication in [item] + item.get('alternate_publications', []):
            if publication.get('platform_id') == canonical['platform_id']:
                continue
            if not any(x.get('platform_id') == publication.get('platform_id') for x in alternates):
                alternates.append({k:publication[k] for k in
                    ('id','platform','platform_id','date_published','source_url','canonical_url') if k in publication})
        aliases[item['id']] = canonical['id']
        previous = route_by_id.pop(item['id'], None)
        path = (previous or {}).get('path', item['canonical_url'].removeprefix('https://voce.life'))
        route_by_id['redirect:' + item['id']] = {
            'id':'redirect:' + item['id'], 'post_id':item['platform_id'].rsplit(':',1)[-1],
            'date':item['date_published'][:10], 'path':path,
            'redirect_to':canonical['canonical_url'].removeprefix('https://voce.life'),
            'canonical_id':canonical['id']}
    for alias in aliases:
        existing.pop(alias)
    for history in histories.values():
        history['items'] = [existing[x['id']] for x in history['items'] if x['id'] in existing]
        history['item_count'] = len(history['items'])
    return aliases
