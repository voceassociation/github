"""Synthetic planning and causal timestamp pairing; no ROS dependency."""
import math
import unittest

def attempts(current, target, yield_rate):
    if not 0 < yield_rate <= 1 or min(current,target)<0:raise ValueError('invalid input')
    return math.ceil(max(0,target-current)/yield_rate)

def causal_pair(times, action, tolerance):
    if tolerance<0 or any(b<=a for a,b in zip(times,times[1:])):raise ValueError('invalid timeline')
    valid=[t for t in times if t<=action]
    if not valid or action-valid[-1]>tolerance:return None
    return valid[-1]

class Checks(unittest.TestCase):
    def test_budget(self):self.assertEqual(sum(attempts(n,20,.8) for n in [80,10,10,0]),51)
    def test_no_deficit(self):self.assertEqual(attempts(80,20,.8),0)
    def test_time(self):self.assertEqual(51*90/60+3*15,121.5)
    def test_drift(self):self.assertAlmostEqual(600*50e-6*1000,30)
    def test_future_excluded(self):self.assertEqual(causal_pair([100,108],105,10),100)
    def test_stale(self):self.assertIsNone(causal_pair([100,108],130,10))
    def test_no_past(self):self.assertIsNone(causal_pair([108],105,10))
    def test_invalid(self):
        with self.assertRaises(ValueError):causal_pair([108,100],110,10)
        with self.assertRaises(ValueError):attempts(0,20,0)
    def test_agreement(self):self.assertEqual(16/20,.8)
if __name__=='__main__':unittest.main()
