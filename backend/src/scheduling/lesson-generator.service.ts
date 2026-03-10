import { Injectable, Logger } from "@nestjs/common";
import { Cron, CronExpression } from "@nestjs/schedule";
import { EntityManager, EntityRepository } from "@mikro-orm/core";
import { InjectRepository } from "@mikro-orm/nestjs";
import { Course } from "../courses/entities/course.entity";
import { Lesson, LessonStatus } from "./entities/lesson.entity";

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
      const schedules = course.schedules.getItems();
      if (schedules.length === 0) continue;

      const students = course.students.getItems();
      if (students.length === 0) continue;

      const today = new Date();
      today.setHours(0, 0, 0, 0);

      const fourWeeksOut = new Date(today);
      fourWeeksOut.setDate(fourWeeksOut.getDate() + 28);

      const courseStart = new Date(course.startDate);
      courseStart.setHours(0, 0, 0, 0);

      const lessonsToCreate: Lesson[] = [];

      for (const schedule of schedules) {
        // Walk each day from today (or course start, whichever is later) to 4 weeks out
        const start = courseStart > today ? courseStart : today;
        const current = new Date(start);

        while (current <= fourWeeksOut) {
          if (current.getDay() === schedule.dayOfWeek) {
            // Build the lesson start/end times
            const [startH, startM] = schedule.startTime.split(":").map(Number);
            const [endH, endM] = schedule.endTime.split(":").map(Number);

            const lessonStart = new Date(current);
            lessonStart.setHours(startH, startM, 0, 0);

            const lessonEnd = new Date(current);
            lessonEnd.setHours(endH, endM, 0, 0);

            // Skip if lesson already exists for this course + time
            const existing = await this.lessonRepository.count({
              course: course.id,
              startTime: lessonStart,
              status: { $ne: LessonStatus.CANCELLED },
            });

            if (existing === 0) {
              const lesson = new Lesson(
                course.tutor,
                course,
                lessonStart,
                lessonEnd,
              );
              for (const student of students) {
                lesson.students.add(student);
              }

              lessonsToCreate.push(lesson);
            }
          }

          current.setDate(current.getDate() + 1);
        }
      }

      if (lessonsToCreate.length > 0) {
        await this.em.persistAndFlush(lessonsToCreate);

        this.logger.log(
          `Generated ${lessonsToCreate.length} lessons for course "${course.title}"`,
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

    const schedules = course.schedules.getItems();
    if (schedules.length === 0) return;

    const students = course.students.getItems();
    if (students.length === 0) return;

    const today = new Date();
    today.setHours(0, 0, 0, 0);

    const fourWeeksOut = new Date(today);
    fourWeeksOut.setDate(fourWeeksOut.getDate() + 28);

    const courseStart = new Date(course.startDate);
    courseStart.setHours(0, 0, 0, 0);

    const lessonsToCreate: Lesson[] = [];

    for (const schedule of schedules) {
      const start = courseStart > today ? courseStart : today;
      const current = new Date(start);

      while (current <= fourWeeksOut) {
        if (current.getDay() === schedule.dayOfWeek) {
          const [startH, startM] = schedule.startTime.split(":").map(Number);
          const [endH, endM] = schedule.endTime.split(":").map(Number);

          const lessonStart = new Date(current);
          lessonStart.setHours(startH, startM, 0, 0);

          const lessonEnd = new Date(current);
          lessonEnd.setHours(endH, endM, 0, 0);

          const existing = await this.lessonRepository.count({
            course: course.id,
            startTime: lessonStart,
            status: { $ne: LessonStatus.CANCELLED },
          });

          if (existing === 0) {
            const lesson = new Lesson(
              course.tutor,
              course,
              lessonStart,
              lessonEnd,
            );
            for (const student of students) {
              lesson.students.add(student);
            }
            lessonsToCreate.push(lesson);
          }
        }

        current.setDate(current.getDate() + 1);
      }
    }

    if (lessonsToCreate.length > 0) {
      await this.em.persistAndFlush(lessonsToCreate);
      this.logger.log(
        `Generated ${lessonsToCreate.length} lessons for course "${course.title}"`,
      );
    }
  }

  async generateAppointments() {
    return this.generateLessons();
  }
}
