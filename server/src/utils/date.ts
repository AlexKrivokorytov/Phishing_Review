// Formats a Date as YYYY-MM-DD for use in export filenames and date-only fields.
export function formatExportDate(date: Date = new Date()): string {
  return date.toISOString().slice(0, 10);
}
