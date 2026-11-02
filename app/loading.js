import LoadingGrid from '@/components/LoadingGrid';

// Shown instantly while any page's data loads from the database, instead
// of the old page sitting there until the new one is ready.
export default function Loading() {
  return <LoadingGrid />;
}
