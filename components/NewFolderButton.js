'use client';

import { useState } from 'react';
import { useRouter } from 'next/navigation';

// A small "+ New folder" button that turns into an inline name field when
// clicked, rather than popping up a whole modal for something this simple.
export default function NewFolderButton({ parentId }) {
  const [adding, setAdding] = useState(false);
  const [name, setName] = useState('');
  const router = useRouter();

  async function handleSubmit(e) {
    e.preventDefault();
    if (!name.trim()) return;

    await fetch('/api/folders', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ name, parentId }),
    });

    setName('');
    setAdding(false);
    router.refresh(); // re-fetches the server-rendered folder list
  }

  if (!adding) {
    return (
      <button
        onClick={() => setAdding(true)}
        className="rounded border border-neutral-300 px-3 py-1 text-sm hover:bg-neutral-50"
      >
        + New folder
      </button>
    );
  }

  return (
    <form onSubmit={handleSubmit} className="flex gap-2">
      <input
        autoFocus
        value={name}
        onChange={(e) => setName(e.target.value)}
        onBlur={() => !name && setAdding(false)}
        placeholder="Folder name"
        className="rounded border border-neutral-300 px-2 py-1 text-sm"
      />
      <button type="submit" className="rounded bg-neutral-900 px-2 py-1 text-sm text-white">
        Add
      </button>
    </form>
  );
}
