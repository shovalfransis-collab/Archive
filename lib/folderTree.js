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
      flat.push({ id: node.id, name: node.name, depth });
      walk(node.children, depth + 1);
    }
  };
  walk(tree, 0);

  return flat;
}
