"""Exact arithmetic for fictional supervision examples, not an efficacy model."""
from fractions import Fraction as F
import unittest

def bad_approved(p,s,c):
    if any(x<0 or x>1 for x in (p,s,c)):raise ValueError('probability')
    bad=p*(1-s);good=(1-p)*c
    return None if bad+good==0 else bad/(bad+good)

class Metrics(unittest.TestCase):
    def test_confusion_matrix(self):
        self.assertEqual(F(6,10),F(3,5));self.assertEqual(F(5,90),F(1,18))
        self.assertEqual(bad_approved(F(1,10),F(3,5),F(85,90)),F(4,89))
        self.assertEqual(F(85+6,100),F(91,100))
    def test_prevalence(self):
        self.assertAlmostEqual(float(bad_approved(F(1,100),F(3,5),F(85,90)))*100,0.426,places=3)
        self.assertAlmostEqual(float(bad_approved(F(3,10),F(3,5),F(85,90)))*100,15.36,places=2)
    def test_no_approvals(self): self.assertIsNone(bad_approved(F(1),F(1),F(1)))
    def test_perfect_detection(self): self.assertEqual(bad_approved(F(1,10),F(1),F(1)),0)
    def test_bad_input(self):
        with self.assertRaises(ValueError):bad_approved(F(2),F(1),F(1))
    def test_capacity(self):
        demand=240*6;available=3*6*60
        self.assertEqual(demand-available,360);self.assertEqual(F(demand-available,6),60)
if __name__=='__main__':unittest.main()
