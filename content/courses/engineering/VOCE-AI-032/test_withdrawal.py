"""Local SQLite lifecycle, single-parent publication, synthetic payloads."""
import sqlite3,tempfile,unittest
from pathlib import Path

def publish(c,child,parent,revision):
 try:
  c.execute('BEGIN IMMEDIATE')
  if c.execute('SELECT active,revision FROM memory WHERE id=?',(parent,)).fetchone()!=(1,revision):raise ValueError('stale parent')
  c.execute('INSERT INTO memory VALUES (?,1,1)',(child,));c.execute('INSERT INTO edge VALUES (?,?)',(parent,child));c.commit()
 except Exception:
  if c.in_transaction:c.rollback()
  raise

def withdraw(c,root,fail=False):
 try:
  c.execute('BEGIN IMMEDIATE');todo=[root];seen=set()
  while todo:
   node=todo.pop()
   if node in seen:continue
   seen.add(node);todo.extend(r[0] for r in c.execute('SELECT child FROM edge WHERE parent=?',(node,)))
   c.execute('UPDATE memory SET active=0,revision=revision+1 WHERE id=? AND active=1',(node,))
  if fail:raise RuntimeError('injected')
  c.commit()
 except Exception:
  if c.in_transaction:c.rollback()
  raise
class LifecycleTests(unittest.TestCase):
 def setUp(self):
  self.tmp=tempfile.TemporaryDirectory();self.path=Path(self.tmp.name)/'db';self.c=sqlite3.connect(self.path,isolation_level=None,timeout=0)
  self.c.execute('PRAGMA journal_mode=WAL');self.c.executescript('CREATE TABLE memory(id TEXT PRIMARY KEY,active INTEGER,revision INTEGER);CREATE TABLE edge(parent TEXT,child TEXT,PRIMARY KEY(parent,child));INSERT INTO memory VALUES("m",1,4);')
 def tearDown(self):self.c.close();self.tmp.cleanup()
 def test_publish(self):publish(self.c,'d','m',4);self.assertEqual(self.c.execute('SELECT count(*) FROM edge').fetchone(),(1,))
 def test_late_publish(self):
  withdraw(self.c,'m')
  with self.assertRaisesRegex(ValueError,'stale'):publish(self.c,'d','m',4)
  self.assertEqual(self.c.execute('SELECT count(*) FROM memory').fetchone(),(1,))
 def test_revision(self):
  self.c.execute('UPDATE memory SET revision=5')
  with self.assertRaises(ValueError):publish(self.c,'d','m',4)
 def test_transitive(self):
  publish(self.c,'d','m',4);publish(self.c,'e','d',1);withdraw(self.c,'m');self.assertEqual(self.c.execute('SELECT sum(active) FROM memory').fetchone(),(0,))
 def test_rollback(self):
  publish(self.c,'d','m',4)
  with self.assertRaises(RuntimeError):withdraw(self.c,'m',True)
  self.assertEqual(self.c.execute('SELECT sum(active) FROM memory').fetchone(),(2,))
 def test_repeat(self):withdraw(self.c,'m');withdraw(self.c,'m');self.assertEqual(self.c.execute('SELECT revision FROM memory').fetchone(),(5,))
 def test_snapshot(self):
  reader=sqlite3.connect(self.path,isolation_level=None,timeout=0)
  try:
   reader.execute('BEGIN');self.assertEqual(reader.execute('SELECT active FROM memory').fetchone(),(1,));withdraw(self.c,'m')
   self.assertEqual(reader.execute('SELECT active FROM memory').fetchone(),(1,));reader.commit();self.assertEqual(reader.execute('SELECT active FROM memory').fetchone(),(0,))
  finally:reader.close()
if __name__=='__main__':unittest.main()
