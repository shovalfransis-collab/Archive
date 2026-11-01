import { test } from 'node:test';
import assert from 'node:assert/strict';
import { buildFolderTree, flattenWithDepth } from '../lib/folderTree.js';

const folders = [
  { id: 1, name: 'Work', parent_id: null },
  { id: 2, name: 'Fun', parent_id: null },
  { id: 3, name: 'Reddit', parent_id: 2 },
  { id: 4, name: 'Games', parent_id: 2 },
  { id: 5, name: 'Retro', parent_id: 4 },
];

test('buildFolderTree nests children under their parent', () => {
  const tree = buildFolderTree(folders);
  const fun = tree.find((f) => f.id === 2);
  assert.deepEqual(fun.children.map((c) => c.id).sort(), [3, 4]);
  assert.equal(fun.children.find((c) => c.id === 4).children[0].id, 5);
});

test('buildFolderTree sorts every level by name', () => {
  const tree = buildFolderTree(folders);
  assert.deepEqual(tree.map((f) => f.name), ['Fun', 'Work']);
  assert.deepEqual(tree[0].children.map((f) => f.name), ['Games', 'Reddit']);
});

test('buildFolderTree treats folders with a missing parent as top level', () => {
  const tree = buildFolderTree([
    { id: 1, name: 'Kept', parent_id: null },
    { id: 9, name: 'Orphan', parent_id: 999 },
  ]);
  assert.deepEqual(tree.map((f) => f.name), ['Kept', 'Orphan']);
});

test('buildFolderTree does not modify the input objects', () => {
  const input = [{ id: 1, name: 'A', parent_id: null }];
  buildFolderTree(input);
  assert.equal(input[0].children, undefined);
});

test('flattenWithDepth lists parents before children with the right depth', () => {
  const flat = flattenWithDepth(folders);
  assert.deepEqual(
    flat.map((f) => [f.name, f.depth]),
    [
      ['Fun', 0],
      ['Games', 1],
      ['Retro', 2],
      ['Reddit', 1],
      ['Work', 0],
    ]
  );
});

test('flattenWithDepth handles an empty list', () => {
  assert.deepEqual(flattenWithDepth([]), []);
});

import { getDescendantIds, canMoveFolder } from '../lib/folderTree.js';

test('getDescendantIds includes the folder and everything below it', () => {
  assert.deepEqual([...getDescendantIds(folders, 2)].sort(), [2, 3, 4, 5]);
  assert.deepEqual([...getDescendantIds(folders, 5)], [5]);
});

test('canMoveFolder allows normal moves and moving to top level', () => {
  assert.equal(canMoveFolder(folders, 5, 1), true); // Retro -> Work
  assert.equal(canMoveFolder(folders, 4, null), true); // Games -> top level
  assert.equal(canMoveFolder(folders, 1, 2), true); // Work -> Fun
});

test('canMoveFolder blocks moving a folder into itself or its subfolders', () => {
  assert.equal(canMoveFolder(folders, 2, 2), false); // Fun -> Fun
  assert.equal(canMoveFolder(folders, 2, 4), false); // Fun -> Fun/Games
  assert.equal(canMoveFolder(folders, 2, 5), false); // Fun -> Fun/Games/Retro
});

test('canMoveFolder blocks moving into a folder that does not exist', () => {
  assert.equal(canMoveFolder(folders, 1, 999), false);
});

test('flattenWithDepth keeps each folder icon', () => {
  const flat = flattenWithDepth([{ id: 1, name: 'A', parent_id: null, icon: '⭐' }]);
  assert.equal(flat[0].icon, '⭐');
});

import { canDropOnFolder } from '../lib/folderTree.js';

test('canDropOnFolder: items can go to any other folder, never top level', () => {
  const item = { kind: 'item', id: 10, folderId: 3 };
  assert.equal(canDropOnFolder(item, 1, folders), true);
  assert.equal(canDropOnFolder(item, 3, folders), false); // already there
  assert.equal(canDropOnFolder(item, null, folders), false);
});

test('canDropOnFolder: folders follow the move rules', () => {
  const games = { kind: 'folder', id: 4, parentId: 2 };
  assert.equal(canDropOnFolder(games, 1, folders), true);
  assert.equal(canDropOnFolder(games, null, folders), true);
  assert.equal(canDropOnFolder(games, 2, folders), false); // already there
  assert.equal(canDropOnFolder(games, 4, folders), false); // onto itself
  assert.equal(canDropOnFolder(games, 5, folders), false); // into its own subfolder
});

test('canDropOnFolder: nothing being dragged means no drop', () => {
  assert.equal(canDropOnFolder(null, 1, folders), false);
});

import { findTopLevelFolderByName } from '../lib/folderTree.js';

test('findTopLevelFolderByName ignores case and extra spaces', () => {
  const list = [
    { id: 1, name: 'Recipes', parent_id: null },
    { id: 2, name: 'Travel  Plans', parent_id: null },
  ];
  assert.equal(findTopLevelFolderByName(list, 'recipes').id, 1);
  assert.equal(findTopLevelFolderByName(list, '  RECIPES ').id, 1);
  assert.equal(findTopLevelFolderByName(list, 'travel plans').id, 2);
});

test('findTopLevelFolderByName only matches top-level folders', () => {
  const list = [
    { id: 1, name: 'Fun', parent_id: null },
    { id: 2, name: 'Recipes', parent_id: 1 }, // nested — not a match
  ];
  assert.equal(findTopLevelFolderByName(list, 'Recipes'), null);
});

test('findTopLevelFolderByName returns null for no match or empty names', () => {
  const list = [{ id: 1, name: 'Recipes', parent_id: null }];
  assert.equal(findTopLevelFolderByName(list, 'Recipe'), null);
  assert.equal(findTopLevelFolderByName(list, ''), null);
  assert.equal(findTopLevelFolderByName(list, null), null);
});
