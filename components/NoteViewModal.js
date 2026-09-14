'use client';

import { useState } from 'react';
import { useRouter } from 'next/navigation';
import { renderMarkdown } from '@/lib/markdown';

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
    await fetch(`/api/items/${item.id}`, {
      method: 'PATCH',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ content }),
    });
    setSaving(false);
    onClose(); // close the whole modal so the card re-renders with fresh content
    router.refresh();
  }

  return (
    <div
      className="fixed inset-0 z-30 flex items-center justify-center bg-black/40 p-4"
      onClick={onClose}
    >
      <div
        className="max-h-[80vh] w-full max-w-md overflow-y-auto rounded-lg bg-white p-4 shadow-lg"
        onClick={(e) => e.stopPropagation()}
      >
        {editing ? (
          <div className="space-y-2">
            <div className="flex gap-1">
              <button
                type="button"
                onClick={() => wrapSelection('**', '**')}
                className="rounded border px-2 py-1 text-sm font-bold"
              >
                B
              </button>
              <button
                type="button"
                onClick={() => wrapSelection('\n- ')}
                className="rounded border px-2 py-1 text-sm"
              >
                List
              </button>
            </div>
            <textarea
              id={`note-textarea-${item.id}`}
              rows={10}
              value={content}
              onChange={(e) => setContent(e.target.value)}
              className="w-full rounded border border-neutral-300 px-2 py-1 text-sm"
            />
            <div className="flex justify-end gap-2">
              <button onClick={() => setEditing(false)} className="px-3 py-1 text-sm text-neutral-600">
                Cancel
              </button>
              <button
                onClick={handleSave}
                disabled={saving}
                className="rounded bg-neutral-900 px-3 py-1 text-sm text-white disabled:opacity-50"
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
              <button onClick={onClose} className="px-3 py-1 text-sm text-neutral-600">
                Close
              </button>
              <button onClick={() => setEditing(true)} className="rounded border px-3 py-1 text-sm">
                Edit
              </button>
            </div>
          </div>
        )}
      </div>
    </div>
  );
}
