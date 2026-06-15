export const IPC_CHANNELS = {
  pickRepository: 'repo:pick',
  listWorktrees: 'worktrees:list',
  listWorktreeSummaries: 'worktrees:summaries',
  getDiff: 'diff:get',
  listUnpushedCommits: 'commits:unpushed',
  // Watch lifecycle: renderer -> main, request/response.
  startWatch: 'watch:start',
  stopWatch: 'watch:stop',
  // Change signals: main -> renderer, push events with no payload ("re-query now").
  repoChanged: 'repo:changed',
  nativeThemeChanged: 'theme:nativeChanged',
  listRecentRepos: 'recentRepos:list',
  addRecentRepo: 'recentRepos:add',
} as const;
