'use client';

import { useState } from 'react';
import { useRouter } from 'next/navigation';
import { canDropOnFolder as canDrop } from '@/lib/folderTree';

// Native HTML5 drag-and-drop for moving items and folders. (No library:
// the built-in browser API covers this; on phones, where dragging is
// unreliable, the "Move to…" menu options still work.)
//
// The browser doesn't let a drop target read what's being dragged until
// the actual drop, but we want to highlight valid targets *while*
// hovering — so the thing being dragged is also kept here, in memory.
// Only one drag can happen at a time, so a single variable is enough.
let currentDrag = null; // { kind: 'item', id, folderId } | { kind: 'folder', id, parentId }

// Props to spread onto anything draggable.
export function dragSourceProps(payload) {
  return {
    draggable: true,
    onDragStart(e) {
      currentDrag = payload;
      e.dataTransfer.effectAllowed = 'move';
      // Firefox only starts a drag if some data is set.
      e.dataTransfer.setData('text/plain', `${payload.kind}:${payload.id}`);
    },
    onDragEnd() {
      currentDrag = null;
    },
  };
}

// Makes an element a drop target for folder `targetId` (null = top level).
// Returns `isOver` (to show a highlight) and props to spread on the element.
export function useFolderDropTarget(targetId, allFolders) {
  const [isOver, setIsOver] = useState(false);
  const router = useRouter();

  function accept(e) {
    if (!canDrop(currentDrag, targetId, allFolders)) return false;
    e.preventDefault(); // this is what tells the browser "dropping here is allowed"
    e.dataTransfer.dropEffect = 'move';
    return true;
  }

  async function onDrop(e) {
    const drag = currentDrag;
    setIsOver(false);
    if (!canDrop(drag, targetId, allFolders)) return;
    e.preventDefault();
    currentDrag = null;

    const isItem = drag.kind === 'item';
    const res = await fetch(isItem ? `/api/items/${drag.id}` : `/api/folders/${drag.id}`, {
      method: 'PATCH',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify(isItem ? { folderId: targetId } : { parentId: targetId }),
    });
    if (!res.ok) {
      const body = await res.json().catch(() => null);
      alert(body?.error || `Couldn't move that ${isItem ? 'item' : 'folder'}.`);
      return;
    }
    router.refresh();
  }

  return {
    isOver,
    dropProps: {
      onDragEnter(e) {
        if (accept(e)) setIsOver(true);
      },
      onDragOver(e) {
        accept(e);
      },
      onDragLeave(e) {
        // Moving onto a child element also fires dragleave — ignore that.
        if (!e.currentTarget.contains(e.relatedTarget)) setIsOver(false);
      },
      onDrop,
    },
  };
}

// Highlight for a drop target that's being hovered with a valid drag.
export const DROP_HIGHLIGHT = 'ring-2 ring-blue-500 bg-blue-50 dark:bg-blue-950';
