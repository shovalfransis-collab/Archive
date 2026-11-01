// Fetches a web page for link previews WITHOUT letting it reach private
// networks. Without these checks, saving a link like http://localhost:5432
// or http://169.254.169.254/ (a cloud server's secret metadata address)
// would make *our server* go and fetch it — a classic attack called SSRF.
//
// The rules:
// - only http:// and https://, only the normal ports (80/443);
// - the address is checked at the moment of connecting (in `lookup`
//   below), not just looked up beforehand — so a hostile domain can't
//   answer "public address" to the check and "127.0.0.1" to the real
//   connection a moment later;
// - redirects are followed by hand (at most 3), each one checked again;
// - we stop reading after MAX_BYTES and give up after the timeout.
//
// Server-only (uses Node's http/https/dns), so it's only imported by
// app/api/link-preview/route.js.
import http from 'node:http';
import https from 'node:https';
import dns from 'node:dns';
import net from 'node:net';
import zlib from 'node:zlib';

export const MAX_BYTES = 512 * 1024; // plenty to find <title> and <meta> tags
const MAX_REDIRECTS = 3;

// Addresses that aren't the public internet: "this machine", home/office
// networks, cloud metadata, carrier-grade NAT, documentation/test ranges,
// multicast, etc.
const blocked = new net.BlockList();
for (const [address, prefix] of [
  ['0.0.0.0', 8],
  ['10.0.0.0', 8],
  ['100.64.0.0', 10],
  ['127.0.0.0', 8],
  ['169.254.0.0', 16],
  ['172.16.0.0', 12],
  ['192.0.0.0', 24],
  ['192.0.2.0', 24],
  ['192.88.99.0', 24],
  ['192.168.0.0', 16],
  ['198.18.0.0', 15],
  ['198.51.100.0', 24],
  ['203.0.113.0', 24],
  ['224.0.0.0', 4],
  ['240.0.0.0', 4],
]) {
  blocked.addSubnet(address, prefix, 'ipv4');
}
for (const [address, prefix] of [
  ['::', 128], // unspecified
  ['::1', 128], // loopback
  ['100::', 64], // discard
  ['2001:db8::', 32], // documentation
  ['fc00::', 7], // private (unique local)
  ['fe80::', 10], // link-local
  ['ff00::', 8], // multicast
]) {
  blocked.addSubnet(address, prefix, 'ipv6');
}

// The IPv4 address hidden inside an IPv6 one, if any: "::ffff:10.0.0.1"
// (IPv4-mapped) or "64:ff9b::a00:1" (NAT64). Otherwise null.
function embeddedIPv4(ip) {
  const lower = ip.toLowerCase();
  const dotted = lower.match(/^(?:::ffff:|64:ff9b::)(\d+\.\d+\.\d+\.\d+)$/);
  if (dotted) return dotted[1];
  const hex = lower.match(/^(?:::ffff:|64:ff9b::)([0-9a-f]{1,4}):([0-9a-f]{1,4})$/);
  if (hex) {
    const hi = parseInt(hex[1], 16);
    const lo = parseInt(hex[2], 16);
    return `${hi >> 8}.${hi & 255}.${lo >> 8}.${lo & 255}`;
  }
  return null;
}

// True only for addresses on the public internet.
export function isPublicAddress(ip) {
  const family = net.isIP(ip);
  if (family === 4) return !blocked.check(ip, 'ipv4');
  if (family === 6) {
    const v4 = embeddedIPv4(ip);
    if (v4) return isPublicAddress(v4);
    if (/^::ffff:/i.test(ip)) return false; // a mapped form we couldn't read — refuse
    return !blocked.check(ip, 'ipv6');
  }
  return false;
}

// Parses and checks a URL before fetching it. Returns the URL, or throws
// an Error whose message is fine to show.
export function checkFetchableUrl(input, { allowAnyPort = false } = {}) {
  let url;
  try {
    url = new URL(input);
  } catch {
    throw new Error('That isn’t a valid web address.');
  }
  if (url.protocol !== 'http:' && url.protocol !== 'https:') {
    throw new Error('Only http:// and https:// links can be previewed.');
  }
  if (!allowAnyPort && url.port && url.port !== '80' && url.port !== '443') {
    throw new Error('Only links on the standard web ports can be previewed.');
  }
  if (url.username || url.password) {
    throw new Error('Links with a username or password can’t be previewed.');
  }
  return url;
}

// A DNS lookup that refuses non-public addresses. Node calls this while
// connecting, so the address that's checked is the one actually used.
// `isAllowed` is swappable only so tests can reach a local test server.
function makeSafeLookup(isAllowed) {
  return (hostname, options, callback) => {
    dns.lookup(hostname, { ...options, all: true }, (err, addresses) => {
      if (err) return callback(err);
      const bad = addresses.find((a) => !isAllowed(a.address));
      if (bad || addresses.length === 0) {
        const error = new Error('That address points to a private network.');
        error.code = 'EBLOCKED';
        return callback(error);
      }
      if (options.all) return callback(null, addresses);
      callback(null, addresses[0].address, addresses[0].family);
    });
  };
}

// Fetches one URL (no redirects followed). Resolves with
// { status, headers, body } where body is at most maxBytes, decompressed.
function requestOnce(url, { lookup, signal, maxBytes, headers }) {
  return new Promise((resolve, reject) => {
    // IP-address hostnames skip DNS entirely, so check them directly.
    const literal = url.hostname.replace(/^\[|\]$/g, '');
    if (net.isIP(literal) && !lookup.isAllowed(literal)) {
      reject(Object.assign(new Error('That address points to a private network.'), { code: 'EBLOCKED' }));
      return;
    }

    const client = url.protocol === 'https:' ? https : http;
    const req = client.request(
      url,
      {
        method: 'GET',
        lookup,
        signal,
        headers: { 'Accept-Encoding': 'gzip, deflate, br', Accept: 'text/html,*/*;q=0.5', ...headers },
      },
      (res) => {
        const status = res.statusCode;
        if (status >= 300 && status < 400) {
          res.resume();
          resolve({ status, headers: res.headers, body: '' });
          return;
        }

        const encoding = String(res.headers['content-encoding'] || '').toLowerCase();
        let stream = res;
        if (encoding === 'gzip' || encoding === 'x-gzip') stream = res.pipe(zlib.createGunzip());
        else if (encoding === 'deflate') stream = res.pipe(zlib.createInflate());
        else if (encoding === 'br') stream = res.pipe(zlib.createBrotliDecompress());

        const chunks = [];
        let size = 0;
        let done = false;
        const finish = () => {
          if (done) return;
          done = true;
          res.destroy();
          resolve({ status, headers: res.headers, body: new TextDecoder().decode(Buffer.concat(chunks)) });
        };
        stream.on('data', (chunk) => {
          if (done) return;
          const room = maxBytes - size;
          chunks.push(chunk.length > room ? chunk.subarray(0, room) : chunk);
          size += Math.min(chunk.length, room);
          if (size >= maxBytes) finish(); // enough — stop downloading
        });
        stream.on('end', finish);
        stream.on('error', (err) => (done ? null : ((done = true), reject(err))));
      }
    );
    req.on('error', reject);
    req.end();
  });
}

// Fetches a public web page safely (see the top of this file). Returns
// { url, status, contentType, body } — `url` is the final address after
// redirects. Throws for private addresses, bad URLs, timeouts, or too many
// redirects.
//
// `_testing` is only for the automated tests, which run a small web server
// on this machine (a private address, on a random port): { isAllowedAddress,
// allowAnyPort }. Never pass it from app code.
export async function fetchPublicPage(
  input,
  { timeoutMs = 5000, maxBytes = MAX_BYTES, headers = {}, _testing = {} } = {}
) {
  const isAllowed = _testing.isAllowedAddress || isPublicAddress;
  const urlRules = { allowAnyPort: Boolean(_testing.allowAnyPort) };
  const lookup = makeSafeLookup(isAllowed);
  lookup.isAllowed = isAllowed;
  const signal = AbortSignal.timeout(timeoutMs); // one deadline for the whole chain

  let url = checkFetchableUrl(input, urlRules);
  for (let hop = 0; hop <= MAX_REDIRECTS; hop++) {
    const res = await requestOnce(url, { lookup, signal, maxBytes, headers });
    if (res.status >= 300 && res.status < 400 && res.headers.location) {
      // Each redirect target goes through every check again.
      url = checkFetchableUrl(new URL(res.headers.location, url).toString(), urlRules);
      continue;
    }
    return {
      url: url.toString(),
      status: res.status,
      contentType: String(res.headers['content-type'] || ''),
      body: res.body,
    };
  }
  throw new Error('Too many redirects.');
}
