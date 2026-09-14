'use client';

import { useState } from 'react';
import { useRouter } from 'next/navigation';
import MoveToFolderModal from './MoveToFolderModal';
import NoteViewModal from './NoteViewModal';
import ItemNoteModal from './ItemNoteModal';

// Renders one saved item — a link, photo, or note — with a preview
// appropriate to its type, plus a hover menu for move/delete.
export default function ItemCard({ item, allFolders }) {
  const [menuOpen, setMenuOpen] = useState(false);
  const [moving, setMoving] = useState(false);
  const [viewingNote, setViewingNote] = useState(false);
  const [editingNote, setEditingNote] = useState(false);
  const router = useRouter();

  async function handleDelete() {
    if (!confirm('Delete this item?')) return;
    await fetch(`/api/items/${item.id}`, { method: 'DELETE' });
    router.refresh();
  }

  return (
    <div className="group relative rounded-lg border border-neutral-200 bg-white dark:border-neutral-700 dark:bg-neutral-800">
      <button
        onClick={() => setMenuOpen((v) => !v)}
        className="absolute right-1 top-1 z-10 rounded bg-white/80 px-1 text-neutral-500 opacity-0 group-hover:opacity-100 dark:bg-neutral-800/80 dark:text-neutral-400"
        aria-label="Item options"
      >
        ⋯
      </button>
      {menuOpen && (
        <div className="absolute right-1 top-6 z-10 whitespace-nowrap rounded border border-neutral-200 bg-white text-sm shadow dark:border-neutral-700 dark:bg-neutral-800">
          {item.type !== 'note' && (
            <button
              onClick={() => {
                setEditingNote(true);
                setMenuOpen(false);
              }}
              className="block w-full px-3 py-1 text-left hover:bg-neutral-50 dark:hover:bg-neutral-700"
            >
              {item.note ? 'Edit note' : 'Add a note…'}
            </button>
          )}
          <button
            onClick={() => {
              setMoving(true);
              setMenuOpen(false);
            }}
            className="block w-full px-3 py-1 text-left hover:bg-neutral-50 dark:hover:bg-neutral-700"
          >
            Move to folder…
          </button>
          <button
            onClick={handleDelete}
            className="block w-full px-3 py-1 text-left text-red-600 hover:bg-neutral-50 dark:text-red-400 dark:hover:bg-neutral-700"
          >
            Delete
          </button>
        </div>
      )}

      {item.type === 'photo' && (
        <>
          <div className="overflow-hidden rounded-t-lg">
            {/* eslint-disable-next-line @next/next/no-img-element */}
            <img src={item.image_url} alt={item.title || ''} className="h-32 w-full object-cover" />
          </div>
          {item.title && (
            <p className="truncate px-2 py-1 text-xs text-neutral-500 dark:text-neutral-400">
              {item.title}
            </p>
          )}
          {item.note && (
            <p className="line-clamp-2 px-2 pb-1 text-xs italic text-neutral-600 dark:text-neutral-400">
              📝 {item.note}
            </p>
          )}
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
            <p className="line-clamp-2 text-xs text-neutral-500 dark:text-neutral-400">
              {item.description}
            </p>
          )}
          {item.note && (
            <p className="mt-1 line-clamp-2 text-xs italic text-neutral-600 dark:text-neutral-400">
              📝 {item.note}
            </p>
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
      {editingNote && <ItemNoteModal item={item} onClose={() => setEditingNote(false)} />}
    </div>
  );
}
