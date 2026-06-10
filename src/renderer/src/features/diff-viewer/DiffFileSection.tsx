import type { RefCallback } from 'react';
import { Diff, Hunk, type ViewType } from 'react-diff-view';

import { DiffStat } from '../../shared/ui/core';
import type { DiffFileModel } from './diffModel';

interface Props {
  model: DiffFileModel;
  viewType: ViewType;
  collapsed: boolean;
  onToggle: () => void;
  sectionRef: RefCallback<HTMLElement>;
}

function FilePath({ model }: { model: DiffFileModel }) {
  if (model.previousPath !== null) {
    return (
      <span className="diff-file__path">
        <span className="diff-file__directory">{model.previousPath}</span>
        <span className="diff-file__rename-arrow">→</span>
        <span className="diff-file__name">
          {model.path.directory}
          {model.path.name}
        </span>
      </span>
    );
  }

  return (
    <span className="diff-file__path">
      <span className="diff-file__directory">{model.path.directory}</span>
      <span className="diff-file__name">{model.path.name}</span>
    </span>
  );
}

export function DiffFileSection({ model, viewType, collapsed, onToggle, sectionRef }: Props) {
  const contentId = `diff-file-${model.id.replace(/[^a-zA-Z0-9_-]/g, '-')}`;

  return (
    <section
      ref={sectionRef}
      className="diff-file"
      aria-label={`${model.path.directory}${model.path.name}`}
    >
      <header className="diff-file__header">
        <button
          type="button"
          className="diff-file__toggle"
          aria-expanded={!collapsed}
          aria-controls={contentId}
          onClick={onToggle}
        >
          <svg
            className="diff-file__chevron"
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
          <span
            className="diff-file__change-type"
            data-type={model.file.type}
            aria-hidden="true"
          >
            {model.file.type === 'add'
              ? 'A'
              : model.file.type === 'delete'
                ? 'D'
                : model.file.type === 'rename'
                  ? 'R'
                  : model.file.type === 'copy'
                    ? 'C'
                    : 'M'}
          </span>
          <FilePath model={model} />
          <DiffStat additions={model.additions} deletions={model.deletions} />
        </button>
      </header>

      {!collapsed && (
        <div id={contentId} className="diff-file__body">
          {model.noTextReason !== null ? (
            <p className="diff-file__no-text">{model.noTextReason}</p>
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
