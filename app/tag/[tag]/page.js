import Link from 'next/link';
import { getItemsByTag, getAllFolders } from '@/lib/db';
import ItemCard from '@/components/ItemCard';

// See app/page.js for why this is forced dynamic rather than cached.
export const dynamic = 'force-dynamic';

// The tag arrives from the URL (/tag/some%20tag). Depending on the
// Next.js version it may or may not already be decoded, so decode it
// defensively and fall back to the raw value if it isn't valid encoding.
function safeDecode(value) {
  try {
    return decodeURIComponent(value);
  } catch {
    return value;
  }
}

// Every item with one tag, from every folder — reached by clicking a tag
// chip on any item card.
export default async function TagPage({ params }) {
  const { tag: tagParam } = await params;
  const tag = safeDecode(tagParam);

  const [items, allFolders] = await Promise.all([getItemsByTag(tag), getAllFolders()]);

  return (
    <div>
      <nav className="text-sm text-neutral-500 dark:text-neutral-400">
        <Link href="/" className="hover:underline">
          Home
        </Link>
        {' / '}
        <span>Tag</span>
      </nav>

      <h1 className="mb-4 mt-2 text-xl font-semibold">
        #{tag}{' '}
        <span className="text-sm font-normal text-neutral-500 dark:text-neutral-400">
          {items.length} {items.length === 1 ? 'item' : 'items'}
        </span>
      </h1>

      {items.length === 0 ? (
        <p className="text-neutral-500 dark:text-neutral-400">Nothing is tagged #{tag}.</p>
      ) : (
        <div className="grid grid-cols-2 gap-4 sm:grid-cols-3 md:grid-cols-4">
          {items.map((item) => (
            <ItemCard key={item.id} item={item} allFolders={allFolders} showFolder />
          ))}
        </div>
      )}
    </div>
  );
}
