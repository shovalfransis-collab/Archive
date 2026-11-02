'use client';

import { useState } from 'react';
import { createPortal } from 'react-dom';
import { flattenWithDepth } from '@/lib/folderTree';
import { useEscape } from './useDismiss';

// A folder picker shown as a modal, shared by "move item" and "move folder".
//
// - `disabledIds`: folders shown greyed out and not clickable (e.g. a
//   folder's own subfolders, where it can't be moved).
// - `currentId`: where the thing lives now — marked "(current)".
//   Use null for "top level".
// - `allowTopLevel`: adds a "Top level" choice (folders only — items
//   always live inside a folder).
// - `onPick(folderIdOrNull)`: should return a Promise; if it throws, the
//   error message is shown here and the modal stays open.
export default function FolderPickerModal({
  title = 'Move to…',
  allFolders,
  disabledIds = new Set(),
  currentId,
  allowTopLevel = false,
  onPick,
  onClose,
}) {
  const [error, setError] = useState('');
  const [busy, setBusy] = useState(false);
  const flatFolders = flattenWithDepth(allFolders);
  useEscape(true, onClose);

  async function pick(id) {
    setBusy(true);
    setError('');
    try {
      await onPick(id);
    } catch (err) {
      setError(err.message || 'Something went wrong.');
      setBusy(false);
    }
  }

  const rowClass =
    'block w-full rounded px-2 py-1 text-left text-sm hover:bg-neutral-50 disabled:cursor-not-allowed disabled:opacity-40 disabled:hover:bg-transparent dark:hover:bg-neutral-700';

  // Rendered at the end of <body> (a portal) rather than inside the card
  // that opened it: cards are draggable, and selecting text in here
  // shouldn't start dragging the card underneath.
  return createPortal(
    <div
      className="fixed inset-0 z-30 flex items-center justify-center bg-black/40 p-4"
      onClick={onClose}
    >
      <div
        className="max-h-[70vh] w-full max-w-sm overflow-y-auto rounded-lg bg-white p-4 shadow-lg dark:bg-neutral-800"
        onClick={(e) => e.stopPropagation()}
      >
        <h2 className="mb-2 font-semibold">{title}</h2>
        {error && <p className="mb-2 text-sm text-red-600 dark:text-red-400">{error}</p>}
        <div className="space-y-1">
          {allowTopLevel && (
            <button
              onClick={() => pick(null)}
              disabled={busy || currentId === null}
              className={rowClass}
            >
              🏠 Top level{currentId === null ? ' (current)' : ''}
            </button>
          )}
          {flatFolders.length === 0 && !allowTopLevel && (
            <p className="text-sm text-neutral-500 dark:text-neutral-400">No folders yet.</p>
          )}
          {flatFolders.map((f) => (
            <button
              key={f.id}
              onClick={() => pick(f.id)}
              disabled={busy || disabledIds.has(f.id) || f.id === currentId}
              className={rowClass}
              style={{ paddingLeft: `${8 + f.depth * 16}px` }}
            >
              {f.icon || '📁'} {f.name}
              {f.id === currentId ? ' (current)' : ''}
            </button>
          ))}
        </div>
      </div>
    </div>,
    document.body
  );
}
