"""Integrity tests for the Facebook continuation, with isolated test fixtures."""
import copy
import hashlib
import json
import tempfile
import unittest
from pathlib import Path
from facebook_sources import integrate_facebook, validate_source, SCHEMA, PAGE_ID


def digest(text):
    return hashlib.sha256(text.encode()).hexdigest()


def fixture(text='Test de conservation\n\nTexte original.\n\nULTRA®\n\nSources \nSource de test\n\n#VOCEAssociation'):
    post = {'facebook_id': '1997995871106377',
            'source_url': 'https://www.facebook.com/reel/1997995871106377/',
            'author_page_canonical': 'https://www.facebook.com/61581153121750/videos/test/1997995871106377/',
            'text': text, 'text_sha256': digest(text),
            'publication_datetime': '2026-10-12T15:00:00+02:00',
            'retrieved_at': '2026-10-12T17:00:00+02:00',
            'date_basis': 'Isolated test fixture: explicit timezone-aware timestamp',
            'url_resolved': True, 'linebreaks_preserved': True,
            'date_verified': True, 'author_verified': True}
    return {'schema': SCHEMA, 'date': '2026-10-12', 'page_id': PAGE_ID,
            'access_verified': True, 'verified_posts': [post]}, post


class FacebookIntegrityTests(unittest.TestCase):
    def run_packet(self, packet, existing=None, text_owner=None):
        existing = existing if existing is not None else {}
        text_owner = text_owner if text_owner is not None else {}
        with tempfile.TemporaryDirectory() as tmp:
            work = Path(tmp) / 'backfill'
            directory = work / 'raw' / 'facebook'
            directory.mkdir(parents=True)
            (directory / '2026-10-12.json').write_text(json.dumps(packet))
            histories, routes = {}, {}
            result = integrate_facebook(work, existing, histories, routes, text_owner,
                                        digest, lambda title, ident: 'test-' + ident)
            return result, existing, histories, routes

    def test_full_base_text_is_preserved_and_ingestion_is_idempotent(self):
        packet, post = fixture('Texte de base\n\n' + 'Développement original.\n\n' * 220 +
                               'ULTRA®\n\nSources \nSource de test\n\n#VOCEAssociation')
        result, existing, histories, routes = self.run_packet(packet)
        self.assertEqual(result[3], 1)
        item = existing['facebook:' + post['facebook_id']]
        self.assertEqual(item['text'], post['text'])
        self.assertGreater(len(item['text']), 3000)
        self.assertEqual(item['platform'], 'facebook')
        self.assertIn('facebook-', item['canonical_url'])
        old = copy.deepcopy(existing)
        result, existing, _, _ = self.run_packet(packet, existing, {digest(item['text']): item})
        self.assertEqual(result[3], 0)
        self.assertEqual(existing, old)

    def test_identical_cross_platform_text_adds_provenance_not_another_route(self):
        packet, post = fixture()
        original = {'id': 'linkedin:test', 'platform_id': 'urn:li:ugcPost:test',
                    'title': 'Test de conservation', 'text': post['text'],
                    'canonical_url': 'https://voce.life/archive/existing-test'}
        existing = {original['id']: original}
        result, existing, _, routes = self.run_packet(packet, existing, {digest(post['text']): original})
        self.assertEqual(result[3], 0)
        self.assertEqual(len(existing), 1)
        self.assertEqual(routes, {})
        self.assertEqual(original['canonical_url'], 'https://voce.life/archive/existing-test')
        self.assertEqual(original['text'], post['text'])
        self.assertEqual(original['alternate_publications'][0]['platform'], 'facebook')
        self.run_packet(packet, existing, {digest(post['text']): original})
        self.assertEqual(len(original['alternate_publications']), 1)

    def test_existing_original_and_same_title_variant_are_not_rewritten(self):
        packet, post = fixture()
        original = {'id': 'linkedin:test', 'title': 'Test de conservation',
                    'text': 'Version LinkedIn conservée', 'canonical_url': 'existing'}
        expected = copy.deepcopy(original)
        result, existing, _, routes = self.run_packet(packet, {original['id']: original})
        self.assertEqual(original, expected)
        self.assertEqual(result[3], 0)
        self.assertEqual(result[2][0]['reason'], 'existing_title_has_different_version')
        self.assertEqual(routes, {})

    def test_invalid_author_date_hash_and_numeric_id_fail_closed(self):
        mutations = [
            ('publication_datetime', '2026-10-12T13:59:00+02:00'),
            ('publication_datetime', '2026-10-12T15:00:00'),
            ('publication_datetime', '2026-10-13T15:00:00+02:00'),
            ('author_page_canonical', 'https://www.facebook.com/802476986277786/videos/test/1997995871106377/'),
            ('facebook_id', 1997995871106377),
            ('facebook_id', '9999999999999999'),
            ('text_sha256', 'wrong'),
            ('date_verified', False),
        ]
        for field, value in mutations:
            packet, post = fixture()
            post[field] = value
            with self.subTest(field=field, value=value):
                with self.assertRaises(ValueError):
                    validate_source(packet, post, digest)


if __name__ == '__main__':
    unittest.main()
