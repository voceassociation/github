from decimal import Decimal as D
import unittest

def reconcile(a,b,factor):
    if factor <= 0: raise ValueError('factor')
    if len(dict(a)) != len(a) or len(dict(b)) != len(b): raise ValueError('duplicate')
    if set(dict(a)) != set(dict(b)): raise ValueError('keys')
    av,bv=dict(a),dict(b)
    return {k:D(bv[k])-D(av[k])/D(factor) for k in sorted(av)}

class Reconciliation(unittest.TestCase):
    def test_compensated_errors(self):
        r=reconcile([('C1','12500'),('C2','7500'),('C3','10000')],[('C1','125.00'),('C2','70.00'),('C3','105.00')],100)
        self.assertEqual(r,{'C1':D(0),'C2':D(-5),'C3':D(5)})
        self.assertEqual(sum(r.values()),0)
    def test_reordered_transfer(self):
        self.assertEqual(reconcile([('T1','120000'),('T2','90000'),('T3','30000')],[('T3','30'),('T1','120'),('T2','90')],1000),dict.fromkeys(['T1','T2','T3'],D(0)))
    def test_missing_key(self):
        with self.assertRaisesRegex(ValueError,'keys'):reconcile([('T1','1000')],[],1000)
    def test_duplicate(self):
        for a,b in [([('x','1'),('x','2')],[('x','1')]),([('x','1')],[('x','1'),('x','2')])]:
            with self.assertRaisesRegex(ValueError,'duplicate'):reconcile(a,b,1)
    def test_factor(self):
        for f in [0,-1]:
            with self.assertRaisesRegex(ValueError,'factor'):reconcile([],[],f)
if __name__=='__main__':unittest.main()
