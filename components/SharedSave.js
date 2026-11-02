'use client';

import { useCallback, useEffect, useRef, useState } from 'react';
import Link from 'next/link';
import { useRouter } from 'next/navigation';
import { saveItem, saveLink } from '@/lib/saveItem';
import { apiRequest } from '@/lib/apiClient';

// The screen you land on after sharing something to The Archive (from your
// phone's share sheet, the bookmarklet, or an iPhone Shortcut). It saves
// straight away — letting the AI pick the folder — then shows where it
// went, with Undo in case that was a mistake.
//
// `url` / `title` / `text` were already worked out on the server from
// whatever was shared (lib/shareInput.js). No url but some text → it's
// saved as a note instead. `autoSave` false → ask "Save this?" first (the
// page may have been opened by another website — see app/add/page.js).
export default function SharedSave({ url, title, text, autoSave = true }) {
  const nothingToSave = !url && !text;
  const [status, setStatus] = useState(
    nothingToSave ? 'empty' : autoSave ? 'saving' : 'confirm'
  );
  const [saved, setSaved] = useState(null);
  const [error, setError] = useState('');
  // Guards against saving twice: React runs effects twice in development,
  // and this must only ever create one item.
  const started = useRef(false);
  const router = useRouter();

  // Starts the save (once). Called on arrival when auto-saving, or from the
  // "Save" button otherwise.
  const startSave = useCallback(() => {
    if (started.current) return;
    started.current = true;
    setStatus('saving');

    const save = url
      ? saveLink({ url, note: text, fallbackTitle: title })
      : saveItem({ type: 'note', content: text, title: text.slice(0, 40) });

    save
      .then((item) => {
        setSaved(item);
        setStatus('saved');
        // Drop the ?url=… from the address bar, so refreshing this page
        // doesn't save the same thing again.
        window.history.replaceState(null, '', window.location.pathname);
      })
      .catch((err) => {
        setError(err.message);
        setStatus('error');
      });
  }, [url, title, text]);

  useEffect(() => {
    if (nothingToSave || !autoSave || started.current) return;
    // Deferred a tick so the state change happens in a callback, not
    // directly inside the effect.
    const timer = setTimeout(startSave, 0);
    return () => clearTimeout(timer);
  }, [nothingToSave, autoSave, startSave]);

  async function handleUndo() {
    setStatus('undoing');
    try {
      await apiRequest(`/api/items/${saved.id}`, { method: 'DELETE' });
      setStatus('undone');
    } catch (err) {
      setError(`Couldn’t undo: ${err.message}`);
      setStatus('saved');
    }
  }

  // Opened as a popup by the bookmarklet → close it. Otherwise go home.
  function handleDone() {
    if (window.opener) window.close();
    else router.push('/');
  }

  return (
    <div className="flex min-h-screen items-center justify-center p-4">
      <div className="w-full max-w-sm space-y-4 text-center">
        <div className="text-4xl">🗄️</div>

        {status === 'confirm' && (
          <>
            <p className="font-semibold">Save this to your archive?</p>
            <p className="break-all text-sm text-neutral-600 dark:text-neutral-300">
              {title && url ? `${title} — ${url}` : url || text}
            </p>
            <button
              onClick={startSave}
              className="rounded bg-neutral-900 px-4 py-2 text-sm text-white dark:bg-neutral-100 dark:text-neutral-900"
            >
              Save
            </button>
          </>
        )}

        {status === 'saving' && <p className="text-neutral-500 dark:text-neutral-400">Saving…</p>}

        {status === 'empty' && (
          <p className="text-neutral-500 dark:text-neutral-400">Nothing to save — no link or text was shared.</p>
        )}

        {status === 'error' && (
          <p className="text-red-600 dark:text-red-400">Couldn&apos;t save that: {error}</p>
        )}

        {(status === 'saved' || status === 'undoing') && saved && (
          <>
            <p className="text-lg font-semibold">✓ Saved</p>
            <p className="truncate text-sm text-neutral-600 dark:text-neutral-300">
              {saved.title || saved.url}
            </p>
            <p className="text-sm text-neutral-500 dark:text-neutral-400">
              {saved.folderName ? (
                <>
                  ✨ Filed in <strong>{saved.folderName}</strong>
                  {saved.folderIsNew ? ' (new folder)' : ''}
                </>
              ) : (
                'Saved.'
              )}
            </p>
          </>
        )}

        {status === 'saved' && error && (
          <p className="text-sm text-red-600 dark:text-red-400">{error}</p>
        )}

        {status === 'undone' && <p className="text-neutral-500 dark:text-neutral-400">Removed.</p>}

        <div className="flex justify-center gap-2">
          {(status === 'saved' || status === 'undoing') && saved?.folder_id && (
            <Link
              href={`/folder/${saved.folder_id}`}
              className="rounded border border-neutral-300 px-3 py-1.5 text-sm dark:border-neutral-600"
            >
              Open folder
            </Link>
          )}
          {(status === 'saved' || status === 'undoing') && (
            <button
              onClick={handleUndo}
              disabled={status === 'undoing'}
              className="rounded border border-neutral-300 px-3 py-1.5 text-sm disabled:opacity-50 dark:border-neutral-600"
            >
              Undo
            </button>
          )}
          {status !== 'saving' && status !== 'undoing' && (
            <button
              onClick={handleDone}
              className="rounded bg-neutral-900 px-3 py-1.5 text-sm text-white dark:bg-neutral-100 dark:text-neutral-900"
            >
              Done
            </button>
          )}
        </div>
      </div>
    </div>
  );
}
