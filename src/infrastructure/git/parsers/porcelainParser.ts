/**
 * A worktree as read from git, before it is mapped to the contract DTO at the IPC
 * boundary. Structurally matches `WorktreeDto`; infrastructure cannot import contracts,
 * so the shape lives here and `worktreeMapper` is the compile-time tripwire that keeps
 * the two aligned. There is no behaviorless domain entity in between.
 */
export interface ParsedWorktree {
  path: string;
  branch: string | null; // null = detached HEAD, or a bare main worktree
  headSha: string; // "" for a bare main worktree (porcelain emits no HEAD line)
  isMain: boolean;
  isLocked: boolean;
}

interface MutableWorktreeFields {
  path: string;
  headSha: string;
  branch: string | null;
  isLocked: boolean;
}

function applyWorktreeLine(fields: MutableWorktreeFields, line: string): void {
  if (line.startsWith('worktree ')) fields.path = line.slice('worktree '.length);
  else if (line.startsWith('HEAD ')) fields.headSha = line.slice('HEAD '.length);
  else if (line.startsWith('branch '))
    fields.branch = line.slice('branch '.length).replace(/^refs\/heads\//, '');
  else if (line === 'detached') fields.branch = null;
  else if (line === 'locked' || line.startsWith('locked ')) fields.isLocked = true;
  // 'bare' and 'prunable [reason]' lines are tolerated and ignored for now.
}

function parseWorktreeBlock(block: string, index: number): ParsedWorktree {
  const fields: MutableWorktreeFields = { path: '', headSha: '', branch: null, isLocked: false };
  for (const line of block.split('\n')) applyWorktreeLine(fields, line);
  return { ...fields, isMain: index === 0 };
}

/**
 * Pure function: `git worktree list --porcelain` output → parsed worktrees.
 * Format details: agent_docs/git-notes.md. Entries are blank-line separated;
 * the first entry is always the main worktree.
 */
export function parseWorktreeListPorcelain(output: string): ParsedWorktree[] {
  const blocks = output
    .split(/\n{2,}/)
    .map((block) => block.trim())
    .filter((block) => block.length > 0);

  return blocks.map(parseWorktreeBlock);
}
