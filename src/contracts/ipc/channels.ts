export const IPC_CHANNELS = {
  pickRepository: 'repo:pick',
  listWorktrees: 'worktrees:list',
  getDiff: 'diff:get',
  listUnpushedCommits: 'commits:unpushed',
  // Watch lifecycle: renderer -> main, request/response.
  startWatch: 'watch:start',
  stopWatch: 'watch:stop',
  // Change signal: main -> renderer, push event with no payload ("re-query now").
  repoChanged: 'repo:changed',
} as const;
