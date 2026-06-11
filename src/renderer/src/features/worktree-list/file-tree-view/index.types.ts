import type { FileTree } from '../utils/fileTree.types';

export type FileTreeViewProps = {
  tree: FileTree;
  depth: number;
  nested?: boolean;
};
