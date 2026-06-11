import { Diff, Hunk, type FileData } from 'react-diff-view';

import { DiffStat } from '../../../shared/ui/diff-stat';
import type { TProps } from './index.types';
import type { DiffFileModel } from '../utils/diffModel.types';
import styles from '../index.module.scss';

const CHANGE_TYPE_LABEL: Record<FileData['type'], string> = {
  add: 'A',
  delete: 'D',
  modify: 'M',
  rename: 'R',
  copy: 'C',
};

function Chevron({ collapsed }: { collapsed: boolean }) {
  return (
    <svg
      className={styles['diff-file__chevron']}
      data-collapsed={collapsed}
      width="8"
      height="8"
      viewBox="0 0 8 8"
      aria-hidden="true"
    >
      <path
        d="M2.5 1 L6 4 L2.5 7"
        fill="none"
        stroke="currentColor"
        strokeWidth="1.4"
        strokeLinecap="round"
        strokeLinejoin="round"
      />
    </svg>
  );
}

function FilePath({ model }: { model: DiffFileModel }) {
  if (model.previousPath !== null) {
    return (
      <span className={styles['diff-file__path']}>
        <span className={styles['diff-file__directory']}>{model.previousPath}</span>
        <span className={styles['diff-file__rename-arrow']}>→</span>
        <span className={styles['diff-file__name']}>
          {model.path.directory}
          {model.path.name}
        </span>
      </span>
    );
  }

  return (
    <span className={styles['diff-file__path']}>
      <span className={styles['diff-file__directory']}>{model.path.directory}</span>
      <span className={styles['diff-file__name']}>{model.path.name}</span>
    </span>
  );
}

export function DiffFileSection({ model, viewType, collapsed, onToggle, sectionRef }: TProps) {
  const contentId = `diff-file-${model.id.replace(/[^a-zA-Z0-9_-]/g, '-')}`;

  return (
    <section
      ref={sectionRef}
      className={styles['diff-file']}
      aria-label={`${model.path.directory}${model.path.name}`}
    >
      <header className={styles['diff-file__header']}>
        <button
          type="button"
          className={styles['diff-file__toggle']}
          aria-expanded={!collapsed}
          aria-controls={contentId}
          onClick={onToggle}
        >
          <Chevron collapsed={collapsed} />
          <span
            className={styles['diff-file__change-type']}
            data-type={model.file.type}
            aria-hidden="true"
          >
            {CHANGE_TYPE_LABEL[model.file.type]}
          </span>
          <FilePath model={model} />
          <DiffStat additions={model.additions} deletions={model.deletions} />
        </button>
      </header>

      {!collapsed && (
        <div id={contentId} className={styles['diff-file__body']}>
          {model.noTextReason !== null ? (
            <p className={styles['diff-file__no-text']}>{model.noTextReason}</p>
          ) : (
            <Diff
              viewType={viewType}
              diffType={model.file.type}
              hunks={model.file.hunks}
              tokens={model.tokens}
              optimizeSelection={viewType === 'split'}
            >
              {(hunks) =>
                hunks.map((hunk) => (
                  <Hunk
                    key={`${hunk.oldStart}:${hunk.newStart}:${hunk.content}`}
                    hunk={hunk}
                  />
                ))
              }
            </Diff>
          )}
        </div>
      )}
    </section>
  );
}
