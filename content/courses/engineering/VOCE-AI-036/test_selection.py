"""Exemples synthétiques de la sélection des références."""
from fractions import Fraction
import unittest


def operating_point(groups, threshold):
    total = sum(size for score, size, errors in groups)
    accepted = sum(size for score, size, errors in groups if score >= threshold)
    wrong = sum(errors for score, size, errors in groups if score >= threshold)
    return Fraction(accepted, total), Fraction(wrong, accepted) if accepted else None


class SelectionTests(unittest.TestCase):
    groups = [(3, 600, 6), (2, 300, 18), (1, 100, 30)]

    def test_complete(self):
        self.assertEqual(operating_point(self.groups, 1), (1, Fraction(54, 1000)))

    def test_selected(self):
        self.assertEqual(operating_point(self.groups, 2), (Fraction(9, 10), Fraction(24, 900)))
        self.assertEqual(operating_point(self.groups, 3), (Fraction(3, 5), Fraction(1, 100)))

    def test_abstention(self):
        self.assertEqual(operating_point(self.groups, 4), (0, None))

    def test_cost(self):
        for loss, boundary in [(80, Fraction(94, 100)), (240, Fraction(73, 75))]:
            self.assertEqual(loss * (1 - boundary), 4 + Fraction(loss, 100))

    def test_review_benefit(self):
        self.assertEqual(30 - 100 * Fraction(1, 100), 29)
        self.assertEqual(18 - 300 * Fraction(1, 100), 15)
