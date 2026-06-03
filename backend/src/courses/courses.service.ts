import { Injectable, NotFoundException } from "@nestjs/common";
import { EntityManager, EntityRepository } from "@mikro-orm/core";
import { InjectRepository } from "@mikro-orm/nestjs";
import { Course } from "./entities/course.entity";
import { CourseSchedule } from "./entities/course-schedule.entity";
import { Lesson, LessonStatus } from "../scheduling/entities/lesson.entity";
import { LessonGeneratorService } from "../scheduling/lesson-generator.service";
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
