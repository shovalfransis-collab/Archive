// Runs before every page/API request. If there's no valid login cookie,
// it bounces the visitor to /login — this is the whole PIN gate.
import { NextResponse } from 'next/server';
import { COOKIE_NAME, isValidSessionToken, authIsConfigured } from '@/lib/auth';

// Skip everything Next.js needs to serve on its own (static assets etc.)
// so the gate only applies to actual pages and API routes.
export const config = {
  matcher: ['/((?!_next/static|_next/image|favicon.ico).*)'],
};

// Reachable without logging in. The login page and its API, obviously —
// otherwise there'd be no way to ever log in. The app manifest and icons
// too: browsers fetch those without your login cookie when installing the
// app to a home screen, and they contain nothing private.
function isPublicPath(pathname) {
  return (
    pathname === '/login' ||
    pathname === '/api/login' ||
    pathname === '/manifest.webmanifest' ||
    pathname.startsWith('/icons/')
  );
}

export async function proxy(request) {
  const { pathname, search } = request.nextUrl;

  // If the PIN or secret isn't set up, nobody gets in — not even with an
  // old cookie. The exact problem goes to the server log (Vercel → Logs),
  // not to the visitor.
  if (!authIsConfigured()) {
    const message = 'The Archive isn’t set up correctly yet. Check the server logs.';
    return pathname.startsWith('/api/')
      ? NextResponse.json({ error: message }, { status: 503 })
      : new NextResponse(message, { status: 503, headers: { 'Content-Type': 'text/plain; charset=utf-8' } });
  }

  if (isPublicPath(pathname)) {
    return NextResponse.next();
  }

  const token = request.cookies.get(COOKIE_NAME)?.value;
  const valid = await isValidSessionToken(token);

  if (!valid) {
    // API calls get a plain "401 not logged in" the app can show, rather
    // than being redirected to the login page's HTML.
    if (pathname.startsWith('/api/')) {
      return NextResponse.json({ error: 'You’re logged out. Please log in again.' }, { status: 401 });
    }
    const loginUrl = new URL('/login', request.url);
    // Remember which page you were heading to (e.g. a link shared from your
    // phone, at /add?url=…) so logging in takes you straight back there.
    // The login page checks this is a path on this site before using it
    // (lib/safeRedirect.js).
    if (pathname !== '/') {
      loginUrl.searchParams.set('next', pathname + search);
    }
    return NextResponse.redirect(loginUrl);
  }

  return NextResponse.next();
}
