import tempfile
import unittest
from concurrent.futures import ThreadPoolExecutor
from lab import RefundService, Conflict, transaction

class ServiceTests(unittest.TestCase):
    def setUp(self):
        self.tmp=tempfile.TemporaryDirectory();self.addCleanup(self.tmp.cleanup)
        self.s=RefundService(self.tmp.name);self.s.add_booking('B1',8000)
    def test_duplicate_admission(self):
        with ThreadPoolExecutor(max_workers=8) as pool:
            rows=list(pool.map(lambda _:self.s.admit('I1','B1',8000),range(16)))
        self.assertEqual({r['id'] for r in rows},{'I1'})
        with transaction(self.s.local) as db:
            self.assertEqual(db.execute('SELECT allocated FROM booking').fetchone()[0],8000)
    def test_changed_command_rejected(self):
        self.s.admit('I1','B1',8000)
        with self.assertRaises(Conflict):self.s.admit('I1','B1',7000)
    def test_budget_under_concurrency(self):
        def reserve(i):
            try:self.s.admit('I'+str(i),'B1',5000);return True
            except Conflict:return False
        with ThreadPoolExecutor(max_workers=2) as pool:
            self.assertEqual(sum(pool.map(reserve,range(2))),1)
    def test_lost_reply_then_reconcile_after_restart(self):
        self.s.admit('I1','B1',8000)
        with self.assertRaises(RuntimeError):self.s.dispatch('I1',crash='after_provider')
        self.assertEqual(self.s.get('I1')['state'],'unknown')
        fresh=RefundService(self.tmp.name)
        self.assertEqual(fresh.reconcile('I1')['state'],'confirmed')
        self.assertEqual(len(fresh.effects()),1)
    def test_repeat_dispatch_keeps_one_effect(self):
        self.s.admit('I1','B1',8000)
        with self.assertRaises(RuntimeError):self.s.dispatch('I1',crash='after_provider')
        with ThreadPoolExecutor(max_workers=4) as pool:
            list(pool.map(lambda _:self.s.dispatch('I1'),range(8)))
        self.assertEqual(len(self.s.effects()),1)
        with transaction(self.s.local) as db:
            n=db.execute("SELECT COUNT(*) FROM event WHERE kind='confirmed'").fetchone()[0]
            self.assertEqual(n,1)
    def test_crash_before_effect_does_not_release_budget(self):
        self.s.admit('I1','B1',8000)
        with self.assertRaises(RuntimeError):self.s.dispatch('I1',crash='before_provider')
        self.assertEqual(self.s.reconcile('I1')['state'],'unknown')
        with self.assertRaises(Conflict):self.s.admit('I2','B1',8000)
        self.assertEqual(self.s.dispatch('I1')['state'],'confirmed')
    def test_invalid_amounts(self):
        for x in [True,0,-1,1.5,'8000']:
            with self.assertRaises(ValueError):self.s.admit('I1','B1',x)
    def test_foreign_receipt(self):
        self.s.admit('I1','B1',8000)
        with self.assertRaises(Conflict):self.s._confirm('I1',{'id':'I2','digest':'x','amount':8000,'receipt':'R'})
        self.assertEqual(self.s.get('I1')['state'],'ready')
    def test_transaction_rolls_back_on_duplicate_id(self):
        self.s.admit('I1','B1',1000)
        with self.assertRaises(Exception):
            with transaction(self.s.local) as db:
                db.execute('UPDATE booking SET allocated=allocated+1000')
                db.execute("INSERT INTO intention VALUES ('I1','B1',1000,'x','ready',NULL)")
        with transaction(self.s.local) as db:
            self.assertEqual(db.execute('SELECT allocated FROM booking').fetchone()[0],1000)

if __name__=='__main__':unittest.main()
