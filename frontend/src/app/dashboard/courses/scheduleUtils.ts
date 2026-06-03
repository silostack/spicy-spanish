/**
 * Sort course schedule slots for display, Monday-first (Mon→Sun), then by start
 * time. The API does not guarantee slot order, so callers should sort before
 * rendering. Returns a new array; does not mutate the input.
 */
export function sortSchedules<
  T extends { dayOfWeek: number; startTime: string },
>(schedules: T[]): T[] {
  // Map Sunday(0)..Saturday(6) onto Monday(0)..Sunday(6).
  const mondayFirst = (day: number) => (day + 6) % 7;
  return [...schedules].sort(
    (a, b) =>
      mondayFirst(a.dayOfWeek) - mondayFirst(b.dayOfWeek) ||
      a.startTime.localeCompare(b.startTime),
  );
}
