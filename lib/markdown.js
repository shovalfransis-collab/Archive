// Turns a note's Markdown text into HTML for display, using the small
// `marked` library rather than writing a Markdown parser by hand.
//
// A note on safety: `marked`'s output is inserted into the page as raw
// HTML (see NoteViewModal.js). Normally that would be a security risk
// (an attacker's HTML could run scripts in your browser), but this app
// is single-user and PIN-gated — the only person who can ever write a
// note is you — so there's no untrusted author to worry about.
import { marked } from 'marked';

marked.setOptions({ breaks: true }); // treat single line breaks as <br>, like a sticky note

export function renderMarkdown(text) {
  return marked.parse(text || '');
}
