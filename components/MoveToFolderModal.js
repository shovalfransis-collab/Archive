'use client';

import { useRouter } from 'next/navigation';
import FolderPickerModal from './FolderPickerModal';

// Moves an item to another folder. Drag-and-drop does the same thing on
// desktop; this picker also works on touch screens.
export default function MoveToFolderModal({ item, allFolders, onClose }) {
  const router = useRouter();

  async function handleMove(folderId) {
    const res = await fetch(`/api/items/${item.id}`, {
      method: 'PATCH',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ folderId }),
    });
    if (!res.ok) throw new Error("Couldn't move that item. Please try again.");
    onClose();
    router.refresh();
  }

  return (
    <FolderPickerModal
      allFolders={allFolders}
      currentId={item.folder_id}
      onPick={handleMove}
      onClose={onClose}
    />
  );
}
