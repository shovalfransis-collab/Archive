'use client';

import { useState } from 'react';
import { useRouter } from 'next/navigation';

// A single folder tile on the desktop/folder view, with a hover menu for
// rename/delete.
export default function FolderTile({ folder }) {
  const [menuOpen, setMenuOpen] = useState(false);
  const [renaming, setRenaming] = useState(false);
  const [name, setName] = useState(folder.name);
  const router = useRouter();

  async function handleRename(e) {
    e.preventDefault();
    await fetch(`/api/folders/${folder.id}`, {
      method: 'PATCH',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ name }),
    });
    setRenaming(false);
    setMenuOpen(false);
    router.refresh();
  }

  async function handleDelete() {
    if (!confirm(`Delete "${folder.name}" and everything inside it? This can't be undone.`)) return;
    await fetch(`/api/folders/${folder.id}`, { method: 'DELETE' });
    router.refresh();
  }

  if (renaming) {
    return (
      <form
        onSubmit={handleRename}
        className="flex flex-col items-center gap-1 rounded-lg border border-neutral-200 p-3 dark:border-neutral-700"
      >
        <input
          autoFocus
          value={name}
          onChange={(e) => setName(e.target.value)}
          className="w-full rounded border border-neutral-300 px-1 text-center text-sm dark:border-neutral-700 dark:bg-neutral-800 dark:text-neutral-100"
        />
        <div className="flex gap-1">
          <button
            type="submit"
            className="rounded bg-neutral-900 px-2 py-0.5 text-xs text-white dark:bg-neutral-100 dark:text-neutral-900"
          >
            Save
          </button>
          <button
            type="button"
            onClick={() => setRenaming(false)}
            className="rounded border px-2 py-0.5 text-xs dark:border-neutral-700"
          >
            Cancel
          </button>
        </div>
      </form>
    );
  }

  return (
    <div className="group relative">
      <a
        href={`/folder/${folder.id}`}
        className="flex flex-col items-center gap-1 rounded-lg border border-neutral-200 p-3 text-center hover:bg-neutral-50 dark:border-neutral-700 dark:hover:bg-neutral-800"
      >
        <span className="text-4xl">📁</span>
        <span className="w-full break-words text-sm">{folder.name}</span>
      </a>
      <button
        onClick={() => setMenuOpen((v) => !v)}
        className="absolute right-1 top-1 px-1 text-neutral-500 opacity-0 group-hover:opacity-100"
        aria-label="Folder options"
      >
        ⋯
      </button>
      {menuOpen && (
        <div className="absolute right-1 top-6 z-10 rounded border border-neutral-200 bg-white text-sm shadow dark:border-neutral-700 dark:bg-neutral-800">
          <button
            onClick={() => {
              setRenaming(true);
              setMenuOpen(false);
            }}
            className="block w-full px-3 py-1 text-left hover:bg-neutral-50 dark:hover:bg-neutral-700"
          >
            Rename
          </button>
          <button
            onClick={handleDelete}
            className="block w-full px-3 py-1 text-left text-red-600 hover:bg-neutral-50 dark:text-red-400 dark:hover:bg-neutral-700"
          >
            Delete
          </button>
        </div>
      )}
    </div>
  );
}
