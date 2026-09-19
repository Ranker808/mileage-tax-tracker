/** Strips characters that aren't safe in a filesystem path segment (e.g. a venture named "A/V Setup"). */
export function sanitizeFilenamePart(part: string): string {
  return part.replace(/[^a-zA-Z0-9._-]+/g, '-').replace(/^-+|-+$/g, '') || 'export';
}
