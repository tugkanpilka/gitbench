import type { ChangedFileItem } from '../changed-file-item';
import type { FileTree } from './fileTree.types';
interface MutableDirectory {
  name: string;
  path: string;
  directories: Map<string, MutableDirectory>;
  files: ChangedFileItem[];
}

function createDirectory(name: string, path: string): MutableDirectory {
  return {
    name,
    path,
    directories: new Map(),
    files: [],
  };
}

function toFileTree(directory: MutableDirectory): FileTree {
  return {
    directories: [...directory.directories.values()].map((child) => ({
      name: child.name,
      path: child.path,
      ...toFileTree(child),
    })),
    files: directory.files,
  };
}

function insertFileIntoTree(root: MutableDirectory, file: ChangedFileItem): void {
  const directoryNames = file.path.directory.split('/').filter(Boolean);
  let current = root;

  for (const name of directoryNames) {
    const path = `${current.path}${name}/`;
    let child = current.directories.get(name);

    if (child === undefined) {
      child = createDirectory(name, path);
      current.directories.set(name, child);
    }

    current = child;
  }

  current.files.push(file);
}

export function buildFileTree(files: ChangedFileItem[]): FileTree {
  const root = createDirectory('', '');

  for (const file of files) {
    insertFileIntoTree(root, file);
  }

  return toFileTree(root);
}

// Every ancestor directory path of a file, from the repository root down to its
// immediate parent. Takes the raw directory string (ChangedFileItem.path.directory)
// so it stays independent of any file model.
export function directoryPathsForDirectory(directory: string): string[] {
  const names = directory.split('/').filter(Boolean);
  const paths: string[] = [];
  let currentPath = '';

  for (const name of names) {
    currentPath = `${currentPath}${name}/`;
    paths.push(currentPath);
  }

  return paths;
}
