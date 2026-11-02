// Small helpers shared by the API routes (app/api/**/route.js), so every
// route answers errors the same way: JSON like { "error": "…" } with a
// proper status code — never an HTML error page the browser can't read.
import { NextResponse } from 'next/server';

export function jsonError(message, status = 400) {
  return NextResponse.json({ error: message }, { status });
}

// Reads the request body as JSON; null if it's missing or not valid JSON.
export async function readJson(request) {
  try {
    return await request.json();
  } catch {
    return null;
  }
}

// Wraps a route handler so anything unexpected (e.g. the database being
// unreachable) is logged and answered with a JSON 500, instead of Next.js's
// default HTML error page.
export function withErrors(handler) {
  return async (...args) => {
    try {
      return await handler(...args);
    } catch (err) {
      console.error('[api] unexpected error:', err);
      return jsonError('Something went wrong on the server. Please try again.', 500);
    }
  };
}
