import { memo } from 'react';
import { Diff, Hunk, type FileData } from 'react-diff-view';

import { Chevron } from '../../../shared/ui/icons';
import { DiffStat } from '../../../shared/ui/diff-stat';
import type { DiffFileSectionProps } from './index.types';
import type { DiffFileModel } from '../utils/diffModel.types';
import styles from '../index.module.scss';

const CHANGE_TYPE_LABEL: Record<FileData['type'], string> = {
  add: 'A',
  delete: 'D',
  modify: 'M',
  rename: 'R',
  copy: 'C',
};

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

export const DiffFileSection = memo(function DiffFileSection({
  model,
  viewType,
  collapsed,
  onToggle,
  sectionRef,
}: DiffFileSectionProps) {
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
          <Chevron collapsed={collapsed} className={styles['diff-file__chevron']} />
          <span
            className={styles['diff-file__change-type']}
            data-type={model.file.type}
            aria-hidden="true"
          >
            <span className={styles['diff-file__change-type-label']}>
              {CHANGE_TYPE_LABEL[model.file.type]}
            </span>
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
                  <Hunk key={`${hunk.oldStart}:${hunk.newStart}:${hunk.content}`} hunk={hunk} />
                ))
              }
            </Diff>
          )}
        </div>
      )}
    </section>
  );
});
