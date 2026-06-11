import type { FileTree } from '../utils/fileTree.types';

export type FileTreeViewProps = {
  tree: FileTree;
  depth: number;
  activeFileId: string | null;
  collapsedDirectories: Set<string>;
  onToggleDirectory: (path: string) => void;
  onSelectFile: (fileId: string) => void;
  nested?: boolean;
};
