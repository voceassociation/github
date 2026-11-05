"""Décisions descriptives sur un lot fini, hors extrapolation."""
from fractions import Fraction
from math import ceil, log, log1p
import unittest


def compatible_rates(total, defects, unresolved):
    if total <= 0 or min(defects, unresolved) < 0 or defects + unresolved > total:
        raise ValueError("Effectifs incompatibles")
    return Fraction(defects, total), Fraction(defects + unresolved, total)


def assess(total, defects, unresolved, threshold):
    low, high = compatible_rates(total, defects, unresolved)
    if low > threshold:
        return "dépassé"
    if high <= threshold:
        return "respecté sur le lot"
    return "indéterminé"


class CategoryAcceptanceTests(unittest.TestCase):
    def test_missing_records(self):
        self.assertEqual(compatible_rates(300, 2, 30), (Fraction(1, 150), Fraction(8, 75)))
        self.assertEqual(assess(300, 2, 30, Fraction(2, 100)), "indéterminé")

    def test_threshold_inclusive(self):
        self.assertEqual(assess(300, 2, 4, Fraction(2, 100)), "respecté sur le lot")
        self.assertEqual(assess(300, 7, 25, Fraction(2, 100)), "dépassé")

    def test_impossible_counts(self):
        with self.assertRaises(ValueError):
            compatible_rates(3, 2, 2)

    def test_simultaneous_upper_bounds(self):
        alpha = .05 / 4
        n = ceil(log(alpha) / log1p(-.01))
        self.assertEqual(n, 437)
        self.assertTrue(.99 ** n <= alpha < .99 ** (n - 1))

    def test_cost_switch_and_capacity(self):
        self.assertTrue(4 + 2 * 10 < 40 == 4 + 2 * 18 < 4 + 2 * 50)
        self.assertEqual(100 - 8 * 60 // 6, 20)
