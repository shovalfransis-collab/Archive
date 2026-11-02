import Link from 'next/link';

// Shown for /folder/<id> when that folder doesn't exist — usually because
// it (or a folder it was inside) was deleted, or an old link was opened.
export default function FolderNotFound() {
  return (
    <div className="mx-auto max-w-md py-16 text-center">
      <div className="mb-3 text-4xl">📁</div>
      <h1 className="mb-2 text-lg font-semibold">This folder doesn&apos;t exist</h1>
      <p className="mb-6 text-sm text-neutral-500 dark:text-neutral-400">
        It may have been deleted, or the link is out of date. Try searching for what was inside it.
      </p>
      <Link
        href="/"
        className="rounded bg-neutral-900 px-3 py-1.5 text-sm text-white dark:bg-neutral-100 dark:text-neutral-900"
      >
        Back to My Archive
      </Link>
    </div>
  );
}
