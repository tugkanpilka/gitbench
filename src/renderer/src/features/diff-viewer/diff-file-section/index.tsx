import { memo } from 'react';
import { Diff, Hunk, type FileData, type HunkData } from 'react-diff-view';
import type { ViewType } from 'react-diff-view';

import { Chevron } from '../../../shared/ui/icons';
import { DiffStat } from '../../../shared/ui/diff-stat';
import { Match, Switch } from '../../../shared/ui/switch';
import { Visibility } from '../../../shared/ui/visibility';
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

type DiffBodyProps = { contentId: string; model: DiffFileModel; viewType: ViewType };
type FileHeaderProps = {
  model: DiffFileModel;
  collapsed: boolean;
  onToggle: () => void;
  contentId: string;
};
type ToggleButtonProps = {
  model: DiffFileModel;
  collapsed: boolean;
  onToggle: () => void;
  contentId: string;
};

function hunkKey(hunk: HunkData): string {
  return `${hunk.oldStart}:${hunk.newStart}:${hunk.content}`;
}

function RenamedFilePath({ model }: { model: DiffFileModel }) {
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

function SimpleFilePath({ model }: { model: DiffFileModel }) {
  return (
    <span className={styles['diff-file__path']}>
      <span className={styles['diff-file__directory']}>{model.path.directory}</span>
      <span className={styles['diff-file__name']}>{model.path.name}</span>
    </span>
  );
}

function FilePath({ model }: { model: DiffFileModel }) {
  return (
    <Switch>
      <Match when={model.previousPath !== null}>
        <RenamedFilePath model={model} />
      </Match>
      <Match when={true}>
        <SimpleFilePath model={model} />
      </Match>
    </Switch>
  );
}

function DiffHunks({ model, viewType }: { model: DiffFileModel; viewType: ViewType }) {
  return (
    <Diff
      viewType={viewType}
      diffType={model.file.type}
      hunks={model.file.hunks}
      tokens={model.tokens}
      optimizeSelection={viewType === 'split'}
    >
      {(hunks) => hunks.map((hunk) => <Hunk key={hunkKey(hunk)} hunk={hunk} />)}
    </Diff>
  );
}

function DiffBody({ contentId, model, viewType }: DiffBodyProps) {
  return (
    <div id={contentId} className={styles['diff-file__body']}>
      <Switch>
        <Match when={model.noTextReason !== null}>
          <p className={styles['diff-file__no-text']}>{model.noTextReason}</p>
        </Match>
        <Match when={true}>
          <DiffHunks model={model} viewType={viewType} />
        </Match>
      </Switch>
    </div>
  );
}

// eslint-disable-next-line max-lines-per-function -- pure JSX render; change-type badge and FilePath are already extracted
function ToggleButton({ model, collapsed, onToggle, contentId }: ToggleButtonProps) {
  return (
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
  );
}

function FileHeader({ model, collapsed, onToggle, contentId }: FileHeaderProps) {
  return (
    <header className={styles['diff-file__header']}>
      <ToggleButton model={model} collapsed={collapsed} onToggle={onToggle} contentId={contentId} />
    </header>
  );
}

// eslint-disable-next-line max-lines-per-function -- pure JSX render; FileHeader and DiffBody are already extracted subcomponents
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
      <FileHeader model={model} collapsed={collapsed} onToggle={onToggle} contentId={contentId} />
      <Visibility isVisible={!collapsed}>
        <DiffBody contentId={contentId} model={model} viewType={viewType} />
      </Visibility>
    </section>
  );
});
