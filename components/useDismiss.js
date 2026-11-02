'use client';

import { useEffect, useRef } from 'react';

// Calls onClose when Esc is pressed, while `active` is true. Used by every
// modal and inline form, so Esc always means "never mind".
export function useEscape(active, onClose) {
  // Kept in a ref so the listener always calls the latest onClose without
  // being re-attached on every render.
  const latest = useRef(onClose);
  useEffect(() => {
    latest.current = onClose;
  });

  useEffect(() => {
    if (!active) return;
    function onKeyDown(e) {
      if (e.key === 'Escape') latest.current();
    }
    document.addEventListener('keydown', onKeyDown);
    return () => document.removeEventListener('keydown', onKeyDown);
  }, [active]);
}

// For small pop-up menus: closes when you tap/click anywhere outside
// `ref`'s element, or press Esc. Uses pointerdown so it works the same for
// mouse, touch and pen.
export function useDismiss(active, onClose, ref) {
  const latest = useRef(onClose);
  useEffect(() => {
    latest.current = onClose;
  });

  useEscape(active, onClose);

  useEffect(() => {
    if (!active) return;
    function onPointerDown(e) {
      if (ref.current && !ref.current.contains(e.target)) latest.current();
    }
    document.addEventListener('pointerdown', onPointerDown);
    return () => document.removeEventListener('pointerdown', onPointerDown);
  }, [active, ref]);
}
