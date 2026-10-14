-- Application content is never written to this database. Only temporary,
-- day-specific HMAC network keys and aggregate usage counters are stored.
CREATE TABLE IF NOT EXISTS quota (
  bucket TEXT PRIMARY KEY,
  used INTEGER NOT NULL DEFAULT 0 CHECK(used >= 0),
  expires INTEGER NOT NULL
);
CREATE INDEX IF NOT EXISTS quota_expiry ON quota(expires);
CREATE TABLE IF NOT EXISTS reservations (
  id TEXT PRIMARY KEY,
  bucket TEXT NOT NULL,
  units INTEGER NOT NULL,
  created INTEGER NOT NULL
);
CREATE TABLE IF NOT EXISTS metrics (
  day TEXT PRIMARY KEY,
  requests INTEGER NOT NULL DEFAULT 0,
  completions INTEGER NOT NULL DEFAULT 0,
  failures INTEGER NOT NULL DEFAULT 0,
  input_tokens INTEGER NOT NULL DEFAULT 0,
  output_tokens INTEGER NOT NULL DEFAULT 0,
  neurons REAL NOT NULL DEFAULT 0
);
