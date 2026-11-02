'use client';

import { useState, useEffect, useRef } from 'react';
import Link from 'next/link';
import { apiRequest } from '@/lib/apiClient';
import { useDismiss } from './useDismiss';

// A small icon for each kind of item in the results list.
const TYPE_ICONS = { link: '🔗', photo: '🖼️', note: '📝', file: '📎' };

// Global search input in the header. Searches titles, notes, URLs, tags,
// summaries and descriptions across every folder (see /api/search), and
// shows results in a dropdown — each with its type and folder path — that
// link straight into their folder.
export default function SearchBar() {
  const [query, setQuery] = useState('');
  const [results, setResults] = useState([]);
  const [open, setOpen] = useState(false);
  const boxRef = useRef(null);

  useEffect(() => {
    if (!query.trim()) return;
    // Wait a beat after typing stops instead of firing a search request on
    // every single keystroke.
    const timeout = setTimeout(async () => {
      try {
        setResults(await apiRequest(`/api/search?q=${encodeURIComponent(query)}`));
      } catch {
        setResults([]); // shows "No results" rather than breaking the box
      }
      setOpen(true);
    }, 250);
    return () => clearTimeout(timeout);
  }, [query]);

  // Results close on a tap outside the search box, or Esc.
  useDismiss(open, () => setOpen(false), boxRef);

  // An empty box shows no results, without needing to clear the old ones.
  const hasQuery = Boolean(query.trim());
  const visibleResults = hasQuery ? results : [];

  return (
    <div ref={boxRef} className="relative max-w-md">
      <input
        value={query}
        onChange={(e) => setQuery(e.target.value)}
        onFocus={() => query && setOpen(true)}
        placeholder="Search everything…"
        className="w-full rounded border border-neutral-300 px-3 py-1.5 text-sm dark:border-neutral-700 dark:bg-neutral-800 dark:text-neutral-100 dark:placeholder-neutral-500"
      />
      {open && visibleResults.length > 0 && (
        <div className="absolute z-30 mt-1 max-h-80 w-full overflow-y-auto rounded border border-neutral-200 bg-white shadow-lg dark:border-neutral-700 dark:bg-neutral-800">
          {visibleResults.map((r) => (
            <Link
              key={r.id}
              href={`/folder/${r.folder_id}`}
              onClick={() => setOpen(false)}
              className="block border-b border-neutral-100 px-3 py-2 text-sm last:border-0 hover:bg-neutral-50 dark:border-neutral-700 dark:hover:bg-neutral-700"
            >
              <div className="flex items-center gap-2">
                <span aria-label={r.type} title={r.type} className="shrink-0">
                  {TYPE_ICONS[r.type] || '•'}
                </span>
                <span className="truncate font-medium">
                  {r.title || r.url || (r.content ? r.content.slice(0, 60) : '(untitled note)')}
                </span>
              </div>
              <div className="truncate pl-6 text-xs text-neutral-500 dark:text-neutral-400">
                in 📁 {r.folder_path?.length ? r.folder_path.join(' / ') : r.folder_name || 'a folder'}
              </div>
            </Link>
          ))}
        </div>
      )}
      {open && hasQuery && visibleResults.length === 0 && (
        <div className="absolute z-30 mt-1 w-full rounded border border-neutral-200 bg-white px-3 py-2 text-sm text-neutral-400 shadow-lg dark:border-neutral-700 dark:bg-neutral-800">
          No results
        </div>
      )}
    </div>
  );
}
