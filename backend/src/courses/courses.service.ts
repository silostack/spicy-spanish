import {
  BadRequestException,
  Injectable,
  Logger,
  NotFoundException,
} from "@nestjs/common";
import { EntityManager, EntityRepository } from "@mikro-orm/core";
import { InjectRepository } from "@mikro-orm/nestjs";
import { Course } from "./entities/course.entity";
import { CourseSchedule } from "./entities/course-schedule.entity";
import { Lesson, LessonStatus } from "../scheduling/entities/lesson.entity";
import { LessonGeneratorService } from "../scheduling/lesson-generator.service";
import { GoogleCalendarService } from "../scheduling/google-calendar.service";
import { User, UserRole } from "../users/entities/user.entity";
import {
  CreateCourseDto,
  UpdateCourseDto,
  AddStudentDto,
  RemoveStudentDto,
  AddScheduleDto,
  AdjustHoursDto,
} from "./dto";

@Injectable()
export class CoursesService {
  private readonly logger = new Logger(CoursesService.name);

  constructor(
    @InjectRepository(Course)
    private readonly courseRepository: EntityRepository<Course>,
    @InjectRepository(CourseSchedule)
    private readonly scheduleRepository: EntityRepository<CourseSchedule>,
    @InjectRepository(Lesson)
    private readonly lessonRepository: EntityRepository<Lesson>,
    @InjectRepository(User)
    private readonly userRepository: EntityRepository<User>,
    private readonly em: EntityManager,
    private readonly lessonGenerator: LessonGeneratorService,
    private readonly googleCalendar: GoogleCalendarService,
  ) {}

  async findAllCourses() {
    return this.courseRepository.findAll({
      populate: ["tutor", "students", "schedules"],
      orderBy: {
        title: "ASC",
        schedules: { dayOfWeek: "ASC", startTime: "ASC" },
      },
    });
  }

  async findActiveCourses() {
    return this.courseRepository.find(
      { isActive: true },
      {
        populate: ["tutor", "students", "schedules"],
        orderBy: {
          title: "ASC",
          schedules: { dayOfWeek: "ASC", startTime: "ASC" },
        },
      },
    );
  }

  async findCourseById(id: string) {
    const course = await this.courseRepository.findOne(
      { id },
      {
        populate: ["tutor", "students", "schedules"],
        orderBy: { schedules: { dayOfWeek: "ASC", startTime: "ASC" } },
      },
    );

    if (!course) {
      throw new NotFoundException(`Course with ID ${id} not found`);
    }

    return course;
  }

  async findCoursesByTutor(tutorId: string) {
    return this.courseRepository.find(
      { tutor: tutorId },
      {
        populate: ["tutor", "students", "schedules"],
        orderBy: {
          title: "ASC",
          schedules: { dayOfWeek: "ASC", startTime: "ASC" },
        },
      },
    );
  }

  async findCoursesByStudent(studentId: string) {
    return this.courseRepository.find(
      { students: studentId },
      {
        populate: ["tutor", "students", "schedules"],
        orderBy: {
          title: "ASC",
          schedules: { dayOfWeek: "ASC", startTime: "ASC" },
        },
      },
    );
  }

  async createCourse(dto: CreateCourseDto) {
    const tutor = await this.userRepository.findOne({
      id: dto.tutorId,
      role: UserRole.TUTOR,
    });
    if (!tutor) {
      throw new NotFoundException(`Tutor with ID ${dto.tutorId} not found`);
    }

    const students: User[] = [];
    for (const studentId of dto.studentIds) {
      const student = await this.userRepository.findOne({
        id: studentId,
        role: UserRole.STUDENT,
      });
      if (!student) {
        throw new NotFoundException(`Student with ID ${studentId} not found`);
      }
      students.push(student);
    }

    const course = new Course(dto.title, tutor, new Date(dto.startDate));

    for (const student of students) {
      course.students.add(student);
    }

    for (const slot of dto.schedules) {
      const schedule = new CourseSchedule(
        course,
        slot.dayOfWeek,
        slot.startTime,
        slot.endTime,
      );
      course.schedules.add(schedule);
    }

    await this.em.persistAndFlush(course);
    return course;
  }

  async updateCourse(id: string, dto: UpdateCourseDto) {
    const course = await this.findCourseById(id);
    this.em.assign(course, dto);
    await this.em.flush();
    return course;
  }

  async removeCourse(id: string) {
    const course = await this.findCourseById(id);
    await this.em.removeAndFlush(course);
    return { id, deleted: true };
  }

  // Student management
  async addStudent(courseId: string, dto: AddStudentDto) {
    const course = await this.findCourseById(courseId);
    const student = await this.userRepository.findOne({
      id: dto.studentId,
      role: UserRole.STUDENT,
    });
    if (!student) {
      throw new NotFoundException(`Student with ID ${dto.studentId} not found`);
    }
    course.students.add(student);
    await this.em.flush();
    return course;
  }

  async removeStudent(courseId: string, dto: RemoveStudentDto) {
    const course = await this.findCourseById(courseId);
    const student = await this.userRepository.findOne({
      id: dto.studentId,
      role: UserRole.STUDENT,
    });
    if (!student) {
      throw new NotFoundException(`Student with ID ${dto.studentId} not found`);
    }
    course.students.remove(student);
    await this.em.flush();
    return course;
  }

  // Schedule management
  async addSchedule(courseId: string, dto: AddScheduleDto) {
    const course = await this.findCourseById(courseId);
    const schedule = new CourseSchedule(
      course,
      dto.dayOfWeek,
      dto.startTime,
      dto.endTime,
    );
    await this.em.persistAndFlush(schedule);
    await this.resyncFutureLessons(courseId);
    return schedule;
  }

  async removeSchedule(scheduleId: string) {
    const schedule = await this.scheduleRepository.findOne(
      { id: scheduleId },
      { populate: ["course"] },
    );
    if (!schedule) {
      throw new NotFoundException(`Schedule with ID ${scheduleId} not found`);
    }
    const courseId = schedule.course.id;
    await this.em.removeAndFlush(schedule);
    await this.resyncFutureLessons(courseId);
    return { id: scheduleId, deleted: true };
  }

  /**
   * After a schedule slot is added or removed, drop future auto-generated
   * lessons (scheduled, not yet started) and regenerate from the current
   * schedules. This prevents stale lessons from a changed/removed slot
   * lingering on the calendar at the old times. Past, completed, cancelled, and
   * manually rescheduled lessons (originalStartTime set) are left untouched.
   */
  private async resyncFutureLessons(courseId: string) {
    const futureLessons = await this.lessonRepository.find({
      course: courseId,
      startTime: { $gt: new Date() },
      status: LessonStatus.SCHEDULED,
      originalStartTime: null,
    });
    if (futureLessons.length > 0) {
      await this.em.removeAndFlush(futureLessons);
    }
    await this.lessonGenerator.generateLessonsForCourse(courseId);
  }

  // Tutor handover
  /**
   * Loads the tutor a course is being handed to. Not found if the user does not
   * exist or is not a tutor; bad request if inactive or already the course tutor.
   */
  private async findNewTutor(
    em: EntityManager,
    course: Course,
    tutorId: string,
  ) {
    const tutor = await em.findOne(User, { id: tutorId, role: UserRole.TUTOR });
    if (!tutor) {
      throw new NotFoundException(`Tutor with ID ${tutorId} not found`);
    }
    if (!tutor.isActive) {
      throw new BadRequestException("Tutor is not active");
    }
    if (tutor.id === course.tutor.id) {
      throw new BadRequestException("Tutor already teaches this course");
    }
    return tutor;
  }

  /**
   * Lessons that follow the course to its new tutor: scheduled and not yet
   * started. Manually rescheduled lessons are included; everything already
   * started, completed, cancelled or no-show keeps its tutor.
   */
  private movableLessonsFilter(courseId: string, now: Date) {
    return {
      course: courseId,
      status: LessonStatus.SCHEDULED,
      startTime: { $gt: now },
    };
  }

  async previewTutorChange(courseId: string, tutorId: string) {
    const course = await this.findCourseById(courseId);
    await this.findNewTutor(this.em, course, tutorId);
    const now = new Date();

    const lessonsToMove = await this.lessonRepository.find(
      this.movableLessonsFilter(courseId, now),
    );
    const unloggedPastLessons = await this.lessonRepository.count({
      course: courseId,
      status: LessonStatus.SCHEDULED,
      startTime: { $lte: now },
    });
    const otherLessons = await this.lessonRepository.find(
      {
        tutor: tutorId,
        status: LessonStatus.SCHEDULED,
        course: { $ne: courseId },
        startTime: { $gt: now },
      },
      { populate: ["course"] },
    );

    const clashes = [];
    for (const lesson of lessonsToMove) {
      const other = otherLessons.find(
        (candidate) =>
          lesson.startTime < candidate.endTime &&
          lesson.endTime > candidate.startTime,
      );
      if (other) {
        clashes.push({
          lessonId: lesson.id,
          startTime: lesson.startTime,
          endTime: lesson.endTime,
          otherCourseTitle: other.course.title,
        });
      }
    }

    return {
      lessonsToMove: lessonsToMove.length,
      unloggedPastLessons,
      clashes,
    };
  }

  async changeTutor(courseId: string, tutorId: string, actor: User) {
    const { oldTutorId, tutor, movedLessons } = await this.em.transactional(
      async (em) => {
        const course = await em.findOne(
          Course,
          { id: courseId },
          { populate: ["tutor"] },
        );
        if (!course) {
          throw new NotFoundException(`Course with ID ${courseId} not found`);
        }
        const tutor = await this.findNewTutor(em, course, tutorId);
        const oldTutorId = course.tutor.id;

        const movedLessons = await em.find(
          Lesson,
          this.movableLessonsFilter(courseId, new Date()),
          { populate: ["students"] },
        );
        course.tutor = tutor;
        for (const lesson of movedLessons) {
          lesson.tutor = tutor;
        }
        await em.flush();
        return { oldTutorId, tutor, movedLessons };
      },
    );

    this.logger.log(
      `Course ${courseId} tutor changed from ${oldTutorId} to ${tutor.id} by ${actor.id}; ${movedLessons.length} lessons moved`,
    );

    // Best effort: updateEvent logs and returns false on failure.
    for (const lesson of movedLessons) {
      if (!lesson.googleCalendarEventId) continue;
      const studentNames = lesson.students
        .getItems()
        .map((student) => student.fullName)
        .join(", ");
      await this.googleCalendar.updateEvent(lesson.googleCalendarEventId, {
        summary: `Spanish Class: ${studentNames} with ${tutor.fullName}`,
        description: lesson.notes,
        startTime: lesson.startTime,
        endTime: lesson.endTime,
      });
    }

    return this.findCourseById(courseId);
  }

  // Hours management
  async adjustHours(courseId: string, dto: AdjustHoursDto) {
    const course = await this.findCourseById(courseId);
    course.hoursBalance = Number(course.hoursBalance) + dto.hours;
    course.needsRenewal = course.hoursBalance <= 0;
    await this.em.flush();
    return course;
  }

  // Stats
  async getCourseStats() {
    const totalCourses = await this.courseRepository.count();
    const activeCourses = await this.courseRepository.count({ isActive: true });
    const needsRenewalCourses = await this.courseRepository.count({
      needsRenewal: true,
    });
    const recentCourses = await this.courseRepository.find(
      {},
      {
        populate: ["tutor", "students"],
        orderBy: { createdAt: "DESC" },
        limit: 5,
      },
    );

    return {
      totalCourses,
      activeCourses,
      needsRenewalCourses,
      recentCourses,
    };
  }
}
