'use client';

import Link from 'next/link';
import { useFolderDropTarget, DROP_HIGHLIGHT } from './dragAndDrop';

// One link in the breadcrumb trail that you can also drop things onto —
// the easy way to drag a folder up a level, or to the top level ("Home").
// `folderId` is null for Home.
export default function BreadcrumbLink({ href, folderId, allFolders, children }) {
  const { isOver, dropProps } = useFolderDropTarget(folderId, allFolders);
  return (
    <Link
      href={href}
      draggable={false}
      {...dropProps}
      className={`rounded px-1 hover:underline ${isOver ? DROP_HIGHLIGHT : ''}`}
    >
      {children}
    </Link>
  );
}
