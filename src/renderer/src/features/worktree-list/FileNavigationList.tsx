import { useEffect, useMemo, useState } from 'react';
import { VscChevronRight, VscChevronDown, VscFile, VscJson, VscMarkdown } from 'react-icons/vsc';
import { SiTypescript, SiJavascript, SiReact, SiCss, SiHtml5 } from 'react-icons/si';

import type { FileListMode } from '../../shared/preferences/appPreferences';
import { DiffStat } from '../../shared/ui/core';
import type { DiffFileModel } from '../diff-viewer/diffModel';
import {
  buildFileTree,
  directoryPathsForFile,
  type FileTree,
  type FileTreeDirectory,
} from './fileTree';

interface Props {
  files: DiffFileModel[];
  mode: FileListMode;
  activeFileId: string | null;
  onSelectFile: (fileId: string) => void;
}

function IndentGuides({ depth }: { depth: number }) {
  if (depth === 0) return null;
  const guides = [];
  for (let i = 0; i < depth; i++) {
    guides.push(
      <span
        key={i}
        className="file-tree-guide"
        aria-hidden="true"
        style={{ left: `${13 + i * 12}px` }}
      />
    );
  }
  return <>{guides}</>;
}

function FileIcon({ name }: { name: string }) {
  const iconStyle = { flex: 'none', marginRight: 6, fontSize: '14px', opacity: 0.9 } as const;

  if (name.endsWith('.tsx') || name.endsWith('.jsx')) return <SiReact style={{ ...iconStyle, color: '#61dafb' }} />;
  if (name.endsWith('.ts')) return <SiTypescript style={{ ...iconStyle, color: '#3178c6' }} />;
  if (name.endsWith('.js')) return <SiJavascript style={{ ...iconStyle, color: '#f7df1e' }} />;
  if (name.endsWith('.css')) return <SiCss style={{ ...iconStyle, color: '#264de4' }} />;
  if (name.endsWith('.json')) return <VscJson style={{ ...iconStyle, color: '#cb3837' }} />;
  if (name.endsWith('.html')) return <SiHtml5 style={{ ...iconStyle, color: '#e34c26' }} />;
  if (name.endsWith('.md')) return <VscMarkdown style={{ ...iconStyle, color: 'var(--gb-dim)' }} />;

  return <VscFile style={{ ...iconStyle, color: 'var(--gb-dim)' }} />;
}

function FileNavigationRow({
  file,
  active,
  depth,
  showDirectory,
  onSelect,
}: {
  file: DiffFileModel;
  active: boolean;
  depth: number;
  showDirectory: boolean;
  onSelect: () => void;
}) {
  const path = `${file.path.directory}${file.path.name}`;

  return (
    <li>
      <button
        type="button"
        className="file-navigation-row"
        aria-label={`${path}, ${file.additions} ${file.additions === 1 ? 'addition' : 'additions'}, ${file.deletions} ${file.deletions === 1 ? 'deletion' : 'deletions'}`}
        aria-current={active ? 'location' : undefined}
        style={{ paddingLeft: `${6 + depth * 12}px` }}
        onClick={onSelect}
      >
        <IndentGuides depth={depth} />
        <span className="file-navigation-row__path" title={path}>
          {showDirectory && (
            <span className="file-navigation-row__directory">{file.path.directory}</span>
          )}
          <FileIcon name={file.path.name} />
          <span className="file-navigation-row__name">{file.path.name}</span>
        </span>
        <DiffStat additions={file.additions} deletions={file.deletions} />
      </button>
    </li>
  );
}

function FolderChevron({ open }: { open: boolean }) {
  const Icon = open ? VscChevronDown : VscChevronRight;
  return <Icon style={{ flex: 'none', marginRight: 4, fontSize: '14px', color: 'var(--gb-faint)' }} />;
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
        className="file-tree-folder"
        aria-label={`${directory.name} folder`}
        aria-expanded={open}
        style={{ paddingLeft: `${6 + depth * 12}px` }}
        onClick={() => onToggleDirectory(directory.path)}
      >
        <IndentGuides depth={depth} />
        <FolderChevron open={open} />
        <span className="file-tree-folder__name">{directory.name}</span>
      </button>
      {open && (
        <TreeLevel
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

interface TreeLevelProps {
  tree: FileTree;
  depth: number;
  activeFileId: string | null;
  collapsedDirectories: Set<string>;
  onToggleDirectory: (path: string) => void;
  onSelectFile: (fileId: string) => void;
  nested?: boolean;
}

function TreeLevel({
  tree,
  depth,
  activeFileId,
  collapsedDirectories,
  onToggleDirectory,
  onSelectFile,
  nested = false,
}: TreeLevelProps) {
  return (
    <ul
      className={nested ? 'file-tree__group' : 'file-navigation-list'}
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

export function FileNavigationList({ files, mode, activeFileId, onSelectFile }: Props) {
  const [collapsedDirectories, setCollapsedDirectories] = useState<Set<string>>(
    () => new Set()
  );
  const tree = useMemo(() => buildFileTree(files), [files]);

  useEffect(() => {
    setCollapsedDirectories(new Set());
  }, [files]);

  useEffect(() => {
    const activeFile = files.find((file) => file.id === activeFileId);
    if (activeFile === undefined) {
      return;
    }

    const activeDirectoryPaths = directoryPathsForFile(activeFile);
    setCollapsedDirectories((current) => {
      if (!activeDirectoryPaths.some((path) => current.has(path))) {
        return current;
      }

      const next = new Set(current);
      for (const path of activeDirectoryPaths) {
        next.delete(path);
      }
      return next;
    });
  }, [activeFileId, files]);

  if (files.length === 0) {
    return null;
  }

  if (mode === 'tree') {
    const toggleDirectory = (path: string) => {
      setCollapsedDirectories((current) => {
        const next = new Set(current);
        if (next.has(path)) {
          next.delete(path);
        } else {
          next.add(path);
        }
        return next;
      });
    };

    return (
      <TreeLevel
        tree={tree}
        depth={0}
        activeFileId={activeFileId}
        collapsedDirectories={collapsedDirectories}
        onToggleDirectory={toggleDirectory}
        onSelectFile={onSelectFile}
      />
    );
  }

  return (
    <ul className="file-navigation-list" aria-label="Changed files">
      {files.map((file) => (
        <FileNavigationRow
          key={file.id}
          file={file}
          active={file.id === activeFileId}
          depth={0}
          showDirectory
          onSelect={() => onSelectFile(file.id)}
        />
      ))}
    </ul>
  );
}
