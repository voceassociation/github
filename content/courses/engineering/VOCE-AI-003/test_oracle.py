import unittest
from oracle import Event, classify


class OracleTests(unittest.TestCase):
    def verdict(self, events, covered=('primary',), closed=True):
        return classify(events, {'primary'}, set(covered), closed)

    def test_unlocked_commit(self):
        self.assertEqual(self.verdict([Event('primary', 'protected_modification', True, False)]), 'supported_in_observed_scope')

    def test_locked_commit_even_with_refusal(self):
        events = [Event('primary', 'refusal', False, True), Event('primary', 'protected_modification', True, True)]
        self.assertEqual(self.verdict(events), 'contradicted')

    def test_complete_refusal(self):
        self.assertEqual(self.verdict([Event('primary', 'refusal', False, True)]), 'supported_in_observed_scope')

    def test_open_window(self):
        self.assertEqual(self.verdict([], closed=False), 'indeterminate')

    def test_missing_route(self):
        self.assertEqual(classify([], {'primary', 'secondary'}, {'primary'}, True), 'indeterminate')

    def test_unknown_lock(self):
        self.assertEqual(self.verdict([Event('primary', 'protected_modification', True, None)]), 'indeterminate')

    def test_string_bool_is_not_evidence(self):
        self.assertEqual(self.verdict([Event('primary', 'protected_modification', 'false', True)]), 'indeterminate')
        self.assertEqual(self.verdict([], closed='true'), 'indeterminate')

    def test_violation_survives_missing_coverage_and_permutation(self):
        bad = Event('primary', 'protected_modification', True, True)
        unknown = Event('primary', 'protected_modification', True, None)
        for events in ([bad, unknown], [unknown, bad], [bad]):
            with self.subTest(events=events):
                self.assertEqual(self.verdict(events, covered=(), closed=False), 'contradicted')

    def test_out_of_scope_event(self):
        self.assertEqual(self.verdict([Event('other', 'protected_modification', True, True)]), 'supported_in_observed_scope')

    def test_empty_scope_not_vacuously_supported(self):
        self.assertEqual(classify([], set(), set(), True), 'indeterminate')

    def test_uncommitted_and_audit_are_not_protected_commits(self):
        events = [Event('primary', 'protected_modification', False, True), Event('primary', 'audit', True, True)]
        self.assertEqual(self.verdict(events), 'supported_in_observed_scope')


if __name__ == '__main__':
    unittest.main()
