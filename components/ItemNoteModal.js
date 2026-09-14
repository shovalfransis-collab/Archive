'use client';

import { useState } from 'react';
import { useRouter } from 'next/navigation';

// Lets you add or edit the free-text annotation attached to a link or photo
// item — separate from a note item's own body (that's NoteViewModal).
export default function ItemNoteModal({ item, onClose }) {
  const [note, setNote] = useState(item.note || '');
  const [saving, setSaving] = useState(false);
  const router = useRouter();

  async function handleSave() {
    setSaving(true);
    await fetch(`/api/items/${item.id}`, {
      method: 'PATCH',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ note }),
    });
    setSaving(false);
    onClose();
    router.refresh();
  }

  return (
    <div
      className="fixed inset-0 z-30 flex items-center justify-center bg-black/40 p-4"
      onClick={onClose}
    >
      <div
        className="w-full max-w-sm rounded-lg bg-white p-4 shadow-lg dark:bg-neutral-800"
        onClick={(e) => e.stopPropagation()}
      >
        <h2 className="mb-2 font-semibold">{item.note ? 'Edit note' : 'Add a note'}</h2>
        <textarea
          autoFocus
          rows={4}
          placeholder="Add a note about this…"
          value={note}
          onChange={(e) => setNote(e.target.value)}
          className="w-full rounded border border-neutral-300 px-2 py-1 text-sm dark:border-neutral-600 dark:bg-neutral-900 dark:text-neutral-100"
        />
        <div className="mt-3 flex justify-end gap-2">
          <button onClick={onClose} className="px-3 py-1 text-sm text-neutral-600 dark:text-neutral-400">
            Cancel
          </button>
          <button
            onClick={handleSave}
            disabled={saving}
            className="rounded bg-neutral-900 px-3 py-1 text-sm text-white disabled:opacity-50 dark:bg-neutral-100 dark:text-neutral-900"
          >
            {saving ? 'Saving…' : 'Save'}
          </button>
        </div>
      </div>
    </div>
  );
}
