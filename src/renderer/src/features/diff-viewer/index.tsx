import { useCallback, useEffect, useRef, useState } from 'react';
import type { RefCallback } from 'react';
import 'react-diff-view/style/index.css';

import { toggledSet } from '../../shared/collections/toggledSet';
import { DiffFileSection } from './diff-file-section';
import { useScrollToSection } from './hooks/useScrollToSection';
import { useActiveFileScrollSpy } from './hooks/useActiveFileScrollSpy';
import type { DiffViewProps } from './index.types';
import type { DiffModel } from './utils/diffModel.types';
import styles from './index.module.scss';

export function DiffView({
  model,
  clean,
  viewType,
  navigationTarget,
  scrollContainerRef,
  onActiveFileChange,
}: DiffViewProps) {
  if (clean) {
    return (
      <div className={styles['diff-view']}>
        <div className={styles['diff-view__clean']}>Worktree is clean; no uncommitted changes.</div>
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

  // A new diff is a new logical instance: keying the content on model identity resets
  // the collapse/scroll state below without a synchronous reset effect. `instanceKey`
  // increments whenever the model reference changes (App rebuilds it per diff).
  return (
    <DiffViewContent
      key={instanceKey(model)}
      model={model}
      viewType={viewType}
      navigationTarget={navigationTarget}
      scrollContainerRef={scrollContainerRef}
      onActiveFileChange={onActiveFileChange}
    />
  );
}

// Monotonic identity counter: a fresh number per distinct model object reference, used
// purely as a React `key`. Render-pure (refs only; no state, no effect).
let nextInstanceId = 0;
const instanceIds = new WeakMap<DiffModel, number>();
function instanceKey(model: DiffModel): number {
  let id = instanceIds.get(model);
  if (id === undefined) {
    id = nextInstanceId++;
    instanceIds.set(model, id);
  }
  return id;
}

type DiffViewContentProps = Omit<DiffViewProps, 'clean'>;

function DiffViewContent({
  model,
  viewType,
  navigationTarget,
  scrollContainerRef,
  onActiveFileChange,
}: DiffViewContentProps) {
  const [collapsedFiles, setCollapsedFiles] = useState<Set<string>>(() => new Set());
  const sectionRefs = useRef(new Map<string, HTMLElement>());
  const scrollToSection = useScrollToSection(sectionRefs);

  // React to a new reveal-and-scroll command during render (not in an effect): expand the
  // target file synchronously so it is open before the commit, comparing against the last
  // handled requestId. Re-selecting the same file produces a new requestId, so it expands
  // again after the user collapses it.
  const [handledRequestId, setHandledRequestId] = useState<number | null>(null);
  if (navigationTarget !== null && navigationTarget.requestId !== handledRequestId) {
    setHandledRequestId(navigationTarget.requestId);
    setCollapsedFiles((current) =>
      current.has(navigationTarget.fileId) ? toggledSet(current, navigationTarget.fileId) : current
    );
  }

  // The scroll and the active-file notification are post-commit side effects: the section
  // element stays mounted regardless of collapse state, so scrolling once the expansion
  // has committed reveals it. No component state is set here.
  useEffect(() => {
    if (navigationTarget === null) {
      return;
    }
    scrollToSection(navigationTarget.fileId);
    onActiveFileChange(navigationTarget.fileId);
  }, [navigationTarget, onActiveFileChange, scrollToSection]);

  useActiveFileScrollSpy(scrollContainerRef, sectionRefs, model, onActiveFileChange);

  // Cache one stable callback per file id so each memoized DiffFileSection keeps
  // referentially-equal onToggle / sectionRef props across re-renders.
  const toggleHandlers = useRef(new Map<string, () => void>());
  const sectionRefHandlers = useRef(new Map<string, RefCallback<HTMLElement>>());

  const getToggleHandler = useCallback((fileId: string) => {
    let handler = toggleHandlers.current.get(fileId);
    if (handler === undefined) {
      handler = () => setCollapsedFiles((current) => toggledSet(current, fileId));
      toggleHandlers.current.set(fileId, handler);
    }
    return handler;
  }, []);

  const getSectionRef = useCallback((fileId: string) => {
    let handler = sectionRefHandlers.current.get(fileId);
    if (handler === undefined) {
      handler = (element) => {
        if (element === null) {
          sectionRefs.current.delete(fileId);
        } else {
          sectionRefs.current.set(fileId, element);
        }
      };
      sectionRefHandlers.current.set(fileId, handler);
    }
    return handler;
  }, []);

  return (
    <div className={styles['diff-view']}>
      <h2 className={styles['diff-view__title']}>Uncommitted changes</h2>
      {model.files.map((file) => (
        <DiffFileSection
          key={file.id}
          model={file}
          viewType={viewType}
          collapsed={collapsedFiles.has(file.id)}
          onToggle={getToggleHandler(file.id)}
          sectionRef={getSectionRef(file.id)}
        />
      ))}
    </div>
  );
}
