"""Synthetic local models: no human-performance or distributed-system claim."""
import unittest
from dataclasses import dataclass

@dataclass
class Dossier:
    amount: int = 12000
    proposed: int = 18000
    version: int = 1
    state: str = 'pending'
    approved_version: int | None = None
    def revise(self, proposed):
        if self.state == 'applied': raise ValueError('already applied')
        self.proposed=proposed; self.version+=1
        self.state='pending'; self.approved_version=None
    def decide(self, action, version):
        if action not in ('approve','reject','request'): raise ValueError('action')
        if version != self.version or self.state != 'pending': return False
        if action == 'approve':
            self.state='approved';self.approved_version=version
        elif action == 'reject': self.state='rejected'
        return True
    def execute(self):
        if self.state != 'approved' or self.approved_version != self.version: return False
        self.amount=self.proposed;self.state='applied';return True

def schedule(rows):
    end=0;previous=-1;out=[]
    for arrival,duration in rows:
        if arrival < previous or arrival < 0 or duration < 0: raise ValueError('time')
        start=max(arrival,end);end=start+duration
        out.append((start,end,start-arrival));previous=arrival
    return out

class ReviewTests(unittest.TestCase):
    def test_refusal_and_retry(self):
        d=Dossier();self.assertTrue(d.decide('reject',1))
        self.assertFalse(d.execute());self.assertFalse(d.execute());self.assertEqual(d.amount,12000)
        self.assertFalse(d.decide('approve',1))
    def test_positive_and_duplicate(self):
        d=Dossier();d.decide('approve',1);self.assertTrue(d.execute());self.assertFalse(d.execute());self.assertEqual(d.amount,18000)
    def test_request_pending(self):
        d=Dossier();d.decide('request',1);self.assertFalse(d.execute());self.assertEqual(d.amount,12000)
    def test_stale_decision(self):
        d=Dossier();d.revise(19000);self.assertFalse(d.decide('approve',1));self.assertFalse(d.execute())
        self.assertTrue(d.decide('approve',2));self.assertTrue(d.execute());self.assertEqual(d.amount,19000)
    def test_revision_invalidates_approval(self):
        d=Dossier();d.decide('approve',1);d.revise(19000);self.assertFalse(d.execute())
    def test_grouped(self): self.assertEqual(schedule([(0,6)]*3),[(0,6,0),(6,12,6),(12,18,12)])
    def test_spread(self): self.assertEqual(schedule([(0,6),(6,6),(12,6)]),[(0,6,0),(6,12,0),(12,18,0)])
    def test_long_first(self): self.assertEqual(schedule([(0,30),(0,2)])[-1],(30,32,30))
    def test_invalid_time(self):
        for rows in [[(0,-1)],[(2,1),(1,1)],[(-1,1)]]:
            with self.assertRaises(ValueError):schedule(rows)
    def test_empty(self): self.assertEqual(schedule([]),[])
if __name__=='__main__':unittest.main()
