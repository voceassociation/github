"""Synthetic charging balances, network-side powers unless stated otherwise."""
import unittest

def stored(slots,eta):
    if not 0<eta<=1 or any(p<0 or h<0 for p,h in slots):raise ValueError('inputs')
    return eta*sum(p*h for p,h in slots)
def duration(energy,network_kw,eta):
    if energy<0 or network_kw<=0 or not 0<eta<=1:raise ValueError('inputs')
    return energy/(network_kw*eta)
class ChargingTests(unittest.TestCase):
    def test_boundary(self):self.assertEqual(duration(36,10,.9),4)
    def test_taper(self):self.assertEqual(20/40+10/20,1);self.assertEqual(30/1,30)
    def test_slots(self):self.assertEqual(stored([(20,.5),(10,1)],.9),18)
    def test_shared(self):self.assertEqual(stored([(10,2)],.9),18);self.assertAlmostEqual(stored([(18,2)],.9),32.4)
    def test_individual_cap(self):self.assertAlmostEqual(stored([(6,2)],.9),10.8)
    def test_sensitivity(self):self.assertAlmostEqual((duration(18,10,.85)-2)*60,7.0588235294)
    def test_missions(self):self.assertAlmostEqual((duration(46,11,.9)-duration(42,11,.9))*60,24.2424242424)
    def test_invalid(self):
        with self.assertRaises(ValueError):duration(18,0,.9)
        with self.assertRaises(ValueError):stored([(10,-1)],.9)
if __name__=='__main__':unittest.main()
