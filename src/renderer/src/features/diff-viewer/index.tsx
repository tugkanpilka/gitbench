import { useEffect, useRef, useState } from 'react';
import 'react-diff-view/style/index.css';

import { toggledSet } from '../../shared/collections/toggledSet';
import { DiffFileSection } from './diff-file-section';
import { useScrollToSection } from './hooks/useScrollToSection';
import { useActiveFileScrollSpy } from './hooks/useActiveFileScrollSpy';
import type { TProps } from './index.types';
import styles from './index.module.scss';

export function DiffView({
  model,
  clean,
  viewType,
  navigationTarget,
  onActiveFileChange,
}: TProps) {
  const [collapsedFiles, setCollapsedFiles] = useState<Set<string>>(() => new Set());
  const rootRef = useRef<HTMLDivElement>(null);
  const sectionRefs = useRef(new Map<string, HTMLElement>());
  const setPendingScrollId = useScrollToSection(sectionRefs, collapsedFiles);

  useEffect(() => {
    setCollapsedFiles(new Set());
    setPendingScrollId(null);
  }, [model, setPendingScrollId]);

  useEffect(() => {
    if (navigationTarget === null) {
      return;
    }

    setCollapsedFiles((current) =>
      current.has(navigationTarget.fileId) ? toggledSet(current, navigationTarget.fileId) : current
    );
    setPendingScrollId(navigationTarget.fileId);
    onActiveFileChange(navigationTarget.fileId);
  }, [navigationTarget, onActiveFileChange, setPendingScrollId]);

  useActiveFileScrollSpy(rootRef, sectionRefs, model, onActiveFileChange);

  const toggleFile = (fileId: string) => {
    setCollapsedFiles((current) => toggledSet(current, fileId));
  };

  if (clean) {
    return (
      <div className={styles['diff-view']}>
        <div className={styles['diff-view__clean']}>
          Worktree is clean; no changes in tracked files.
        </div>
      </div>
    );
  }

  if (model.files.length === 0) {
    return (
      <div className={styles['diff-view']}>
        <div className={styles['diff-view__empty']}>No diff to display.</div>
      </div>
    );
  }

  return (
    <div ref={rootRef} className={styles['diff-view']}>
      <h2 className={styles['diff-view__title']}>Uncommitted changes</h2>
      {model.files.map((file) => (
        <DiffFileSection
          key={file.id}
          model={file}
          viewType={viewType}
          collapsed={collapsedFiles.has(file.id)}
          onToggle={() => toggleFile(file.id)}
          sectionRef={(element) => {
            if (element === null) {
              sectionRefs.current.delete(file.id);
            } else {
              sectionRefs.current.set(file.id, element);
            }
          }}
        />
      ))}
    </div>
  );
}
