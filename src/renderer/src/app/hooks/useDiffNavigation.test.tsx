// @vitest-environment jsdom
import { cleanup, fireEvent, render, screen } from '@testing-library/react';
import { afterEach, describe, expect, it } from 'vitest';

import type { DiffModel } from '../../features/diff-viewer/utils/diffModel.types';
import { buildDiffModel, EMPTY_DIFF_MODEL } from '../../features/diff-viewer/utils/diffModel';
import { useDiffNavigation } from './useDiffNavigation';

const MULTI_FILE_DIFF = `diff --git a/src/a.ts b/src/a.ts
index 1111111..2222222 100644
--- a/src/a.ts
+++ b/src/a.ts
@@ -1 +1,2 @@
 const a = 1;
+const a2 = 2;
diff --git a/src/b.ts b/src/b.ts
index 3333333..4444444 100644
--- a/src/b.ts
+++ b/src/b.ts
@@ -1 +1,2 @@
 export const b = 1;
+export const c = 2;
`;

function NavigationHarness({ model }: { model: DiffModel }) {
  const navigation = useDiffNavigation(model);

  return (
    <>
      <output aria-label="Active file">{navigation.activeFileId ?? '(none)'}</output>
      <output aria-label="Navigation target">
        {navigation.navigationTarget === null
          ? '(none)'
          : `${navigation.navigationTarget.fileId}@${navigation.navigationTarget.requestId}`}
      </output>
      <button type="button" onClick={() => navigation.selectFile(model.files[1].id)}>
        Select second file
      </button>
      <button type="button" onClick={() => navigation.setActiveFileId(model.files[1].id)}>
        Scroll to second file
      </button>
      <button type="button" onClick={() => navigation.setActiveFileId(null)}>
        Scroll past every file
      </button>
    </>
  );
}

afterEach(() => cleanup());

describe('useDiffNavigation', () => {
  it('activates the first file of a new diff model without requesting navigation', () => {
    const model = buildDiffModel(MULTI_FILE_DIFF);

    render(<NavigationHarness model={model} />);

    expect(screen.getByLabelText('Active file').textContent).toBe(model.files[0].id);
    expect(screen.getByLabelText('Navigation target').textContent).toBe('(none)');
  });

  it('has no active file for an empty diff model', () => {
    render(<NavigationHarness model={EMPTY_DIFF_MODEL} />);

    expect(screen.getByLabelText('Active file').textContent).toBe('(none)');
    expect(screen.getByLabelText('Navigation target').textContent).toBe('(none)');
  });

  it('selectFile activates the file and emits a navigation target with a strictly increasing request id', () => {
    const model = buildDiffModel(MULTI_FILE_DIFF);
    render(<NavigationHarness model={model} />);

    fireEvent.click(screen.getByRole('button', { name: 'Select second file' }));

    expect(screen.getByLabelText('Active file').textContent).toBe(model.files[1].id);
    expect(screen.getByLabelText('Navigation target').textContent).toBe(`${model.files[1].id}@1`);

    // Re-selecting the same file must produce a new request id so DiffView
    // scrolls again even though the target file is unchanged.
    fireEvent.click(screen.getByRole('button', { name: 'Select second file' }));

    expect(screen.getByLabelText('Navigation target').textContent).toBe(`${model.files[1].id}@2`);
  });

  it('a new diff model identity clears the pending navigation target and re-activates the first file', () => {
    const model = buildDiffModel(MULTI_FILE_DIFF);
    const { rerender } = render(<NavigationHarness model={model} />);
    fireEvent.click(screen.getByRole('button', { name: 'Select second file' }));
    expect(screen.getByLabelText('Navigation target').textContent).toBe(`${model.files[1].id}@1`);

    const nextModel = buildDiffModel(MULTI_FILE_DIFF);
    rerender(<NavigationHarness model={nextModel} />);

    expect(screen.getByLabelText('Active file').textContent).toBe(nextModel.files[0].id);
    expect(screen.getByLabelText('Navigation target').textContent).toBe('(none)');
  });

  it('scroll-driven active-file updates do not echo back as navigation requests', () => {
    const model = buildDiffModel(MULTI_FILE_DIFF);
    render(<NavigationHarness model={model} />);

    fireEvent.click(screen.getByRole('button', { name: 'Scroll to second file' }));

    expect(screen.getByLabelText('Active file').textContent).toBe(model.files[1].id);
    expect(screen.getByLabelText('Navigation target').textContent).toBe('(none)');

    fireEvent.click(screen.getByRole('button', { name: 'Scroll past every file' }));

    expect(screen.getByLabelText('Active file').textContent).toBe('(none)');
    expect(screen.getByLabelText('Navigation target').textContent).toBe('(none)');
  });
});
