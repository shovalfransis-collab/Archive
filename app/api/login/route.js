import { NextResponse } from 'next/server';
import { checkPin, makeSessionToken, COOKIE_NAME } from '@/lib/auth';

export async function POST(request) {
  const { pin } = await request.json();

  if (!checkPin(pin)) {
    return NextResponse.json({ error: 'Wrong PIN' }, { status: 401 });
  }

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
}
