import { describe, expect, it } from 'vitest';
import { topLocations } from './recentLocations';

describe('topLocations', () => {
  it('ranks by frequency, most-used first', () => {
    const result = topLocations(['Home', 'Client A', 'Home', 'Home', 'Client A'], 10);
    expect(result).toEqual(['Home', 'Client A']);
  });

  it('respects the limit', () => {
    const result = topLocations(['A', 'B', 'C', 'D'], 2);
    expect(result).toHaveLength(2);
  });

  it('trims whitespace and ignores blank entries', () => {
    const result = topLocations(['  Home  ', '', '   ', 'Home'], 10);
    expect(result).toEqual(['Home']);
  });

  it('returns an empty list for no input', () => {
    expect(topLocations([], 5)).toEqual([]);
  });
});
