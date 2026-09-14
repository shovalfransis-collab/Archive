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

export async function makeSessionToken() {
  const value = 'ok';
  const signature = await sign(value, signingSecret());
  return `${value}.${signature}`;
}

export async function isValidSessionToken(token) {
  if (!token) return false;
  const [value, signature] = token.split('.');
  if (!value || !signature) return false;
  const expected = await sign(value, signingSecret());
  return signature === expected;
}

export function checkPin(pin) {
  return typeof pin === 'string' && pin === process.env.ARCHIVE_PIN;
}
