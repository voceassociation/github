import math
import unittest
from uncertainty import zero_upper, required_zero_trials, finite_bounds


class UncertaintyTests(unittest.TestCase):
    def test_known_zero_limits(self):
        self.assertAlmostEqual(zero_upper(100), 0.02951304960703993)
        self.assertAlmostEqual(zero_upper(1000), 0.0029912495450953314)

    def test_defining_equation(self):
        for n in (1, 10, 1000, 1000000):
            upper = zero_upper(n)
            self.assertAlmostEqual(n * math.log1p(-upper), math.log(0.05), places=10)

    def test_sample_sizes_and_minimality(self):
        for alpha, expected in ((0.05, 2995), (0.005, 5296)):
            n = required_zero_trials(0.001, alpha)
            self.assertEqual(n, expected)
            self.assertLessEqual(zero_upper(n, alpha), 0.001)
            self.assertGreater(zero_upper(n-1, alpha), 0.001)

    def test_monotonicity(self):
        self.assertLess(zero_upper(1000), zero_upper(100))
        self.assertGreater(zero_upper(100, 0.005), zero_upper(100, 0.05))

    def test_missing_data_bounds(self):
        self.assertEqual(finite_bounds(2, 30, 100), (0.02, 0.32))

    def test_invalid_inputs(self):
        for n in (0, -1, True, 1.5):
            with self.assertRaises(ValueError):
                zero_upper(n)
        for alpha in (0, 1, float('nan'), True):
            with self.assertRaises(ValueError):
                zero_upper(100, alpha)
        with self.assertRaises(ValueError):
            finite_bounds(3, 8, 10)

    def test_synthetic_weighting_and_cost(self):
        self.assertAlmostEqual(0.99 * 0.001 + 0.01 * 0.1, 0.00199)
        threshold = 5 / 10005
        self.assertAlmostEqual(10000 * threshold, 5 * (1-threshold))
        self.assertAlmostEqual(zero_upper(1000)/0.8, 0.003739061931369164)


if __name__ == '__main__':
    unittest.main()
