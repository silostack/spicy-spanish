import { Injectable, Logger } from "@nestjs/common";
import { Cron, CronExpression } from "@nestjs/schedule";
import { EntityManager, EntityRepository } from "@mikro-orm/core";
import { InjectRepository } from "@mikro-orm/nestjs";
import { formatInTimeZone, zonedTimeToUtc } from "date-fns-tz";
import { Course } from "../courses/entities/course.entity";
import { Lesson, LessonStatus } from "./entities/lesson.entity";
import { SCHEDULE_TIMEZONE } from "./schedule-timezone";

const GENERATION_WINDOW_DAYS = 28;

@Injectable()
export class LessonGeneratorService {
  private readonly logger = new Logger(LessonGeneratorService.name);

  constructor(
    @InjectRepository(Course)
    private readonly courseRepository: EntityRepository<Course>,
    @InjectRepository(Lesson)
    private readonly lessonRepository: EntityRepository<Lesson>,
    private readonly em: EntityManager,
  ) {}

  @Cron(CronExpression.EVERY_DAY_AT_2AM)
  async generateLessons() {
    this.logger.log("Starting lesson generation...");

    const courses = await this.courseRepository.find(
      { isActive: true },
      { populate: ["tutor", "students", "schedules"] },
    );

    for (const course of courses) {
      const created = await this.buildLessonsForCourse(course);
      if (created > 0) {
        this.logger.log(
          `Generated ${created} lessons for course "${course.title}"`,
        );
      }
    }

    this.logger.log("Lesson generation complete.");
  }

  async generateLessonsForCourse(courseId: string) {
    const course = await this.courseRepository.findOne(
      { id: courseId, isActive: true },
      { populate: ["tutor", "students", "schedules"] },
    );

    if (!course) return;

    const created = await this.buildLessonsForCourse(course);
    if (created > 0) {
      this.logger.log(
        `Generated ${created} lessons for course "${course.title}"`,
      );
    }
  }

  /**
   * Generate any missing lessons for a single course over the upcoming window.
   *
   * Schedule times are wall-clock times in SCHEDULE_TIMEZONE. We walk the
   * window by calendar date (a date's day-of-week is timezone-independent) and
   * build each lesson instant with zonedTimeToUtc, so the stored UTC instant is
   * correct regardless of the server's local timezone. Returns the number of
   * lessons created.
   */
  private async buildLessonsForCourse(course: Course): Promise<number> {
    const schedules = course.schedules.getItems();
    if (schedules.length === 0) return 0;

    const students = course.students.getItems();
    if (students.length === 0) return 0;

    // Window boundaries as school-zone calendar dates (yyyy-MM-dd sorts
    // chronologically, so plain string comparison is safe).
    const todayStr = formatInTimeZone(
      new Date(),
      SCHEDULE_TIMEZONE,
      "yyyy-MM-dd",
    );
    const endStr = addDays(todayStr, GENERATION_WINDOW_DAYS);
    const courseStartStr = formatInTimeZone(
      course.startDate,
      SCHEDULE_TIMEZONE,
      "yyyy-MM-dd",
    );
    const startStr = courseStartStr > todayStr ? courseStartStr : todayStr;

    const lessonsToCreate: Lesson[] = [];

    for (
      let dateStr = startStr;
      dateStr <= endStr;
      dateStr = addDays(dateStr, 1)
    ) {
      const dow = dayOfWeek(dateStr);

      for (const schedule of schedules) {
        if (schedule.dayOfWeek !== dow) continue;

        const lessonStart = zonedTimeToUtc(
          `${dateStr}T${schedule.startTime}:00`,
          SCHEDULE_TIMEZONE,
        );
        const lessonEnd = zonedTimeToUtc(
          `${dateStr}T${schedule.endTime}:00`,
          SCHEDULE_TIMEZONE,
        );

        // Skip if a non-cancelled lesson already covers this slot — either one
        // sitting at the instant, or one that was manually rescheduled away from
        // it (originalStartTime). The latter stops us recreating an occurrence a
        // tutor already moved.
        const existing = await this.lessonRepository.count({
          course: course.id,
          status: { $ne: LessonStatus.CANCELLED },
          $or: [{ startTime: lessonStart }, { originalStartTime: lessonStart }],
        });
        if (existing > 0) continue;

        const lesson = new Lesson(course.tutor, course, lessonStart, lessonEnd);
        for (const student of students) {
          lesson.students.add(student);
        }
        lessonsToCreate.push(lesson);
      }
    }

    if (lessonsToCreate.length > 0) {
      await this.em.persistAndFlush(lessonsToCreate);
    }

    return lessonsToCreate.length;
  }

  async generateAppointments() {
    return this.generateLessons();
  }
}

/** Parse a yyyy-MM-dd string into a UTC Date at midnight (timezone-independent). */
function parseDateString(dateStr: string): Date {
  const [y, m, d] = dateStr.split("-").map(Number);
  return new Date(Date.UTC(y, m - 1, d));
}

/** Add `n` calendar days to a yyyy-MM-dd string, returning a yyyy-MM-dd string. */
function addDays(dateStr: string, n: number): string {
  const date = parseDateString(dateStr);
  date.setUTCDate(date.getUTCDate() + n);
  return date.toISOString().slice(0, 10);
}

/** Day of week (0=Sunday..6=Saturday) for a yyyy-MM-dd calendar date. */
function dayOfWeek(dateStr: string): number {
  return parseDateString(dateStr).getUTCDay();
}
