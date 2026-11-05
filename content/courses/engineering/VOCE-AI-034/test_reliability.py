"""Calculs exacts de fiabilité dans le scénario de la coopérative."""
from fractions import Fraction
from itertools import combinations
from math import comb
from statistics import variance
import unittest


def all_correct(successes, trials, k):
    if not (0 <= successes <= trials and 1 <= k <= trials):
        raise ValueError("effectifs incompatibles")
    return Fraction(comb(successes, k), comb(trials, k))


class ReliabilityTests(unittest.TestCase):
    def test_enumeration(self):
        for n in range(1, 8):
            for c in range(n + 1):
                results = [True] * c + [False] * (n - c)
                for k in range(1, n + 1):
                    groups = list(combinations(results, k))
                    self.assertEqual(all_correct(c, n, k),
                                     Fraction(sum(map(all, groups)), len(groups)))

    def test_equal_single_different_pair(self):
        for counts, expected in [([5, 5, 0, 0], Fraction(1, 2)),
                                 ([3, 3, 2, 2], Fraction(1, 5))]:
            self.assertEqual(sum(counts), 10)
            self.assertEqual(sum(all_correct(c, 5, 2) for c in counts) / 4, expected)

    def test_any_success(self):
        self.assertEqual(1 - all_correct(2, 5, 2), Fraction(9, 10))

    def test_cluster_variance(self):
        self.assertEqual(variance(map(Fraction, [1, 1, 0, 0])) / 4, Fraction(1, 12))

    def test_insufficient_repeats(self):
        with self.assertRaises(ValueError):
            all_correct(3, 3, 5)
