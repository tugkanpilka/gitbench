import type { FileData, HunkTokens } from 'react-diff-view';

export interface DiffPath {
  directory: string;
  name: string;
}

export interface DiffFileModel {
  id: string;
  file: FileData;
  path: DiffPath;
  previousPath: string | null;
  binary: boolean;
  additions: number;
  deletions: number;
  tokens: HunkTokens | null;
  noTextReason: string | null;
}

export interface DiffModel {
  files: DiffFileModel[];
  additions: number;
  deletions: number;
}
