import { NextResponse } from 'next/server';
import { fetchPublicPage, checkFetchableUrl } from '@/lib/safeFetch';
import { jsonError, readJson } from '@/lib/api';

// Best-effort attempt to fetch a page's title, description, and favicon so a
// saved link doesn't just show a bare URL. We also prefix the title with the
// site name (e.g. "YouTube - Gangnam Style") so a folder full of links from
// the same site (ten YouTube videos, say) stays scannable instead of just
// showing ten identical-looking "YouTube" entries.
//
// This is deliberately simple — plain regex over the HTML, not a full HTML
// parser library — which is good enough for most sites and keeps
// dependencies down. If a site blocks fetches or the page doesn't have this
// metadata, we just fall back to the URL itself; a link is always saved
// either way.
//
// The page is fetched through lib/safeFetch.js, which refuses private and
// local addresses (so a link can't make our server poke at internal
// systems), caps the download size, and times out after 5 seconds.

const KNOWN_SITE_NAMES = {
  'youtube.com': 'YouTube',
  'youtu.be': 'YouTube',
  'twitter.com': 'Twitter',
  'x.com': 'X',
  'github.com': 'GitHub',
  'reddit.com': 'Reddit',
  'linkedin.com': 'LinkedIn',
  'imdb.com': 'IMDb',
};

function isYouTube(hostname) {
  return hostname === 'youtube.com' || hostname === 'youtu.be' || hostname.endsWith('.youtube.com');
}

function bareHostname(url) {
  return new URL(url).hostname.replace(/^www\./, '');
}

function guessSiteName(hostname) {
  if (KNOWN_SITE_NAMES[hostname]) return KNOWN_SITE_NAMES[hostname];
  const label = hostname.split('.')[0];
  return label.charAt(0).toUpperCase() + label.slice(1);
}

// Strips a trailing " - <site>" / " | <site>" suffix that a page's own
// <title> often already appends (e.g. "Gangnam Style - YouTube"), so we
// don't end up prefixing it a second time.
function stripSiteSuffix(title, siteName) {
  const pattern = new RegExp(`\\s*[-|–]\\s*${siteName}\\s*$`, 'i');
  return title.replace(pattern, '').trim();
}

function withSitePrefix(title, siteName) {
  const cleaned = stripSiteSuffix(title, siteName) || title;
  if (cleaned.toLowerCase().startsWith(siteName.toLowerCase())) return cleaned;
  return `${siteName} - ${cleaned}`;
}

// YouTube serves bot-unfriendly HTML (consent walls, JS-shell titles), so
// scraping it is unreliable. Its oEmbed endpoint is official, unauthenticated,
// and gives us the real video title directly.
async function fetchYouTubePreview(url) {
  const oembedUrl = `https://www.youtube.com/oembed?url=${encodeURIComponent(url)}&format=json`;
  const res = await fetch(oembedUrl, { signal: AbortSignal.timeout(5000) });
  if (!res.ok) throw new Error('oEmbed failed');
  const data = await res.json();
  return {
    title: withSitePrefix(data.title, 'YouTube'),
    description: data.author_name ? `by ${data.author_name}` : null,
    faviconUrl: 'https://www.youtube.com/favicon.ico',
  };
}

// Only http(s) favicons — anything else (data:, javascript:) is dropped.
function safeFaviconUrl(href, pageUrl) {
  try {
    const icon = new URL(href, pageUrl);
    return icon.protocol === 'http:' || icon.protocol === 'https:' ? icon.toString() : null;
  } catch {
    return null;
  }
}

async function fetchGenericPreview(url) {
  const page = await fetchPublicPage(url, {
    headers: { 'User-Agent': 'Mozilla/5.0 (compatible; TheArchiveBot/1.0)' },
  });
  const html = page.body;

  const ogTitleMatch = html.match(
    /<meta[^>]+property=["']og:title["'][^>]+content=["']([^"']*)["']/i
  );
  const titleMatch = html.match(/<title[^>]*>([^<]*)<\/title>/i);
  const ogSiteNameMatch = html.match(
    /<meta[^>]+property=["']og:site_name["'][^>]+content=["']([^"']*)["']/i
  );
  const descMatch =
    html.match(/<meta[^>]+name=["']description["'][^>]+content=["']([^"']*)["']/i) ||
    html.match(/<meta[^>]+content=["']([^"']*)["'][^>]+name=["']description["']/i);
  const iconMatch = html.match(
    /<link[^>]+rel=["'](?:shortcut icon|icon)["'][^>]+href=["']([^"']*)["']/i
  );

  const hostname = bareHostname(url);
  const siteName = ogSiteNameMatch ? ogSiteNameMatch[1].trim() : guessSiteName(hostname);
  const rawTitle = (ogTitleMatch ? ogTitleMatch[1] : titleMatch ? titleMatch[1] : url).trim();
  const title = withSitePrefix(rawTitle, siteName);
  const description = descMatch ? descMatch[1].trim() : null;
  const faviconUrl = safeFaviconUrl(iconMatch ? iconMatch[1] : '/favicon.ico', page.url);

  return { title, description, faviconUrl };
}

export async function POST(request) {
  const { url: input } = (await readJson(request)) || {};

  // Bad or non-web URLs get a clear 400 instead of crashing the route.
  let url;
  try {
    url = checkFetchableUrl(input).toString();
  } catch (err) {
    return jsonError(err.message, 400);
  }

  const hostname = bareHostname(url);

  if (isYouTube(hostname)) {
    try {
      return NextResponse.json(await fetchYouTubePreview(url));
    } catch {
      // oEmbed can fail for private/deleted videos — fall through to a
      // generic scrape rather than giving up on a title entirely.
    }
  }

  try {
    return NextResponse.json(await fetchGenericPreview(url));
  } catch {
    // Unreachable, private, too slow… — the link is still saved, just
    // without a fetched title.
    return NextResponse.json({ title: url, description: null, faviconUrl: null });
  }
}
