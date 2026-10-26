import tempfile
import unittest
from pathlib import Path
from concurrent.futures import ThreadPoolExecutor
from threading import Barrier
from transaction_lab import connection, initialize, propose, approve, admit, revoke, dispatch, SimulatedProvider

class Transactions(unittest.TestCase):
    def setUp(self):
        self.tmp = tempfile.TemporaryDirectory()
        self.addCleanup(self.tmp.cleanup)
        self.path = str(Path(self.tmp.name)/'authority.db')
        initialize(self.path)
        with connection(self.path) as db:
            db.execute("INSERT INTO mandate VALUES('A',1,100)")
            db.execute("INSERT INTO mandate VALUES('B',1,100)")
        self.provider = SimulatedProvider(str(Path(self.tmp.name)/'provider.db'))
        self.make('p1')
    def make(self, name, amount=70):
        digest = propose(self.path,name,'A',1,amount,'supplier-7')
        approve(self.path,name,digest)
        return digest
    def scalar(self, sql, path=None):
        with connection(path or self.path) as db:
            return db.execute(sql).fetchone()[0]
    def test_rollback_all_local_writes(self):
        with self.assertRaises(RuntimeError):
            admit(self.path,'A','p1','o1',True)
        self.assertEqual(self.scalar("SELECT budget FROM mandate WHERE tenant='A'"),100)
        for table in ('outbox','admission'):
            self.assertEqual(self.scalar('SELECT count(*) FROM '+table),0)
        self.assertEqual(self.scalar('SELECT consumed FROM approval'),0)
        self.assertEqual(admit(self.path,'A','p1','o1'),'admitted')
    def test_two_connections_compete_for_budget(self):
        self.make('p2')
        barrier = Barrier(2)
        def run(i):
            barrier.wait()
            try:
                return admit(self.path,'A','p'+str(i),'o'+str(i))
            except PermissionError:
                return 'denied'
        with ThreadPoolExecutor(2) as pool:
            results = list(pool.map(run,(1,2)))
        self.assertCountEqual(results,['admitted','denied'])
        self.assertEqual(self.scalar("SELECT budget FROM mandate WHERE tenant='A'"),30)
        self.assertEqual(self.scalar('SELECT count(*) FROM admission'),1)
    def test_scope_and_idempotency(self):
        with self.assertRaises(PermissionError): admit(self.path,'B','p1','o1')
        admit(self.path,'A','p1','o1')
        self.assertEqual(admit(self.path,'A','p1','o1'),'already_admitted')
        with self.assertRaises(PermissionError): admit(self.path,'A','p1','o2')
        self.make('p2',10)
        with self.assertRaises(PermissionError): admit(self.path,'A','p2','o1')
        self.assertEqual(self.scalar("SELECT budget FROM mandate WHERE tenant='A'"),30)
    def test_immutable_and_digest_mismatch(self):
        import sqlite3
        with connection(self.path) as db:
            with self.assertRaises(sqlite3.IntegrityError):
                db.execute("UPDATE proposal SET amount=1 WHERE id='p1'")
        propose(self.path,'p2','A',2,10,'supplier-8')
        with self.assertRaises(PermissionError): approve(self.path,'p2','wrong')
        with self.assertRaises(PermissionError): admit(self.path,'A','p2','o2')
    def test_revocation_before_admission(self):
        revoke(self.path,'A')
        with self.assertRaises(PermissionError): admit(self.path,'A','p1','o1')
    def test_response_lost_then_restart(self):
        admit(self.path,'A','p1','o1')
        with self.assertRaises(TimeoutError): dispatch(self.path,self.provider,'o1',True)
        self.assertEqual(self.scalar('SELECT state FROM outbox'),'pending')
        restarted = SimulatedProvider(self.provider.path)
        dispatch(self.path,restarted,'o1')
        dispatch(self.path,restarted,'o1')
        self.assertEqual(self.scalar('SELECT count(*) FROM effect',restarted.path),1)
        self.assertEqual(self.scalar('SELECT state FROM outbox'),'done')
    def test_revocation_after_commit_policy(self):
        admit(self.path,'A','p1','o1')
        revoke(self.path,'A')
        self.assertEqual(dispatch(self.path,self.provider,'o1'),'done')
    def test_invalid_amount(self):
        for value in (True,0,-1,1.5):
            with self.assertRaises(ValueError): propose(self.path,'bad','A',1,value,'r')

    def test_same_approval_concurrent(self):
        barrier = Barrier(2)
        def run(operation):
            barrier.wait()
            try:
                return admit(self.path,'A','p1',operation)
            except PermissionError:
                return 'denied'
        with ThreadPoolExecutor(2) as pool:
            results = list(pool.map(run,('same-a','same-b')))
        self.assertCountEqual(results,['admitted','denied'])
        self.assertEqual(self.scalar('SELECT count(*) FROM outbox'),1)
        self.assertEqual(self.scalar('SELECT count(*) FROM admission'),1)
        self.assertEqual(self.scalar('SELECT consumed FROM approval'),1)
        self.assertEqual(self.scalar("SELECT budget FROM mandate WHERE tenant='A'"),30)

    def test_exact_budget_concurrent(self):
        self.make('p2',50)
        self.make('p3',50)
        barrier = Barrier(2)
        def run(i):
            barrier.wait()
            return admit(self.path,'A','p'+str(i),'o'+str(i))
        with ThreadPoolExecutor(2) as pool:
            self.assertEqual(list(pool.map(run,(2,3))),['admitted','admitted'])
        self.assertEqual(self.scalar("SELECT budget FROM mandate WHERE tenant='A'"),0)
        self.assertEqual(self.scalar('SELECT count(*) FROM admission'),2)

    def test_failed_admission_trace_rolls_back_outbox(self):
        import sqlite3
        with connection(self.path) as db:
            db.execute("CREATE TRIGGER fail_trace BEFORE INSERT ON admission BEGIN SELECT RAISE(ABORT,'injected trace failure'); END")
        with self.assertRaises(sqlite3.IntegrityError):
            admit(self.path,'A','p1','o1')
        self.assertEqual(self.scalar("SELECT budget FROM mandate WHERE tenant='A'"),100)
        self.assertEqual(self.scalar('SELECT consumed FROM approval'),0)
        for table in ('outbox','admission'):
            self.assertEqual(self.scalar('SELECT count(*) FROM '+table),0)


if __name__ == '__main__': unittest.main()
