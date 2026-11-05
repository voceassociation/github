"""Calculs du chapitre 1. Exécuter python -m unittest discover."""
from math import ceil, expm1, log, log1p
import unittest


def upper_after_zero(n, alpha=0.05):
    if n <= 0 or not 0 < alpha < 1:
        raise ValueError("Effectif ou niveau invalide")
    return -expm1(log(alpha) / n)


class AcceptanceTests(unittest.TestCase):
    def test_exposure(self):
        self.assertEqual(10 / 20, 0.5)
        self.assertAlmostEqual((20 / 10000) * (10 / 20), 0.001)

    def test_weighting(self):
        self.assertAlmostEqual(.02 * (8 / 200) + .98 * (2 / 200), .0106)

    def test_zero_observations(self):
        self.assertAlmostEqual(.99 ** 60, .547, places=3)
        self.assertAlmostEqual(upper_after_zero(60), .0487, places=4)
        self.assertAlmostEqual(upper_after_zero(6), .393, places=3)

    def test_minimum_sample(self):
        n = ceil(log(.05) / log1p(-.01))
        self.assertEqual(n, 299)
        self.assertGreater(upper_after_zero(n - 1), .01)
        self.assertLessEqual(upper_after_zero(n), .01)

    def test_no_exposure(self):
        with self.assertRaises(ValueError):
            upper_after_zero(0)
