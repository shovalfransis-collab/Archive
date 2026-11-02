// Login rate limiting rules: after MAX_FAILURES wrong PINs within
// LOCK_MINUTES, that visitor is locked out for LOCK_MINUTES. A 4-digit PIN
// has only 10,000 possibilities; without this, a script could try them all
// in minutes. The counts live in Postgres (login_attempts table, see
// lib/db.js) so every server shares them.

export const MAX_FAILURES = 5;
export const LOCK_MINUTES = 15;

// Who's knocking: the visitor's IP address, as reported by Vercel (which
// sets these headers itself, so they can't be faked by the visitor). IPv6
// users usually control a whole block of 2^64 addresses, so for IPv6 we
// count the block (first four groups), not the single address — otherwise
// they could just switch address after every few tries.
export function clientKey(headers) {
  const forwarded = headers.get('x-forwarded-for')?.split(',')[0]?.trim();
  const ip = headers.get('x-real-ip')?.trim() || forwarded || 'unknown';
  if (!ip.includes(':')) return ip; // IPv4 (or unknown)
  return `${ipv6Prefix64(ip)}::/64`;
}

// The first four 16-bit groups of an IPv6 address, expanding "::".
function ipv6Prefix64(ip) {
  const clean = ip.replace(/^\[|\]$/g, '').split('%')[0].toLowerCase();
  const [head, tail] = clean.split('::');
  const headParts = head ? head.split(':') : [];
  const tailParts = tail !== undefined && tail ? tail.split(':') : [];
  const missing = 8 - headParts.length - tailParts.length;
  const full = [...headParts, ...Array(Math.max(missing, 0)).fill('0'), ...tailParts];
  return full
    .slice(0, 4)
    .map((g) => g.replace(/^0+(?=.)/, ''))
    .join(':');
}

// "Try again in 12 minutes." from a lock end time.
export function lockedMessage(lockedUntil, now = new Date()) {
  const minutes = Math.max(1, Math.ceil((new Date(lockedUntil) - now) / 60000));
  return `Too many wrong PINs. Try again in ${minutes} minute${minutes === 1 ? '' : 's'}.`;
}

export function wrongPinMessage(failures) {
  const left = MAX_FAILURES - failures;
  if (left > 2) return 'Wrong PIN — try again.';
  return `Wrong PIN — ${left} ${left === 1 ? 'try' : 'tries'} left before a ${LOCK_MINUTES}-minute lockout.`;
}
