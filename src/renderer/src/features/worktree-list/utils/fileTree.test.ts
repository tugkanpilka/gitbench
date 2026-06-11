import { describe, expect, it } from 'vitest';

import { buildDiffModel } from '../../diff-viewer/utils/diffModel';
import { buildFileTree, directoryPathsForFile } from './fileTree';

const FILES = buildDiffModel(`diff --git a/src/components/Button.tsx b/src/components/Button.tsx
index 1111111..2222222 100644
--- a/src/components/Button.tsx
+++ b/src/components/Button.tsx
@@ -1 +1,2 @@
 export const Button = () => null;
+export const PrimaryButton = Button;
diff --git a/src/App.tsx b/src/App.tsx
index 3333333..4444444 100644
--- a/src/App.tsx
+++ b/src/App.tsx
@@ -1 +1,2 @@
 export const App = () => null;
+export const name = 'GitBench';
diff --git a/README.md b/README.md
index 5555555..6666666 100644
--- a/README.md
+++ b/README.md
@@ -1 +1,2 @@
 # GitBench
+Worktree diff viewer
`).files;

describe('fileTree', () => {
  it('groups files into nested directories while retaining root files', () => {
    const tree = buildFileTree(FILES);

    expect(tree.files.map((file) => file.path.name)).toEqual(['README.md']);
    expect(tree.directories.map((directory) => directory.name)).toEqual(['src']);
    expect(tree.directories[0].files.map((file) => file.path.name)).toEqual(['App.tsx']);
    expect(tree.directories[0].directories[0].name).toBe('components');
    expect(tree.directories[0].directories[0].files.map((file) => file.path.name)).toEqual([
      'Button.tsx',
    ]);
  });

  it('returns every ancestor path for an active file', () => {
    expect(directoryPathsForFile(FILES[0])).toEqual(['src/', 'src/components/']);
    expect(directoryPathsForFile(FILES[2])).toEqual([]);
  });
});
