"""Single-intention synthetic event oracle, no producer authentication."""
import unittest
from copy import deepcopy
BASE=[dict(id='p',kind='proposal',proposal='P2',amount=8000,currency='EUR'),dict(id='a',kind='authorization',proposal='P2',allow=True),dict(id='h',kind='approval',proposal='P2',allow=True),dict(id='d',kind='dispatch',proposal='P2',authorization='a',approval='h'),dict(id='e',kind='effect',dispatch='d',amount=8000,currency='EUR')]
def check(events):
 byid={}
 for e in events:
  if e['id'] in byid and byid[e['id']]!=e:return 'contradictory'
  byid[e['id']]=e
 groups={k:[e for e in byid.values() if e['kind']==k] for k in ['proposal','authorization','approval','dispatch','effect']}
 if any(len(v)>1 for v in groups.values()):return 'incomplete' # outside single-event profile
 if any(not v for v in groups.values()):return 'incomplete'
 p,a,h,d,e=[groups[k][0] for k in groups]
 if d['authorization'] not in byid or d['approval'] not in byid or e['dispatch'] not in byid:return 'incomplete'
 if d['authorization']!=a['id'] or d['approval']!=h['id'] or e['dispatch']!=d['id']:return 'contradictory'
 if any(x['proposal']!=p['proposal'] for x in [a,h,d]):return 'contradictory'
 if a['allow'] is not True or h['allow'] is not True:return 'contradictory'
 if (e['amount'],e['currency'])!=(p['amount'],p['currency']):return 'contradictory'
 return 'compatible'
class Tests(unittest.TestCase):
 def setUp(self):self.events=deepcopy(BASE)
 def test_valid(self):self.assertEqual(check(self.events),'compatible')
 def test_reordered(self):self.assertEqual(check(self.events[::-1]),'compatible')
 def test_copy(self):self.events.append(deepcopy(self.events[0]));self.assertEqual(check(self.events),'compatible')
 def test_collision(self):x=deepcopy(self.events[0]);x['amount']=9000;self.events.append(x);self.assertEqual(check(self.events),'contradictory')
 def test_amount(self):self.events[-1]['amount']=9000;self.assertEqual(check(self.events),'contradictory')
 def test_currency(self):self.events[-1]['currency']='USD';self.assertEqual(check(self.events),'contradictory')
 def test_wrong_approval(self):self.events[2]['proposal']='P1';self.assertEqual(check(self.events),'contradictory')
 def test_missing(self):del self.events[1];self.assertEqual(check(self.events),'incomplete')
 def test_unknown_parent(self):self.events[3]['authorization']='missing';self.assertEqual(check(self.events),'incomplete')
 def test_denied(self):self.events[1]['allow']=False;self.assertEqual(check(self.events),'contradictory')
 def test_wrong_parent_kind(self):self.events[3]['authorization']='h';self.assertEqual(check(self.events),'contradictory')
if __name__=='__main__':unittest.main()
