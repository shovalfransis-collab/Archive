'use client';

import { useEffect, useRef } from 'react';

// The draggable "＋ Archive" bookmarklet button. React refuses to render
// `javascript:` links (a security measure), so the link's address is set
// directly on the element after it appears. `code` is the full
// javascript:… bookmarklet, built on the server (app/save-anywhere/page.js).
export default function BookmarkletButton({ code }) {
  const ref = useRef(null);

  useEffect(() => {
    ref.current?.setAttribute('href', code);
  }, [code]);

  return (
    <a
      ref={ref}
      // Clicking it here (instead of dragging) would save this page, so stop that.
      onClick={(e) => e.preventDefault()}
      className="inline-block cursor-grab rounded-full bg-neutral-900 px-4 py-2 text-sm font-medium text-white dark:bg-neutral-100 dark:text-neutral-900"
      title="Drag me to your bookmarks bar"
    >
      ＋ Archive
    </a>
  );
}
