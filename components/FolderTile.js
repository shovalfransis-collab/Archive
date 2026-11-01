'use client';

import { useRef, useState } from 'react';
import { useRouter } from 'next/navigation';
import Link from 'next/link';
import MoveFolderModal from './MoveFolderModal';
import { dragSourceProps, useFolderDropTarget, DROP_HIGHLIGHT } from './dragAndDrop';
import { apiRequest } from '@/lib/apiClient';
import { showError } from '@/lib/toast';
import { useDismiss, useEscape } from './useDismiss';

// A small palette of common folder emoji, plus the input below lets you
// type/paste any other emoji.
const ICON_CHOICES = ['📁', '⭐', '📌', '💼', '🎬', '🎵', '📚', '🖼️', '🍳', '✈️', '💡', '🎮'];

// A single folder tile on the desktop/folder view, with a hover menu for
// rename/move/delete/change icon. `allFolders` (every folder, flat) is
// needed for the "Move to…" picker.
export default function FolderTile({ folder, allFolders = [] }) {
  const [menuOpen, setMenuOpen] = useState(false);
  const [moving, setMoving] = useState(false);
  const [renaming, setRenaming] = useState(false);
  const [pickingIcon, setPickingIcon] = useState(false);
  const [name, setName] = useState(folder.name);
  const [customIcon, setCustomIcon] = useState('');
  const router = useRouter();
  // Drag this folder onto another one to move it there; drop items or other
  // folders onto this one to move them in.
  const { isOver, dropProps } = useFolderDropTarget(folder.id, allFolders);

  // The ⋯ menu closes on a tap outside it or Esc; Esc also cancels
  // renaming / icon picking.
  const menuRef = useRef(null);
  useDismiss(menuOpen, () => setMenuOpen(false), menuRef);
  useEscape(renaming, () => {
    setRenaming(false);
    setName(folder.name);
  });
  useEscape(pickingIcon, () => setPickingIcon(false));

  // Each action below shows a message if the server says no (e.g. an empty
  // name) and leaves the form open, so nothing silently fails.
  async function handleRename(e) {
    e.preventDefault();
    try {
      await apiRequest(`/api/folders/${folder.id}`, { method: 'PATCH', body: { name } });
    } catch (err) {
      showError(`Couldn’t rename: ${err.message}`);
      return;
    }
    setRenaming(false);
    setMenuOpen(false);
    router.refresh();
  }

  async function handleIconChange(icon) {
    try {
      await apiRequest(`/api/folders/${folder.id}`, { method: 'PATCH', body: { icon } });
    } catch (err) {
      showError(`Couldn’t change the icon: ${err.message}`);
      return;
    }
    setPickingIcon(false);
    setMenuOpen(false);
    setCustomIcon('');
    router.refresh();
  }

  async function handleDelete() {
    setMenuOpen(false);
    if (!confirm(`Delete "${folder.name}" and everything inside it? This can't be undone.`)) return;
    try {
      await apiRequest(`/api/folders/${folder.id}`, { method: 'DELETE' });
    } catch (err) {
      showError(`Couldn’t delete “${folder.name}”: ${err.message}`);
      return;
    }
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

  if (pickingIcon) {
    return (
      <div className="flex flex-col items-center gap-2 rounded-lg border border-neutral-200 p-3 dark:border-neutral-700">
        <div className="grid grid-cols-4 gap-1">
          {ICON_CHOICES.map((icon) => (
            <button
              key={icon}
              type="button"
              onClick={() => handleIconChange(icon)}
              className="rounded p-1 text-xl hover:bg-neutral-100 dark:hover:bg-neutral-700"
              aria-label={`Use ${icon} icon`}
            >
              {icon}
            </button>
          ))}
        </div>
        <form
          onSubmit={(e) => {
            e.preventDefault();
            if (customIcon.trim()) handleIconChange(customIcon.trim());
          }}
          className="flex w-full gap-1"
        >
          <input
            value={customIcon}
            onChange={(e) => setCustomIcon(e.target.value)}
            placeholder="Or type an emoji"
            className="w-full rounded border border-neutral-300 px-1 text-center text-sm dark:border-neutral-700 dark:bg-neutral-800 dark:text-neutral-100"
          />
          <button
            type="submit"
            className="rounded bg-neutral-900 px-2 py-0.5 text-xs text-white dark:bg-neutral-100 dark:text-neutral-900"
          >
            Set
          </button>
        </form>
        <button
          type="button"
          onClick={() => setPickingIcon(false)}
          className="rounded border px-2 py-0.5 text-xs dark:border-neutral-700"
        >
          Cancel
        </button>
      </div>
    );
  }

  return (
    <div
      className="group relative"
      {...dragSourceProps({ kind: 'folder', id: folder.id, parentId: folder.parent_id ?? null })}
      {...dropProps}
    >
      <Link
        href={`/folder/${folder.id}`}
        draggable={false}
        className={`flex flex-col items-center gap-1 rounded-lg border border-neutral-200 p-3 text-center hover:bg-neutral-50 dark:border-neutral-700 dark:hover:bg-neutral-800 ${isOver ? DROP_HIGHLIGHT : ''}`}
      >
        <span className="text-4xl">{folder.icon || '📁'}</span>
        <span className="w-full break-words text-sm">{folder.name}</span>
      </Link>
      {/* Button and menu share one wrapper, so tapping ⋯ again isn't an
          "outside" tap. `contents` keeps it out of the layout. */}
      <div ref={menuRef} className="contents">
        <button
          onClick={() => setMenuOpen((v) => !v)}
          className={`absolute right-1 top-1 rounded px-1 text-neutral-500 pointer-coarse:px-2 pointer-coarse:py-0.5 dark:text-neutral-400 ${menuOpen ? 'opacity-100' : 'opacity-0 group-hover:opacity-100 focus-visible:opacity-100 pointer-coarse:opacity-100'}`}
          aria-label="Folder options"
          aria-expanded={menuOpen}
        >
          ⋯
        </button>
        {menuOpen && (
          <div className="absolute right-1 top-7 z-10 rounded border border-neutral-200 bg-white text-sm shadow dark:border-neutral-700 dark:bg-neutral-800">
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
              onClick={() => {
                setMoving(true);
                setMenuOpen(false);
              }}
              className="block w-full px-3 py-1 text-left hover:bg-neutral-50 dark:hover:bg-neutral-700"
            >
              Move to…
            </button>
            <button
              onClick={() => {
                setPickingIcon(true);
                setMenuOpen(false);
              }}
              className="block w-full px-3 py-1 text-left hover:bg-neutral-50 dark:hover:bg-neutral-700"
            >
              Change icon
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
      {moving && (
        <MoveFolderModal folder={folder} allFolders={allFolders} onClose={() => setMoving(false)} />
      )}
    </div>
  );
}
