"""Scénarios synthétiques du chapitre 2."""
import math
import unittest


def backlog(arrivals, capacity):
    remaining = 0
    history = []
    for work in arrivals:
        remaining = max(0, remaining + work - capacity)
        history.append(remaining)
    return history


class CalibrationAndQueueTests(unittest.TestCase):
    def test_temperature(self):
        margin = math.log(9)
        for temperature, expected in [(1, .9), (2, .75)]:
            self.assertAlmostEqual(1 / (1 + math.exp(-margin / temperature)), expected)

    def test_local_calibration(self):
        self.assertEqual((98 + 92) / 200, .95)
        self.assertLess(80 * .02, 4.8)
        self.assertGreater(80 * .08, 4.8)

    def test_review_minutes(self):
        self.assertEqual(100 * 12 - 2 * 420, 360)
        self.assertEqual(60 * 3 + 40 * 12, 660)

    def test_late_arrivals(self):
        self.assertEqual(backlog([60, 60, 60, 480], 210), [0, 0, 0, 270])

    def test_early_arrivals(self):
        self.assertEqual(backlog([480, 60, 60, 60], 210), [270, 120, 0, 0])
