import { getAllFolders, getRecentItems } from '@/lib/db';
import ItemCard from '@/components/ItemCard';

// See app/page.js for why this is forced dynamic rather than cached.
export const dynamic = 'force-dynamic';

// The latest things you saved, from any folder — so something you just
// added (or the AI just filed) is easy to find. Reached from the ☰ menu.
export default async function RecentPage() {
  const [items, allFolders] = await Promise.all([getRecentItems(60), getAllFolders()]);

  return (
    <div>
      <h1 className="mb-4 text-xl font-semibold">Recent</h1>

      {items.length === 0 ? (
        <p className="text-neutral-500 dark:text-neutral-400">Nothing saved yet.</p>
      ) : (
        <div className="grid grid-cols-2 gap-4 sm:grid-cols-3 md:grid-cols-4 lg:grid-cols-6">
          {items.map((item) => (
            <ItemCard key={item.id} item={item} allFolders={allFolders} showFolder />
          ))}
        </div>
      )}
    </div>
  );
}
