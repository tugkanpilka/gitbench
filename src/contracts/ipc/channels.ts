export const IPC_CHANNELS = {
  pickRepository: 'repo:pick',
  listWorktrees: 'worktrees:list',
  listWorktreeSummaries: 'worktrees:summaries',
  getDiff: 'diff:get',
  listUnpushedCommits: 'commits:unpushed',
  // Watch lifecycle: renderer -> main, request/response.
  startWatch: 'watch:start',
  stopWatch: 'watch:stop',
  // Change signal: main -> renderer, push event with no payload ("re-query now").
  repoChanged: 'repo:changed',
  // OS appearance change: main -> renderer, push event carrying the resolved ColorScheme.
  themeChanged: 'theme:changed',
  listRecentRepos: 'recentRepos:list',
  addRecentRepo: 'recentRepos:add',
} as const;
