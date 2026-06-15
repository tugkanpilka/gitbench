import { useEffect } from 'react';
import type { RefObject } from 'react';
import type { DiffModel } from '../utils/diffModel.types';

const ACTIVE_FILE_THRESHOLD = 60;

export interface ActiveFileScrollSpyOptions {
  scrollContainerRef: RefObject<HTMLElement | null>;
  sectionRefs: { current: Map<string, HTMLElement> };
  model: DiffModel;
  onActiveFileChange: (fileId: string) => void;
}

function findActiveFileId(files: DiffModel['files'], sectionRefs: Map<string, HTMLElement>, threshold: number): string {
  let activeFileId = files[0].id;
  for (const file of files) {
    const section = sectionRefs.get(file.id);
    if (section !== undefined && section.offsetTop <= threshold) {
      activeFileId = file.id;
    }
  }
  return activeFileId;
}

function makeScrollHandler(options: ActiveFileScrollSpyOptions, scrollRoot: HTMLElement): () => void {
  const { sectionRefs, model, onActiveFileChange } = options;
  return () => {
    const threshold = scrollRoot.scrollTop + ACTIVE_FILE_THRESHOLD;
    onActiveFileChange(findActiveFileId(model.files, sectionRefs.current, threshold));
  };
}

export function useActiveFileScrollSpy(options: ActiveFileScrollSpyOptions): void {
  const { scrollContainerRef, model } = options;
  useEffect(() => {
    const scrollRoot = scrollContainerRef.current;
    if (scrollRoot === null || model.files.length === 0) {
      return;
    }
    const updateActiveFile = makeScrollHandler(options, scrollRoot);
    scrollRoot.addEventListener('scroll', updateActiveFile, { passive: true });
    updateActiveFile();
    return () => scrollRoot.removeEventListener('scroll', updateActiveFile);
  }, [options, model, scrollContainerRef]);
}
