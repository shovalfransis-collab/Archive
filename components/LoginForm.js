'use client';

import { useState } from 'react';
import { useRouter } from 'next/navigation';

// The PIN form. `nextPath` is where to go after logging in — already
// checked to be a page on this site (see app/login/page.js).
export default function LoginForm({ nextPath = '/' }) {
  const [pin, setPin] = useState('');
  const [error, setError] = useState('');
  const [submitting, setSubmitting] = useState(false);
  const router = useRouter();

  async function handleSubmit(e) {
    e.preventDefault();
    setError('');
    setSubmitting(true);

    let res;
    try {
      res = await fetch('/api/login', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ pin }),
      });
    } catch {
      setSubmitting(false);
      setError('Couldn’t reach the server — check your connection.');
      return;
    }

    setSubmitting(false);

    if (res.ok) {
      router.replace(nextPath);
      router.refresh();
      return;
    }
    // The server explains what went wrong: wrong PIN (and how many tries
    // are left), or locked out for a while after too many wrong ones.
    const data = await res.json().catch(() => null);
    setError(data?.error || 'Wrong PIN — try again.');
    if (res.status === 429) setPin('');
  }

  return (
    <div className="flex min-h-screen items-center justify-center p-4">
      <form onSubmit={handleSubmit} className="w-full max-w-xs space-y-3 text-center">
        <div className="mb-2 text-4xl">🗄️</div>
        <h1 className="mb-4 text-lg font-semibold">The Archive</h1>
        <input
          type="password"
          inputMode="numeric"
          autoFocus
          value={pin}
          onChange={(e) => setPin(e.target.value)}
          placeholder="Enter PIN"
          className="w-full rounded border border-neutral-300 px-3 py-2 text-center text-lg tracking-widest dark:border-neutral-700 dark:bg-neutral-800 dark:text-neutral-100"
        />
        {error && <p className="text-sm text-red-600 dark:text-red-400">{error}</p>}
        <button
          type="submit"
          disabled={submitting}
          className="w-full rounded bg-neutral-900 py-2 text-white disabled:opacity-50 dark:bg-neutral-100 dark:text-neutral-900"
        >
          {submitting ? 'Checking…' : 'Unlock'}
        </button>
      </form>
    </div>
  );
}
