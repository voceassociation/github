"""Synthetic admission/selection predicates; no semantic validation or LLM."""
import unittest
from copy import deepcopy

def admit(m):
 return (m['kind'] in {'observation','preference'} and bool(m['source']) and bool(m['source_rev']) and m['created']<m['expires'] and (m['kind']!='preference' or m['confirmed'] is True))
def eligible(m,org,owner,purpose,now,revisions):
 return (admit(m) and m['active'] and m['org']==org and m['owner']==owner and m['purpose']==purpose and m['created']<=now<m['expires'] and revisions.get(m['source'])==m['source_rev'])
BASE=dict(kind='observation',source='doc42',source_rev=3,created=10,expires=20,confirmed=False,active=True,org='A',owner='U',purpose='maintenance',score=1.0,text='Observation externe limitée au dossier')
class Tests(unittest.TestCase):
 def setUp(self):self.m=deepcopy(BASE)
 def read(self,now=15,rev=3):return eligible(self.m,'A','U','maintenance',now,{'doc42':rev})
 def test_valid(self):self.assertTrue(self.read())
 def test_provenance(self):self.m['source']='';self.assertFalse(admit(self.m))
 def test_preference_confirmation(self):self.m['kind']='preference';self.assertFalse(admit(self.m));self.m['confirmed']=True;self.assertTrue(admit(self.m))
 def test_authority_type(self):self.m['kind']='authorization';self.assertFalse(admit(self.m))
 def test_interval(self):self.m['expires']=10;self.assertFalse(admit(self.m))
 def test_start(self):self.assertFalse(self.read(9));self.assertTrue(self.read(10))
 def test_expiration(self):self.assertTrue(self.read(19));self.assertFalse(self.read(20))
 def test_cross_org_high_score(self):self.m['org']='B';self.m['score']=999;self.assertFalse(self.read())
 def test_owner(self):self.m['owner']='V';self.assertFalse(self.read())
 def test_purpose(self):self.m['purpose']='evaluation';self.assertFalse(self.read())
 def test_withdrawal(self):self.m['active']=False;self.assertFalse(self.read())
 def test_revision(self):self.assertFalse(self.read(rev=4))
 def test_read_does_not_renew(self):old=deepcopy(self.m);self.read();self.assertEqual(old,self.m)
if __name__=='__main__':unittest.main()
