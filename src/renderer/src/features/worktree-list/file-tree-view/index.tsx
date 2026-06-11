import { VscChevronRight, VscChevronDown } from 'react-icons/vsc';

import type { FileTreeDirectory } from '../utils/fileTree.types';
import { FileNavigationRow } from '../file-navigation-row';
import { IndentGuides, treeRowIndent } from '../indent-guides';
import type { TProps } from './index.types';
import styles from '../index.module.scss';

function FolderChevron({ open }: { open: boolean }) {
  const Icon = open ? VscChevronDown : VscChevronRight;
  return <Icon className={styles['file-tree-folder__chevron']} />;
}

interface TreeDirectoryProps {
  directory: FileTreeDirectory;
  depth: number;
  activeFileId: string | null;
  collapsedDirectories: Set<string>;
  onToggleDirectory: (path: string) => void;
  onSelectFile: (fileId: string) => void;
}

function TreeDirectory({
  directory,
  depth,
  activeFileId,
  collapsedDirectories,
  onToggleDirectory,
  onSelectFile,
}: TreeDirectoryProps) {
  const open = !collapsedDirectories.has(directory.path);

  return (
    <li>
      <button
        type="button"
        className={styles['file-tree-folder']}
        aria-label={`${directory.name} folder`}
        aria-expanded={open}
        style={{ paddingLeft: treeRowIndent(depth) }}
        onClick={() => onToggleDirectory(directory.path)}
      >
        <IndentGuides depth={depth} />
        <FolderChevron open={open} />
        <span className={styles['file-tree-folder__name']}>{directory.name}</span>
      </button>
      {open && (
        <FileTreeView
          tree={directory}
          depth={depth + 1}
          activeFileId={activeFileId}
          collapsedDirectories={collapsedDirectories}
          onToggleDirectory={onToggleDirectory}
          onSelectFile={onSelectFile}
          nested
        />
      )}
    </li>
  );
}

export function FileTreeView({
  tree,
  depth,
  activeFileId,
  collapsedDirectories,
  onToggleDirectory,
  onSelectFile,
  nested = false,
}: TProps) {
  return (
    <ul
      className={nested ? styles['file-tree__group'] : styles['file-navigation-list']}
      aria-label={nested ? undefined : 'Changed files'}
    >
      {tree.directories.map((directory) => (
        <TreeDirectory
          key={directory.path}
          directory={directory}
          depth={depth}
          activeFileId={activeFileId}
          collapsedDirectories={collapsedDirectories}
          onToggleDirectory={onToggleDirectory}
          onSelectFile={onSelectFile}
        />
      ))}
      {tree.files.map((file) => (
        <FileNavigationRow
          key={file.id}
          file={file}
          active={file.id === activeFileId}
          depth={depth}
          showDirectory={false}
          onSelect={() => onSelectFile(file.id)}
        />
      ))}
    </ul>
  );
}
