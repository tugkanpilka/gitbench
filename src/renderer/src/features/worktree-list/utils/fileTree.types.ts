import type { DiffFileModel } from '../../diff-viewer/utils/diffModel.types';

export interface FileTreeDirectory {
  name: string;
  path: string;
  directories: FileTreeDirectory[];
  files: DiffFileModel[];
}

export interface FileTree {
  directories: FileTreeDirectory[];
  files: DiffFileModel[];
}
