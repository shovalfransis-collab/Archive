import { notFound } from 'next/navigation';
import { getFolder, getFolders, getItems, getAllFolders } from '@/lib/db';
import FolderTile from '@/components/FolderTile';
import ItemCard from '@/components/ItemCard';
import NewFolderButton from '@/components/NewFolderButton';
import Breadcrumbs from '@/components/Breadcrumbs';

// See app/page.js for why this is forced dynamic rather than cached.
export const dynamic = 'force-dynamic';

export default async function FolderPage({ params }) {
  // In current Next.js, route params arrive as a Promise (so the
  // framework can start streaming the page before they're resolved) —
  // that's why this needs an `await` here.
  const { id: idParam } = await params;
  const id = Number(idParam);
  const folder = await getFolder(id);
  if (!folder) notFound();

  // allFolders is used for breadcrumbs and the "move to folder" picker on
  // each item, so we only need one query for the whole tree.
  const [subfolders, items, allFolders] = await Promise.all([
    getFolders(id),
    getItems(id),
    getAllFolders(),
  ]);

  return (
    <div>
      <Breadcrumbs folder={folder} allFolders={allFolders} />

      <div className="mb-4 mt-2 flex items-center justify-between">
        <h1 className="text-xl font-semibold">{folder.name}</h1>
        <NewFolderButton parentId={id} />
      </div>

      {subfolders.length > 0 && (
        <div className="mb-6 grid grid-cols-2 gap-4 sm:grid-cols-3 md:grid-cols-4 lg:grid-cols-6">
          {subfolders.map((f) => (
            <FolderTile key={f.id} folder={f} />
          ))}
        </div>
      )}

      {items.length === 0 && subfolders.length === 0 ? (
        <p className="text-neutral-500 dark:text-neutral-400">This folder is empty.</p>
      ) : (
        <div className="grid grid-cols-2 gap-4 sm:grid-cols-3 md:grid-cols-4">
          {items.map((item) => (
            <ItemCard key={item.id} item={item} allFolders={allFolders} />
          ))}
        </div>
      )}
    </div>
  );
}
