export class NotARepositoryError extends Error {
  constructor(path: string) {
    super(`Not a git repository: ${path}`);
    this.name = 'NotARepositoryError';
  }
}
