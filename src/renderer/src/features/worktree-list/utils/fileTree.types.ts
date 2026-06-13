import type { ChangedFileItem } from '../changed-file-item';

export interface FileTreeDirectory {
  name: string;
  path: string;
  directories: FileTreeDirectory[];
  files: ChangedFileItem[];
}

export interface FileTree {
  directories: FileTreeDirectory[];
  files: ChangedFileItem[];
}
