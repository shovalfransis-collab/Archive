import { NextResponse } from 'next/server';

// Best-effort attempt to fetch a page's title, description, and favicon
// so a saved link doesn't just show a bare URL. This is deliberately
// simple — plain regex over the HTML, not a full HTML parser library —
// which is good enough for most sites and keeps dependencies down. If a
// site blocks fetches or the page doesn't have this metadata, we just
// fall back to the URL itself; a link is always saved either way.
export async function POST(request) {
  const { url } = await request.json();

  try {
    const res = await fetch(url, {
      headers: { 'User-Agent': 'Mozilla/5.0 (compatible; TheArchiveBot/1.0)' },
      signal: AbortSignal.timeout(5000),
    });
    const html = await res.text();

    const titleMatch = html.match(/<title[^>]*>([^<]*)<\/title>/i);
    const descMatch =
      html.match(/<meta[^>]+name=["']description["'][^>]+content=["']([^"']*)["']/i) ||
      html.match(/<meta[^>]+content=["']([^"']*)["'][^>]+name=["']description["']/i);
    const iconMatch = html.match(
      /<link[^>]+rel=["'](?:shortcut icon|icon)["'][^>]+href=["']([^"']*)["']/i
    );

    const title = titleMatch ? titleMatch[1].trim() : url;
    const description = descMatch ? descMatch[1].trim() : null;
    const faviconUrl = new URL(iconMatch ? iconMatch[1] : '/favicon.ico', url).toString();

    return NextResponse.json({ title, description, faviconUrl });
  } catch {
    return NextResponse.json({ title: url, description: null, faviconUrl: null });
  }
}
