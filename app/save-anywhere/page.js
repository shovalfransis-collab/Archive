import { headers } from 'next/headers';
import BookmarkletButton from '@/components/BookmarkletButton';
import CopyText from '@/components/CopyText';
import { makeShareKey } from '@/lib/auth';

// Depends on the address the app is opened at, so it's built per request.
export const dynamic = 'force-dynamic';

// Setup instructions for saving to The Archive without opening it first:
// a bookmarklet for computers, the share menu on Android (installed app),
// and an Apple Shortcut on iPhone/iPad. All of them end up at
// /add?url=… (app/add/page.js), which saves the link and lets the AI file it.
export default async function SaveAnywherePage() {
  // This site's own address (e.g. https://the-archive.vercel.app), so the
  // bookmarklet and Shortcut point back here.
  const h = await headers();
  const host = h.get('x-forwarded-host') || h.get('host');
  const proto = h.get('x-forwarded-proto') || (host?.startsWith('localhost') ? 'http' : 'https');
  const origin = `${proto}://${host}`;
  // The key lets these links save without asking "Save this?" first
  // (see makeShareKey in lib/auth.js).
  const addUrl = `${origin}/add?key=${await makeShareKey()}&url=`;

  // Opens /add in a small popup with the current page's address and title.
  // If popups are blocked, it goes there in the same tab instead.
  const bookmarklet =
    `javascript:(function(){var u=${JSON.stringify(addUrl)}+encodeURIComponent(location.href)` +
    `+'&title='+encodeURIComponent(document.title);` +
    `var w=window.open(u,'archive','width=420,height=480');if(!w)location.href=u;})();`;

  const card = 'rounded-lg border border-neutral-200 p-4 dark:border-neutral-700';
  const steps = 'ml-5 list-decimal space-y-1.5 text-sm text-neutral-700 dark:text-neutral-300';

  return (
    <div className="mx-auto max-w-2xl space-y-6">
      <div>
        <h1 className="text-xl font-semibold">Save from anywhere</h1>
        <p className="mt-1 text-sm text-neutral-500 dark:text-neutral-400">
          Save the page you&apos;re looking at in one tap — the AI picks the folder. If you&apos;re
          logged out, you&apos;ll be asked for your PIN first, then it carries on.
        </p>
      </div>

      <section className={card}>
        <h2 className="mb-2 font-semibold">💻 On a computer: bookmarklet</h2>
        <ol className={steps}>
          <li>
            Drag this button onto your browser&apos;s bookmarks bar:{' '}
            <BookmarkletButton code={bookmarklet} />
          </li>
          <li>On any web page, click it. A small window saves the page and shows where it went.</li>
        </ol>
        <p className="mt-2 text-xs text-neutral-500 dark:text-neutral-400">
          The button contains a private key, so don&apos;t share it. If you change your PIN, set it
          up again (old ones will just ask &quot;Save this?&quot; first).
        </p>
        <p className="mt-2 text-xs text-neutral-500 dark:text-neutral-400">
          Can&apos;t see a bookmarks bar? Press Ctrl+Shift+B (Windows) or ⌘+Shift+B (Mac).
        </p>
      </section>

      <section className={card}>
        <h2 className="mb-2 font-semibold">🤖 On Android: the share menu</h2>
        <ol className={steps}>
          <li>Open The Archive in Chrome and log in.</li>
          <li>
            Tap Chrome&apos;s <strong>⋮</strong> menu → <strong>Install app</strong> (or{' '}
            <strong>Add to Home screen</strong>).
          </li>
          <li>
            Now in any app, tap <strong>Share</strong> → <strong>The Archive</strong>.
          </li>
        </ol>
      </section>

      <section className={card}>
        <h2 className="mb-2 font-semibold">📱 On iPhone / iPad: a Shortcut</h2>
        <p className="mb-2 text-sm text-neutral-500 dark:text-neutral-400">
          iPhones don&apos;t let web apps appear in the share menu, but a Shortcut does the same job.
          One-time setup in the <strong>Shortcuts</strong> app:
        </p>
        <ol className={steps}>
          <li>
            Tap <strong>+</strong> to make a new shortcut and name it <strong>Save to Archive</strong>.
          </li>
          <li>
            Tap the <strong>ⓘ</strong> (details) button and turn on <strong>Show in Share Sheet</strong>.
            At the top, set it to receive <strong>URLs</strong> and <strong>Text</strong>.
          </li>
          <li>
            Add the action <strong>URL Encode</strong>, and make sure it encodes{' '}
            <strong>Shortcut Input</strong>.
          </li>
          <li>
            Add the action <strong>Open URLs</strong>. For its address, paste this, then tap right after
            it and insert the <strong>URL Encoded Text</strong> variable:
            <div className="mt-1">
              <CopyText text={addUrl} />
            </div>
          </li>
          <li>
            Done! In Safari (or any app), tap <strong>Share</strong> → <strong>Save to Archive</strong>.
          </li>
        </ol>
        <p className="mt-2 text-xs text-neutral-500 dark:text-neutral-400">
          Tip: in Safari, Share → <strong>Add to Home Screen</strong> also gives The Archive its own app icon.
        </p>
      </section>
    </div>
  );
}
