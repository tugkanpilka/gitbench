export class GitCommandFailedError extends Error {
  constructor(message: string) {
    super(message);
    this.name = 'GitCommandFailedError';
  }
}
