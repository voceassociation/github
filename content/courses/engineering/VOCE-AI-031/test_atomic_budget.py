"""Local SQLite model: one mission, direct branches, trusted reconciliation inputs."""
import sqlite3,tempfile,unittest
from pathlib import Path

def reserve(c,key,branch,epoch,q,fail=False):
 if type(q) is not int or q<=0:raise ValueError('amount')
 try:
  c.execute('BEGIN IMMEDIATE')
  old=c.execute('SELECT branch,amount,state FROM hold WHERE id=?',(key,)).fetchone()
  if old:
   if old[:2]!=(branch,q):raise ValueError('key conflict')
   c.commit();return old[2] # observation only; never authorizes dispatch
  if c.execute('SELECT active,epoch FROM branch WHERE id=?',(branch,)).fetchone()!=(1,epoch):raise ValueError('authority')
  if c.execute('UPDATE mission SET free=free-? WHERE id=1 AND free>=?',(q,q)).rowcount!=1:raise ValueError('budget')
  if fail:raise RuntimeError('injected')
  c.execute('INSERT INTO hold VALUES (?,?,?,?)',(key,branch,q,'reserved'));c.commit();return 'reserved'
 except Exception:
  if c.in_transaction:c.rollback()
  raise

def settle(c,key,target):
 if target not in {'unknown','spent','released'}:raise ValueError('target')
 try:
  c.execute('BEGIN IMMEDIATE');q,old=c.execute('SELECT amount,state FROM hold WHERE id=?',(key,)).fetchone()
  if old==target:c.commit();return
  if old not in {'reserved','unknown'}:raise ValueError('terminal')
  if target=='released':c.execute('UPDATE mission SET free=free+? WHERE id=1',(q,))
  c.execute('UPDATE hold SET state=? WHERE id=?',(target,key));c.commit()
 except Exception:
  if c.in_transaction:c.rollback()
  raise
class AtomicTests(unittest.TestCase):
 def setUp(self):
  self.tmp=tempfile.TemporaryDirectory();self.path=Path(self.tmp.name)/'db';self.c=sqlite3.connect(self.path,isolation_level=None,timeout=0)
  self.c.executescript('CREATE TABLE mission(id INTEGER PRIMARY KEY,free INTEGER CHECK(free>=0));INSERT INTO mission VALUES(1,100000);CREATE TABLE branch(id TEXT PRIMARY KEY,active INTEGER,epoch INTEGER);INSERT INTO branch VALUES("T",1,1),("H",1,1);CREATE TABLE hold(id TEXT PRIMARY KEY,branch TEXT,amount INTEGER,state TEXT);')
 def tearDown(self):self.c.close();self.tmp.cleanup()
 def free(self):return self.c.execute('SELECT free FROM mission').fetchone()[0]
 def invariant(self):self.assertEqual(100000-self.free(),self.c.execute('SELECT coalesce(sum(amount),0) FROM hold WHERE state<>"released"').fetchone()[0])
 def test_shared_limit(self):
  reserve(self.c,'a','T',1,65000)
  with self.assertRaisesRegex(ValueError,'budget'):reserve(self.c,'b','H',1,50000)
  self.assertEqual(self.free(),35000);self.invariant()
 def test_rollback(self):
  with self.assertRaises(RuntimeError):reserve(self.c,'a','T',1,65000,True)
  self.assertEqual(self.free(),100000);self.invariant()
 def test_repeat(self):reserve(self.c,'a','T',1,65000);reserve(self.c,'a','T',1,65000);self.assertEqual(self.free(),35000);self.invariant()
 def test_conflict(self):
  reserve(self.c,'a','T',1,65000)
  with self.assertRaisesRegex(ValueError,'key conflict'):reserve(self.c,'a','H',1,65000)
  self.invariant()
 def test_revoke_holds_then_settle(self):
  reserve(self.c,'a','T',1,65000);self.c.execute('UPDATE branch SET active=0,epoch=epoch+1 WHERE id="T"');self.assertEqual(self.free(),35000)
  with self.assertRaisesRegex(ValueError,'authority'):reserve(self.c,'b','T',1,1000)
  settle(self.c,'a','spent');self.assertEqual(self.free(),35000);self.invariant()
 def test_old_epoch_after_reactivation(self):
  self.c.execute('UPDATE branch SET epoch=2 WHERE id="T"')
  with self.assertRaisesRegex(ValueError,'authority'):reserve(self.c,'a','T',1,1000)
  reserve(self.c,'b','T',2,1000);self.invariant()
 def test_unknown_release(self):
  reserve(self.c,'a','T',1,65000);settle(self.c,'a','unknown');self.assertEqual(self.free(),35000);settle(self.c,'a','released');settle(self.c,'a','released');self.assertEqual(self.free(),100000);self.invariant()
 def test_contention(self):
  other=sqlite3.connect(self.path,isolation_level=None,timeout=0);self.c.execute('BEGIN IMMEDIATE')
  try:
   with self.assertRaises(sqlite3.OperationalError):reserve(other,'a','T',1,65000)
  finally:other.close();self.c.rollback()
  self.assertEqual(self.free(),100000);self.invariant()
if __name__=='__main__':unittest.main()
