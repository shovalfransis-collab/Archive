'use client';

import { useState, useEffect } from 'react';
import { createPortal } from 'react-dom';
import { useRouter } from 'next/navigation';
import { flattenWithDepth } from '@/lib/folderTree';
import { saveItem as postItem, saveLink } from '@/lib/saveItem';
import { upload } from '@vercel/blob/client';
import { checkUpload, uploadPathname } from '@/lib/uploadRules';
import { apiRequest } from '@/lib/apiClient';
import { showToast, showError } from '@/lib/toast';

const TYPES = [
  { key: 'link', label: '🔗 Add link' },
  { key: 'photo', label: '🖼️ Add photo' },
  { key: 'note', label: '📝 Add note' },
  { key: 'file', label: '📎 Add a file' },
];

// Sentinel value for the folder <select> meaning "don't make me choose —
// let the AI agent (see lib/ai.js) decide where this belongs." Links and
// photos default to this; notes still ask you to pick, since a note is
// usually written with a specific folder already in mind.
const AUTO_SORT = '__auto__';

// The "+" button in the header — lets you add a link, photo, or note from
// anywhere in the app without navigating into a folder first. Defaults to
// the folder you're currently viewing (if any); otherwise, for links/photos,
// defaults to letting the AI auto-sort agent pick a folder for you.
export default function QuickAddModal({ currentFolderId }) {
  const [open, setOpen] = useState(false);
  const [type, setType] = useState(null);
  const [folders, setFolders] = useState([]);
  const [folderId, setFolderId] = useState('');
  const [saving, setSaving] = useState(false);

  const [url, setUrl] = useState('');
  const [noteText, setNoteText] = useState('');
  const [file, setFile] = useState(null);
  // A free-text annotation you can attach on top of a link or photo (e.g.
  // "watch this before the meeting") — separate from a note item's own body.
  const [annotation, setAnnotation] = useState('');

  const router = useRouter();

  // Load the folder list each time the modal opens (it may have changed
  // since last time).
  useEffect(() => {
    if (!open) return;
    apiRequest('/api/folders')
      .then(setFolders)
      .catch((err) => showError(`Couldn’t load your folders: ${err.message}`));
  }, [open]);

  // Picking a type also picks a sensible default folder. Inside a folder
  // already: default to it. Otherwise default to auto-sort for
  // links/photos/files, and to "choose one" for notes. Done here in the
  // click handler (not in an effect) so it happens in the same render.
  function chooseType(nextType) {
    setType(nextType);
    if (currentFolderId) {
      setFolderId(String(currentFolderId));
    } else {
      setFolderId(nextType === 'note' ? '' : AUTO_SORT);
    }
  }

  function closeAndReset() {
    setOpen(false);
    setType(null);
    setUrl('');
    setNoteText('');
    setFile(null);
    setAnnotation('');
  }

  // Saves via lib/saveItem.js and, if the server auto-sorted it (no
  // folderId was sent), surfaces a short toast naming where it landed.
  function showToastIfSorted(saved) {
    if (saved.autoSorted) {
      showToast(`✨ Filed in ${saved.folderName}${saved.folderIsNew ? ' (new folder)' : ''}`);
    }
  }

  async function saveItem(body) {
    showToastIfSorted(await postItem(body));
  }

  async function handleSubmit(e) {
    e.preventDefault();
    const isAutoSort = folderId === AUTO_SORT;
    if (!folderId || (!isAutoSort && !folderId)) return;

    setSaving(true);
    try {
      if (type === 'link') {
        // The preview fetch is best-effort — if it fails, the bare URL is saved.
        showToastIfSorted(
          await saveLink({
            url,
            folderId: isAutoSort ? null : Number(folderId),
            note: annotation || null,
          })
        );
      } else if (type === 'note') {
        await saveItem({
          folderId: Number(folderId),
          type: 'note',
          content: noteText,
          title: noteText.slice(0, 40),
        });
      } else if (type === 'photo' && file) {
        const { url: imageUrl } = await uploadFile(file, 'photo');
        await saveItem({
          folderId: isAutoSort ? null : Number(folderId),
          type: 'photo',
          imageUrl,
          title: file.name,
          note: annotation || null,
        });
      } else if (type === 'file' && file) {
        // Files reuse the same generic imageUrl column as photos — it's just
        // a URL to whatever got uploaded, not an image-specific field.
        const { url: fileUrl } = await uploadFile(file, 'file');
        await saveItem({
          folderId: isAutoSort ? null : Number(folderId),
          type: 'file',
          imageUrl: fileUrl,
          title: file.name,
          note: annotation || null,
        });
      }
      closeAndReset();
      router.refresh();
    } catch (err) {
      // The modal stays open with what you typed, so you can try again.
      showError(`Couldn’t save that: ${err.message}`);
    } finally {
      setSaving(false);
    }
  }

  // Uploads straight from the browser to Vercel Blob storage (no size limit
  // from our server in between); /api/upload only hands out permission.
  // Throws a readable error if anything goes wrong.
  async function uploadFile(file, kind) {
    const problem = checkUpload(file, kind);
    if (problem) throw new Error(problem);
    try {
      const blob = await upload(uploadPathname(file.name), file, {
        access: 'public',
        handleUploadUrl: '/api/upload',
        clientPayload: kind, // tells the server which rules apply
        multipart: file.size > 8 * 1024 * 1024, // big files go up in chunks
      });
      return { url: blob.url };
    } catch (err) {
      throw new Error(`Upload failed — ${err.message || 'please try again.'}`);
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
            className="my-auto max-h-[90vh] w-full max-w-sm overflow-y-auto rounded-lg bg-white p-4 shadow-lg dark:bg-neutral-800"
            onClick={(e) => e.stopPropagation()}
          >
            {!type ? (
              <div className="space-y-2">
                <h2 className="mb-2 font-semibold">Add to Archive</h2>
                {TYPES.map((t) => (
                  <button
                    key={t.key}
                    onClick={() => chooseType(t.key)}
                    className="block w-full rounded border border-neutral-200 px-3 py-2 text-left hover:bg-neutral-50 dark:border-neutral-700 dark:hover:bg-neutral-700"
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
                    className="mt-1 w-full rounded border border-neutral-300 px-2 py-1 dark:border-neutral-600 dark:bg-neutral-900 dark:text-neutral-100"
                  >
                    <option value="" disabled>
                      Choose a folder…
                    </option>
                    {type !== 'note' && (
                      <option value={AUTO_SORT}>✨ Let AI sort it</option>
                    )}
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
                    className="w-full rounded border border-neutral-300 px-2 py-1 dark:border-neutral-600 dark:bg-neutral-900 dark:text-neutral-100"
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
                    className="w-full rounded border border-neutral-300 px-2 py-1 dark:border-neutral-600 dark:bg-neutral-900 dark:text-neutral-100"
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
                {type === 'file' && (
                  <input
                    type="file"
                    required
                    onChange={(e) => setFile(e.target.files[0])}
                  />
                )}

                {type !== 'note' && (
                  <label className="block text-sm">
                    Note <span className="text-neutral-400">(optional)</span>
                    <textarea
                      rows={2}
                      placeholder="Add a note about this…"
                      value={annotation}
                      onChange={(e) => setAnnotation(e.target.value)}
                      className="mt-1 w-full rounded border border-neutral-300 px-2 py-1 dark:border-neutral-600 dark:bg-neutral-900 dark:text-neutral-100"
                    />
                  </label>
                )}

                <div className="flex justify-end gap-2">
                  <button
                    type="button"
                    onClick={closeAndReset}
                    className="px-3 py-1 text-neutral-600 dark:text-neutral-400"
                  >
                    Cancel
                  </button>
                  <button
                    type="submit"
                    disabled={saving}
                    className="rounded bg-neutral-900 px-3 py-1 text-white disabled:opacity-50 dark:bg-neutral-100 dark:text-neutral-900"
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
