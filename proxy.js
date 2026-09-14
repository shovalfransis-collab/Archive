// Runs before every page/API request. If there's no valid login cookie,
// it bounces the visitor to /login — this is the whole PIN gate.
import { NextResponse } from 'next/server';
import { COOKIE_NAME, isValidSessionToken } from '@/lib/auth';

// Skip everything Next.js needs to serve on its own (static assets etc.)
// so the gate only applies to actual pages and API routes.
export const config = {
  matcher: ['/((?!_next/static|_next/image|favicon.ico).*)'],
};

export async function proxy(request) {
  const { pathname } = request.nextUrl;

  // The login page itself, and the API route it submits to, must stay
  // reachable — otherwise there'd be no way to ever log in.
  if (pathname === '/login' || pathname === '/api/login') {
    return NextResponse.next();
  }

  const token = request.cookies.get(COOKIE_NAME)?.value;
  const valid = await isValidSessionToken(token);

  if (!valid) {
    return NextResponse.redirect(new URL('/login', request.url));
  }

  return NextResponse.next();
}
