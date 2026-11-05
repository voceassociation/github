"""Collecte d'un seul flux et d'une seule génération. Laboratoire local."""
import sqlite3
import tempfile
import unittest
from pathlib import Path


def collect(db, position, payload):
    with db:
        db.execute("INSERT INTO events VALUES (?, ?) ON CONFLICT(seq) DO NOTHING",
                   (position, payload))
        saved, = db.execute("SELECT payload FROM events WHERE seq=?", (position,)).fetchone()
        if saved != payload:
            raise ValueError("position litigieuse")
    return position


def prefix(db, anchor):
    for seq, in db.execute("SELECT seq FROM events WHERE seq>? ORDER BY seq", (anchor,)):
        if seq != anchor + 1:
            break
        anchor = seq
    return anchor


class CollectionTests(unittest.TestCase):
    def setUp(self):
        directory = tempfile.TemporaryDirectory()
        self.addCleanup(directory.cleanup)
        self.path = Path(directory.name) / "trace.sqlite"
        self.db = sqlite3.connect(self.path)
        self.addCleanup(self.db.close)
        self.db.execute("CREATE TABLE events(seq INTEGER PRIMARY KEY, payload BLOB NOT NULL)")

    def test_gap_survives_duplicate_then_closes(self):
        for n in (411, 413, 414, 413):
            collect(self.db, n, str(n).encode())
        self.assertEqual(prefix(self.db, 410), 411)
        collect(self.db, 412, b"approved 80 EUR")
        self.assertEqual(prefix(self.db, 410), 414)

    def test_conflicting_retry_preserves_first_record(self):
        collect(self.db, 412, b"80 EUR")
        with self.assertRaises(ValueError):
            collect(self.db, 412, b"800 EUR")
        self.assertEqual(self.db.execute("SELECT payload FROM events").fetchall(), [(b"80 EUR",)])

    def test_retry_after_unobserved_receipt(self):
        collect(self.db, 411, b"proposal")
        other = sqlite3.connect(self.path)
        self.addCleanup(other.close)
        self.assertEqual(collect(other, 411, b"proposal"), 411)
        self.assertEqual(other.execute("SELECT count(*) FROM events").fetchone(), (1,))
