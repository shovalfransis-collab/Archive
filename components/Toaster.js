'use client';

import { useEffect, useState } from 'react';
import { subscribeToToasts } from '@/lib/toast';

// Shows the messages sent with showToast()/showError() (lib/toast.js),
// stacked at the bottom of the screen. Mounted once, in app/layout.js.
export default function Toaster() {
  const [toasts, setToasts] = useState([]);

  useEffect(() => {
    const timers = new Set();
    const unsubscribe = subscribeToToasts((toast) => {
      setToasts((current) => [...current.slice(-2), toast]); // at most 3 at once
      const timer = setTimeout(() => {
        setToasts((current) => current.filter((t) => t.id !== toast.id));
        timers.delete(timer);
      }, toast.duration);
      timers.add(timer);
    });
    return () => {
      unsubscribe();
      timers.forEach(clearTimeout);
    };
  }, []);

  function dismiss(id) {
    setToasts((current) => current.filter((t) => t.id !== id));
  }

  return (
    <div
      aria-live="polite"
      className="pointer-events-none fixed bottom-4 left-1/2 z-50 flex w-[calc(100%-2rem)] max-w-md -translate-x-1/2 flex-col items-center gap-2"
    >
      {toasts.map((t) => (
        <button
          key={t.id}
          onClick={() => dismiss(t.id)}
          role={t.type === 'error' ? 'alert' : 'status'}
          title="Dismiss"
          className={`pointer-events-auto rounded-full px-4 py-2 text-left text-sm shadow-lg ${
            t.type === 'error'
              ? 'bg-red-600 text-white dark:bg-red-500'
              : 'bg-neutral-900 text-white dark:bg-neutral-100 dark:text-neutral-900'
          }`}
        >
          {t.type === 'error' ? '⚠️ ' : ''}
          {t.message}
        </button>
      ))}
    </div>
  );
}
