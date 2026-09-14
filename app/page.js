import { getFolders } from '@/lib/db';
import FolderTile from '@/components/FolderTile';
import NewFolderButton from '@/components/NewFolderButton';

// Always render this page fresh on each visit instead of caching a
// snapshot at build/deploy time — folders change constantly as you use
// the app, so a stale cached version would be actively wrong.
export const dynamic = 'force-dynamic';

// The "desktop" home view: your top-level folders, shown as tiles. This is
// a Server Component — it reads straight from the database on the server
// before the page is sent to the browser, no separate API call needed for
// the initial load.
export default async function HomePage() {
  const folders = await getFolders(null);

  return (
    <div>
      <div className="mb-4 flex items-center justify-between">
        <h1 className="text-xl font-semibold">My Archive</h1>
        <NewFolderButton parentId={null} />
      </div>

      {folders.length === 0 ? (
        <p className="text-neutral-500 dark:text-neutral-400">No folders yet — create one to get started.</p>
      ) : (
        <div className="grid grid-cols-2 gap-4 sm:grid-cols-3 md:grid-cols-4 lg:grid-cols-6">
          {folders.map((folder) => (
            <FolderTile key={folder.id} folder={folder} />
          ))}
        </div>
      )}
    </div>
  );
}
