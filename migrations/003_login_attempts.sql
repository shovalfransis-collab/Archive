-- Wrong-PIN tracking for login rate limiting (see lib/rateLimit.js and
-- app/api/login/route.js). One row per visitor (IP address, or IPv6 /64
-- network): how many wrong PINs in the current 15-minute window, and — once
-- they hit the limit — when they're allowed to try again. Stored here
-- (not in memory) because each request on Vercel can run on a different
-- server; the database is the only thing they all share.
CREATE TABLE IF NOT EXISTS login_attempts (
  client_key TEXT PRIMARY KEY,
  failures INTEGER NOT NULL DEFAULT 0,
  window_started_at TIMESTAMPTZ NOT NULL DEFAULT now(),
  locked_until TIMESTAMPTZ
);
