import LoadingGrid from '@/components/LoadingGrid';

// Folder pages get their own placeholder (with a breadcrumb bar), so moving
// between folders shows the loading state right where the content goes.
export default function FolderLoading() {
  return <LoadingGrid withBreadcrumbs />;
}
