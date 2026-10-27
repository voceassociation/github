"""Synthetic registry checks, not a robot or video deduplication test."""
import unittest

def validate(rows):
    episodes, sessions = {}, {}
    for episode, session, partition in rows:
        if not episode or not session or partition not in {'train','validation','test'}:
            raise ValueError('missing identity or invalid partition')
        for registry, key in [(episodes,episode),(sessions,session)]:
            if key in registry and registry[key] != partition:
                raise ValueError('cross-partition identity')
            registry[key] = partition
    return True

def coverage(counts):
    if not counts or any(v is None or v < 0 for v in counts):
        raise ValueError('unknown or invalid counts')
    return sum(v > 0 for v in counts)/len(counts)

def weighted(rates, weights):
    if len(rates)!=len(weights) or not rates or abs(sum(weights)-1)>1e-9:
        raise ValueError('invalid weights')
    if any(r is None or not 0<=r<=1 for r in rates) or any(w<0 for w in weights):
        raise ValueError('invalid rates')
    return sum(r*w for r,w in zip(rates,weights))

class Checks(unittest.TestCase):
    def test_disjoint(self):
        self.assertTrue(validate([('E1','S1','train'),('E2','S2','test')]))
    def test_session_leak(self):
        with self.assertRaises(ValueError):validate([('E1','S1','train'),('E2','S1','test')])
    def test_episode_leak(self):
        with self.assertRaises(ValueError):validate([('E1','S1','train'),('E1','S2','test')])
    def test_missing(self):
        with self.assertRaises(ValueError):validate([('E1','','train')])
    def test_frames_not_episodes(self):
        self.assertEqual(100*20*30,60000)
    def test_coverage(self):
        self.assertEqual(coverage([80,10,10,0]),.75)
    def test_unknown(self):
        with self.assertRaises(ValueError):coverage([80,None])
    def test_weighted(self):
        self.assertAlmostEqual(weighted([.9,.5],[.8,.2]),.82)
        self.assertAlmostEqual(weighted([.9,.5],[.5,.5]),.7)
    def test_missing_rate(self):
        with self.assertRaises(ValueError):weighted([.9,None],[.8,.2])

if __name__=='__main__':unittest.main()
