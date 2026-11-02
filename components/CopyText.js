'use client';

import { useState } from 'react';

// Shows a piece of text with a "Copy" button next to it.
export default function CopyText({ text }) {
  const [copied, setCopied] = useState(false);

  async function copy() {
    try {
      await navigator.clipboard.writeText(text);
      setCopied(true);
      setTimeout(() => setCopied(false), 1500);
    } catch {
      // Clipboard access can be blocked; the text is still there to select.
    }
  }

  return (
    <span className="flex items-center gap-2">
      <code className="min-w-0 flex-1 break-all rounded bg-neutral-100 px-2 py-1 text-xs dark:bg-neutral-800">
        {text}
      </code>
      <button
        onClick={copy}
        className="shrink-0 rounded border border-neutral-300 px-2 py-1 text-xs dark:border-neutral-600"
      >
        {copied ? 'Copied ✓' : 'Copy'}
      </button>
    </span>
  );
}
