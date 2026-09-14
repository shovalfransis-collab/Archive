'use client';

import { useState, useEffect, useRef } from 'react';

// Global search input in the header. Searches title, note text, and URL
// across every folder (see /api/search) and shows results in a dropdown
// that link straight into their folder.
export default function SearchBar() {
  const [query, setQuery] = useState('');
  const [results, setResults] = useState([]);
  const [open, setOpen] = useState(false);
  const boxRef = useRef(null);

  useEffect(() => {
    if (!query.trim()) {
      setResults([]);
      return;
    }
    // Wait a beat after typing stops instead of firing a search request on
    // every single keystroke.
    const timeout = setTimeout(async () => {
      const res = await fetch(`/api/search?q=${encodeURIComponent(query)}`);
      setResults(await res.json());
      setOpen(true);
    }, 250);
    return () => clearTimeout(timeout);
  }, [query]);

  useEffect(() => {
    function handleClickOutside(e) {
      if (boxRef.current && !boxRef.current.contains(e.target)) setOpen(false);
    }
    document.addEventListener('mousedown', handleClickOutside);
    return () => document.removeEventListener('mousedown', handleClickOutside);
  }, []);

  return (
    <div ref={boxRef} className="relative max-w-md">
      <input
        value={query}
        onChange={(e) => setQuery(e.target.value)}
        onFocus={() => query && setOpen(true)}
        placeholder="Search everything…"
        className="w-full rounded border border-neutral-300 px-3 py-1.5 text-sm"
      />
      {open && results.length > 0 && (
        <div className="absolute z-30 mt-1 max-h-80 w-full overflow-y-auto rounded border border-neutral-200 bg-white shadow-lg">
          {results.map((r) => (
            <a
              key={r.id}
              href={`/folder/${r.folder_id}`}
              onClick={() => setOpen(false)}
              className="block border-b border-neutral-100 px-3 py-2 text-sm last:border-0 hover:bg-neutral-50"
            >
              <div className="truncate font-medium">{r.title || r.url || '(untitled note)'}</div>
              <div className="text-xs capitalize text-neutral-400">{r.type}</div>
            </a>
          ))}
        </div>
      )}
      {open && query.trim() && results.length === 0 && (
        <div className="absolute z-30 mt-1 w-full rounded border border-neutral-200 bg-white px-3 py-2 text-sm text-neutral-400 shadow-lg">
          No results
        </div>
      )}
    </div>
  );
}
