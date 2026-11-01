'use client';

import { useRouter } from 'next/navigation';
import FolderPickerModal from './FolderPickerModal';
import { getDescendantIds } from '@/lib/folderTree';

// Moves a folder (and everything inside it) under another folder, or to the
// top level. The folder itself and its own subfolders are greyed out,
// since moving into them would make a loop (the server refuses that too).
export default function MoveFolderModal({ folder, allFolders, onClose }) {
  const router = useRouter();

  async function handleMove(parentId) {
    const res = await fetch(`/api/folders/${folder.id}`, {
      method: 'PATCH',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ parentId }),
    });
    if (!res.ok) {
      const body = await res.json().catch(() => null);
      throw new Error(body?.error || "Couldn't move that folder. Please try again.");
    }
    onClose();
    router.refresh();
  }

  return (
    <FolderPickerModal
      title={`Move "${folder.name}" to…`}
      allFolders={allFolders}
      disabledIds={getDescendantIds(allFolders, folder.id)}
      currentId={folder.parent_id ?? null}
      allowTopLevel
      onPick={handleMove}
      onClose={onClose}
    />
  );
}
