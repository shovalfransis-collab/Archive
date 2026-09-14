'use client';

import { useRouter } from 'next/navigation';
import { flattenWithDepth } from '@/lib/folderTree';

// A simple folder picker used to move an item. Drag-and-drop was the
// stretch goal in the spec; this button-based picker covers the same need
// and works identically on touch and desktop, so it's the v1 approach.
export default function MoveToFolderModal({ item, allFolders, onClose }) {
  const router = useRouter();
  const flatFolders = flattenWithDepth(allFolders);

  async function handleMove(folderId) {
    await fetch(`/api/items/${item.id}`, {
      method: 'PATCH',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ folderId }),
    });
    onClose();
    router.refresh();
  }

  return (
    <div
      className="fixed inset-0 z-30 flex items-center justify-center bg-black/40 p-4"
      onClick={onClose}
    >
      <div
        className="max-h-[70vh] w-full max-w-sm overflow-y-auto rounded-lg bg-white p-4 shadow-lg"
        onClick={(e) => e.stopPropagation()}
      >
        <h2 className="mb-2 font-semibold">Move to…</h2>
        <div className="space-y-1">
          {flatFolders.length === 0 && (
            <p className="text-sm text-neutral-500">No folders yet.</p>
          )}
          {flatFolders.map((f) => (
            <button
              key={f.id}
              onClick={() => handleMove(f.id)}
              className="block w-full rounded px-2 py-1 text-left text-sm hover:bg-neutral-50"
              style={{ paddingLeft: `${8 + f.depth * 16}px` }}
            >
              📁 {f.name}
            </button>
          ))}
        </div>
      </div>
    </div>
  );
}
