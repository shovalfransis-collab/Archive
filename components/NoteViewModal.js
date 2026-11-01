'use client';

import { useState } from 'react';
import { createPortal } from 'react-dom';
import { useRouter } from 'next/navigation';
import { renderMarkdown } from '@/lib/markdown';
import { apiRequest } from '@/lib/apiClient';
import { showError } from '@/lib/toast';

// Opens a note to read it fully rendered as Markdown, with an Edit mode
// that's a plain textarea plus two toolbar buttons that insert Markdown
// syntax around the current selection (Bold / bullet list) — this is the
// "basic formatting" the spec asked for, without a rich-text editor
// dependency.
export default function NoteViewModal({ item, onClose }) {
  const [editing, setEditing] = useState(false);
  const [content, setContent] = useState(item.content || '');
  const [saving, setSaving] = useState(false);
  const router = useRouter();

  function wrapSelection(before, after = '') {
    const el = document.getElementById(`note-textarea-${item.id}`);
    if (!el) return;
    const { selectionStart, selectionEnd, value } = el;
    const selected = value.slice(selectionStart, selectionEnd);
    setContent(value.slice(0, selectionStart) + before + selected + after + value.slice(selectionEnd));
  }

  async function handleSave() {
    setSaving(true);
    try {
      await apiRequest(`/api/items/${item.id}`, { method: 'PATCH', body: { content } });
    } catch (err) {
      // Keep the editor open so your text isn't lost.
      showError(`Couldn’t save the note: ${err.message}`);
      setSaving(false);
      return;
    }
    setSaving(false);
    onClose(); // close the whole modal so the card re-renders with fresh content
    router.refresh();
  }

  // Rendered at the end of <body> (a portal) rather than inside the card
  // that opened it: cards are draggable, and selecting text in here
  // shouldn't start dragging the card underneath.
  return createPortal(
    <div
      className="fixed inset-0 z-30 flex items-center justify-center bg-black/40 p-4"
      onClick={onClose}
    >
      <div
        className="max-h-[80vh] w-full max-w-md overflow-y-auto rounded-lg bg-white p-4 shadow-lg dark:bg-neutral-800"
        onClick={(e) => e.stopPropagation()}
      >
        {editing ? (
          <div className="space-y-2">
            <div className="flex gap-1">
              <button
                type="button"
                onClick={() => wrapSelection('**', '**')}
                className="rounded border px-2 py-1 text-sm font-bold dark:border-neutral-600"
              >
                B
              </button>
              <button
                type="button"
                onClick={() => wrapSelection('\n- ')}
                className="rounded border px-2 py-1 text-sm dark:border-neutral-600"
              >
                List
              </button>
            </div>
            <textarea
              id={`note-textarea-${item.id}`}
              rows={10}
              value={content}
              onChange={(e) => setContent(e.target.value)}
              className="w-full rounded border border-neutral-300 px-2 py-1 text-sm dark:border-neutral-600 dark:bg-neutral-900 dark:text-neutral-100"
            />
            <div className="flex justify-end gap-2">
              <button
                onClick={() => setEditing(false)}
                className="px-3 py-1 text-sm text-neutral-600 dark:text-neutral-400"
              >
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
        ) : (
          <div>
            <div
              className="note-content mb-3 text-sm"
              dangerouslySetInnerHTML={{ __html: renderMarkdown(item.content) }}
            />
            <div className="flex justify-end gap-2">
              <button
                onClick={onClose}
                className="px-3 py-1 text-sm text-neutral-600 dark:text-neutral-400"
              >
                Close
              </button>
              <button
                onClick={() => setEditing(true)}
                className="rounded border px-3 py-1 text-sm dark:border-neutral-600"
              >
                Edit
              </button>
            </div>
          </div>
        )}
      </div>
    </div>,
    document.body
  );
}
