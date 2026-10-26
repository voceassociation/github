"""Checks the fictional allocation example; no empirical learning claim."""
from fractions import Fraction as F
import unittest
class Allocation(unittest.TestCase):
 def test_remaining_work(self):
  n=[100,40,10];a=[F(4,5),F(1,2),0]
  self.assertEqual([v*(1-r) for v,r in zip(n,a)],[20,20,10])
 def test_case_mix(self):
  self.assertEqual(F(10,50)/F(10,150),3)
 def test_decision_exposure(self):
  remaining=[20,20,10];q=[F(1,2),F(1,4),0]
  m=[[1,1,0,0],[0,1,1,0],[0,0,0,1]]
  e=[sum(remaining[j]*q[j]*m[j][k] for j in range(3)) for k in range(4)]
  self.assertEqual(e,[10,15,5,0])
  targets=[12,15,8,4];self.assertEqual([max(0,t-v) for t,v in zip(targets,e)],[2,0,3,4])
  extra=[2,3,4];final=[e[k]+sum(extra[j]*m[j][k] for j in range(3)) for k in range(4)]
  self.assertEqual(final,[12,20,8,4]);self.assertEqual(sum(extra),9)
 def test_total_automation(self):
  self.assertEqual(100*(1-F(1))*F(1,2),0)
if __name__=='__main__':unittest.main()
