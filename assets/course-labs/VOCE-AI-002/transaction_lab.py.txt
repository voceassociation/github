"""Teaching model: trusted caller, local SQLite admission, simulated provider.
Not an IAM service. No OAuth, wall-clock expiry, hostile database access or HTTP.
"""
import hashlib
import json
import sqlite3
from contextlib import contextmanager

@contextmanager
def connection(path):
    db = sqlite3.connect(path, isolation_level=None, timeout=5)
    db.execute('PRAGMA foreign_keys=ON')
    try:
        yield db
    finally:
        db.close()

@contextmanager
def transaction(db):
    db.execute('BEGIN IMMEDIATE')
    try:
        yield
        db.execute('COMMIT')
    except BaseException:
        if db.in_transaction:
            db.execute('ROLLBACK')
        raise

def initialize(path):
    with connection(path) as db:
        db.executescript('''
        CREATE TABLE mandate(tenant TEXT PRIMARY KEY, active INTEGER NOT NULL,
                             budget INTEGER NOT NULL CHECK(budget>=0));
        CREATE TABLE proposal(id TEXT PRIMARY KEY, tenant TEXT NOT NULL REFERENCES mandate,
          version INTEGER NOT NULL, amount INTEGER NOT NULL CHECK(amount>0),
          recipient TEXT NOT NULL, digest TEXT NOT NULL);
        CREATE TRIGGER immutable_proposal BEFORE UPDATE ON proposal
          BEGIN SELECT RAISE(ABORT,'immutable proposal'); END;
        CREATE TRIGGER no_delete_proposal BEFORE DELETE ON proposal
          BEGIN SELECT RAISE(ABORT,'immutable proposal'); END;
        CREATE TABLE approval(proposal TEXT PRIMARY KEY REFERENCES proposal,
          digest TEXT NOT NULL, consumed INTEGER NOT NULL DEFAULT 0);
        CREATE TABLE outbox(operation TEXT PRIMARY KEY, proposal TEXT UNIQUE NOT NULL REFERENCES proposal,
          state TEXT NOT NULL CHECK(state IN ('pending','done')));
        CREATE TABLE admission(operation TEXT PRIMARY KEY REFERENCES outbox,
          tenant TEXT NOT NULL, digest TEXT NOT NULL);
        ''')

def propose(path, identifier, tenant, version, amount, recipient):
    if type(amount) is not int or amount <= 0 or type(version) is not int or version <= 0:
        raise ValueError('positive integer version and amount required')
    if not all(type(v) is str and v for v in (identifier, tenant, recipient)):
        raise ValueError('nonempty strings required')
    # Local restricted serialization, not a general JCS implementation.
    body = json.dumps([identifier, tenant, version, amount, recipient],
                      ensure_ascii=True, separators=(',', ':'))
    digest = hashlib.sha256(body.encode('ascii')).hexdigest()
    with connection(path) as db:
        db.execute('INSERT INTO proposal VALUES(?,?,?,?,?,?)',
                   (identifier, tenant, version, amount, recipient, digest))
    return digest

def approve(path, proposal, observed_digest):
    # Approver authentication and display are external trusted boundaries here.
    with connection(path) as db, transaction(db):
        row = db.execute('SELECT digest FROM proposal WHERE id=?', (proposal,)).fetchone()
        if row is None or row[0] != observed_digest:
            raise PermissionError('proposal differs from reviewed content')
        db.execute('INSERT INTO approval(proposal,digest) VALUES(?,?)', (proposal, observed_digest))

def admit(path, tenant, proposal, operation, fail_after_reservation=False):
    if not operation:
        raise ValueError('operation required')
    with connection(path) as db, transaction(db):
        old = db.execute('SELECT o.proposal,p.tenant FROM outbox o JOIN proposal p ON p.id=o.proposal WHERE operation=?', (operation,)).fetchone()
        if old:
            if old != (proposal, tenant):
                raise PermissionError('idempotency key reused for different scope')
            return 'already_admitted'  # Status only, never a second effect.
        row = db.execute('''SELECT p.amount,p.digest,a.digest,a.consumed,m.active
            FROM proposal p JOIN approval a ON a.proposal=p.id
            JOIN mandate m ON m.tenant=p.tenant WHERE p.id=? AND p.tenant=?''',
            (proposal, tenant)).fetchone()
        if not row or row[1] != row[2] or row[3] or not row[4]:
            raise PermissionError('no active approved authority')
        changed = db.execute('UPDATE mandate SET budget=budget-? WHERE tenant=? AND active=1 AND budget>=?', (row[0], tenant, row[0])).rowcount
        if changed != 1:
            raise PermissionError('budget exhausted')
        if fail_after_reservation:
            raise RuntimeError('injected fault')
        db.execute('UPDATE approval SET consumed=1 WHERE proposal=?', (proposal,))
        db.execute("INSERT INTO outbox VALUES(?,?,'pending')", (operation, proposal))
        db.execute('INSERT INTO admission VALUES(?,?,?)', (operation, tenant, row[1]))
    return 'admitted'

def revoke(path, tenant):
    with connection(path) as db, transaction(db):
        db.execute('UPDATE mandate SET active=0 WHERE tenant=?', (tenant,))

class SimulatedProvider:
    """Persistent idempotency oracle assumed available for the exercise only."""
    def __init__(self, path):
        self.path = path
        with connection(path) as db:
            db.execute('CREATE TABLE IF NOT EXISTS effect(operation TEXT PRIMARY KEY, payload TEXT NOT NULL)')

    def send(self, operation, payload, lose_response=False):
        encoded = json.dumps(payload, ensure_ascii=True, separators=(',', ':'))
        with connection(self.path) as db, transaction(db):
            old = db.execute('SELECT payload FROM effect WHERE operation=?', (operation,)).fetchone()
            if old and old[0] != encoded:
                raise ValueError('provider key conflict')
            if not old:
                db.execute('INSERT INTO effect VALUES(?,?)', (operation, encoded))
        if lose_response:
            raise TimeoutError('effect committed, response lost')
        return 'accepted'

def dispatch(path, provider, operation, lose_response=False):
    with connection(path) as db:
        row = db.execute('''SELECT o.state,p.tenant,p.amount,p.recipient,p.digest
          FROM outbox o JOIN proposal p ON p.id=o.proposal WHERE o.operation=?''', (operation,)).fetchone()
    if row is None:
        raise KeyError(operation)
    if row[0] == 'done':
        return 'done'
    # Explicit policy: admission is the commitment point. Revocation does not
    # cancel already admitted commands; a cancellable dispatch needs another model.
    provider.send(operation, row[1:], lose_response=lose_response)
    with connection(path) as db:
        db.execute("UPDATE outbox SET state='done' WHERE operation=?", (operation,))
    return 'done'
