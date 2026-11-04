"""Single-reference SQLite admission model; no extraction or payment integration."""
import sqlite3, tempfile, unittest
from pathlib import Path

def admit(c,key,document,docrev,qty,revision,fail=False):
 if type(qty) is not int or qty<=0:raise ValueError('quantity')
 try:
  c.execute('BEGIN IMMEDIATE')
  old=c.execute('SELECT document,docrev,qty FROM admission WHERE id=?',(key,)).fetchone()
  if old:
   if old!=(document,docrev,qty):raise ValueError('key conflict')
   c.commit();return 'replayed'
  if c.execute('SELECT revision FROM document WHERE id=?',(document,)).fetchone()!=(docrev,):raise ValueError('document stale')
  changed=c.execute('UPDATE receipt SET available=available-?, revision=revision+1 WHERE id=1 AND revision=? AND available>=?',(qty,revision,qty)).rowcount
  if changed!=1:raise ValueError('receipt stale or insufficient')
  if fail:raise RuntimeError('injected before journal')
  c.execute('INSERT INTO admission VALUES (?,?,?,?)',(key,document,docrev,qty));c.commit();return 'admitted'
 except Exception:
  if c.in_transaction:c.rollback()
  raise
class AdmissionTests(unittest.TestCase):
 def setUp(self):
  self.tmp=tempfile.TemporaryDirectory();self.path=Path(self.tmp.name)/'db';self.c=sqlite3.connect(self.path,isolation_level=None,timeout=0)
  self.c.executescript('CREATE TABLE document(id TEXT PRIMARY KEY,revision INTEGER);INSERT INTO document VALUES ("D17",1);CREATE TABLE receipt(id INTEGER PRIMARY KEY, available INTEGER CHECK(available>=0),revision INTEGER);INSERT INTO receipt VALUES (1,3,8);CREATE TABLE admission(id TEXT PRIMARY KEY,document TEXT,docrev INTEGER,qty INTEGER);')
 def tearDown(self):self.c.close();self.tmp.cleanup()
 def state(self):return self.c.execute('SELECT available,revision FROM receipt').fetchone(),self.c.execute('SELECT count(*) FROM admission').fetchone()[0]
 def test_success_reopen(self):
  self.assertEqual(admit(self.c,'K','D17',1,3,8),'admitted');other=sqlite3.connect(self.path)
  self.assertEqual(other.execute('SELECT available FROM receipt').fetchone(),(0,));other.close()
 def test_repeat(self):
  admit(self.c,'K','D17',1,3,8);self.assertEqual(admit(self.c,'K','D17',1,3,8),'replayed');self.assertEqual(self.state(),((0,9),1))
 def test_key_conflict(self):
  admit(self.c,'K','D17',1,2,8)
  with self.assertRaisesRegex(ValueError,'key conflict'):admit(self.c,'K','D17',1,1,9)
  self.assertEqual(self.state(),((1,9),1))
 def test_stale_document(self):
  self.c.execute('UPDATE document SET revision=2')
  with self.assertRaisesRegex(ValueError,'document stale'):admit(self.c,'K','D17',1,3,8)
  self.assertEqual(self.state(),((3,8),0))
 def test_stale_ticket(self):
  admit(self.c,'K','D17',1,1,8)
  with self.assertRaisesRegex(ValueError,'receipt stale'):admit(self.c,'L','D17',1,1,8)
  self.assertEqual(self.state(),((2,9),1))
 def test_insufficient(self):
  with self.assertRaises(ValueError):admit(self.c,'K','D17',1,4,8)
  self.assertEqual(self.state(),((3,8),0))
 def test_rollback(self):
  with self.assertRaises(RuntimeError):admit(self.c,'K','D17',1,3,8,True)
  self.assertEqual(self.state(),((3,8),0))
 def test_writer_contention(self):
  other=sqlite3.connect(self.path,isolation_level=None,timeout=0);self.c.execute('BEGIN IMMEDIATE')
  try:
   with self.assertRaises(sqlite3.OperationalError):admit(other,'K','D17',1,3,8)
  finally:other.close();self.c.rollback()
  self.assertEqual(self.state(),((3,8),0))
if __name__=='__main__':unittest.main()
