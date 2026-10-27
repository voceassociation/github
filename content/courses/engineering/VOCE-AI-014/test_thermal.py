"""Synthetic single-node thermal model, not battery safety validation."""
import math
import unittest

def temperature(t,t0,ambient,power,capacity,conductance):
    if t<0 or capacity<=0 or conductance<0:raise ValueError('invalid parameters')
    if conductance==0:return t0+power*t/capacity
    equilibrium=ambient+power/conductance
    return equilibrium+(t0-equilibrium)*math.exp(-t*conductance/capacity)

class Checks(unittest.TestCase):
    def test_initial(self):self.assertEqual(temperature(0,25,25,2000,400000,100),25)
    def test_adiabatic(self):self.assertEqual(temperature(600,25,25,2000,400000,0),28)
    def test_exchange(self):self.assertAlmostEqual(temperature(600,25,25,2000,400000,100),27.7858404715)
    def test_threshold(self):self.assertAlmostEqual(temperature(4000*math.log(2),25,25,2000,400000,100),35)
    def test_environment_heats(self):self.assertGreater(temperature(600,20,30,0,400000,100),20)
    def test_inertia(self):self.assertLess(temperature(600,25,25,2000,800000,100),temperature(600,25,25,2000,400000,100))
    def test_current_square(self):self.assertEqual((0**2+200**2)/2*.05,2*100**2*.05)
    def test_invalid(self):
        with self.assertRaises(ValueError):temperature(600,25,25,2000,0,100)
if __name__=='__main__':unittest.main()
