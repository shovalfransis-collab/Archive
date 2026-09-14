'use client';

import { usePathname, useRouter } from 'next/navigation';
import SearchBar from './SearchBar';
import QuickAddModal from './QuickAddModal';

// Wraps every page with the header bar (logo, search, quick-add, logout) —
// except the login page, which should be a blank slate. This has to be a
// Client Component (not the root layout itself) because it needs
// usePathname() to know which page it's on.
export default function AppShell({ children }) {
  const pathname = usePathname();
  const router = useRouter();

  if (pathname === '/login') {
    return children;
  }

  // If we're inside a folder, quick-add should default to adding into
  // *that* folder rather than asking you to pick one every time.
  const folderMatch = pathname.match(/^\/folder\/(\d+)/);
  const currentFolderId = folderMatch ? Number(folderMatch[1]) : null;

  async function handleLogout() {
    await fetch('/api/logout', { method: 'POST' });
    router.push('/login');
    router.refresh();
  }

  return (
    <div>
      <header className="sticky top-0 z-20 flex items-center gap-3 border-b border-neutral-200 bg-white/90 px-4 py-3 backdrop-blur">
        <a href="/" className="shrink-0 text-lg font-semibold">
          🗄️ The Archive
        </a>
        <div className="flex-1">
          <SearchBar />
        </div>
        <QuickAddModal currentFolderId={currentFolderId} />
        <button
          onClick={handleLogout}
          className="shrink-0 text-sm text-neutral-500 hover:text-neutral-900"
        >
          Log out
        </button>
      </header>
      <main className="p-4">{children}</main>
    </div>
  );
}
