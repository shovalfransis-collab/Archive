// The API hands back folders as a flat list (each one just knows its own
// parent_id). These helpers turn that flat list into something the UI can
// actually walk: a nested tree, or a flat-but-indented list for dropdowns
// and the "move to folder" picker, so subfolders visibly nest under their
// parent instead of appearing as one long unordered list.

export function buildFolderTree(folders) {
  const byId = new Map(folders.map((f) => [f.id, { ...f, children: [] }]));
  const roots = [];

  for (const folder of byId.values()) {
    if (folder.parent_id && byId.has(folder.parent_id)) {
      byId.get(folder.parent_id).children.push(folder);
    } else {
      roots.push(folder);
    }
  }

  const byName = (a, b) => a.name.localeCompare(b.name);
  const sortTree = (nodes) => {
    nodes.sort(byName);
    nodes.forEach((node) => sortTree(node.children));
  };
  sortTree(roots);

  return roots;
}

export function flattenWithDepth(folders) {
  const tree = buildFolderTree(folders);
  const flat = [];

  const walk = (nodes, depth) => {
    for (const node of nodes) {
      flat.push({ id: node.id, name: node.name, icon: node.icon ?? null, depth });
      walk(node.children, depth + 1);
    }
  };
  walk(tree, 0);

  return flat;
}

// The ids of a folder and everything nested anywhere inside it.
export function getDescendantIds(folders, folderId) {
  const childrenOf = new Map();
  for (const f of folders) {
    if (!childrenOf.has(f.parent_id)) childrenOf.set(f.parent_id, []);
    childrenOf.get(f.parent_id).push(f.id);
  }
  const result = new Set([folderId]);
  const stack = [folderId];
  while (stack.length) {
    for (const child of childrenOf.get(stack.pop()) || []) {
      if (!result.has(child)) {
        result.add(child);
        stack.push(child);
      }
    }
  }
  return result;
}

// Whether a folder may be moved under `newParentId` (null = top level).
// A folder can't go inside itself or inside one of its own subfolders:
// that would make a loop with no top-level ancestor, and the whole loop
// would disappear from the folder tree.
export function canMoveFolder(folders, folderId, newParentId) {
  if (newParentId === null) return true;
  if (!folders.some((f) => f.id === newParentId)) return false;
  return !getDescendantIds(folders, folderId).has(newParentId);
}

// Whether a dragged item or folder may be dropped on folder `targetId`
// (null = top level). `drag` is { kind: 'item', id, folderId } or
// { kind: 'folder', id, parentId }. Dropping where it already is counts as
// "no", so nothing lights up for a move that wouldn't change anything.
export function canDropOnFolder(drag, targetId, folders) {
  if (!drag) return false;
  if (drag.kind === 'item') {
    return targetId !== null && drag.folderId !== targetId; // items always live in a folder
  }
  if (drag.kind === 'folder') {
    if ((drag.parentId ?? null) === targetId) return false;
    return canMoveFolder(folders, drag.id, targetId);
  }
  return false;
}

// The top-level folder with this name, ignoring upper/lower case and extra
// spaces — or null. Used so the AI's "make a new folder called Recipes"
// reuses an existing "recipes" folder instead of creating a duplicate.
export function findTopLevelFolderByName(folders, name) {
  const wanted = String(name ?? '').trim().replace(/\s+/g, ' ').toLowerCase();
  if (!wanted) return null;
  return (
    folders.find(
      (f) => !f.parent_id && f.name.trim().replace(/\s+/g, ' ').toLowerCase() === wanted
    ) || null
  );
}

// The names from the top level down to a folder, e.g. ['Fun', 'Games']
// for Fun/Games. Empty if the folder doesn't exist. Stops safely if bad
// data ever made a loop.
export function folderPath(folders, folderId) {
  const byId = new Map(folders.map((f) => [f.id, f]));
  const path = [];
  const seen = new Set();
  let current = byId.get(folderId);
  while (current && !seen.has(current.id)) {
    seen.add(current.id);
    path.unshift(current.name);
    current = current.parent_id ? byId.get(current.parent_id) : null;
  }
  return path;
}
