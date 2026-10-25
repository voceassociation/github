"""VOCE-AI-001: local simulator, no network or money. Python standard library.
The provider is a second SQLite database, outside the service transaction.
Its durable idempotency contract is an explicit assumption of this exercise.
"""
import hashlib
import json
import sqlite3
from contextlib import contextmanager
from pathlib import Path

@contextmanager
def transaction(path):
    db = sqlite3.connect(path, isolation_level=None, timeout=10)
    db.row_factory = sqlite3.Row
    try:
        db.execute('PRAGMA foreign_keys=ON')
        db.execute('BEGIN IMMEDIATE')
        yield db
        db.commit()
    except BaseException:
        db.rollback()
        raise
    finally:
        db.close()

class Conflict(ValueError):
    pass

class RefundService:
    def __init__(self, folder):
        folder = Path(folder)
        folder.mkdir(parents=True, exist_ok=True)
        self.local = folder / 'service.sqlite'
        self.provider = folder / 'provider.sqlite'
        with transaction(self.local) as db:
            db.execute('CREATE TABLE IF NOT EXISTS booking (id TEXT PRIMARY KEY, cap INTEGER NOT NULL CHECK(cap >= 0), allocated INTEGER NOT NULL DEFAULT 0 CHECK(allocated >= 0 AND allocated <= cap))')
            db.execute("CREATE TABLE IF NOT EXISTS intention (id TEXT PRIMARY KEY, booking TEXT NOT NULL REFERENCES booking(id), amount INTEGER NOT NULL CHECK(amount > 0), digest TEXT NOT NULL, state TEXT NOT NULL CHECK(state IN ('ready','unknown','confirmed')), receipt TEXT)")
            db.execute('CREATE TABLE IF NOT EXISTS event (id INTEGER PRIMARY KEY, intention TEXT NOT NULL REFERENCES intention(id), kind TEXT NOT NULL)')
        with transaction(self.provider) as db:
            db.execute('CREATE TABLE IF NOT EXISTS effect (id TEXT PRIMARY KEY, digest TEXT NOT NULL, amount INTEGER NOT NULL, receipt TEXT NOT NULL UNIQUE)')

    def add_booking(self, booking, cap):
        if type(cap) is not int or cap < 0:
            raise ValueError('cap must be integer cents')
        with transaction(self.local) as db:
            db.execute('INSERT INTO booking(id,cap) VALUES (?,?)', (booking,cap))

    def admit(self, intent, booking, amount):
        if not all(type(v) is str and v.strip() for v in (intent,booking)):
            raise ValueError('non-empty identifiers required')
        if type(amount) is not int or amount <= 0:
            raise ValueError('amount must be positive integer cents')
        # Server-side trusted fixture: identity/authorization is NOT implemented.
        payload = json.dumps({'booking':booking,'amount':amount,'currency':'EUR'},sort_keys=True,separators=(',',':'))
        digest = hashlib.sha256(payload.encode()).hexdigest()
        with transaction(self.local) as db:
            old = db.execute('SELECT * FROM intention WHERE id=?',(intent,)).fetchone()
            if old:
                if old['digest'] != digest:
                    raise Conflict('same intention, different command')
                return dict(old)
            changed = db.execute('UPDATE booking SET allocated=allocated+? WHERE id=? AND allocated+?<=cap',(amount,booking,amount)).rowcount
            if changed != 1:
                raise Conflict('unknown booking or insufficient capacity')
            db.execute("INSERT INTO intention VALUES (?,?,?,?,'ready',NULL)",(intent,booking,amount,digest))
            db.execute("INSERT INTO event(intention,kind) VALUES (?,'admitted')",(intent,))
        return self.get(intent)

    def get(self, intent):
        with transaction(self.local) as db:
            row=db.execute('SELECT * FROM intention WHERE id=?',(intent,)).fetchone()
            if row is None: raise KeyError(intent)
            return dict(row)

    def _provider_effect(self, command):
        with transaction(self.provider) as db:
            old=db.execute('SELECT * FROM effect WHERE id=?',(command['id'],)).fetchone()
            if old:
                if old['digest'] != command['digest']:
                    raise Conflict('provider command conflict')
                return dict(old)
            receipt='R-'+command['id']
            db.execute('INSERT INTO effect VALUES (?,?,?,?)',(command['id'],command['digest'],command['amount'],receipt))
            return dict(db.execute('SELECT * FROM effect WHERE id=?',(command['id'],)).fetchone())

    def dispatch(self, intent, crash=None):
        with transaction(self.local) as db:
            command=db.execute('SELECT * FROM intention WHERE id=?',(intent,)).fetchone()
            if command is None: raise KeyError(intent)
            if command['state']=='confirmed': return dict(command)
            db.execute("UPDATE intention SET state='unknown' WHERE id=?",(intent,))
            db.execute("INSERT INTO event(intention,kind) VALUES (?,'dispatch_started')",(intent,))
            command=dict(command)
        if crash=='before_provider': raise RuntimeError('injected crash before provider')
        effect=self._provider_effect(command)
        if crash=='after_provider': raise RuntimeError('injected crash after provider commit')
        return self._confirm(intent,effect)

    def _confirm(self, intent, effect):
        with transaction(self.local) as db:
            command=db.execute('SELECT * FROM intention WHERE id=?',(intent,)).fetchone()
            if command is None: raise KeyError(intent)
            if (effect['id'],effect['digest'],effect['amount']) != (intent,command['digest'],command['amount']):
                raise Conflict('receipt does not match command')
            if command['state']!='confirmed':
                db.execute("UPDATE intention SET state='confirmed',receipt=? WHERE id=?",(effect['receipt'],intent))
                db.execute("INSERT INTO event(intention,kind) VALUES (?,'confirmed')",(intent,))
        return self.get(intent)

    def reconcile(self, intent):
        with transaction(self.provider) as db:
            row=db.execute('SELECT * FROM effect WHERE id=?',(intent,)).fetchone()
            effect=dict(row) if row else None
        return self._confirm(intent,effect) if effect else self.get(intent)

    def effects(self):
        with transaction(self.provider) as db:
            return [dict(row) for row in db.execute('SELECT * FROM effect ORDER BY id')]
