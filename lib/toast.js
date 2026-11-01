// A tiny app-wide notification system. Call showToast('Saved!') or
// showToast("Couldn't delete that", { type: 'error' }) from any component;
// the <Toaster /> in app/layout.js listens and shows it at the bottom of
// the screen for a few seconds. (No library — it's just a list of
// listeners.)

const listeners = new Set();
let nextId = 1;

export function showToast(message, { type = 'info', duration } = {}) {
  const toast = {
    id: nextId++,
    message,
    type,
    // Errors stay up a little longer so there's time to read them.
    duration: duration ?? (type === 'error' ? 6000 : 4000),
  };
  listeners.forEach((listener) => listener(toast));
  return toast.id;
}

export function showError(message) {
  return showToast(message, { type: 'error' });
}

// Used by <Toaster />. Returns a function that stops listening.
export function subscribeToToasts(listener) {
  listeners.add(listener);
  return () => listeners.delete(listener);
}
