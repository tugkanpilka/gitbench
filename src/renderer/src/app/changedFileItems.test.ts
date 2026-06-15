import { describe, expect, it } from 'vitest';

import { buildDiffModel } from '../features/diff-viewer/utils/diffModel';
import { toChangedFileItems } from './changedFileItems';

const DIFF = `diff --git a/src/a.ts b/src/a.ts
new file mode 100644
index 0000000..1111111
--- /dev/null
+++ b/src/a.ts
@@ -0,0 +1 @@
+export const a = 1;
diff --git a/old.ts b/old.ts
deleted file mode 100644
index 1111111..0000000
--- a/old.ts
+++ /dev/null
@@ -1 +0,0 @@
-export const old = true;
`;

const EXPECTED_CHANGED_FILE_ITEMS = [
  {
    id: expect.any(String),
    path: { directory: 'src/', name: 'a.ts' },
    status: 'add',
    additions: 1,
    deletions: 0,
  },
  {
    id: expect.any(String),
    path: { directory: '', name: 'old.ts' },
    status: 'delete',
    additions: 0,
    deletions: 1,
  },
];

describe('toChangedFileItems', () => {
  it('maps the diff viewer model into the neutral navigation model', () => {
    const items = toChangedFileItems(buildDiffModel(DIFF).files);

    expect(items).toEqual(EXPECTED_CHANGED_FILE_ITEMS);
  });

  it('preserves the diff file ids so navigation targets stay aligned', () => {
    const files = buildDiffModel(DIFF).files;
    const items = toChangedFileItems(files);

    expect(items.map((item) => item.id)).toEqual(files.map((file) => file.id));
  });
});
