// Handles the private PIN gate. There's no user database or session
// table — instead, logging in successfully sets a cookie whose value is
// cryptographically "signed" using a secret only the server knows
// (AUTH_SECRET). On every later request we recompute that signature and
// check it matches, which proves the cookie could only have been created
// by someone who typed the right PIN, without the server needing to
// remember anything.
//
// We use the Web Crypto API (`crypto.subtle`) instead of Node's built-in
// `crypto` module because this code also runs inside Next.js "middleware",
// which uses a restricted "Edge" runtime that only has Web Crypto
// available (not Node's full API).

export const COOKIE_NAME = 'archive_session';

// Converts the raw bytes from a hash/signature into a plain hex string,
// e.g. so it can be stored in a cookie.
function bufferToHex(buffer) {
  return Array.from(new Uint8Array(buffer))
    .map((byte) => byte.toString(16).padStart(2, '0'))
    .join('');
}

async function sign(value, secret) {
  const encoder = new TextEncoder();
  const key = await crypto.subtle.importKey(
    'raw',
    encoder.encode(secret),
    { name: 'HMAC', hash: 'SHA-256' },
    false,
    ['sign']
  );
  const signature = await crypto.subtle.sign('HMAC', key, encoder.encode(value));
  return bufferToHex(signature);
}

// The secret used to sign cookies combines AUTH_SECRET with the current
// ARCHIVE_PIN, so that changing the PIN in your Vercel project settings
// instantly invalidates any old session cookies too.
function signingSecret() {
  return `${process.env.AUTH_SECRET}:${process.env.ARCHIVE_PIN}`;
}

// How long a login lasts before you're asked for the PIN again.
export const SESSION_DAYS = 90;
const DAY_MS = 24 * 60 * 60 * 1000;

// A session token looks like "v1.<issued>.<expires>.<signature>": the
// times (in milliseconds) say when you logged in and when this login stops
// working, and the signature proves the server wrote them — change either
// time and the signature no longer matches. So a stolen or forgotten
// cookie stops working after SESSION_DAYS, and logging out deletes it.
//
// (Changing AUTH_SECRET or ARCHIVE_PIN in Vercel changes every signature,
// which logs out every device at once — the "log out everywhere" button.)
export async function makeSessionToken({ now = Date.now(), days = SESSION_DAYS } = {}) {
  const payload = `v1.${now}.${now + days * DAY_MS}`;
  const signature = await sign(payload, signingSecret());
  return `${payload}.${signature}`;
}

export async function isValidSessionToken(token, { now = Date.now() } = {}) {
  if (typeof token !== 'string') return false;
  const parts = token.split('.');
  if (parts.length !== 4 || parts[0] !== 'v1') return false; // includes old "ok.<sig>" tokens

  const [, issuedText, expiresText, signature] = parts;
  const issued = Number(issuedText);
  const expires = Number(expiresText);
  if (!Number.isSafeInteger(issued) || !Number.isSafeInteger(expires)) return false;

  const expected = await sign(`v1.${issuedText}.${expiresText}`, signingSecret());
  if (!(await safeEqual(signature, expected))) return false;

  // Checked after the signature, so these times are known to be genuine.
  // A token "from the future" (beyond a minute of clock difference) or
  // lasting longer than SESSION_DAYS is rejected too.
  if (expires <= now) return false;
  if (issued > now + 60_000) return false;
  if (expires - issued > SESSION_DAYS * DAY_MS) return false;
  return true;
}

// Compares two strings without leaking, through timing, how much of them
// matched. A plain === stops at the first different character, so an
// attacker timing many guesses could learn the secret bit by bit. Here
// both sides are hashed to equal-length digests first, then every byte is
// compared no matter what. (Web Crypto has no built-in for this.)
export async function safeEqual(a, b) {
  if (typeof a !== 'string' || typeof b !== 'string') return false;
  const encoder = new TextEncoder();
  const [x, y] = await Promise.all([
    crypto.subtle.digest('SHA-256', encoder.encode(a)),
    crypto.subtle.digest('SHA-256', encoder.encode(b)),
  ]);
  const xb = new Uint8Array(x);
  const yb = new Uint8Array(y);
  let diff = 0;
  for (let i = 0; i < xb.length; i++) diff |= xb[i] ^ yb[i];
  return diff === 0;
}

export async function checkPin(pin) {
  if (typeof pin !== 'string' || !pin || !process.env.ARCHIVE_PIN) return false;
  return safeEqual(pin, process.env.ARCHIVE_PIN);
}

// A secret key built into your bookmarklet and iPhone Shortcut links
// (/add?key=…&url=…). Opening /add saves straight away only when it was
// clearly you: either this key is present, or the browser says you opened
// it yourself (from a share menu, bookmark, or the address bar). Otherwise
// any website you visit could send you to /add?url=… and quietly add
// things to your archive — so in that case /add asks "Save this?" first.
// Changing the PIN or AUTH_SECRET changes the key; old bookmarklets then
// just ask that one extra question until you set them up again.
export async function makeShareKey() {
  return (await sign('share-key', signingSecret())).slice(0, 32);
}

export async function isValidShareKey(key) {
  if (typeof key !== 'string' || key.length !== 32) return false;
  return safeEqual(key, await makeShareKey());
}
