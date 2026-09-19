import { describe, expect, it } from 'vitest';
import { sanitizeFilenamePart } from './filenames';

describe('sanitizeFilenamePart', () => {
  it('leaves a simple alphanumeric name untouched', () => {
    expect(sanitizeFilenamePart('DoorDash')).toBe('DoorDash');
  });

  it('replaces path separators so a venture name cannot escape the target directory', () => {
    expect(sanitizeFilenamePart('A/V Setup')).toBe('A-V-Setup');
    // No "/" survives, so the result is a single path segment with no
    // traversal capability, whatever text it otherwise contains.
    expect(sanitizeFilenamePart('../../etc/passwd')).not.toContain('/');
  });

  it('collapses spaces and punctuation into single hyphens with no leading/trailing hyphen', () => {
    expect(sanitizeFilenamePart('IT Support!!')).toBe('IT-Support');
  });

  it('falls back to a safe default for an all-punctuation or empty input', () => {
    expect(sanitizeFilenamePart('///')).toBe('export');
    expect(sanitizeFilenamePart('')).toBe('export');
  });
});
