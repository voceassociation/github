"""Local SQLite transaction tests; no payment provider integration."""
import sqlite3,tempfile,unittest
from pathlib import Path
class Transactions(unittest.TestCase):
 def setUp(self):
  self.tmp=tempfile.TemporaryDirectory();self.path=str(Path(self.tmp.name)/'lab.db');self.db=sqlite3.connect(self.path,isolation_level=None)
  self.db.executescript('CREATE TABLE payment(id TEXT PRIMARY KEY, paid INTEGER, engaged INTEGER); INSERT INTO payment VALUES("P8",12000,0); CREATE TABLE intent(id TEXT PRIMARY KEY, amount INTEGER, remote_key TEXT, state TEXT);')
 def tearDown(self):self.db.close();self.tmp.cleanup()
 def reserve(self,ident,amount,fail=False):
  if not isinstance(amount,int) or isinstance(amount,bool) or amount<=0:raise ValueError('amount')
  self.db.execute('BEGIN IMMEDIATE')
  try:
   cur=self.db.execute('UPDATE payment SET engaged=engaged+? WHERE id=? AND engaged+?<=paid',(amount,'P8',amount))
   if cur.rowcount!=1:raise ValueError('balance')
   if fail:raise RuntimeError('injected')
   self.db.execute('INSERT INTO intent VALUES(?,?,?,?)',(ident,amount,'key-'+ident,'prepared'));self.db.execute('COMMIT')
  except Exception:self.db.execute('ROLLBACK');raise
 def engaged(self):return self.db.execute('SELECT engaged FROM payment').fetchone()[0]
 def test_ceiling(self):
  self.reserve('R1',7000)
  with self.assertRaisesRegex(ValueError,'balance'):self.reserve('R2',7000)
  self.assertEqual(self.engaged(),7000)
 def test_duplicate_rolls_back(self):
  self.reserve('R1',3000)
  with self.assertRaises(sqlite3.IntegrityError):self.reserve('R1',3000)
  self.assertEqual(self.engaged(),3000)
 def test_injected_failure_rolls_back(self):
  with self.assertRaises(RuntimeError):self.reserve('R1',3000,True)
  self.assertEqual(self.engaged(),0);self.assertEqual(self.db.execute('SELECT count(*) FROM intent').fetchone()[0],0)
 def test_reopen(self):
  self.reserve('R1',3000);self.db.close();self.db=sqlite3.connect(self.path,isolation_level=None)
  self.assertEqual(self.db.execute('SELECT remote_key FROM intent').fetchone()[0],'key-R1');self.assertEqual(self.engaged(),3000)
 def test_two_connections_writer_contention(self):
  second=sqlite3.connect(self.path,timeout=0,isolation_level=None)
  try:
   self.db.execute('BEGIN IMMEDIATE')
   with self.assertRaisesRegex(sqlite3.OperationalError,'locked'):second.execute('BEGIN IMMEDIATE')
   self.db.execute('ROLLBACK');second.execute('BEGIN IMMEDIATE');second.execute('ROLLBACK')
  finally:second.close()
 def test_unknown_keeps_reservation(self):
  self.reserve('R1',3000);self.db.execute('UPDATE intent SET state="unknown" WHERE id="R1"')
  with self.assertRaisesRegex(ValueError,'balance'):self.reserve('R2',10000)
  self.assertEqual(self.engaged(),3000)
if __name__=='__main__':unittest.main()
