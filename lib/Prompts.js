// The auto-sort "agent" — talks to OpenRouter (https://openrouter.ai), a
// single API that can call many different AI models (OpenAI, Google,
// Anthropic, etc.) using one API key. You get that key from
// openrouter.ai/keys and put it in your OPENROUTER_API_KEY environment
// variable (see .env.example / README.md) — never in the code itself.
//
// What this does: given a link/photo/note you just saved, and the list of
// folders you already have, it asks the model to (a) pick the best-fitting
// existing folder OR invent a short new folder name if nothing fits, and
// (b) write a one-line summary and a few short tags. It always returns a
// best-effort result — if the API key is missing, the request fails, or the
// model returns something we can't parse, we fall back to leaving the item
// unsorted (folderId: null) rather than throwing, so a save never breaks
// just because the AI step had a hiccup.

// Cheap, fast model — plenty good for "which folder does this belong in"
// and short tags. Change this (or set OPENROUTER_MODEL in your env) to swap
// models any time without touching code.
const DEFAULT_MODEL = 'google/gemini-2.5-flash-lite';

function buildFolderList(folders) {
  // folders: flat array of { id, name, parent_id }. We show the AI a simple
  // indented list so it understands nesting (a "Reddit" folder inside
  // "Fun" reads differently than a top-level one).
  const byId = new Map(folders.map((f) => [f.id, f]));
  const pathFor = (folder) => {
    const parts = [folder.name];
    let current = folder;
    while (current.parent_id && byId.has(current.parent_id)) {
      current = byId.get(current.parent_id);
      parts.unshift(current.name);
    }
    return parts.join(' / ');
  };
  return folders.map((f) => `- id=${f.id}: ${pathFor(f)}`).join('\n');
}

// Builds the plain-text description of the item we hand to the model.
// `item` can describe a link (title/description/url), a photo (title/note),
// or a note (content).
function describeItem(item) {
  const lines = [];
  if (item.type) lines.push(`Type: ${item.type}`);
  if (item.title) lines.push(`Title: ${item.title}`);
  if (item.url) lines.push(`URL: ${item.url}`);
  if (item.description) lines.push(`Page description: ${item.description}`);
  if (item.content) lines.push(`Note content: ${item.content}`);
  if (item.note) lines.push(`User's own note: ${item.note}`);
  return lines.join('\n');
}

const SYSTEM_PROMPT = `You are a filing assistant for a personal archive app called "The Archive". The user saves links, photos, and notes into folders. Your job, given one new item and the user's existing folder list, is to:

1. Decide which existing folder it fits best in, OR, if nothing fits well, propose a short new top-level folder name (2-3 words, Title Case, no emoji).
2. Write a one-sentence summary (under 100 characters) of what the item is.
3. Suggest 2-5 short lowercase tags (single words or short phrases, no # symbol) that describe it.

Reply with ONLY a JSON object, no markdown fences, no explanation, in exactly this shape:
{"folderId": <number or null>, "newFolderName": <string or null>, "summary": "<string>", "tags": ["<string>", ...]}

Rules:
- Set exactly one of folderId or newFolderName (never both, never neither).
- Only use a folderId that appears in the provided list.
- If you truly cannot tell anything useful from the item, still make your best reasonable guess — never refuse.`;

// Turns the model's raw reply into a safe, predictable result — or null if
// the reply isn't usable JSON at all. Models don't always follow the rules
// in the prompt, so nothing here trusts the reply: the folder id must be one
// we actually have, tags must be real strings, and the summary is capped.
// Kept separate from the network call (and exported) so it can be tested.
export function parseClassification(raw, folders) {
  if (typeof raw !== 'string' || !raw.trim()) return null;

  let parsed;
  try {
    // Some models wrap JSON in ```json fences despite being told not to.
    parsed = JSON.parse(raw.trim().replace(/^```(?:json)?\s*|\s*```$/g, ''));
  } catch {
    return null;
  }
  if (!parsed || typeof parsed !== 'object' || Array.isArray(parsed)) return null;

  // Accept 3 or "3" — models sometimes quote numbers.
  const validFolderIds = new Set(folders.map((f) => f.id));
  const candidateId = typeof parsed.folderId === 'string' ? Number(parsed.folderId) : parsed.folderId;
  const folderId =
    Number.isInteger(candidateId) && validFolderIds.has(candidateId) ? candidateId : null;

  // If the model set both, the existing folder wins (no surprise new folders).
  const newFolderName =
    !folderId && typeof parsed.newFolderName === 'string' && parsed.newFolderName.trim()
      ? parsed.newFolderName.trim().slice(0, 60)
      : null;

  const summary =
    typeof parsed.summary === 'string' && parsed.summary.trim()
      ? parsed.summary.trim().slice(0, 200)
      : null;

  const tags = Array.isArray(parsed.tags)
    ? [
        ...new Set(
          parsed.tags
            .filter((t) => typeof t === 'string')
            .map((t) => t.trim().replace(/^#/, '').toLowerCase())
            .filter(Boolean)
        ),
      ].slice(0, 5)
    : null;

  return { folderId, newFolderName, summary, tags: tags && tags.length ? tags : null };
}

export async function classifyItem(item, folders) {
  const apiKey = process.env.OPENROUTER_API_KEY;
  if (!apiKey) {
    console.warn('[ai] OPENROUTER_API_KEY is not set — skipping auto-sort.');
    return null;
  }

  const model = process.env.OPENROUTER_MODEL || DEFAULT_MODEL;
  const userPrompt = `Existing folders:\n${buildFolderList(folders) || '(none yet)'}\n\nNew item:\n${describeItem(item)}`;

  try {
    const res = await fetch('https://openrouter.ai/api/v1/chat/completions', {
      method: 'POST',
      headers: {
        Authorization: `Bearer ${apiKey}`,
        'Content-Type': 'application/json',
        // OpenRouter asks apps to identify themselves — purely informational,
        // shown on your OpenRouter dashboard, has no effect on the request.
        'HTTP-Referer': 'https://the-archive.local',
        'X-Title': 'The Archive - auto-sort',
      },
      body: JSON.stringify({
        model,
        messages: [
          { role: 'system', content: SYSTEM_PROMPT },
          { role: 'user', content: userPrompt },
        ],
        temperature: 0.2,
        response_format: { type: 'json_object' },
      }),
      signal: AbortSignal.timeout(15000),
    });

    if (!res.ok) {
      console.error('[ai] OpenRouter request failed:', res.status, await res.text());
      return null;
    }

    const data = await res.json();
    const raw = data.choices?.[0]?.message?.content;
    return parseClassification(raw, folders);
  } catch (err) {
    console.error('[ai] classifyItem failed:', err);
    return null;
  }
}
