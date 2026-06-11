import type { DiffFileModel } from '../../diff-viewer/utils/diffModel.types';
import type { FileTree } from './fileTree.types';
interface MutableDirectory {
  name: string;
  path: string;
  directories: Map<string, MutableDirectory>;
  files: DiffFileModel[];
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

export function buildFileTree(files: DiffFileModel[]): FileTree {
  const root = createDirectory('', '');

  for (const file of files) {
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

  return toFileTree(root);
}

export function directoryPathsForFile(file: DiffFileModel): string[] {
  const names = file.path.directory.split('/').filter(Boolean);
  const paths: string[] = [];
  let currentPath = '';

  for (const name of names) {
    currentPath = `${currentPath}${name}/`;
    paths.push(currentPath);
  }

  return paths;
}
