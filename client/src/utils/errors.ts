// Safely extracts a human-readable message from a thrown value, normalizing
// the common `unknown` catch-binding shape across the codebase.
export function getErrorMessage(err: unknown): string {
  if (err instanceof Error) return err.message;
  if (typeof err === 'string') return err;
  return String(err);
}
