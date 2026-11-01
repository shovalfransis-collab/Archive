// The one way the browser talks to our API. Sends JSON, and turns every
// kind of failure — no connection, logged out, bad input, server error —
// into a thrown Error with a message that's fine to show the user (usually
// via showError() from lib/toast.js).
//
//   const folder = await apiRequest('/api/folders', { method: 'POST', body: { name } });

export async function apiRequest(url, { method = 'GET', body } = {}) {
  let res;
  try {
    res = await fetch(url, {
      method,
      headers: body === undefined ? undefined : { 'Content-Type': 'application/json' },
      body: body === undefined ? undefined : JSON.stringify(body),
    });
  } catch {
    throw new Error('Couldn’t reach the server — check your connection and try again.');
  }

  const data = await res.json().catch(() => null);
  if (!res.ok) {
    if (res.status === 401) throw new Error('You’re logged out. Reload the page to log in again.');
    throw new Error(data?.error || `Something went wrong (error ${res.status}).`);
  }
  return data;
}
