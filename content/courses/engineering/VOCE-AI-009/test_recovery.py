"""Sequential model; atomic destination checks and trusted actor labels assumed."""
import unittest
class Registry:
    def __init__(self):
        self.mode='normal';self.epoch=7;self.version=4;self.value='A'
    def freeze(self):
        if self.mode!='normal':raise ValueError('mode')
        self.mode='manual';self.epoch+=1
    def reconcile(self):
        if self.mode!='manual':raise ValueError('mode')
        self.mode='reconciling';self.epoch+=1
    def resume(self,closed,reconciled):
        if self.mode!='reconciling' or not closed or not reconciled:return False
        self.mode='normal';self.epoch+=1;return True
    def write(self,actor,epoch,version,value):
        expected={'normal':'automatic','manual':'operator'}.get(self.mode)
        if expected is None or actor!=expected or epoch!=self.epoch or version!=self.version:return False
        self.value=value;self.version+=1;return True
class RecoveryTests(unittest.TestCase):
    def test_late_automatic(self):
        r=Registry();r.freeze();self.assertTrue(r.write('operator',8,4,'C'))
        self.assertFalse(r.write('automatic',7,4,'B'));self.assertEqual((r.value,r.version),('C',5))
    def test_manual_closed(self):
        r=Registry();r.freeze();r.reconcile();self.assertFalse(r.write('operator',8,4,'C'));self.assertEqual(r.value,'A')
    def test_stale_business_version(self):
        r=Registry();r.freeze();r.write('operator',8,4,'C');r.reconcile();r.resume(True,True)
        self.assertFalse(r.write('automatic',10,4,'B'));self.assertEqual(r.value,'C')
        self.assertTrue(r.write('automatic',10,5,'D'));self.assertEqual((r.value,r.version),('D',6))
    def test_resume_conditions(self):
        for closed,reconciled in [(False,False),(True,False),(False,True)]:
            r=Registry();r.freeze();r.reconcile();self.assertFalse(r.resume(closed,reconciled));self.assertEqual(r.mode,'reconciling')
    def test_wrong_actor_current_epoch(self):
        r=Registry();r.freeze();self.assertFalse(r.write('automatic',8,4,'B'));self.assertEqual(r.value,'A')
    def test_invalid_transition(self):
        with self.assertRaises(ValueError):Registry().reconcile()
    def test_positive_normal(self):
        r=Registry();self.assertTrue(r.write('automatic',7,4,'B'));self.assertEqual(r.version,5)
if __name__=='__main__':unittest.main()
