'use client';

import Link from 'next/link';
import { usePathname } from 'next/navigation';
import SearchBar from './SearchBar';
import QuickAddModal from './QuickAddModal';
import ThemeToggle from './ThemeToggle';
import HeaderMenu from './HeaderMenu';

// Wraps every page with the header bar (logo, search, quick-add, menu) —
// except the login and share-save pages, which should be a blank slate.
// This has to be a Client Component (not the root layout itself) because
// it needs usePathname() to know which page it's on.
export default function AppShell({ children }) {
  const pathname = usePathname();

  // These pages are full-screen on their own: the PIN screen, and the
  // save-from-share screens (which often open in a small popup).
  if (pathname === '/login' || pathname === '/add' || pathname === '/share') {
    return children;
  }

  // If we're inside a folder, quick-add should default to adding into
  // *that* folder rather than asking you to pick one every time.
  const folderMatch = pathname.match(/^\/folder\/(\d+)/);
  const currentFolderId = folderMatch ? Number(folderMatch[1]) : null;

  return (
    <div>
      <header className="sticky top-0 z-20 flex items-center gap-3 border-b border-neutral-200 bg-white/90 px-4 py-3 backdrop-blur dark:border-neutral-800 dark:bg-neutral-900/90">
        <Link href="/" className="shrink-0 text-lg font-semibold">
          🗄️ The Archive
        </Link>
        <div className="flex-1">
          <SearchBar />
        </div>
        <QuickAddModal currentFolderId={currentFolderId} />
        <ThemeToggle />
        <HeaderMenu />
      </header>
      <main className="p-4">{children}</main>
    </div>
  );
}
