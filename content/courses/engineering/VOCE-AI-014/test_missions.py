import math
import unittest
from test_thermal import temperature

def cooling(previous,t,low=33,high=35):
    if low>=high:raise ValueError('invalid band')
    if t>=high:return True
    if t<=low:return False
    return previous

class MissionChecks(unittest.TestCase):
    def test_sequence(self):
        t=temperature(1800,25,25,2000,400000,100)
        t=temperature(600,t,25,0,400000,100)
        self.assertAlmostEqual(temperature(1800,t,25,2000,400000,100),36.2249147072)
    def test_periodic(self):
        a,b=math.exp(-.45),math.exp(-.15)
        t=(b*(1-a)*45+(1-b)*25)/(1-a*b)
        self.assertAlmostEqual(temperature(600,temperature(1800,t,25,2000,400000,100),25,0,400000,100),t)
    def test_heating(self):
        duration=4000*math.log(1.5)
        self.assertAlmostEqual(temperature(duration,5,5,3000,400000,100),15)
    def test_delay(self):self.assertAlmostEqual(temperature(600,15,5,0,400000,100),13.6070797643)
    def test_energy_boundary(self):self.assertAlmostEqual(2-1.5/.9,1/3)
    def test_hysteresis(self):
        state=False;actual=[]
        for t in [34,35,34,33,34]:state=cooling(state,t);actual.append(state)
        self.assertEqual(actual,[False,True,True,False,False])
    def test_invalid_band(self):
        with self.assertRaises(ValueError):cooling(False,34,35,33)
if __name__=='__main__':unittest.main()
