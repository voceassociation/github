"""Synthetic energy balances; no hardware control or manufacturer data."""
import unittest

def road_kwh(mass,speed,distance_km,cr=.01,rho=1.2,cda=.7):
    if mass<=0 or speed<0 or distance_km<0:raise ValueError('inputs')
    force=cr*mass*9.81+.5*rho*cda*speed**2
    return force*distance_km*1000/3_600_000

def mission(distance_km,traction_per100,aux_kw,hours):
    if min(distance_km,traction_per100,aux_kw,hours)<0:raise ValueError('inputs')
    return distance_km*traction_per100/100+aux_kw*hours

def available(useful,reserve):
    if useful<=0 or not 0<=reserve<1:raise ValueError('inputs')
    return useful*(1-reserve)

class EnergyTests(unittest.TestCase):
    def test_road72(self):self.assertAlmostEqual(road_kwh(2000,20,100),10.1166666667)
    def test_road108(self):self.assertAlmostEqual(road_kwh(2000,30,100),15.95)
    def test_duration(self):self.assertEqual(mission(200,17,2,4),42);self.assertEqual(mission(200,17,2,6),46)
    def test_range(self):self.assertAlmostEqual(100*available(68,.1)/19,322.1052631579)
    def test_kinetic(self):
        e=.5*2000*20**2/3_600_000
        self.assertAlmostEqual(e,.1111111111);self.assertAlmostEqual((e/.9-.6*e)*50,2.8395061728)
    def test_height(self):self.assertAlmostEqual(2000*9.81*100/3_600_000,.545)
    def test_units(self):self.assertEqual(2*2,4);self.assertEqual(1000*3600,3_600_000)
    def test_invalid(self):
        with self.assertRaises(ValueError):available(68,1)
        with self.assertRaises(ValueError):mission(200,17,2,-1)
if __name__=='__main__':unittest.main()
