"""Local ordered-log model: coherent snapshot and contiguous sequence assumed."""
import copy,unittest
class Replica:
    def __init__(self):
        self.cursor=100;self.seen={}
        self.docs={'D1':dict(version=1,text='budget initial',teams=['sales'],deleted=False),'D2':dict(version=1,text='budget recherche',teams=['sales'],deleted=False)}
    def apply(self,seq,doc,expected,new):
        payload=(doc,expected,copy.deepcopy(new))
        if seq in self.seen:
            if self.seen[seq]!=payload:raise ValueError('conflicting duplicate')
            return False
        if seq!=self.cursor+1:raise ValueError('sequence')
        if self.docs[doc]['version']!=expected or new['version']!=expected+1:raise ValueError('version')
        self.docs[doc]=copy.deepcopy(new);self.seen[seq]=payload;self.cursor=seq;return True
    def search(self,term,team):
        return sorted(k for k,v in self.docs.items() if not v['deleted'] and team in v['teams'] and term.lower() in v['text'].lower().split())
def metrics(relevant,returned):
    hit=len(relevant & returned)
    return (hit/len(returned) if returned else None,hit/len(relevant) if relevant else None)
class SyncTests(unittest.TestCase):
    def update(self):return dict(version=2,text='prévision finale',teams=['sales'],deleted=False)
    def test_trace(self):
        r=Replica();r.apply(101,'D1',1,self.update());r.apply(102,'D2',1,dict(version=2,text='budget recherche',teams=['research'],deleted=False))
        self.assertEqual(r.search('budget','sales'),[]);self.assertEqual(r.search('budget','research'),['D2'])
        r.apply(103,'D2',2,dict(version=3,text='',teams=['research'],deleted=True));self.assertEqual(r.search('budget','research'),[])
        with self.assertRaises(ValueError):r.apply(104,'D1',1,self.update())
        self.assertEqual(r.cursor,103);self.assertEqual(r.docs['D1']['version'],2)
    def test_duplicate(self):
        r=Replica();r.apply(101,'D1',1,self.update());self.assertFalse(r.apply(101,'D1',1,self.update()));self.assertEqual(r.cursor,101)
    def test_conflicting_duplicate(self):
        r=Replica();r.apply(101,'D1',1,self.update())
        with self.assertRaises(ValueError):r.apply(101,'D1',1,self.update()|{'text':'autre'})
    def test_gap(self):
        r=Replica()
        with self.assertRaises(ValueError):r.apply(102,'D1',1,self.update())
        self.assertEqual(r.cursor,100);self.assertEqual(r.docs['D1']['version'],1)
    def test_input_is_copied(self):
        r=Replica();v=self.update();r.apply(101,'D1',1,v);v['teams'].clear();self.assertEqual(r.search('finale','sales'),['D1'])
    def test_metrics(self):
        self.assertEqual(metrics({1,4,7},{1,4,9}),(2/3,2/3));self.assertEqual(metrics({1,4,7},{1}),(1,1/3))
    def test_empty_results(self):self.assertEqual(metrics({1},set()),(None,0))
if __name__=='__main__':unittest.main()
