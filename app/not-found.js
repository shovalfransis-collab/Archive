import Link from 'next/link';

// Shown for any address that doesn't exist in the app.
export default function NotFound() {
  return (
    <div className="mx-auto max-w-md py-16 text-center">
      <div className="mb-3 text-4xl">🔍</div>
      <h1 className="mb-2 text-lg font-semibold">Page not found</h1>
      <p className="mb-6 text-sm text-neutral-500 dark:text-neutral-400">
        There&apos;s nothing at this address.
      </p>
      <Link
        href="/"
        className="rounded bg-neutral-900 px-3 py-1.5 text-sm text-white dark:bg-neutral-100 dark:text-neutral-900"
      >
        Go home
      </Link>
    </div>
  );
}
