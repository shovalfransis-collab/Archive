'use client';

import { useEffect, useState } from 'react';

// Toggles a `.dark` class on <html>, persisted in localStorage so it
// survives reloads (falls back to the OS preference the very first time).
// The actual class is set as early as possible by the inline script in
// app/layout.js, so there's no flash of the wrong theme on load — this
// component just keeps the button's icon and future toggles in sync.
export default function ThemeToggle() {
  const [isDark, setIsDark] = useState(false);

  useEffect(() => {
    setIsDark(document.documentElement.classList.contains('dark'));
  }, []);

  function toggle() {
    const next = !isDark;
    setIsDark(next);
    document.documentElement.classList.toggle('dark', next);
    try {
      localStorage.setItem('theme', next ? 'dark' : 'light');
    } catch {
      // localStorage can throw in private-browsing modes — theme just
      // won't persist across reloads, which is fine.
    }
  }

  return (
    <button
      onClick={toggle}
      className="flex h-9 w-9 shrink-0 items-center justify-center rounded-full text-lg text-neutral-500 hover:bg-neutral-100 dark:text-neutral-400 dark:hover:bg-neutral-800"
      aria-label={isDark ? 'Switch to light mode' : 'Switch to dark mode'}
      title={isDark ? 'Switch to light mode' : 'Switch to dark mode'}
    >
      {isDark ? '☀️' : '🌙'}
    </button>
  );
}
