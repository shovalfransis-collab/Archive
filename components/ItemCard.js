'use client';

import { useState } from 'react';
import { useRouter } from 'next/navigation';
import MoveToFolderModal from './MoveToFolderModal';
import NoteViewModal from './NoteViewModal';

// Renders one saved item — a link, photo, or note — with a preview
// appropriate to its type, plus a hover menu for move/delete.
export default function ItemCard({ item, allFolders }) {
  const [menuOpen, setMenuOpen] = useState(false);
  const [moving, setMoving] = useState(false);
  const [viewingNote, setViewingNote] = useState(false);
  const router = useRouter();

  async function handleDelete() {
    if (!confirm('Delete this item?')) return;
    await fetch(`/api/items/${item.id}`, { method: 'DELETE' });
    router.refresh();
  }

  return (
    <div className="group relative overflow-hidden rounded-lg border border-neutral-200 bg-white">
      <button
        onClick={() => setMenuOpen((v) => !v)}
        className="absolute right-1 top-1 z-10 rounded bg-white/80 px-1 text-neutral-500 opacity-0 group-hover:opacity-100"
        aria-label="Item options"
      >
        ⋯
      </button>
      {menuOpen && (
        <div className="absolute right-1 top-6 z-10 rounded border border-neutral-200 bg-white text-sm shadow">
          <button
            onClick={() => {
              setMoving(true);
              setMenuOpen(false);
            }}
            className="block w-full px-3 py-1 text-left hover:bg-neutral-50"
          >
            Move to folder…
          </button>
          <button
            onClick={handleDelete}
            className="block w-full px-3 py-1 text-left text-red-600 hover:bg-neutral-50"
          >
            Delete
          </button>
        </div>
      )}

      {item.type === 'photo' && (
        <>
          {/* eslint-disable-next-line @next/next/no-img-element */}
          <img src={item.image_url} alt={item.title || ''} className="h-32 w-full object-cover" />
          {item.title && <p className="truncate px-2 py-1 text-xs text-neutral-500">{item.title}</p>}
        </>
      )}

      {item.type === 'link' && (
        <a href={item.url} target="_blank" rel="noopener noreferrer" className="block p-3">
          <div className="mb-1 flex items-center gap-2">
            {item.favicon_url && (
              // eslint-disable-next-line @next/next/no-img-element
              <img src={item.favicon_url} alt="" className="h-4 w-4" />
            )}
            <span className="truncate text-sm font-medium">{item.title || item.url}</span>
          </div>
          {item.description && (
            <p className="line-clamp-2 text-xs text-neutral-500">{item.description}</p>
          )}
        </a>
      )}

      {item.type === 'note' && (
        <button onClick={() => setViewingNote(true)} className="block w-full p-3 text-left">
          <p className="line-clamp-6 whitespace-pre-wrap text-sm">{item.content}</p>
        </button>
      )}

      {moving && (
        <MoveToFolderModal item={item} allFolders={allFolders} onClose={() => setMoving(false)} />
      )}
      {viewingNote && <NoteViewModal item={item} onClose={() => setViewingNote(false)} />}
    </div>
  );
}
