"""Petit banc de réception de scénarios fictifs de réservation."""
import unittest


def leaked_roots(training, evaluation):
    return {row["root"] for row in training} & {row["root"] for row in evaluation}


def accepted(before, after, notifications, consent, available):
    # Cet oracle ne couvre qu'un déplacement fixé et deux issues.
    expected = before.copy()
    expected_messages = []
    if consent and available:
        expected["R1"] = ("Lina", "spectromètre", 10, 12)
        expected_messages.append(("R1", "déplacé", 10, 12))
    return after == expected and notifications == expected_messages


class EvaluationTests(unittest.TestCase):
    initial = {"R1": ("Lina", "spectromètre", 8, 10), "R2": ("Ali", "sonde", 9, 11)}

    def test_paraphrase_leak(self):
        self.assertEqual(leaked_roots([{"root": 7, "text": "mardi"}],
                                      [{"root": 7, "text": "demain"}]), {7})

    def test_consent(self):
        moved = dict(self.initial, R1=("Lina", "spectromètre", 10, 12))
        notices = [("R1", "déplacé", 10, 12)]
        self.assertTrue(accepted(self.initial, moved, notices, True, True))
        self.assertFalse(accepted(self.initial, moved, notices, False, True))

    def test_compensated_write_with_notification(self):
        self.assertTrue(accepted(self.initial, self.initial, [], True, False))
        self.assertFalse(accepted(self.initial, self.initial, [("R1", "déplacé", 10, 12)], True, False))

    def test_collateral_damage(self):
        moved = {"R1": ("Lina", "spectromètre", 10, 12)}
        self.assertFalse(accepted(self.initial, moved, [("R1", "déplacé", 10, 12)], True, True))

    def test_numerical_examples(self):
        self.assertAlmostEqual(.9 * .98 + .1 * .60, .942)
        self.assertEqual(round(100 * (1 - .8**8 - .2**8), 1), 83.2)
        self.assertEqual(round(100 * (1 - .95**20)), 64)
