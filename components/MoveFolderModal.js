'use client';

import { useRouter } from 'next/navigation';
import FolderPickerModal from './FolderPickerModal';
import { getDescendantIds } from '@/lib/folderTree';
import { apiRequest } from '@/lib/apiClient';

// Moves a folder (and everything inside it) under another folder, or to the
// top level. The folder itself and its own subfolders are greyed out,
// since moving into them would make a loop (the server refuses that too).
export default function MoveFolderModal({ folder, allFolders, onClose }) {
  const router = useRouter();

  async function handleMove(parentId) {
    // Errors are shown inside the picker (FolderPickerModal).
    await apiRequest(`/api/folders/${folder.id}`, { method: 'PATCH', body: { parentId } });
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
