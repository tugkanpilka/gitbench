import { useEffect, useLayoutEffect, useRef, useState } from 'react';
import type { ViewType } from 'react-diff-view';
import 'react-diff-view/style/index.css';

import { DiffFileSection } from './DiffFileSection';
import type { DiffModel } from './diffModel';
import './diff-view.css';

export interface DiffNavigationTarget {
  fileId: string;
  requestId: number;
}

interface Props {
  model: DiffModel;
  clean: boolean;
  viewType: ViewType;
  navigationTarget: DiffNavigationTarget | null;
  onActiveFileChange: (fileId: string) => void;
}

export function DiffView({
  model,
  clean,
  viewType,
  navigationTarget,
  onActiveFileChange,
}: Props) {
  const [collapsedFiles, setCollapsedFiles] = useState<Set<string>>(() => new Set());
  const [pendingScrollId, setPendingScrollId] = useState<string | null>(null);
  const rootRef = useRef<HTMLDivElement>(null);
  const sectionRefs = useRef(new Map<string, HTMLElement>());

  useEffect(() => {
    setCollapsedFiles(new Set());
    setPendingScrollId(null);
  }, [model]);

  useEffect(() => {
    if (navigationTarget === null) {
      return;
    }

    setCollapsedFiles((current) => {
      if (!current.has(navigationTarget.fileId)) {
        return current;
      }
      const next = new Set(current);
      next.delete(navigationTarget.fileId);
      return next;
    });
    setPendingScrollId(navigationTarget.fileId);
    onActiveFileChange(navigationTarget.fileId);
  }, [navigationTarget, onActiveFileChange]);

  useLayoutEffect(() => {
    if (pendingScrollId === null) {
      return;
    }

    sectionRefs.current.get(pendingScrollId)?.scrollIntoView?.({
      behavior: 'smooth',
      block: 'start',
    });
    setPendingScrollId(null);
  }, [collapsedFiles, pendingScrollId]);

  useEffect(() => {
    const scrollRoot = rootRef.current?.closest<HTMLElement>('.app-shell__content');
    if (scrollRoot === null || scrollRoot === undefined || model.files.length === 0) {
      return;
    }

    const updateActiveFile = () => {
      const threshold = scrollRoot.scrollTop + 60;
      let activeFileId = model.files[0].id;

      for (const file of model.files) {
        const section = sectionRefs.current.get(file.id);
        if (section !== undefined && section.offsetTop <= threshold) {
          activeFileId = file.id;
        }
      }

      onActiveFileChange(activeFileId);
    };

    scrollRoot.addEventListener('scroll', updateActiveFile, { passive: true });
    updateActiveFile();
    return () => scrollRoot.removeEventListener('scroll', updateActiveFile);
  }, [model, onActiveFileChange]);

  // "" is a first-class success state, never an error (CLAUDE.md hard rule 6).
  if (clean) {
    return (
      <div className="diff-view">
        <div className="diff-view__clean">
          Worktree is clean; no changes in tracked files.
        </div>
      </div>
    );
  }

  if (model.files.length === 0) {
    return (
      <div className="diff-view">
        <div className="diff-view__empty">No diff to display.</div>
      </div>
    );
  }

  const toggleFile = (fileId: string) => {
    setCollapsedFiles((current) => {
      const next = new Set(current);
      if (next.has(fileId)) {
        next.delete(fileId);
      } else {
        next.add(fileId);
      }
      return next;
    });
  };

  return (
    <div ref={rootRef} className="diff-view">
      <h2 className="diff-view__title">Uncommitted changes</h2>
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
