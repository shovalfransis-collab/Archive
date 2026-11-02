// Works out what to save from the bits a phone's share sheet (or the
// bookmarklet / iPhone Shortcut) hands us. Apps aren't consistent: some put
// the link in `url`, many (especially on Android) put it inside `text`
// along with other words ("Look at this! https://…"), and some put it in
// `title`. So we take the first http(s) link found in any of them.
//
// Returns { url, title, text }:
// - url: the link to save, or null if there isn't one (then the shared
//   text is saved as a note instead)
// - title: a title hint, used only if the page's own title can't be fetched
// - text: any leftover shared words (saved as the item's note), or null

const URL_PATTERN = /https?:\/\/[^\s<>"']+/i;

function clean(value) {
  if (Array.isArray(value)) value = value[0];
  return typeof value === 'string' ? value.trim() : '';
}

function findUrl(value) {
  const match = value.match(URL_PATTERN);
  if (!match) return null;
  // Trailing punctuation from a sentence ("…see https://x.com/a.") isn't
  // part of the link.
  const candidate = match[0].replace(/[.,;:!?)\]]+$/, '');
  try {
    const url = new URL(candidate);
    return url.protocol === 'http:' || url.protocol === 'https:' ? url.toString() : null;
  } catch {
    return null;
  }
}

export function extractShared(params = {}) {
  const rawUrl = clean(params.url);
  const rawTitle = clean(params.title);
  const rawText = clean(params.text);

  const url = findUrl(rawUrl) || findUrl(rawText) || findUrl(rawTitle);

  // Whatever words are left once the link is taken out of the text.
  let text = rawText;
  if (url) {
    const inText = rawText.match(URL_PATTERN)?.[0];
    if (inText) text = rawText.replace(inText, '').trim();
  }
  // If the "text" was only ever the title again, it isn't a note.
  if (text === rawTitle) text = '';

  return {
    url,
    title: rawTitle && rawTitle !== url ? rawTitle : null,
    text: text || null,
  };
}
