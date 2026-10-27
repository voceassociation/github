"""Synthetic design and descriptive arithmetic, not inferential statistics."""
import random,unittest
from collections import Counter
from fractions import Fraction as F

def design(seed):
    rng=random.Random(seed);rows=[]
    for family in ('easy','hard'):
        for session in (1,2,3):
            conditions=['A']*4+['B']*4;rng.shuffle(conditions)
            rows.extend((family,session,i,c) for i,c in enumerate(conditions,1))
    return rows

def standardized(rates,weights):
    if len(rates)!=len(weights) or not rates or sum(weights)!=1 or any(w<0 for w in weights):raise ValueError('weights')
    if any(p<0 or p>1 for p in rates):raise ValueError('rates')
    return sum(p*w for p,w in zip(rates,weights))

class DesignTests(unittest.TestCase):
    def test_coverage(self):
        rows=design(17);self.assertEqual(len(rows),48)
        self.assertEqual(set(Counter((f,s,c) for f,s,i,c in rows).values()),{4})
        self.assertEqual(len({(f,s,i) for f,s,i,c in rows}),48)
    def test_reproducible(self):self.assertEqual(design(17),design(17))
    def test_composition_reversal(self):
        self.assertLess(F(49,110),F(83,110));self.assertGreater(F(9,10),F(80,100));self.assertGreater(F(40,100),F(3,10))
    def test_equal_weights(self):
        self.assertEqual(standardized([F(9,10),F(4,10)],[F(1,2)]*2),F(65,100))
        self.assertEqual(standardized([F(8,10),F(3,10)],[F(1,2)]*2),F(55,100))
    def test_target_weights(self):
        self.assertEqual(standardized([F(9,10),F(4,10)],[F(1,5),F(4,5)]),F(1,2))
    def test_invalid_weights(self):
        with self.assertRaises(ValueError):standardized([F(1,2)],[F(1,2)])
    def test_pairs(self):
        both,sim_only,real_only,neither=12,5,1,2;n=both+sim_only+real_only+neither
        self.assertEqual(F(both+sim_only,n),F(85,100));self.assertEqual(F(both+real_only,n),F(65,100));self.assertEqual(sim_only+real_only,6)
if __name__=='__main__':unittest.main()
