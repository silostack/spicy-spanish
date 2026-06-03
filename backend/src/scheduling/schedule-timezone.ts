/**
 * The school's canonical timezone. Course schedule times (the bare "HH:MM"
 * strings on CourseSchedule) are wall-clock times in this zone. Lesson
 * generation anchors those wall-clock times to this zone when computing the
 * absolute UTC instant stored on a Lesson, so generation is independent of the
 * server's local timezone.
 *
 * Configurable via the SCHEDULE_TIMEZONE env var; defaults to America/Bogota
 * (COT, UTC-5, no DST).
 */
export const SCHEDULE_TIMEZONE =
  process.env.SCHEDULE_TIMEZONE ?? "America/Bogota";
