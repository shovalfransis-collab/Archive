import BreadcrumbLink from './BreadcrumbLink';

// Stays a Server Component; only the individual links (which are also
// drag-and-drop targets) are client components. Walks up the parent_id chain to
// build the "Home / Parent / Current" trail.
export default function Breadcrumbs({ folder, allFolders }) {
  const byId = new Map(allFolders.map((f) => [f.id, f]));
  const trail = [];
  let current = folder;
  // `seen` guards against looping forever if bad data ever made a cycle.
  const seen = new Set();
  while (current && !seen.has(current.id)) {
    seen.add(current.id);
    trail.unshift(current);
    current = current.parent_id ? byId.get(current.parent_id) : null;
  }

  return (
    <nav className="flex flex-wrap gap-1 text-sm text-neutral-500 dark:text-neutral-400">
      <BreadcrumbLink href="/" folderId={null} allFolders={allFolders}>
        Home
      </BreadcrumbLink>
      {trail.map((f) => (
        <span key={f.id}>
          {' / '}
          <BreadcrumbLink href={`/folder/${f.id}`} folderId={f.id} allFolders={allFolders}>
            {f.name}
          </BreadcrumbLink>
        </span>
      ))}
    </nav>
  );
}
