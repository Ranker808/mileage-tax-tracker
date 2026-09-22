/** Ranks locations by how often they appear, most-frequent first, for
 * quick-fill suggestion chips on the trip form. Pure so it's testable
 * without a hook harness — src/hooks/useRecentLocations.ts wraps it. */
export function topLocations(locations: string[], limit: number): string[] {
  const counts = new Map<string, number>();
  for (const raw of locations) {
    const loc = raw.trim();
    if (!loc) continue;
    counts.set(loc, (counts.get(loc) ?? 0) + 1);
  }
  return [...counts.entries()]
    .sort((a, b) => b[1] - a[1])
    .slice(0, limit)
    .map(([loc]) => loc);
}
