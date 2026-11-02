'use client';

import { usePathname, useRouter } from 'next/navigation';
import { SORT_OPTIONS, TYPE_OPTIONS, DEFAULT_SORT } from '@/lib/itemQuery';

// The "sort by" and "show only" dropdowns above a folder's items. The
// choice lives in the URL (?sort=…&type=…), so it survives a refresh and
// can be bookmarked; the server page reads it and does the sorting in the
// database query.
export default function ItemControls({ sort, type }) {
  const router = useRouter();
  const pathname = usePathname();

  function update(next) {
    const merged = { sort, type: type ?? 'all', ...next };
    const params = new URLSearchParams();
    // Leave defaults out so the plain folder URL stays clean.
    if (merged.sort !== DEFAULT_SORT) params.set('sort', merged.sort);
    if (merged.type !== 'all') params.set('type', merged.type);
    const query = params.toString();
    router.replace(query ? `${pathname}?${query}` : pathname, { scroll: false });
  }

  const selectClass =
    'rounded border border-neutral-300 bg-white px-2 py-1 text-sm dark:border-neutral-700 dark:bg-neutral-800 dark:text-neutral-100';

  return (
    <div className="mb-3 flex flex-wrap items-center gap-2">
      <label className="sr-only" htmlFor="item-sort">
        Sort items
      </label>
      <select
        id="item-sort"
        value={sort}
        onChange={(e) => update({ sort: e.target.value })}
        className={selectClass}
      >
        {SORT_OPTIONS.map((o) => (
          <option key={o.key} value={o.key}>
            {o.label}
          </option>
        ))}
      </select>
      <label className="sr-only" htmlFor="item-type">
        Show only
      </label>
      <select
        id="item-type"
        value={type ?? 'all'}
        onChange={(e) => update({ type: e.target.value })}
        className={selectClass}
      >
        {TYPE_OPTIONS.map((o) => (
          <option key={o.key} value={o.key}>
            {o.label}
          </option>
        ))}
      </select>
    </div>
  );
}
