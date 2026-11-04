"""Sequential synthetic model; no authentication, concurrency or provider."""
import unittest

def delegate(parent,child):
 return (child['org']==parent['org'] and child['mission']==parent['mission'] and child['ops']<=parent['ops'] and child['resources']<=parent['resources'] and child['expires']<=parent['expires'])
class Budget:
 def __init__(self,total):self.total=total;self.items={}
 def free(self):return self.total-sum(x[1] for x in self.items.values() if x[2]!='released')
 def reserve(self,key,actor,amount):
  if type(amount) is not int or amount<=0:raise ValueError('amount')
  if key in self.items:
   if self.items[key][:2]!=(actor,amount):raise ValueError('key conflict')
   return self.items[key][2]
  if amount>self.free():raise ValueError('budget')
  self.items[key]=(actor,amount,'reserved');return 'reserved'
 def settle(self,key,state):
  actor,amount,old=self.items[key]
  if old==state:return
  if old not in {'reserved','unknown'} or state not in {'unknown','spent','released'}:raise ValueError('transition')
  self.items[key]=(actor,amount,state)
 def invariant(self):
  spent=sum(v for _,v,s in self.items.values() if s=='spent')
  held=sum(v for _,v,s in self.items.values() if s in {'reserved','unknown'})
  return self.total==spent+held+self.free() and self.free()>=0
class Tests(unittest.TestCase):
 def setUp(self):self.b=Budget(100000);self.p=dict(org='O',mission='M',ops={'read','reserve'},resources={'rail','hotel'},expires=100)
 def child(self,**changes):
  c=dict(org='O',mission='M',ops={'reserve'},resources={'rail'},expires=90);c.update(changes);return c
 def test_attenuation(self):self.assertTrue(delegate(self.p,self.child()))
 def test_expansion(self):self.assertFalse(delegate(self.p,self.child(ops={'pay'})))
 def test_organization(self):self.assertFalse(delegate(self.p,self.child(org='X')))
 def test_expiry(self):self.assertFalse(delegate(self.p,self.child(expires=101)))
 def test_budget_shared(self):
  self.b.reserve('T','transport',65000)
  with self.assertRaisesRegex(ValueError,'budget'):self.b.reserve('H','hotel',50000)
  self.assertEqual(self.b.free(),35000);self.assertTrue(self.b.invariant())
 def test_exact_limit(self):self.b.reserve('T','transport',100000);self.assertEqual(self.b.free(),0)
 def test_retry(self):self.b.reserve('T','transport',65000);self.b.reserve('T','transport',65000);self.assertEqual(self.b.free(),35000)
 def test_key_conflict(self):
  self.b.reserve('T','transport',65000)
  with self.assertRaisesRegex(ValueError,'key conflict'):self.b.reserve('T','transport',60000)
 def test_unknown_holds(self):self.b.reserve('T','transport',65000);self.b.settle('T','unknown');self.assertEqual(self.b.free(),35000);self.assertTrue(self.b.invariant())
 def test_spend_and_release(self):
  self.b.reserve('T','transport',65000);self.b.reserve('H','hotel',30000);self.b.settle('T','spent');self.b.settle('H','released');self.assertEqual(self.b.free(),35000);self.assertTrue(self.b.invariant())
 def test_terminal(self):
  self.b.reserve('T','transport',65000);self.b.settle('T','spent')
  with self.assertRaises(ValueError):self.b.settle('T','released')
 def test_nonpositive(self):
  for x in [0,-1,True,1.5]:
   with self.assertRaises(ValueError):self.b.reserve('T','transport',x)
if __name__=='__main__':unittest.main()
