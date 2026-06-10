import {
  isDelete,
  isInsert,
  markEdits,
  parseDiff,
  tokenize,
  type FileData,
  type HunkTokens,
} from 'react-diff-view';
import { languageFromPath, refractor } from './syntaxHighlight';

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

export const EMPTY_DIFF_MODEL: DiffModel = {
  files: [],
  additions: 0,
  deletions: 0,
};

function displayPath(file: FileData): string {
  return file.type === 'delete' ? file.oldPath : file.newPath;
}

export function splitPath(path: string): DiffPath {
  const separatorIndex = path.lastIndexOf('/');
  if (separatorIndex === -1) {
    return { directory: '', name: path };
  }

  return {
    directory: path.slice(0, separatorIndex + 1),
    name: path.slice(separatorIndex + 1),
  };
}

function noTextReason(file: FileData, binary: boolean): string | null {
  if (file.hunks.length > 0) {
    return null;
  }
  if (binary) {
    return 'Cannot display text diff for binary file.';
  }
  if (file.type === 'rename') {
    return 'File renamed; text content unchanged.';
  }
  if (file.type === 'copy') {
    return 'File copied; text content unchanged.';
  }
  return 'No text changes. File may be binary or only metadata changed.';
}

function rawFileSections(diffText: string): string[] {
  return diffText
    .split(/(?=^diff --git )/m)
    .filter((section) => section.startsWith('diff --git '));
}

function buildFileModel(file: FileData, index: number, rawSection: string): DiffFileModel {
  let additions = 0;
  let deletions = 0;
  const binary =
    file.isBinary === true ||
    /(?:^|\n)(?:Binary files .+ differ|GIT binary patch)(?:\n|$)/m.test(rawSection);
  const path = splitPath(displayPath(file));
  const language = languageFromPath(`${path.directory}${path.name}`);

  for (const hunk of file.hunks) {
    for (const change of hunk.changes) {
      if (isInsert(change)) {
        additions += 1;
      } else if (isDelete(change)) {
        deletions += 1;
      }
    }
  }

  return {
    id: `${file.type}:${file.oldPath}:${file.newPath}:${index}`,
    file,
    path,
    previousPath: file.type === 'rename' || file.type === 'copy' ? file.oldPath : null,
    binary,
    additions,
    deletions,
    tokens:
      file.hunks.length === 0
        ? null
        : language === null
          ? tokenize(file.hunks, { enhancers: [markEdits(file.hunks)] })
          : tokenize(file.hunks, {
              highlight: true,
              refractor,
              language,
              enhancers: [markEdits(file.hunks)],
            }),
    noTextReason: noTextReason(file, binary),
  };
}

export function buildDiffModel(diffText: string): DiffModel {
  const sections = rawFileSections(diffText);
  const files = parseDiff(diffText).map((file, index) =>
    buildFileModel(file, index, sections[index] ?? '')
  );
  let additions = 0;
  let deletions = 0;

  for (const file of files) {
    additions += file.additions;
    deletions += file.deletions;
  }

  return { files, additions, deletions };
}
