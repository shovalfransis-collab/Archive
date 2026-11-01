import { NextResponse } from 'next/server';
import { checkPin, makeSessionToken, COOKIE_NAME } from '@/lib/auth';
import { getLoginLock, recordLoginFailure, clearLoginFailures } from '@/lib/db';
import { jsonError, readJson, withErrors } from '@/lib/api';
import {
  MAX_FAILURES,
  LOCK_MINUTES,
  clientKey,
  lockedMessage,
  wrongPinMessage,
} from '@/lib/rateLimit';

// Checks the PIN and, if right, sets the login cookie. Wrong guesses are
// counted per visitor; after MAX_FAILURES within LOCK_MINUTES, that
// visitor gets "429 Too Many Requests" until the lockout ends — even with
// the right PIN, so guessing during a lockout gets you nowhere.
export const POST = withErrors(async (request) => {
  const key = clientKey(request.headers);

  const lockedUntil = await getLoginLock(key);
  if (lockedUntil) return jsonError(lockedMessage(lockedUntil), 429);

  const { pin } = (await readJson(request)) || {};

  if (!(await checkPin(pin))) {
    const { failures, locked_until } = await recordLoginFailure(key, MAX_FAILURES, LOCK_MINUTES);
    if (locked_until && new Date(locked_until) > new Date()) {
      return jsonError(lockedMessage(locked_until), 429);
    }
    return jsonError(wrongPinMessage(failures), 401);
  }

  await clearLoginFailures(key);

  const token = await makeSessionToken();
  const response = NextResponse.json({ ok: true });

  response.cookies.set(COOKIE_NAME, token, {
    httpOnly: true, // JavaScript in the browser can't read this cookie
    secure: true, // only sent over HTTPS
    sameSite: 'lax',
    maxAge: 60 * 60 * 24 * 365, // stay logged in for a year — this is a personal app
    path: '/',
  });

  return response;
});
