'use client'; // error pages must run in the browser

import { useEffect } from 'react';
import Link from 'next/link';

// Shown when a page crashes — most often because the database couldn't be
// reached. The header stays, so you can still search or go home.
// `retry` asks the server for the page again (new in this Next.js version;
// it used to be called `reset`).
export default function Error({ error, retry }) {
  useEffect(() => {
    console.error(error);
  }, [error]);

  return (
    <div className="mx-auto max-w-md py-16 text-center">
      <div className="mb-3 text-4xl">⚠️</div>
      <h1 className="mb-2 text-lg font-semibold">Something went wrong</h1>
      <p className="mb-6 text-sm text-neutral-500 dark:text-neutral-400">
        This page couldn&apos;t load. It&apos;s usually a temporary hiccup — try again in a moment.
      </p>
      <div className="flex justify-center gap-2">
        <button
          onClick={() => retry()}
          className="rounded bg-neutral-900 px-3 py-1.5 text-sm text-white dark:bg-neutral-100 dark:text-neutral-900"
        >
          Try again
        </button>
        <Link
          href="/"
          className="rounded border border-neutral-300 px-3 py-1.5 text-sm hover:bg-neutral-50 dark:border-neutral-700 dark:hover:bg-neutral-800"
        >
          Go home
        </Link>
      </div>
      {error?.digest && (
        // A code that matches this error in the server logs (Vercel → Logs).
        <p className="mt-6 text-xs text-neutral-400">Error code: {error.digest}</p>
      )}
    </div>
  );
}
