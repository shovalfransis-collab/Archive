// The sort and filter options for a folder's items, shared by the folder
// page (which reads them from the URL, e.g. ?sort=name&type=photo), the
// controls that change them, and the database query that applies them.

export const SORT_OPTIONS = [
  { key: 'newest', label: 'Newest first' },
  { key: 'oldest', label: 'Oldest first' },
  { key: 'name', label: 'Name (A–Z)' },
];

export const TYPE_OPTIONS = [
  { key: 'all', label: 'All types' },
  { key: 'link', label: 'Links' },
  { key: 'photo', label: 'Photos' },
  { key: 'note', label: 'Notes' },
  { key: 'file', label: 'Files' },
];

export const DEFAULT_SORT = 'newest';

// Turns raw URL values into known-good ones. Anything unrecognised (a typo,
// an old bookmark) quietly falls back to the defaults instead of erroring.
// `type` comes back as null for "all types".
export function parseItemQuery(searchParams = {}) {
  const first = (v) => (Array.isArray(v) ? v[0] : v);
  const sort = first(searchParams.sort);
  const type = first(searchParams.type);
  return {
    sort: SORT_OPTIONS.some((o) => o.key === sort) ? sort : DEFAULT_SORT,
    type: type && type !== 'all' && TYPE_OPTIONS.some((o) => o.key === type) ? type : null,
  };
}
