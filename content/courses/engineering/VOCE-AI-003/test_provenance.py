import copy
import unittest
from provenance import digest, verify


class ProvenanceTests(unittest.TestCase):
    def setUp(self):
        self.e = {'run': 'R7', 'source': 'db-A', 'events': [
            {'seq': n, 'payload': {'locked': n == 43}} for n in range(41, 45)]}
        self.m = {'run': 'R7', 'source': 'db-A', 'first': 41, 'last': 44,
                  'sha256': digest(self.e)}

    def check(self):
        return verify(self.e, self.m, 'R7', 'db-A')

    def test_original_matches_reference(self):
        self.assertTrue(self.check())

    def test_interior_deletion(self):
        del self.e['events'][2]
        self.assertFalse(self.check())

    def test_tail_deletion(self):
        self.e['events'].pop()
        self.assertFalse(self.check())

    def test_duplicate_sequence_same_count(self):
        self.e['events'][2]['seq'] = 42
        self.assertFalse(self.check())

    def test_permutation(self):
        self.e['events'].reverse()
        self.assertFalse(self.check())

    def test_payload_alteration(self):
        self.e['events'][2]['payload']['locked'] = False
        self.assertFalse(self.check())

    def test_wrong_context(self):
        self.e['run'] = 'R8'
        self.assertFalse(self.check())

    def test_false_reference_is_not_detected(self):
        self.e['events'].pop()
        self.m['last'] = 43
        self.m['sha256'] = digest(self.e)
        self.assertTrue(self.check())  # Deliberate trust-boundary limitation.

    def test_invalid_types(self):
        self.e['events'][0]['seq'] = '41'
        self.assertFalse(self.check())

    def test_key_order_does_not_change_canonical_digest(self):
        reordered = {'events': copy.deepcopy(self.e['events']), 'source': 'db-A', 'run': 'R7'}
        self.assertEqual(digest(reordered), digest(self.e))


if __name__ == '__main__':
    unittest.main()
