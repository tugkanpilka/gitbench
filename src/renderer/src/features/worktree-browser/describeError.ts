import { ApiError } from '../../shared/api/ApiError';

export function describeError(error: unknown): string {
  if (error instanceof ApiError) {
    return error.message;
  }
  return 'Unexpected error.';
}
