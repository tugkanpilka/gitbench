import { describe, expect, it } from 'vitest';

import { buildDiffModel, splitPath } from './diffModel';
import { languageFromPath } from './syntaxHighlight';

const DIFF = `diff --git a/src/auth/session.ts b/src/auth/session.ts
index 1111111..2222222 100644
--- a/src/auth/session.ts
+++ b/src/auth/session.ts
@@ -1,2 +1,3 @@
 const ttl = 30;
-const mode = "local";
+const mode = "remote";
+const secure = true;
diff --git a/old-name.ts b/new-name.ts
similarity index 100%
rename from old-name.ts
rename to new-name.ts
diff --git a/logo.png b/logo.png
index 1111111..2222222 100644
Binary files a/logo.png and b/logo.png differ
`;

// eslint-disable-next-line max-lines-per-function
describe('diffModel', () => {
  it('splits file paths into directory and filename', () => {
    expect(splitPath('src/auth/session.ts')).toEqual({
      directory: 'src/auth/',
      name: 'session.ts',
    });
    expect(splitPath('README.md')).toEqual({ directory: '', name: 'README.md' });
  });

  it('builds file and total statistics from parsed changes', () => {
    const model = buildDiffModel(DIFF);

    expect(model.files).toHaveLength(3);
    expect(model.additions).toBe(2);
    expect(model.deletions).toBe(1);
    expect(model.files[0]).toMatchObject({
      path: { directory: 'src/auth/', name: 'session.ts' },
      additions: 2,
      deletions: 1,
      noTextReason: null,
    });
    expect(model.files[0].tokens).not.toBeNull();
  });

  it('describes rename-only and binary files without textual hunks', () => {
    const model = buildDiffModel(DIFF);

    expect(model.files[1]).toMatchObject({
      previousPath: 'old-name.ts',
      path: { directory: '', name: 'new-name.ts' },
      noTextReason: 'File renamed; text content unchanged.',
    });
    expect(model.files[2]).toMatchObject({
      binary: true,
      noTextReason: 'Cannot display text diff for binary file.',
    });
  });

  it('maps common source paths to syntax grammars', () => {
    expect(languageFromPath('src/App.tsx')).toBe('tsx');
    expect(languageFromPath('scripts/release.sh')).toBe('bash');
    expect(languageFromPath('assets/logo.png')).toBeNull();
  });
});
