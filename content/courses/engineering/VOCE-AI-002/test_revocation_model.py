"""Logical-clock counterexamples and bounds; no network/OAuth integration."""
import unittest
from dataclasses import dataclass

@dataclass
class Replica:
    revoked_at: float = 0
    delay: float = 4
    available: bool = True
    def read(self, now):
        if not self.available:
            raise ConnectionError('Authority unavailable')
        return now < self.revoked_at + self.delay

@dataclass
class FixedCache:
    ttl: float = 20
    expires: float = float('-inf')
    decision: bool = False
    last_time: float = float('-inf')
    def check(self, now, replica):
        if now < self.last_time:
            raise ValueError('Logical clock must not go backwards')
        self.last_time = now
        if now >= self.expires:
            self.decision = replica.read(now)
            self.expires = now + self.ttl
        return self.decision

@dataclass
class VersionedMandate:
    version: int = 0
    active: bool = False
    def apply(self, version, active):
        if version > self.version:
            self.version, self.active = version, active

class RevocationTests(unittest.TestCase):
    def test_replica_then_cache_delays_accumulate(self):
        r,c=Replica(),FixedCache()
        self.assertTrue(c.check(3.999,r))
        self.assertTrue(c.check(23.998,r))
        self.assertFalse(c.check(24,r))
        self.assertEqual(4+20+2+1,27)

    def test_hits_do_not_extend_expiration(self):
        r,c=Replica(),FixedCache()
        self.assertTrue(c.check(0,r))
        for t in range(1,20):
            self.assertTrue(c.check(t,r))
            self.assertEqual(c.expires,20)
        self.assertFalse(c.check(20,r))

    def test_old_event_cannot_resurrect(self):
        m=VersionedMandate()
        m.apply(7,True);m.apply(8,False);m.apply(7,True)
        self.assertEqual((m.version,m.active),(8,False))
        m.apply(8,True)
        self.assertFalse(m.active)

    def test_outage_does_not_create_allow(self):
        r,c=Replica(),FixedCache()
        self.assertTrue(c.check(0,r))
        r.available=False
        self.assertTrue(c.check(19,r))
        with self.assertRaises(ConnectionError):
            c.check(20,r)
        self.assertEqual(c.expires,20)

    def test_clock_regression_is_rejected(self):
        c=FixedCache();r=Replica()
        c.check(3,r)
        with self.assertRaises(ValueError):
            c.check(2,r)

if __name__ == '__main__':
    unittest.main()
