'use client';

import { useState } from 'react';
import Link from 'next/link';
import { useRouter } from 'next/navigation';
import MoveToFolderModal from './MoveToFolderModal';
import NoteViewModal from './NoteViewModal';
import ItemNoteModal from './ItemNoteModal';
import { dragSourceProps } from './dragAndDrop';

// Shown under any item type when the AI auto-sort agent (lib/ai.js) tagged
// it with a summary and/or tags. Absent for manually-filed items.
function AiMetadata({ item }) {
  if (!item.summary && !(item.tags && item.tags.length)) return null;
  return (
    <div className="px-3 pb-2">
      {item.summary && (
        <p className="text-xs text-neutral-500 dark:text-neutral-400">🤖 {item.summary}</p>
      )}
      {item.tags && item.tags.length > 0 && (
        <div className="mt-1 flex flex-wrap gap-1">
          {item.tags.map((tag) => (
            <Link
              key={tag}
              href={`/tag/${encodeURIComponent(tag)}`}
              draggable={false}
              className="rounded-full bg-neutral-100 px-2 py-0.5 text-[10px] text-neutral-600 hover:bg-neutral-200 dark:bg-neutral-700 dark:text-neutral-300 dark:hover:bg-neutral-600"
            >
              #{tag}
            </Link>
          ))}
        </div>
      )}
    </div>
  );
}

// Renders one saved item — a link, photo, or note — with a preview
// appropriate to its type, plus a hover menu for move/delete.
//
// `showFolder` adds an "in <folder>" line at the bottom — used on pages that
// mix items from many folders (a tag page, Recent), where it's otherwise
// unclear where each one lives. Needs `item.folder_name` from the query.
export default function ItemCard({ item, allFolders, showFolder = false }) {
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
    <div
      {...dragSourceProps({ kind: 'item', id: item.id, folderId: item.folder_id })}
      className="group relative cursor-grab rounded-lg border border-neutral-200 bg-white active:cursor-grabbing dark:border-neutral-700 dark:bg-neutral-800"
    >
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
            <img src={item.image_url} alt={item.title || ''} draggable={false} className="h-32 w-full object-cover" />
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
          <AiMetadata item={item} />
        </>
      )}

      {item.type === 'link' && (
        <a href={item.url} target="_blank" rel="noopener noreferrer" draggable={false} className="block p-3">
          <div className="mb-1 flex items-center gap-2">
            {item.favicon_url && (
              // eslint-disable-next-line @next/next/no-img-element
              <img src={item.favicon_url} alt="" draggable={false} className="h-4 w-4" />
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
      {item.type === 'link' && <AiMetadata item={item} />}

      {item.type === 'note' && (
        <button onClick={() => setViewingNote(true)} className="block w-full p-3 text-left">
          <p className="line-clamp-6 whitespace-pre-wrap text-sm">{item.content}</p>
        </button>
      )}
      {item.type === 'note' && <AiMetadata item={item} />}

      {item.type === 'file' && (
        <a href={item.image_url} target="_blank" rel="noopener noreferrer" draggable={false} className="block p-3">
          <div className="flex items-center gap-2">
            <span className="text-xl leading-none">📎</span>
            <span className="truncate text-sm font-medium">{item.title || 'File'}</span>
          </div>
          {item.note && (
            <p className="mt-1 line-clamp-2 text-xs italic text-neutral-600 dark:text-neutral-400">
              📝 {item.note}
            </p>
          )}
        </a>
      )}
      {item.type === 'file' && <AiMetadata item={item} />}

      {showFolder && item.folder_id && (
        <Link
          href={`/folder/${item.folder_id}`}
          draggable={false}
          className="block truncate border-t border-neutral-100 px-3 py-1.5 text-[11px] text-neutral-400 hover:text-neutral-700 dark:border-neutral-700 dark:hover:text-neutral-200"
        >
          in 📁 {item.folder_name || 'a folder'}
        </Link>
      )}

      {moving && (
        <MoveToFolderModal item={item} allFolders={allFolders} onClose={() => setMoving(false)} />
      )}
      {viewingNote && <NoteViewModal item={item} onClose={() => setViewingNote(false)} />}
      {editingNote && <ItemNoteModal item={item} onClose={() => setEditingNote(false)} />}
    </div>
  );
}
