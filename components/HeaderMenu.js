'use client';

import { useEffect, useRef, useState } from 'react';
import Link from 'next/link';
import { useRouter } from 'next/navigation';

// The "☰" menu at the right of the header, for things you don't need on
// every visit — keeps the header uncluttered, especially on a phone.
export default function HeaderMenu() {
  const [open, setOpen] = useState(false);
  const boxRef = useRef(null);
  const router = useRouter();

  // Close when clicking anywhere outside the menu, or pressing Esc.
  useEffect(() => {
    if (!open) return;
    function onPointerDown(e) {
      if (boxRef.current && !boxRef.current.contains(e.target)) setOpen(false);
    }
    function onKeyDown(e) {
      if (e.key === 'Escape') setOpen(false);
    }
    document.addEventListener('mousedown', onPointerDown);
    document.addEventListener('keydown', onKeyDown);
    return () => {
      document.removeEventListener('mousedown', onPointerDown);
      document.removeEventListener('keydown', onKeyDown);
    };
  }, [open]);

  async function handleLogout() {
    setOpen(false);
    await fetch('/api/logout', { method: 'POST' });
    router.push('/login');
    router.refresh();
  }

  const itemClass =
    'block w-full px-4 py-2 text-left text-sm hover:bg-neutral-50 dark:hover:bg-neutral-700';

  return (
    <div ref={boxRef} className="relative shrink-0">
      <button
        onClick={() => setOpen((v) => !v)}
        aria-label="Menu"
        aria-expanded={open}
        className="flex h-9 w-9 items-center justify-center rounded-full text-lg text-neutral-500 hover:bg-neutral-100 dark:text-neutral-400 dark:hover:bg-neutral-800"
      >
        ☰
      </button>
      {open && (
        <div className="absolute right-0 top-11 z-30 w-56 overflow-hidden rounded-lg border border-neutral-200 bg-white shadow-lg dark:border-neutral-700 dark:bg-neutral-800">
          <Link href="/save-anywhere" onClick={() => setOpen(false)} className={itemClass}>
            📲 Save from anywhere…
          </Link>
          <button onClick={handleLogout} className={`${itemClass} border-t border-neutral-100 dark:border-neutral-700`}>
            Log out
          </button>
        </div>
      )}
    </div>
  );
}
