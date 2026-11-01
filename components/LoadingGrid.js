// Grey placeholder tiles shown while a page loads (see app/loading.js),
// laid out like the real folder/item grid so the page doesn't jump around
// when the content arrives.
export default function LoadingGrid({ tiles = 8, withBreadcrumbs = false }) {
  return (
    <div className="animate-pulse" aria-busy="true" aria-label="Loading">
      {withBreadcrumbs && <div className="mb-3 h-4 w-40 rounded bg-neutral-200 dark:bg-neutral-800" />}
      <div className="mb-4 flex items-center justify-between">
        <div className="h-6 w-36 rounded bg-neutral-200 dark:bg-neutral-800" />
        <div className="h-8 w-28 rounded bg-neutral-200 dark:bg-neutral-800" />
      </div>
      <div className="grid grid-cols-2 gap-4 sm:grid-cols-3 md:grid-cols-4 lg:grid-cols-6">
        {Array.from({ length: tiles }, (_, i) => (
          <div key={i} className="h-24 rounded-lg bg-neutral-200 dark:bg-neutral-800" />
        ))}
      </div>
    </div>
  );
}
