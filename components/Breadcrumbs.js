// Pure display component — no interactivity needed, so it stays a plain
// Server Component (no 'use client'). Walks up the parent_id chain to
// build the "Home / Parent / Current" trail.
export default function Breadcrumbs({ folder, allFolders }) {
  const byId = new Map(allFolders.map((f) => [f.id, f]));
  const trail = [];
  let current = folder;
  while (current) {
    trail.unshift(current);
    current = current.parent_id ? byId.get(current.parent_id) : null;
  }

  return (
    <nav className="flex flex-wrap gap-1 text-sm text-neutral-500">
      <a href="/" className="hover:underline">
        Home
      </a>
      {trail.map((f) => (
        <span key={f.id}>
          {' / '}
          <a href={`/folder/${f.id}`} className="hover:underline">
            {f.name}
          </a>
        </span>
      ))}
    </nav>
  );
}
