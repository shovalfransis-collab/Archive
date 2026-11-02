// After logging in, the app sends you back to the page you were trying to
// open (e.g. a shared link at /add?url=…), passed along as ?next=…. That
// value comes from the URL, so anyone could craft a login link with
// ?next=https://evil.example — this makes sure we only ever go to a page
// on this same site, and fall back to the home page otherwise.
export function safeNextPath(next) {
  if (typeof next !== 'string' || !next) return '/';
  // Must be a path on this site: "/something", but not "//evil.com" or
  // "/\evil.com" (browsers treat both as "another website").
  if (!next.startsWith('/') || next.startsWith('//') || next.startsWith('/\\')) return '/';
  // No control characters (tabs/newlines get stripped by browsers and can
  // turn "/\t/evil.com" into "//evil.com").
  if (/[\u0000-\u001f\u007f]/.test(next)) return '/';
  try {
    const base = 'https://archive.invalid';
    const resolved = new URL(next, base);
    if (resolved.origin !== base) return '/';
    // Don't bounce back to the login page itself.
    if (resolved.pathname === '/login') return '/';
    return resolved.pathname + resolved.search + resolved.hash;
  } catch {
    return '/';
  }
}
