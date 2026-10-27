import unittest
from fractions import Fraction as F

def classify(complete,verdict,events):
    if verdict not in (None,'success','failure','stop'):raise ValueError('verdict')
    if any(e not in ('setup','teleop','reposition','correction') for e in events):raise ValueError('event')
    if not complete or verdict is None:return 'incomplete'
    if verdict=='stop':return 'stopped'
    if verdict=='failure':return 'failed'
    return 'assisted' if any(e!='setup' for e in events) else 'autonomous'

class EpisodeTests(unittest.TestCase):
    def test_setup(self):self.assertEqual(classify(True,'success',['setup']),'autonomous')
    def test_reposition(self):self.assertEqual(classify(True,'success',['reposition']),'assisted')
    def test_failed_with_help(self):self.assertEqual(classify(True,'failure',['teleop']),'failed')
    def test_stop(self):self.assertEqual(classify(True,'stop',[]),'stopped')
    def test_missing(self):self.assertEqual(classify(False,'success',[]),'incomplete')
    def test_no_verdict(self):self.assertEqual(classify(True,None,[]),'incomplete')
    def test_unknown(self):
        with self.assertRaises(ValueError):classify(True,'success',['other'])
    def test_rates(self):
        self.assertEqual(F(90,100),F(9,10));self.assertAlmostEqual(float(F(22,26)*100),84.6153846)
        self.assertAlmostEqual(float(F(68,90)*100),75.5555556)
    def test_bounds(self):
        self.assertAlmostEqual(float(F(68,105)*100),64.7619048);self.assertAlmostEqual(float(F(73,105)*100),69.5238095)
        self.assertEqual(26*2,52)
if __name__=='__main__':unittest.main()
