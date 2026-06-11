import { useEffect } from 'react';
import type { DiffModel } from '../utils/diffModel.types';

const ACTIVE_FILE_THRESHOLD = 60;

function findScrollRoot(start: HTMLElement): HTMLElement | null {
  for (let node = start.parentElement; node !== null; node = node.parentElement) {
    const { overflowY } = window.getComputedStyle(node);
    if (overflowY === 'auto' || overflowY === 'scroll') {
      return node;
    }
  }

  // Stylesheets may be absent (e.g. jsdom tests), leaving every ancestor
  // overflow "visible"; fall back to the app shell's known scroll container.
  return start.closest<HTMLElement>('.app-shell__content');
}

export function useActiveFileScrollSpy(
  rootRef: { current: HTMLDivElement | null },
  sectionRefs: { current: Map<string, HTMLElement> },
  model: DiffModel,
  onActiveFileChange: (fileId: string) => void
): void {
  useEffect(() => {
    const scrollRoot = rootRef.current === null ? null : findScrollRoot(rootRef.current);
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
  }, [model, onActiveFileChange, rootRef, sectionRefs]);
}
