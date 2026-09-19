import { describe, expect, it, afterEach } from 'vitest';
import { isDemoMode, setDemoMode } from './demoMode';

describe('demoMode', () => {
  afterEach(() => {
    setDemoMode(false);
  });

  it('defaults to false', () => {
    expect(isDemoMode()).toBe(false);
  });

  it('reflects the last value set', () => {
    setDemoMode(true);
    expect(isDemoMode()).toBe(true);
    setDemoMode(false);
    expect(isDemoMode()).toBe(false);
  });
});
