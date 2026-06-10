export class GitNotInstalledError extends Error {
  constructor() {
    super('Git is not installed or not on PATH.');
    this.name = 'GitNotInstalledError';
  }
}
