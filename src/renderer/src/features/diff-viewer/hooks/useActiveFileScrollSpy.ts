import { useEffect } from 'react';
import type { RefObject } from 'react';
import type { DiffModel } from '../utils/diffModel.types';

const ACTIVE_FILE_THRESHOLD = 60;

export function useActiveFileScrollSpy(
  scrollContainerRef: RefObject<HTMLElement | null>,
  sectionRefs: { current: Map<string, HTMLElement> },
  model: DiffModel,
  onActiveFileChange: (fileId: string) => void
): void {
  useEffect(() => {
    const scrollRoot = scrollContainerRef.current;
    if (scrollRoot === null || model.files.length === 0) {
      return;
    }

    const updateActiveFile = () => {
      const threshold = scrollRoot.scrollTop + ACTIVE_FILE_THRESHOLD;
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
  }, [model, onActiveFileChange, scrollContainerRef, sectionRefs]);
}
