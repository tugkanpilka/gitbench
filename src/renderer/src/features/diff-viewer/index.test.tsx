// @vitest-environment jsdom
import { cleanup, fireEvent, render, screen } from '@testing-library/react';
import { afterEach, describe, expect, it, vi } from 'vitest';

import { DiffView } from '.';
import { buildDiffModel, EMPTY_DIFF_MODEL } from './utils/diffModel';

const TEXT_DIFF = `diff --git a/src/a.ts b/src/a.ts
index 1111111..2222222 100644
--- a/src/a.ts
+++ b/src/a.ts
@@ -1,2 +1,3 @@
 const a = 1;
-old
+new
+added
`;

const NON_TEXT_DIFF = `diff --git a/old.ts b/new.ts
similarity index 100%
rename from old.ts
rename to new.ts
diff --git a/image.png b/image.png
index 1111111..2222222 100644
Binary files a/image.png and b/image.png differ
`;

const MULTI_FILE_DIFF = `${TEXT_DIFF}diff --git a/src/b.ts b/src/b.ts
index 3333333..4444444 100644
--- a/src/b.ts
+++ b/src/b.ts
@@ -1 +1,2 @@
 export const b = 1;
+export const c = 2;
`;

const CSS_DIFF = `diff --git a/src/app.css b/src/app.css
index 5555555..6666666 100644
--- a/src/app.css
+++ b/src/app.css
@@ -1,3 +1,3 @@
 .button {
-  color: red;
+  color: blue;
 }
`;

const HCL_DIFF = `diff --git a/infra/main.tf b/infra/main.tf
index 7777777..8888888 100644
--- a/infra/main.tf
+++ b/infra/main.tf
@@ -1,3 +1,4 @@
 resource "aws_s3_bucket" "example" {
   bucket = "example"
+  force_destroy = true
 }
`;

afterEach(() => cleanup());

type DiffViewProps = Parameters<typeof DiffView>[0];

function renderDiffView(overrides: Partial<DiffViewProps> = {}) {
  return render(
    <DiffView
      model={buildDiffModel(TEXT_DIFF)}
      clean={false}
      viewType="unified"
      navigationTarget={null}
      onActiveFileChange={() => undefined}
      {...overrides}
    />
  );
}

describe('DiffView', () => {
  it('renders a syntax-highlighted unified diff', () => {
    const { container } = renderDiffView();

    expect(screen.getByRole('heading', { name: 'Uncommitted changes' })).toBeTruthy();
    expect(container.querySelector('.diff-unified')).toBeTruthy();
    expect(container.querySelector('.token.keyword')).toBeTruthy();
    expect(container.querySelector('.token.number')).toBeTruthy();
    expect(container.querySelector('.diff-code-edit')).toBeNull();
  });

  it('renders syntax tokens for CSS diffs', () => {
    const { container } = renderDiffView({ model: buildDiffModel(CSS_DIFF) });

    expect(container.querySelector('.token.selector')).toBeTruthy();
    expect(container.querySelector('.token.property')).toBeTruthy();
  });

  it('renders syntax tokens from the full Refractor language set', () => {
    const { container } = renderDiffView({ model: buildDiffModel(HCL_DIFF) });

    expect(container.querySelector('.token.keyword')).toBeTruthy();
    expect(container.querySelector('.token.type')).toBeTruthy();
    expect(container.querySelector('.token.variable')).toBeTruthy();
  });

  it('renders in split mode when viewType is split', () => {
    const { container } = renderDiffView({ viewType: 'split' });

    expect(container.querySelector('.diff-split')).toBeTruthy();
  });

  it('collapses and expands a file section', () => {
    renderDiffView();

    const toggle = screen.getByRole('button', { name: /src\/a.ts/ });
    expect(toggle.getAttribute('aria-expanded')).toBe('true');
    expect(screen.getByText('new')).toBeTruthy();

    fireEvent.click(toggle);

    expect(toggle.getAttribute('aria-expanded')).toBe('false');
    expect(screen.queryByText('new')).toBeNull();
  });

  it('renders explicit rename and binary states', () => {
    renderDiffView({ model: buildDiffModel(NON_TEXT_DIFF) });

    expect(screen.getByText('File renamed; text content unchanged.')).toBeTruthy();
    expect(screen.getByText('Cannot display text diff for binary file.')).toBeTruthy();
  });

  it('renders the clean-worktree state for an empty diff', () => {
    renderDiffView({ model: EMPTY_DIFF_MODEL, clean: true });

    expect(screen.getByText('Worktree is clean; no uncommitted changes.')).toBeTruthy();
  });

  it('opens a collapsed file and scrolls to a requested sidebar target', () => {
    const model = buildDiffModel(TEXT_DIFF);
    const onActiveFileChange = vi.fn();
    const { rerender } = renderDiffView({ model, onActiveFileChange });
    const toggle = screen.getByRole('button', { name: /src\/a.ts/ });
    const section = screen.getByRole('region', { name: 'src/a.ts' });
    const scrollIntoView = vi.fn();
    Object.defineProperty(section, 'scrollIntoView', {
      configurable: true,
      value: scrollIntoView,
    });

    fireEvent.click(toggle);
    expect(toggle.getAttribute('aria-expanded')).toBe('false');

    rerender(
      <DiffView
        model={model}
        clean={false}
        viewType="unified"
        navigationTarget={{ fileId: model.files[0].id, requestId: 1 }}
        onActiveFileChange={onActiveFileChange}
      />
    );

    expect(toggle.getAttribute('aria-expanded')).toBe('true');
    expect(scrollIntoView).toHaveBeenCalledWith({ behavior: 'smooth', block: 'start' });
    expect(onActiveFileChange).toHaveBeenCalledWith(model.files[0].id);
  });

  it('reports the active file while the diff stream scrolls', () => {
    const model = buildDiffModel(MULTI_FILE_DIFF);
    const onActiveFileChange = vi.fn();
    const { container } = render(
      <div className="app-shell__content">
        <DiffView
          model={model}
          clean={false}
          viewType="unified"
          navigationTarget={null}
          onActiveFileChange={onActiveFileChange}
        />
      </div>
    );
    const scrollRoot = container.querySelector<HTMLElement>('.app-shell__content');
    const sections = screen.getAllByRole('region');
    Object.defineProperty(sections[0], 'offsetTop', { configurable: true, value: 0 });
    Object.defineProperty(sections[1], 'offsetTop', { configurable: true, value: 500 });
    onActiveFileChange.mockClear();

    if (scrollRoot === null) {
      throw new Error('Expected diff scroll root.');
    }
    scrollRoot.scrollTop = 520;
    fireEvent.scroll(scrollRoot);

    expect(onActiveFileChange).toHaveBeenLastCalledWith(model.files[1].id);
  });
});
