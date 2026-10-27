"""Synthetic proof classifier. Evidence authenticity is an input assumption."""
import unittest

def classify(intent, evidence):
    verdicts=set()
    for e in evidence:
        if e['intent'] != intent['id']: continue
        if e['parameters'] != intent['parameters']: return 'conflict'
        if not e['terminal']: continue
        if e['status']=='applied': verdicts.add('applied')
        elif e['status']=='absent' and e['closed']: verdicts.add('not_applied')
        elif e['status'] not in ('absent','accepted'): raise ValueError('unknown status')
    if len(verdicts)>1:return 'conflict'
    return next(iter(verdicts),'unknown')

class ReconcileTests(unittest.TestCase):
    def setUp(self):self.i={'id':'I17','parameters':'R17:B:v4'}
    def proof(self,status='applied',terminal=True,closed=True):
        return dict(intent='I17',parameters='R17:B:v4',status=status,terminal=terminal,closed=closed)
    def test_applied(self):self.assertEqual(classify(self.i,[self.proof()]),'applied')
    def test_timeout(self):self.assertEqual(classify(self.i,[]),'unknown')
    def test_nonterminal(self):self.assertEqual(classify(self.i,[self.proof('accepted',False)]),'unknown')
    def test_absent_unclosed(self):self.assertEqual(classify(self.i,[self.proof('absent',True,False)]),'unknown')
    def test_absent_closed(self):self.assertEqual(classify(self.i,[self.proof('absent')]),'not_applied')
    def test_contradictory(self):self.assertEqual(classify(self.i,[self.proof(),self.proof('absent')]),'conflict')
    def test_parameters(self):
        e=self.proof();e['parameters']='R17:C:v4';self.assertEqual(classify(self.i,[e]),'conflict')
    def test_unrelated_provenance(self):
        e=self.proof();e['intent']='OTHER';self.assertEqual(classify(self.i,[e]),'unknown')
    def test_duplicate_evidence(self):self.assertEqual(classify(self.i,[self.proof(),self.proof()]),'applied')
    def test_batch(self):
        from collections import Counter
        evidence=[[self.proof()]]*31+[[self.proof('absent')]]*7+[[]]*2
        self.assertEqual(Counter(classify(self.i,e) for e in evidence),dict(applied=31,not_applied=7,unknown=2))
if __name__=='__main__':unittest.main()
