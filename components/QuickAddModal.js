'use client';

import { useState, useEffect } from 'react';
import { createPortal } from 'react-dom';
import { useRouter } from 'next/navigation';
import { flattenWithDepth } from '@/lib/folderTree';

const TYPES = [
  { key: 'link', label: '🔗 Add link' },
  { key: 'photo', label: '🖼️ Add photo' },
  { key: 'note', label: '📝 Add note' },
];

// The "+" button in the header — lets you add a link, photo, or note from
// anywhere in the app without navigating into a folder first. Defaults to
// the folder you're currently viewing (if any); otherwise you pick one.
export default function QuickAddModal({ currentFolderId }) {
  const [open, setOpen] = useState(false);
  const [type, setType] = useState(null);
  const [folders, setFolders] = useState([]);
  const [folderId, setFolderId] = useState('');
  const [saving, setSaving] = useState(false);

  const [url, setUrl] = useState('');
  const [noteText, setNoteText] = useState('');
  const [file, setFile] = useState(null);

  const router = useRouter();

  useEffect(() => {
    if (open) {
      fetch('/api/folders')
        .then((res) => res.json())
        .then(setFolders);
      setFolderId(currentFolderId ?? '');
    }
  }, [open, currentFolderId]);

  function closeAndReset() {
    setOpen(false);
    setType(null);
    setUrl('');
    setNoteText('');
    setFile(null);
  }

  async function handleSubmit(e) {
    e.preventDefault();
    if (!folderId) return;

    setSaving(true);
    try {
      if (type === 'link') {
        // Best-effort metadata fetch — if it fails, we still save the URL.
        let preview = {};
        try {
          const res = await fetch('/api/link-preview', {
            method: 'POST',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify({ url }),
          });
          preview = await res.json();
        } catch {
          // ignore — fall back to the bare URL below
        }
        await fetch('/api/items', {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({
            folderId: Number(folderId),
            type: 'link',
            url,
            title: preview.title || url,
            description: preview.description,
            faviconUrl: preview.faviconUrl,
          }),
        });
      } else if (type === 'note') {
        await fetch('/api/items', {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({
            folderId: Number(folderId),
            type: 'note',
            content: noteText,
            title: noteText.slice(0, 40),
          }),
        });
      } else if (type === 'photo' && file) {
        const formData = new FormData();
        formData.append('file', file);
        const uploadRes = await fetch('/api/upload', { method: 'POST', body: formData });
        const { url: imageUrl } = await uploadRes.json();
        await fetch('/api/items', {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({
            folderId: Number(folderId),
            type: 'photo',
            imageUrl,
            title: file.name,
          }),
        });
      }
      closeAndReset();
      router.refresh();
    } finally {
      setSaving(false);
    }
  }

  const flatFolders = flattenWithDepth(folders);
  const activeType = TYPES.find((t) => t.key === type);

  return (
    <>
      <button
        onClick={() => setOpen(true)}
        className="flex h-9 w-9 shrink-0 items-center justify-center rounded-full bg-neutral-900 text-xl leading-none text-white"
        aria-label="Add"
      >
        +
      </button>

      {open && createPortal(
        <div
          className="fixed inset-0 z-30 flex items-center justify-center overflow-y-auto bg-black/40 p-4"
          onClick={closeAndReset}
        >
          <div
            className="my-auto max-h-[90vh] w-full max-w-sm overflow-y-auto rounded-lg bg-white p-4 shadow-lg"
            onClick={(e) => e.stopPropagation()}
          >
            {!type ? (
              <div className="space-y-2">
                <h2 className="mb-2 font-semibold">Add to Archive</h2>
                {TYPES.map((t) => (
                  <button
                    key={t.key}
                    onClick={() => setType(t.key)}
                    className="block w-full rounded border border-neutral-200 px-3 py-2 text-left hover:bg-neutral-50"
                  >
                    {t.label}
                  </button>
                ))}
              </div>
            ) : (
              <form onSubmit={handleSubmit} className="space-y-3">
                <h2 className="font-semibold">{activeType.label}</h2>

                <label className="block text-sm">
                  Folder
                  <select
                    required
                    value={folderId}
                    onChange={(e) => setFolderId(e.target.value)}
                    className="mt-1 w-full rounded border border-neutral-300 px-2 py-1"
                  >
                    <option value="" disabled>
                      Choose a folder…
                    </option>
                    {flatFolders.map((f) => (
                      <option key={f.id} value={f.id}>
                        {'— '.repeat(f.depth)}
                        {f.name}
                      </option>
                    ))}
                  </select>
                </label>

                {type === 'link' && (
                  <input
                    type="url"
                    required
                    autoFocus
                    placeholder="https://example.com"
                    value={url}
                    onChange={(e) => setUrl(e.target.value)}
                    className="w-full rounded border border-neutral-300 px-2 py-1"
                  />
                )}
                {type === 'note' && (
                  <textarea
                    required
                    autoFocus
                    rows={5}
                    placeholder="Type a note… (Markdown supported)"
                    value={noteText}
                    onChange={(e) => setNoteText(e.target.value)}
                    className="w-full rounded border border-neutral-300 px-2 py-1"
                  />
                )}
                {type === 'photo' && (
                  <input
                    type="file"
                    accept="image/*"
                    required
                    onChange={(e) => setFile(e.target.files[0])}
                  />
                )}

                <div className="flex justify-end gap-2">
                  <button type="button" onClick={closeAndReset} className="px-3 py-1 text-neutral-600">
                    Cancel
                  </button>
                  <button
                    type="submit"
                    disabled={saving}
                    className="rounded bg-neutral-900 px-3 py-1 text-white disabled:opacity-50"
                  >
                    {saving ? 'Saving…' : 'Save'}
                  </button>
                </div>
              </form>
            )}
          </div>
        </div>,
        document.body
      )}
    </>
  );
}
