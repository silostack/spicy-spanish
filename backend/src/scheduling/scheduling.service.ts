import {
  Injectable,
  NotFoundException,
  BadRequestException,
  ForbiddenException,
  Logger,
} from "@nestjs/common";
import { EntityManager, EntityRepository } from "@mikro-orm/core";
import { InjectRepository } from "@mikro-orm/nestjs";
import { Lesson, LessonStatus } from "./entities/lesson.entity";
import { Availability } from "./entities/availability.entity";
import { Attendance, AttendanceStatus } from "./entities/attendance.entity";
import { ClassReport } from "./entities/class-report.entity";
import { User, UserRole } from "../users/entities/user.entity";
import { Course } from "../courses/entities/course.entity";
import { EmailService } from "../email/email.service";
import { GoogleCalendarService } from "./google-calendar.service";
import {
  CreateLessonDto,
  UpdateLessonDto,
  CancelLessonDto,
  CompleteLessonDto,
  RescheduleLessonDto,
  CreateAvailabilityDto,
  UpdateAvailabilityDto,
  CreateAttendanceDto,
  UpdateAttendanceDto,
  CreateClassReportDto,
  UpdateClassReportDto,
} from "./dto";
import { LessonGeneratorService } from "./lesson-generator.service";

@Injectable()
export class SchedulingService {
  private readonly logger = new Logger(SchedulingService.name);

  constructor(
    @InjectRepository(Lesson)
    private readonly lessonRepository: EntityRepository<Lesson>,
    @InjectRepository(Availability)
    private readonly availabilityRepository: EntityRepository<Availability>,
    @InjectRepository(Attendance)
    private readonly attendanceRepository: EntityRepository<Attendance>,
    @InjectRepository(ClassReport)
    private readonly classReportRepository: EntityRepository<ClassReport>,
    @InjectRepository(User)
    private readonly userRepository: EntityRepository<User>,
    @InjectRepository(Course)
    private readonly courseRepository: EntityRepository<Course>,
    private readonly em: EntityManager,
    private readonly emailService: EmailService,
    private readonly googleCalendar: GoogleCalendarService,
    private readonly lessonGenerator: LessonGeneratorService,
  ) {}

  // Lesson methods
  async findAllLessons() {
    return this.lessonRepository.findAll({
      populate: ["students", "tutor", "course"],
      orderBy: { startTime: "ASC" },
    });
  }

  async findLessonById(id: string) {
    const lesson = await this.lessonRepository.findOne(
      { id },
      { populate: ["students", "tutor", "course"] },
    );

    if (!lesson) {
      throw new NotFoundException(`Lesson with ID ${id} not found`);
    }

    return lesson;
  }

  async findLessonsByCourse(courseId: string, actor: User) {
    const course = await this.courseRepository.findOne(
      { id: courseId },
      { populate: ["tutor", "students", "schedules"] },
    );
    if (!course) {
      throw new NotFoundException(`Course with ID ${courseId} not found`);
    }

    if (actor.role === UserRole.TUTOR && course.tutor.id !== actor.id) {
      throw new ForbiddenException("Tutors can only access their own course lessons");
    }

    if (
      actor.role === UserRole.STUDENT &&
      !course.students.getItems().some((student) => student.id === actor.id)
    ) {
      throw new ForbiddenException("Students can only access lessons for enrolled courses");
    }

    // Auto-generate lessons if the course is active with schedules but has no future lessons
    if (course.isActive && course.schedules.length > 0) {
      const now = new Date();
      const futureCount = await this.lessonRepository.count({
        course: courseId,
        startTime: { $gt: now },
        status: LessonStatus.SCHEDULED,
      });

      if (futureCount === 0) {
        await this.lessonGenerator.generateLessonsForCourse(courseId);
      }
    }

    return this.lessonRepository.find(
      { course: courseId },
      {
        populate: ["students", "tutor", "course"],
        orderBy: { startTime: "DESC" },
      },
    );
  }

  async findLessonsByStudent(studentId: string) {
    return this.lessonRepository.find(
      { students: studentId },
      {
        populate: ["students", "tutor", "course"],
        orderBy: { startTime: "ASC" },
      },
    );
  }

  async findLessonsByTutor(tutorId: string) {
    return this.lessonRepository.find(
      { tutor: tutorId },
      {
        populate: ["students", "tutor", "course"],
        orderBy: { startTime: "ASC" },
      },
    );
  }

  async findUpcomingLessonsByStudent(studentId: string) {
    const now = new Date();
    return this.lessonRepository.find(
      {
        students: studentId,
        startTime: { $gt: now },
        status: LessonStatus.SCHEDULED,
      },
      {
        populate: ["students", "tutor", "course"],
        orderBy: { startTime: "ASC" },
      },
    );
  }

  async findUpcomingLessonsByTutor(tutorId: string) {
    const now = new Date();
    return this.lessonRepository.find(
      {
        tutor: tutorId,
        startTime: { $gt: now },
        status: LessonStatus.SCHEDULED,
      },
      {
        populate: ["students", "tutor", "course"],
        orderBy: { startTime: "ASC" },
      },
    );
  }

  async createLesson(createLessonDto: CreateLessonDto) {
    const students: User[] = [];
    for (const studentId of createLessonDto.studentIds) {
      const student = await this.userRepository.findOne({
        id: studentId,
        role: UserRole.STUDENT,
      });
      if (!student) {
        throw new NotFoundException(`Student with ID ${studentId} not found`);
      }
      students.push(student);
    }

    const tutor = await this.userRepository.findOne({
      id: createLessonDto.tutorId,
      role: UserRole.TUTOR,
    });

    if (!tutor) {
      throw new NotFoundException(
        `Tutor with ID ${createLessonDto.tutorId} not found`,
      );
    }

    const course = await this.courseRepository.findOne(
      { id: createLessonDto.courseId },
      { populate: ["students"] },
    );
    if (!course) {
      throw new NotFoundException(
        `Course with ID ${createLessonDto.courseId} not found`,
      );
    }

    const courseStudents = course.students?.getItems?.() || [];
    if (courseStudents.length > 0) {
      const courseStudentIds = new Set(
        courseStudents.map((student) => student.id),
      );
      const hasOutsiderStudent = createLessonDto.studentIds.some(
        (studentId) => !courseStudentIds.has(studentId),
      );
      if (hasOutsiderStudent) {
        throw new BadRequestException("All students must belong to the selected course");
      }
    }

    const conflicts = await this.checkTimeConflicts(
      tutor.id,
      createLessonDto.startTime,
      createLessonDto.endTime,
    );

    if (conflicts) {
      throw new BadRequestException(
        "The selected time conflicts with another lesson",
      );
    }

    const lesson = new Lesson(
      tutor,
      course,
      createLessonDto.startTime,
      createLessonDto.endTime,
    );

    for (const student of students) {
      lesson.students.add(student);
    }

    if (createLessonDto.notes) {
      lesson.notes = createLessonDto.notes;
    }

    const studentNames = students.map((student) => student.fullName).join(", ");
    const calendarEventId = await this.googleCalendar.createEvent({
      summary: `Spanish Class: ${studentNames} with ${tutor.fullName}`,
      description: lesson.notes,
      startTime: lesson.startTime,
      endTime: lesson.endTime,
      attendeeEmails: [...students.map((student) => student.email), tutor.email],
    });

    if (calendarEventId) {
      lesson.googleCalendarEventId = calendarEventId;
    }

    await this.em.persistAndFlush(lesson);

    try {
      await this.emailService.sendClassConfirmationEmail(lesson);
      lesson.confirmationEmailSent = true;
      await this.em.flush();
    } catch (error) {
      this.logger.error("Failed to send confirmation email", error.stack);
    }

    return lesson;
  }

  async updateLesson(id: string, updateLessonDto: UpdateLessonDto) {
    const lesson = await this.findLessonById(id);

    if (updateLessonDto.startTime || updateLessonDto.endTime) {
      const startTime = updateLessonDto.startTime || lesson.startTime;
      const endTime = updateLessonDto.endTime || lesson.endTime;

      const isAvailable = await this.checkTutorAvailability(
        lesson.tutor.id,
        startTime,
        endTime,
      );

      if (!isAvailable) {
        throw new BadRequestException(
          "The selected time is not within the tutor's availability",
        );
      }

      const conflicts = await this.checkTimeConflicts(
        lesson.tutor.id,
        startTime,
        endTime,
        id,
      );

      if (conflicts) {
        throw new BadRequestException(
          "The selected time conflicts with another lesson",
        );
      }

      if (lesson.googleCalendarEventId) {
        const studentNames = lesson.students
          .getItems()
          .map((student) => student.fullName)
          .join(", ");
        await this.googleCalendar.updateEvent(lesson.googleCalendarEventId, {
          summary: `Spanish Class: ${studentNames} with ${lesson.tutor.fullName}`,
          description: updateLessonDto.notes || lesson.notes,
          startTime,
          endTime,
        });
      }
    }

    if (
      updateLessonDto.status === LessonStatus.CANCELLED &&
      lesson.googleCalendarEventId
    ) {
      await this.googleCalendar.deleteEvent(lesson.googleCalendarEventId);
    }

    this.em.assign(lesson, updateLessonDto);
    await this.em.flush();
    return lesson;
  }

  async cancelLesson(id: string, dto: CancelLessonDto) {
    const lesson = await this.findLessonById(id);

    if (lesson.status === LessonStatus.CANCELLED) {
      throw new BadRequestException("Lesson is already cancelled");
    }

    lesson.status = LessonStatus.CANCELLED;
    lesson.creditedBack = dto.creditHoursBack;

    if (dto.creditHoursBack) {
      const durationHours =
        (lesson.endTime.getTime() - lesson.startTime.getTime()) /
        (1000 * 60 * 60);
      const course = lesson.course;
      course.hoursBalance = Number(course.hoursBalance) + durationHours;
      if (course.hoursBalance > 0) {
        course.needsRenewal = false;
      }
    }

    if (lesson.googleCalendarEventId) {
      await this.googleCalendar.deleteEvent(lesson.googleCalendarEventId);
    }

    await this.em.flush();

    try {
      await this.emailService.sendClassCancellationEmail(lesson);
    } catch (error) {
      this.logger.error("Failed to send cancellation email", error.stack);
    }

    return lesson;
  }

  async rescheduleLesson(id: string, dto: RescheduleLessonDto) {
    const lesson = await this.findLessonById(id);

    if (lesson.status !== LessonStatus.SCHEDULED) {
      throw new BadRequestException("Only scheduled lessons can be rescheduled");
    }

    const conflicts = await this.checkTimeConflicts(
      lesson.tutor.id,
      dto.startTime,
      dto.endTime,
      id,
    );

    if (conflicts) {
      throw new BadRequestException(
        "The selected time conflicts with another lesson",
      );
    }

    lesson.startTime = dto.startTime;
    lesson.endTime = dto.endTime;
    if (dto.notes !== undefined) {
      lesson.notes = dto.notes;
    }

    if (lesson.googleCalendarEventId) {
      const studentNames = lesson.students
        .getItems()
        .map((student) => student.fullName)
        .join(", ");
      await this.googleCalendar.updateEvent(lesson.googleCalendarEventId, {
        summary: `Spanish Class: ${studentNames} with ${lesson.tutor.fullName}`,
        description: lesson.notes,
        startTime: dto.startTime,
        endTime: dto.endTime,
      });
    }

    await this.em.flush();
    return lesson;
  }

  async completeLesson(id: string, dto: CompleteLessonDto, actor: User) {
    return this.em.transactional(async (em) => {
      const lesson = await em.findOne(
        Lesson,
        { id },
        { populate: ["students", "tutor", "course"] },
      );
      if (!lesson) {
        throw new NotFoundException(`Lesson with ID ${id} not found`);
      }
      if (lesson.status !== LessonStatus.SCHEDULED) {
        throw new BadRequestException("Only scheduled lessons can be completed");
      }

      if (actor.role === UserRole.TUTOR && lesson.tutor.id !== actor.id) {
        throw new ForbiddenException("Tutors can only complete their own lessons");
      }

      const lessonStudents = lesson.students.getItems();
      const lessonStudentIds = new Set(lessonStudents.map((student) => student.id));
      const payloadStudentIds = dto.attendances.map((item) => item.studentId);
      const uniquePayloadStudentIds = new Set(payloadStudentIds);

      if (uniquePayloadStudentIds.size !== payloadStudentIds.length) {
        throw new BadRequestException("Attendance payload contains duplicate students");
      }

      if (uniquePayloadStudentIds.size !== lessonStudentIds.size) {
        throw new BadRequestException(
          "Attendance must include exactly one entry for each lesson student",
        );
      }

      for (const studentId of uniquePayloadStudentIds) {
        if (!lessonStudentIds.has(studentId)) {
          throw new BadRequestException(
            `Student ${studentId} is not enrolled in this lesson`,
          );
        }
      }

      const attendances: Attendance[] = [];
      for (const item of dto.attendances) {
        const student = lessonStudents.find((candidate) => candidate.id === item.studentId);
        if (!student) {
          throw new BadRequestException(`Student ${item.studentId} not found on lesson`);
        }

        const existingAttendance = await em.findOne(Attendance, { lesson, student });
        if (existingAttendance) {
          throw new BadRequestException(
            `Attendance already exists for student ${item.studentId} in this lesson`,
          );
        }

        const attendance = new Attendance(
          lesson,
          student,
          item.status,
          item.notes,
          actor.role === UserRole.TUTOR,
        );
        em.persist(attendance);
        attendances.push(attendance);
      }

      let report: ClassReport | null = null;
      if (dto.report) {
        const existingReport = await em.findOne(ClassReport, { lesson });
        if (existingReport) {
          throw new BadRequestException("Class report already exists for this lesson");
        }

        report = new ClassReport(
          lesson,
          actor.role === UserRole.TUTOR ? actor : lesson.tutor,
          dto.report.subject,
          dto.report.content,
          dto.report.homeworkAssigned,
          dto.report.studentProgress,
          dto.report.nextLessonNotes,
        );
        em.persist(report);
      }

      lesson.status = LessonStatus.COMPLETED;

      const durationHours =
        (lesson.endTime.getTime() - lesson.startTime.getTime()) /
        (1000 * 60 * 60);
      lesson.course.hoursBalance = Number(lesson.course.hoursBalance) - durationHours;
      lesson.course.needsRenewal = lesson.course.hoursBalance <= 0;

      if (lesson.googleCalendarEventId) {
        const studentNames = lesson.students
          .getItems()
          .map((student) => student.fullName)
          .join(", ");
        await this.googleCalendar.updateEvent(lesson.googleCalendarEventId, {
          summary: `Spanish Class: ${studentNames} with ${lesson.tutor.fullName} (Completed)`,
          description: lesson.notes,
          startTime: lesson.startTime,
          endTime: lesson.endTime,
        });
      }

      await em.flush();

      return {
        lesson,
        attendances,
        report,
      };
    });
  }

  // Availability methods
  async findAvailabilityById(id: string) {
    const availability = await this.availabilityRepository.findOne(
      { id },
      { populate: ["tutor"] },
    );

    if (!availability) {
      throw new NotFoundException(`Availability with ID ${id} not found`);
    }

    return availability;
  }

  async findAvailabilityByTutor(tutorId: string) {
    return this.availabilityRepository.find(
      { tutor: tutorId },
      {
        populate: ["tutor"],
        orderBy: [{ dayOfWeek: "ASC" }, { startTime: "ASC" }],
      },
    );
  }

  async createAvailability(createAvailabilityDto: CreateAvailabilityDto) {
    const tutor = await this.userRepository.findOne({
      id: createAvailabilityDto.tutorId,
      role: UserRole.TUTOR,
    });

    if (!tutor) {
      throw new NotFoundException(
        `Tutor with ID ${createAvailabilityDto.tutorId} not found`,
      );
    }

    const availability = new Availability(
      tutor,
      createAvailabilityDto.dayOfWeek,
      createAvailabilityDto.startTime,
      createAvailabilityDto.endTime,
      createAvailabilityDto.isRecurring !== undefined
        ? createAvailabilityDto.isRecurring
        : true,
      createAvailabilityDto.specificDate,
    );

    await this.em.persistAndFlush(availability);
    return availability;
  }

  async updateAvailability(
    id: string,
    updateAvailabilityDto: UpdateAvailabilityDto,
  ) {
    const availability = await this.findAvailabilityById(id);
    this.em.assign(availability, updateAvailabilityDto);
    await this.em.flush();
    return availability;
  }

  async removeAvailability(id: string) {
    const availability = await this.findAvailabilityById(id);
    await this.em.removeAndFlush(availability);
    return { id, deleted: true };
  }

  // Attendance methods
  async createAttendance(createAttendanceDto: CreateAttendanceDto) {
    const lessonId =
      (createAttendanceDto as unknown as { lessonId?: string; appointmentId?: string }).lessonId ??
      (createAttendanceDto as unknown as { lessonId?: string; appointmentId?: string }).appointmentId;
    const lesson = await this.lessonRepository.findOne({
      id: lessonId,
    });
    if (!lesson) {
      throw new NotFoundException(
        `Lesson with ID ${lessonId} not found`,
      );
    }

    const student = await this.userRepository.findOne({
      id: createAttendanceDto.studentId,
      role: UserRole.STUDENT,
    });
    if (!student) {
      throw new NotFoundException(
        `Student with ID ${createAttendanceDto.studentId} not found`,
      );
    }

    const existingAttendance = await this.attendanceRepository.findOne({
      lesson,
      student,
    });
    if (existingAttendance) {
      throw new BadRequestException(
        "Attendance already recorded for this lesson and student",
      );
    }

    const attendance = new Attendance(
      lesson,
      student,
      createAttendanceDto.status,
      createAttendanceDto.notes,
      createAttendanceDto.markedByTutor,
    );

    await this.em.persistAndFlush(attendance);
    return attendance;
  }

  async findAttendanceByLesson(lessonId: string) {
    return this.attendanceRepository.find(
      { lesson: lessonId },
      {
        populate: ["lesson", "student"],
        orderBy: { createdAt: "ASC" },
      },
    );
  }

  async findAttendanceByStudent(studentId: string) {
    return this.attendanceRepository.find(
      { student: studentId },
      {
        populate: ["lesson", "student"],
        orderBy: { createdAt: "DESC" },
      },
    );
  }

  async updateAttendance(id: string, updateAttendanceDto: UpdateAttendanceDto) {
    const attendance = await this.attendanceRepository.findOne({ id });
    if (!attendance) {
      throw new NotFoundException(`Attendance with ID ${id} not found`);
    }

    this.em.assign(attendance, updateAttendanceDto);
    await this.em.flush();
    return attendance;
  }

  // Class report methods
  async createClassReport(createClassReportDto: CreateClassReportDto) {
    const lessonId =
      (createClassReportDto as unknown as { lessonId?: string; appointmentId?: string }).lessonId ??
      (createClassReportDto as unknown as { lessonId?: string; appointmentId?: string }).appointmentId;
    const lesson = await this.lessonRepository.findOne({
      id: lessonId,
    });
    if (!lesson) {
      throw new NotFoundException(
        `Lesson with ID ${lessonId} not found`,
      );
    }

    const tutor = await this.userRepository.findOne({
      id: createClassReportDto.tutorId,
      role: UserRole.TUTOR,
    });
    if (!tutor) {
      throw new NotFoundException(
        `Tutor with ID ${createClassReportDto.tutorId} not found`,
      );
    }

    const existingReport = await this.classReportRepository.findOne({
      lesson,
    });
    if (existingReport) {
      throw new BadRequestException("Class report already exists for this lesson");
    }

    const classReport = new ClassReport(
      lesson,
      tutor,
      createClassReportDto.subject,
      createClassReportDto.content,
      createClassReportDto.homeworkAssigned,
      createClassReportDto.studentProgress,
      createClassReportDto.nextLessonNotes,
    );

    await this.em.persistAndFlush(classReport);
    return classReport;
  }

  async findClassReportByLesson(lessonId: string) {
    return this.classReportRepository.findOne(
      { lesson: lessonId },
      { populate: ["lesson", "tutor"] },
    );
  }

  async findClassReportsByTutor(tutorId: string) {
    return this.classReportRepository.find(
      { tutor: tutorId },
      {
        populate: ["lesson", "tutor"],
        orderBy: { createdAt: "DESC" },
      },
    );
  }

  async updateClassReport(
    id: string,
    updateClassReportDto: UpdateClassReportDto,
  ) {
    const classReport = await this.classReportRepository.findOne({ id });
    if (!classReport) {
      throw new NotFoundException(`Class report with ID ${id} not found`);
    }

    this.em.assign(classReport, updateClassReportDto);
    await this.em.flush();
    return classReport;
  }

  async removeClassReport(id: string) {
    const classReport = await this.classReportRepository.findOne({ id });
    if (!classReport) {
      throw new NotFoundException(`Class report with ID ${id} not found`);
    }

    await this.em.removeAndFlush(classReport);
    return { id, deleted: true };
  }

  async getAttendanceStats(studentId?: string, tutorId?: string) {
    const criteria: Record<string, unknown> = {};
    if (studentId) criteria.student = studentId;
    if (tutorId) criteria.lesson = { tutor: tutorId };

    const [totalAttendance, presentCount, absentCount] = await Promise.all([
      this.attendanceRepository.count(criteria),
      this.attendanceRepository.count({
        ...criteria,
        status: AttendanceStatus.PRESENT,
      }),
      this.attendanceRepository.count({
        ...criteria,
        status: AttendanceStatus.ABSENT,
      }),
    ]);

    const attendanceRate =
      totalAttendance > 0 ? (presentCount / totalAttendance) * 100 : 0;

    return {
      totalAttendance,
      presentCount,
      absentCount,
      attendanceRate: Math.round(attendanceRate * 100) / 100,
    };
  }

  // Dashboard stats
  async getSchedulingStats() {
    const now = new Date();

    const upcomingAppointments = await this.lessonRepository.find(
      {
        startTime: { $gt: now },
        status: LessonStatus.SCHEDULED,
      },
      {
        populate: ["students", "tutor", "course"],
        orderBy: { startTime: "ASC" },
        limit: 5,
      },
    );

    const firstDayOfMonth = new Date(now.getFullYear(), now.getMonth(), 1);
    const completedAppointmentsThisMonth = await this.lessonRepository.count({
      status: LessonStatus.COMPLETED,
      startTime: { $gte: firstDayOfMonth, $lte: now },
    });

    const completedAppointments = await this.lessonRepository.find({
      status: LessonStatus.COMPLETED,
    });

    let totalHoursTaught = 0;
    completedAppointments.forEach((lesson) => {
      const durationHours =
        (lesson.endTime.getTime() - lesson.startTime.getTime()) /
        (1000 * 60 * 60);
      totalHoursTaught += durationHours;
    });

    const scheduledAppointments = await this.lessonRepository.find({
      status: LessonStatus.SCHEDULED,
      startTime: { $gt: now },
    });

    let totalScheduledHours = 0;
    scheduledAppointments.forEach((lesson) => {
      const durationHours =
        (lesson.endTime.getTime() - lesson.startTime.getTime()) /
        (1000 * 60 * 60);
      totalScheduledHours += durationHours;
    });

    return {
      upcomingAppointments,
      completedAppointmentsThisMonth,
      totalHoursTaught,
      totalScheduledHours,
      totalCompletedAppointments: completedAppointments.length,
      totalScheduledAppointments: scheduledAppointments.length,
    };
  }

  // Internal helpers
  private async checkTutorAvailability(
    tutorId: string,
    startTime: Date,
    endTime: Date,
  ): Promise<boolean> {
    const day = startTime.getDay();
    const timeStart = `${startTime.getHours().toString().padStart(2, "0")}:${startTime.getMinutes().toString().padStart(2, "0")}`;
    const timeEnd = `${endTime.getHours().toString().padStart(2, "0")}:${endTime.getMinutes().toString().padStart(2, "0")}`;

    const recurringAvailability = await this.availabilityRepository.findOne({
      tutor: tutorId,
      dayOfWeek: day,
      isRecurring: true,
      startTime: { $lte: timeStart },
      endTime: { $gte: timeEnd },
    });

    if (recurringAvailability) {
      return true;
    }

    const specificDate = new Date(startTime);
    specificDate.setHours(0, 0, 0, 0);

    const specificAvailability = await this.availabilityRepository.findOne({
      tutor: tutorId,
      isRecurring: false,
      specificDate,
      startTime: { $lte: timeStart },
      endTime: { $gte: timeEnd },
    });

    return !!specificAvailability;
  }

  private async checkTimeConflicts(
    tutorId: string,
    startTime: Date,
    endTime: Date,
    excludeLessonId?: string,
  ): Promise<boolean> {
    const query = {
      tutor: tutorId,
      status: LessonStatus.SCHEDULED,
      $or: [
        { startTime: { $lt: endTime }, endTime: { $gt: startTime } },
        { startTime: { $gte: startTime, $lt: endTime } },
        {
          startTime: { $lt: startTime },
          endTime: { $gt: startTime, $lte: endTime },
        },
      ],
    };

    if (excludeLessonId) {
      Object.assign(query, { id: { $ne: excludeLessonId } });
    }

    const conflictingLessons = await this.lessonRepository.count(query);
    return conflictingLessons > 0;
  }

  // Backwards-compatible aliases for existing internal/tests
  async findAllAppointments() {
    return this.findAllLessons();
  }

  async findAppointmentById(id: string) {
    return this.findLessonById(id);
  }

  async findAppointmentsByStudent(studentId: string) {
    return this.findLessonsByStudent(studentId);
  }

  async findAppointmentsByTutor(tutorId: string) {
    return this.findLessonsByTutor(tutorId);
  }

  async findUpcomingAppointmentsByStudent(studentId: string) {
    return this.findUpcomingLessonsByStudent(studentId);
  }

  async findUpcomingAppointmentsByTutor(tutorId: string) {
    return this.findUpcomingLessonsByTutor(tutorId);
  }

  async createAppointment(createLessonDto: CreateLessonDto) {
    return this.createLesson(createLessonDto);
  }

  async updateAppointment(id: string, updateLessonDto: UpdateLessonDto) {
    return this.updateLesson(id, updateLessonDto);
  }

  async cancelAppointment(id: string, dto: CancelLessonDto) {
    return this.cancelLesson(id, dto);
  }

  async completeAppointment(id: string) {
    const lesson = await this.findLessonById(id);
    lesson.status = LessonStatus.COMPLETED;

    if (lesson.googleCalendarEventId) {
      const studentNames = lesson.students
        .getItems()
        .map((student) => student.fullName)
        .join(", ");
      await this.googleCalendar.updateEvent(lesson.googleCalendarEventId, {
        summary: `Spanish Class: ${studentNames} with ${lesson.tutor.fullName} (Completed)`,
        description: lesson.notes,
        startTime: lesson.startTime,
        endTime: lesson.endTime,
      });
    }

    await this.em.flush();
    return lesson;
  }

  async findAttendanceByAppointment(lessonId: string) {
    return this.attendanceRepository.findOne(
      { lesson: lessonId },
      { populate: ["lesson", "student"] },
    );
  }

  async findClassReportByAppointment(lessonId: string) {
    return this.findClassReportByLesson(lessonId);
  }
}
