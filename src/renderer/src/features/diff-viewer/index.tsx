import { useCallback, useEffect, useRef, useState } from 'react';
import type { Dispatch, RefCallback, RefObject, SetStateAction } from 'react';
import 'react-diff-view/style/index.css';

import { toggledSet } from '../../shared/collections/toggledSet';
import { Match, Switch } from '../../shared/ui/switch';
import { DiffFileSection } from './diff-file-section';
import { useScrollToSection } from './hooks/useScrollToSection';
import { useActiveFileScrollSpy } from './hooks/useActiveFileScrollSpy';
import type { DiffViewProps, DiffNavigationTarget } from './index.types';
import type { DiffModel } from './utils/diffModel.types';
import styles from './index.module.scss';

type DiffViewContentProps = Omit<DiffViewProps, 'clean'>;

type SectionHandlers = {
  getToggleHandler: (id: string) => () => void;
  getSectionRef: (id: string) => RefCallback<HTMLElement>;
};

type DiffFileListProps = {
  model: DiffModel;
  viewType: DiffViewContentProps['viewType'];
  collapsedFiles: Set<string>;
  getToggleHandler: (id: string) => () => void;
  getSectionRef: (id: string) => RefCallback<HTMLElement>;
};

function CleanWorktree() {
  return (
    <div className={styles['diff-view']}>
      <div className={styles['diff-view__clean']}>Worktree is clean; no uncommitted changes.</div>
    </div>
  );
}

function EmptyDiff() {
  return (
    <div className={styles['diff-view']}>
      <div className={styles['diff-view__empty']}>No diff to display.</div>
    </div>
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

function makeToggleHandler(
  fileId: string,
  cache: Map<string, () => void>,
  setCollapsedFiles: Dispatch<SetStateAction<Set<string>>>
): () => void {
  let handler = cache.get(fileId);
  if (handler === undefined) {
    handler = () => setCollapsedFiles((current) => toggledSet(current, fileId));
    cache.set(fileId, handler);
  }
  return handler;
}

function applyElementRef(
  element: HTMLElement | null,
  fileId: string,
  sectionRefs: RefObject<Map<string, HTMLElement>>
): void {
  if (element === null) {
    sectionRefs.current.delete(fileId);
  } else {
    sectionRefs.current.set(fileId, element);
  }
}

function makeSectionRefHandler(
  fileId: string,
  cache: Map<string, RefCallback<HTMLElement>>,
  sectionRefs: RefObject<Map<string, HTMLElement>>
): RefCallback<HTMLElement> {
  let handler = cache.get(fileId);
  if (handler === undefined) {
    handler = (element) => applyElementRef(element, fileId, sectionRefs);
    cache.set(fileId, handler);
  }
  return handler;
}

// eslint-disable-next-line max-lines-per-function -- two useCallback wrappers each occupy 3 lines; logic is already in extracted helpers
function useSectionHandlers(
  sectionRefs: RefObject<Map<string, HTMLElement>>,
  setCollapsedFiles: Dispatch<SetStateAction<Set<string>>>
): SectionHandlers {
  const toggleCache = useRef(new Map<string, () => void>());
  const refCache = useRef(new Map<string, RefCallback<HTMLElement>>());
  const getToggleHandler = useCallback(
    (id: string) => makeToggleHandler(id, toggleCache.current, setCollapsedFiles),
    [setCollapsedFiles]
  );
  const getSectionRef = useCallback(
    (id: string) => makeSectionRefHandler(id, refCache.current, sectionRefs),
    [sectionRefs]
  );
  return { getToggleHandler, getSectionRef };
}

function useNavigationEffect(
  navigationTarget: DiffNavigationTarget | null,
  scrollToSection: (id: string) => void,
  onActiveFileChange: (id: string) => void
): void {
  useEffect(() => {
    if (navigationTarget === null) {
      return;
    }
    scrollToSection(navigationTarget.fileId);
    onActiveFileChange(navigationTarget.fileId);
  }, [navigationTarget, onActiveFileChange, scrollToSection]);
}

function useNavigationTargetExpansion(
  navigationTarget: DiffNavigationTarget | null,
  setCollapsedFiles: Dispatch<SetStateAction<Set<string>>>
): void {
  const [handledRequestId, setHandledRequestId] = useState<number | null>(null);
  if (navigationTarget !== null && navigationTarget.requestId !== handledRequestId) {
    setHandledRequestId(navigationTarget.requestId);
    setCollapsedFiles((current) =>
      current.has(navigationTarget.fileId) ? toggledSet(current, navigationTarget.fileId) : current
    );
  }
}

// eslint-disable-next-line max-lines-per-function -- pure JSX render; multi-line DiffFileSection prop spread inflates count
function DiffFileList({
  model,
  viewType,
  collapsedFiles,
  getToggleHandler,
  getSectionRef,
}: DiffFileListProps) {
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

// eslint-disable-next-line max-lines-per-function -- orchestrates five hooks; each hook call is a single responsibility already extracted
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
  useNavigationTargetExpansion(navigationTarget, setCollapsedFiles);
  useNavigationEffect(navigationTarget, scrollToSection, onActiveFileChange);
  useActiveFileScrollSpy({ scrollContainerRef, sectionRefs, model, onActiveFileChange });
  const handlers = useSectionHandlers(sectionRefs, setCollapsedFiles);
  return (
    <DiffFileList model={model} viewType={viewType} collapsedFiles={collapsedFiles} {...handlers} />
  );
}

// eslint-disable-next-line max-lines-per-function -- pure JSX render; Switch/Match branches and multi-line DiffViewContent props inflate count
export function DiffView({
  model,
  clean,
  viewType,
  navigationTarget,
  scrollContainerRef,
  onActiveFileChange,
}: DiffViewProps) {
  const contentKey = instanceKey(model);
  return (
    <Switch>
      <Match when={clean}>
        <CleanWorktree />
      </Match>
      <Match when={model.files.length === 0}>
        <EmptyDiff />
      </Match>
      <Match when={true}>
        <DiffViewContent
          key={contentKey}
          model={model}
          viewType={viewType}
          navigationTarget={navigationTarget}
          scrollContainerRef={scrollContainerRef}
          onActiveFileChange={onActiveFileChange}
        />
      </Match>
    </Switch>
  );
}
