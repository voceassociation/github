"""Finite synthetic coverage and evidence mutations, no production system."""
import itertools
import unittest
from oracle import Event, classify


def pairs(rows):
    return {(i, j, row[i], row[j]) for row in rows
            for i, j in itertools.combinations(range(3), 2)}


class ScenarioTests(unittest.TestCase):
    def test_pairwise_coverage_does_not_cover_triple(self):
        exhaustive = list(itertools.product((0, 1), repeat=3))
        selected = [(0, 0, 0), (0, 1, 1), (1, 0, 1), (1, 1, 0)]
        self.assertEqual(len(pairs(exhaustive)), 12)
        self.assertEqual(pairs(selected), pairs(exhaustive))
        self.assertNotIn((1, 1, 1), selected)
        defect = lambda row: row == (1, 1, 1)
        self.assertFalse(any(map(defect, selected)))
        self.assertTrue(any(map(defect, selected + [(1, 1, 1)])))

    def test_missing_route_mutation(self):
        self.assertEqual(classify([], {'primary', 'secondary'}, {'primary'}, True), 'indeterminate')

    def test_open_export_mutation(self):
        self.assertEqual(classify([], {'primary'}, {'primary'}, False), 'indeterminate')

    def test_missing_lock_mutation(self):
        e = Event('primary', 'protected_modification', True, None)
        self.assertEqual(classify([e], {'primary'}, {'primary'}, True), 'indeterminate')

    def test_locked_commit_mutation(self):
        e = Event('primary', 'protected_modification', True, True)
        self.assertEqual(classify([e], {'primary'}, {'primary'}, True), 'contradicted')

    def test_forged_coverage_is_an_explicit_blind_spot(self):
        # The oracle cannot observe a deleted event; certification is trusted.
        original = [Event('primary', 'protected_modification', True, True)]
        self.assertEqual(classify(original, {'primary'}, {'primary'}, True), 'contradicted')
        self.assertEqual(classify([], {'primary'}, {'primary'}, True), 'supported_in_observed_scope')

    def test_permutation_is_invariant_for_this_local_property(self):
        events = [Event('primary', 'audit', True, True),
                  Event('primary', 'protected_modification', True, False)]
        for ordered in itertools.permutations(events):
            self.assertEqual(classify(ordered, {'primary'}, {'primary'}, True), 'supported_in_observed_scope')


if __name__ == '__main__':
    unittest.main()
