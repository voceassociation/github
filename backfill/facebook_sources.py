"""Reconcile verified Facebook texts without rewriting archived publications."""
import json
import re
from datetime import datetime, timezone
from urllib.parse import urlsplit
from zoneinfo import ZoneInfo

PAGE_ID = '61581153121750'
BOUNDARY = datetime.fromisoformat('2026-10-12T12:00:56.377+00:00')
SCHEMA = 'voce.facebook-verified-source.v1'


def aware_datetime(value):
    parsed = datetime.fromisoformat(value.replace('Z', '+00:00'))
    if parsed.tzinfo is None or parsed.utcoffset() is None:
        raise ValueError('Facebook publication time requires a verified UTC offset')
    return parsed


def validate_source(packet, post, digest):
    ident = post.get('facebook_id')
    if not isinstance(ident, str) or not re.fullmatch(r'(?:\d+|pfbid[A-Za-z0-9]+)', ident):
        raise ValueError('Facebook identifiers must be literal source strings')
    if packet.get('page_id') != PAGE_ID or not packet.get('access_verified'):
        raise ValueError('Facebook packet must verify the authorised VOCE page')
    required = ('url_resolved', 'linebreaks_preserved', 'date_verified', 'author_verified')
    if not all(post.get(flag) is True for flag in required):
        raise ValueError('Unverified Facebook source: ' + ident)
    source = urlsplit(post['source_url'])
    canonical = urlsplit(post['author_page_canonical'])
    allowed_hosts = {'www.facebook.com', 'facebook.com'}
    if source.scheme != 'https' or source.hostname not in allowed_hosts or source.username or source.password:
        raise ValueError('Invalid Facebook source URL')
    if canonical.scheme != 'https' or canonical.hostname not in allowed_hosts or PAGE_ID not in canonical.path.split('/'):
        raise ValueError('Facebook author must match the observed VOCE canonical')
    paths = [source.path.rstrip('/'), canonical.path.rstrip('/')]
    if not any(path.split('/')[-1] == ident for path in paths):
        raise ValueError('Facebook identifier is not present in the observed permalink')
    text = post['text']
    if not isinstance(text, str) or not text.strip() or (len(text) > 1000 and '\n' not in text):
        raise ValueError('Facebook text is empty or has lost paragraph structure')
    if digest(text) != post['text_sha256']:
        raise ValueError('Facebook literal source text hash mismatch')
    published = aware_datetime(post['publication_datetime'])
    retrieved = aware_datetime(post['retrieved_at'])
    if published <= BOUNDARY or published > retrieved:
        raise ValueError('Facebook publication is outside the authorised continuation')
    day = published.astimezone(ZoneInfo('Europe/Podgorica')).date().isoformat()
    if day != packet['date'] or not post.get('date_basis'):
        raise ValueError('Facebook verified date does not match the packet day')
    return ident, text, published.astimezone(ZoneInfo('Europe/Podgorica')).isoformat(), day


def integrate_facebook(work, existing, histories, route_by_id, text_owner, digest, slug):
    records, scans, conflicts = [], {}, []
    added = 0
    for path in sorted((work / 'raw' / 'facebook').glob('*.json')):
        if not re.fullmatch(r'\d{4}-\d{2}-\d{2}\.json', path.name):
            continue
        packet = json.loads(path.read_text())
        if packet.get('schema') != SCHEMA:
            raise ValueError('Unrecognised verified Facebook packet: ' + str(path))
        if packet.get('date') != path.stem:
            raise ValueError('Facebook packet filename does not match its civil date')
        for post in packet.get('verified_posts', []):
            ident, text, published, day = validate_source(packet, post, digest)
            key = 'facebook:' + ident
            title = next(line for line in text.splitlines() if line.strip())
            record = {'id': key, 'platform_id': key, 'platform': 'facebook',
                      'source_url': post['source_url'], 'date_published': published,
                      'text': text, 'text_sha256': digest(text),
                      'source': 'verified_facebook_source', 'date_basis': post['date_basis'],
                      'retrieved_at': post['retrieved_at']}
            records.append(record)
            scans.setdefault(day, {'source': 'facebook', 'verified_rows': 0,
                                  'coverage_complete': False, 'source_packets': []})
            scans[day]['verified_rows'] += 1
            relative = str(path.relative_to(work.parent))
            if relative not in scans[day]['source_packets']:
                scans[day]['source_packets'].append(relative)
            if key in existing:
                if existing[key]['text'] != text:
                    conflicts.append({'id': key, 'reason': 'existing_text_differs',
                                      'resolution': 'existing_original_preserved',
                                      'existing_sha256': digest(existing[key]['text']),
                                      'retrieved_sha256': digest(text)})
                continue
            canonical = text_owner.get(digest(text))
            if canonical:
                alternate = {'platform': 'facebook', 'platform_id': key,
                             'date_published': published, 'source_url': post['source_url']}
                alternates = canonical.setdefault('alternate_publications', [])
                if not any(p.get('platform_id') == key for p in alternates):
                    alternates.append(alternate)
                record['duplicate_of'] = canonical['id']
                continue
            # A Facebook expansion of an existing title is not a new canonical work.
            same_title = [item for item in existing.values()
                          if item.get('title', '').strip().casefold() == title.strip().casefold()]
            if same_title:
                conflicts.append({'id': key, 'reason': 'existing_title_has_different_version',
                                  'canonical_ids': [item['id'] for item in same_title],
                                  'resolution': 'facebook_variant_preserved_in_source_packet_pending_review'})
                continue
            item_slug = slug(title, 'facebook-' + ident)
            canonical_path = '/archive/' + day.replace('-', '/') + '/' + item_slug
            item = {'id': key, 'platform': 'facebook', 'platform_id': key,
                    'date_published': published, 'title': title, 'slug': item_slug,
                    'canonical_url': 'https://voce.life' + canonical_path,
                    'source_url': post['source_url'], 'language': post.get('language', 'fr'),
                    'text': text, 'adobe_provenance': {'status': 'pending'},
                    'provenance': {'source': 'verified_facebook_source',
                                   'source_packet': relative, 'retrieved_at': post['retrieved_at'],
                                   'date_basis': post['date_basis'], 'page_id': PAGE_ID}}
            existing[key] = item
            text_owner[digest(text)] = item
            route_by_id[key] = {'id': key, 'post_id': ident, 'platform': 'facebook',
                                'date': day, 'path': canonical_path}
            target = histories.setdefault(day, {'schema': 1, 'owner': 'VOCE Association',
                                               'source': 'VOCE original publications',
                                               'date': day, 'item_count': 0, 'items': []})
            target['items'].append(item)
            added += 1
    return records, scans, conflicts, added
