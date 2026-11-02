'use client';

import { useRouter } from 'next/navigation';
import FolderPickerModal from './FolderPickerModal';
import { apiRequest } from '@/lib/apiClient';

// Moves an item to another folder. Drag-and-drop does the same thing on
// desktop; this picker also works on touch screens.
export default function MoveToFolderModal({ item, allFolders, onClose }) {
  const router = useRouter();

  async function handleMove(folderId) {
    // Errors are shown inside the picker (FolderPickerModal).
    await apiRequest(`/api/items/${item.id}`, { method: 'PATCH', body: { folderId } });
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
