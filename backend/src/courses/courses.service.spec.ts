import { Test, TestingModule } from "@nestjs/testing";
import { BadRequestException, NotFoundException } from "@nestjs/common";
import { EntityManager, Collection } from "@mikro-orm/core";
import { getRepositoryToken } from "@mikro-orm/nestjs";
import { CoursesService } from "./courses.service";
import { Course } from "./entities/course.entity";
import { CourseSchedule } from "./entities/course-schedule.entity";
import { Lesson, LessonStatus } from "../scheduling/entities/lesson.entity";
import { LessonGeneratorService } from "../scheduling/lesson-generator.service";
import { GoogleCalendarService } from "../scheduling/google-calendar.service";
import { User, UserRole } from "../users/entities/user.entity";

type MockRepo = Record<string, jest.Mock>;

describe("CoursesService", () => {
  let service: CoursesService;
  let courseRepo: MockRepo;
  let scheduleRepo: MockRepo;
  let lessonRepo: MockRepo;
  let userRepo: MockRepo;
  let em: Record<string, jest.Mock>;
  let lessonGenerator: Record<string, jest.Mock>;
  let googleCalendar: Record<string, jest.Mock>;

  const mockTutor = {
    id: "tutor-1",
    firstName: "Maria",
    lastName: "Garcia",
    email: "maria@example.com",
    role: UserRole.TUTOR,
  };

  const mockStudent1 = {
    id: "student-1",
    firstName: "Jim",
    lastName: "Smith",
    email: "jim@example.com",
    role: UserRole.STUDENT,
  };

  const mockStudent2 = {
    id: "student-2",
    firstName: "Bob",
    lastName: "Jones",
    email: "bob@example.com",
    role: UserRole.STUDENT,
  };

  const mockCourse = {
    id: "course-1",
    title: "Jim & Bob - Conversational Spanish",
    tutor: mockTutor,
    students: {
      getItems: () => [mockStudent1, mockStudent2],
      add: jest.fn(),
      remove: jest.fn(),
      isInitialized: () => true,
    },
    startDate: new Date("2026-03-01"),
    isActive: true,
    hoursBalance: 10,
    needsRenewal: false,
    schedules: { getItems: () => [], isInitialized: () => true },
    createdAt: new Date(),
    updatedAt: new Date(),
  };

  beforeEach(async () => {
    // MikroORM Collection.add() accesses entity metadata (__meta) which is only
    // available when MikroORM is fully bootstrapped. In pure unit tests we mock
    // it so that Collection.add() calls on new entities don't throw.
    jest.spyOn(Collection.prototype, "add").mockImplementation(() => {});

    courseRepo = {
      findAll: jest.fn(),
      find: jest.fn(),
      findOne: jest.fn(),
      count: jest.fn(),
    };

    scheduleRepo = {
      findOne: jest.fn(),
      find: jest.fn(),
    };

    lessonRepo = {
      find: jest.fn().mockResolvedValue([]),
      count: jest.fn().mockResolvedValue(0),
    };

    userRepo = {
      findOne: jest.fn(),
      find: jest.fn(),
    };

    em = {
      persistAndFlush: jest.fn(),
      flush: jest.fn(),
      removeAndFlush: jest.fn(),
      assign: jest.fn(),
      find: jest.fn().mockResolvedValue([]),
      findOne: jest.fn(),
      // Run the transaction callback against the same mock so assertions on
      // `em` cover work done inside `em.transactional`.
      transactional: jest.fn(),
    };
    em.transactional.mockImplementation((cb: (txEm: typeof em) => unknown) =>
      cb(em),
    );

    googleCalendar = {
      updateEvent: jest.fn().mockResolvedValue(true),
    };

    lessonGenerator = {
      generateLessonsForCourse: jest.fn().mockResolvedValue(undefined),
    };

    const module: TestingModule = await Test.createTestingModule({
      providers: [
        CoursesService,
        { provide: getRepositoryToken(Course), useValue: courseRepo },
        { provide: getRepositoryToken(CourseSchedule), useValue: scheduleRepo },
        { provide: getRepositoryToken(Lesson), useValue: lessonRepo },
        { provide: getRepositoryToken(User), useValue: userRepo },
        { provide: EntityManager, useValue: em },
        { provide: LessonGeneratorService, useValue: lessonGenerator },
        { provide: GoogleCalendarService, useValue: googleCalendar },
      ],
    }).compile();

    service = module.get<CoursesService>(CoursesService);
  });

  it("should be defined", () => {
    expect(service).toBeDefined();
  });

  // ────────────────────────────────────────────────────────────────
  // Course CRUD
  // ────────────────────────────────────────────────────────────────

  describe("findAllCourses", () => {
    it("should return all courses with tutor and students populated", async () => {
      courseRepo.findAll.mockResolvedValue([mockCourse]);

      const result = await service.findAllCourses();

      expect(result).toEqual([mockCourse]);
      expect(courseRepo.findAll).toHaveBeenCalledWith({
        populate: ["tutor", "students", "schedules"],
        orderBy: {
          title: "ASC",
          schedules: { dayOfWeek: "ASC", startTime: "ASC" },
        },
      });
    });
  });

  describe("findActiveCourses", () => {
    it("should return only active courses", async () => {
      courseRepo.find.mockResolvedValue([mockCourse]);

      const result = await service.findActiveCourses();

      expect(result).toEqual([mockCourse]);
      expect(courseRepo.find).toHaveBeenCalledWith(
        { isActive: true },
        {
          populate: ["tutor", "students", "schedules"],
          orderBy: {
            title: "ASC",
            schedules: { dayOfWeek: "ASC", startTime: "ASC" },
          },
        },
      );
    });
  });

  describe("findCourseById", () => {
    it("should return a course with all relations populated", async () => {
      courseRepo.findOne.mockResolvedValue(mockCourse);

      const result = await service.findCourseById("course-1");

      expect(result).toBe(mockCourse);
      expect(courseRepo.findOne).toHaveBeenCalledWith(
        { id: "course-1" },
        {
          populate: ["tutor", "students", "schedules"],
          orderBy: { schedules: { dayOfWeek: "ASC", startTime: "ASC" } },
        },
      );
    });

    it("should throw NotFoundException when course does not exist", async () => {
      courseRepo.findOne.mockResolvedValue(null);

      await expect(service.findCourseById("nonexistent")).rejects.toThrow(
        NotFoundException,
      );
    });
  });

  describe("createCourse", () => {
    it("should create a course with tutor, students, and schedule slots", async () => {
      userRepo.findOne
        .mockResolvedValueOnce(mockTutor) // tutor lookup
        .mockResolvedValueOnce(mockStudent1) // student 1 lookup
        .mockResolvedValueOnce(mockStudent2); // student 2 lookup
      em.persistAndFlush.mockResolvedValue(undefined);

      const dto = {
        title: "Jim & Bob - Spanish",
        tutorId: "tutor-1",
        studentIds: ["student-1", "student-2"],
        startDate: "2026-03-01",
        schedules: [
          { dayOfWeek: 3, startTime: "10:00", endTime: "11:00" },
          { dayOfWeek: 5, startTime: "10:00", endTime: "11:00" },
        ],
      };

      const result = await service.createCourse(dto);

      expect(result).toBeInstanceOf(Course);
      expect(result.title).toBe("Jim & Bob - Spanish");
      expect(result.tutor).toBe(mockTutor);
      expect(em.persistAndFlush).toHaveBeenCalled();
    });

    it("should throw NotFoundException when tutor does not exist", async () => {
      userRepo.findOne.mockResolvedValue(null);

      const dto = {
        title: "Test",
        tutorId: "nonexistent",
        studentIds: ["student-1"],
        startDate: "2026-03-01",
        schedules: [{ dayOfWeek: 1, startTime: "10:00", endTime: "11:00" }],
      };

      await expect(service.createCourse(dto)).rejects.toThrow(
        NotFoundException,
      );
    });

    it("should throw NotFoundException when a student does not exist", async () => {
      userRepo.findOne
        .mockResolvedValueOnce(mockTutor)
        .mockResolvedValueOnce(null); // student not found

      const dto = {
        title: "Test",
        tutorId: "tutor-1",
        studentIds: ["nonexistent"],
        startDate: "2026-03-01",
        schedules: [{ dayOfWeek: 1, startTime: "10:00", endTime: "11:00" }],
      };

      await expect(service.createCourse(dto)).rejects.toThrow(
        NotFoundException,
      );
    });
  });

  describe("updateCourse", () => {
    it("should update course fields and flush", async () => {
      courseRepo.findOne.mockResolvedValue(mockCourse);
      em.flush.mockResolvedValue(undefined);

      await service.updateCourse("course-1", {
        title: "Updated",
      });

      expect(em.assign).toHaveBeenCalledWith(mockCourse, { title: "Updated" });
      expect(em.flush).toHaveBeenCalled();
    });
  });

  describe("removeCourse", () => {
    it("should remove a course and return confirmation", async () => {
      courseRepo.findOne.mockResolvedValue(mockCourse);
      em.removeAndFlush.mockResolvedValue(undefined);

      const result = await service.removeCourse("course-1");

      expect(result).toEqual({ id: "course-1", deleted: true });
    });
  });

  // ────────────────────────────────────────────────────────────────
  // Student management
  // ────────────────────────────────────────────────────────────────

  describe("addStudent", () => {
    it("should add a student to the course", async () => {
      courseRepo.findOne.mockResolvedValue(mockCourse);
      userRepo.findOne.mockResolvedValue(mockStudent1);
      em.flush.mockResolvedValue(undefined);

      await service.addStudent("course-1", { studentId: "student-1" });

      expect(mockCourse.students.add).toHaveBeenCalledWith(mockStudent1);
      expect(em.flush).toHaveBeenCalled();
    });

    it("should throw NotFoundException when student not found", async () => {
      courseRepo.findOne.mockResolvedValue(mockCourse);
      userRepo.findOne.mockResolvedValue(null);

      await expect(
        service.addStudent("course-1", { studentId: "nonexistent" }),
      ).rejects.toThrow(NotFoundException);
    });
  });

  describe("removeStudent", () => {
    it("should remove a student from the course", async () => {
      courseRepo.findOne.mockResolvedValue(mockCourse);
      userRepo.findOne.mockResolvedValue(mockStudent1);
      em.flush.mockResolvedValue(undefined);

      await service.removeStudent("course-1", { studentId: "student-1" });

      expect(mockCourse.students.remove).toHaveBeenCalledWith(mockStudent1);
      expect(em.flush).toHaveBeenCalled();
    });
  });

  // ────────────────────────────────────────────────────────────────
  // Schedule management
  // ────────────────────────────────────────────────────────────────

  describe("addSchedule", () => {
    it("should add a schedule slot to the course", async () => {
      courseRepo.findOne.mockResolvedValue(mockCourse);
      em.persistAndFlush.mockResolvedValue(undefined);

      const dto = { dayOfWeek: 1, startTime: "14:00", endTime: "15:00" };
      const result = await service.addSchedule("course-1", dto);

      expect(result).toBeInstanceOf(CourseSchedule);
      expect(result.dayOfWeek).toBe(1);
      expect(result.startTime).toBe("14:00");
      expect(result.endTime).toBe("15:00");
      // Future lessons are resynced from the updated schedules, preserving
      // manually rescheduled ones (originalStartTime set).
      expect(lessonRepo.find).toHaveBeenCalledWith(
        expect.objectContaining({
          course: "course-1",
          status: LessonStatus.SCHEDULED,
          originalStartTime: null,
        }),
      );
      expect(lessonGenerator.generateLessonsForCourse).toHaveBeenCalledWith(
        "course-1",
      );
    });
  });

  describe("removeSchedule", () => {
    it("should remove a schedule slot and resync future lessons", async () => {
      const mockSchedule = { id: "sched-1", course: { id: "course-1" } };
      scheduleRepo.findOne.mockResolvedValue(mockSchedule);
      em.removeAndFlush.mockResolvedValue(undefined);

      const result = await service.removeSchedule("sched-1");

      expect(result).toEqual({ id: "sched-1", deleted: true });
      expect(lessonGenerator.generateLessonsForCourse).toHaveBeenCalledWith(
        "course-1",
      );
    });

    it("should throw NotFoundException when schedule not found", async () => {
      scheduleRepo.findOne.mockResolvedValue(null);

      await expect(service.removeSchedule("nonexistent")).rejects.toThrow(
        NotFoundException,
      );
    });
  });

  // ────────────────────────────────────────────────────────────────
  // Hours management
  // ────────────────────────────────────────────────────────────────

  describe("adjustHours", () => {
    it("should add hours to course balance", async () => {
      const course = { ...mockCourse, hoursBalance: 5, needsRenewal: true };
      courseRepo.findOne.mockResolvedValue(course);
      em.flush.mockResolvedValue(undefined);

      const result = await service.adjustHours("course-1", { hours: 10 });

      expect(result.hoursBalance).toBe(15);
      expect(result.needsRenewal).toBe(false);
    });

    it("should set needsRenewal when balance goes to zero or below", async () => {
      const course = { ...mockCourse, hoursBalance: 5, needsRenewal: false };
      courseRepo.findOne.mockResolvedValue(course);
      em.flush.mockResolvedValue(undefined);

      const result = await service.adjustHours("course-1", { hours: -5 });

      expect(result.hoursBalance).toBe(0);
      expect(result.needsRenewal).toBe(true);
    });
  });

  // ────────────────────────────────────────────────────────────────
  // Stats
  // ────────────────────────────────────────────────────────────────

  describe("getCourseStats", () => {
    it("should return course statistics", async () => {
      courseRepo.count.mockResolvedValue(5);
      courseRepo.find.mockResolvedValue([mockCourse]);

      const result = await service.getCourseStats();

      expect(result.totalCourses).toBe(5);
      expect(result.needsRenewalCourses).toBeDefined();
    });
  });
  // ────────────────────────────────────────────────────────────────
  // Tutor handover
  // ────────────────────────────────────────────────────────────────

  const oldTutor = {
    id: "tutor-1",
    role: UserRole.TUTOR,
    isActive: true,
    fullName: "Maria Garcia",
  };
  const newTutor = {
    id: "tutor-2",
    role: UserRole.TUTOR,
    isActive: true,
    fullName: "Ana Lopez",
    email: "ana@example.com",
  };
  const handoverStudent = {
    id: "student-1",
    fullName: "Jim Smith",
    email: "jim@example.com",
  };

  const makeCourse = () => ({
    id: "course-1",
    title: "Jim - Conversational Spanish",
    tutor: oldTutor,
    hoursBalance: 7,
    needsRenewal: false,
  });

  const makeLesson = (id: string, start: string, end: string, extra = {}) => ({
    id,
    tutor: oldTutor,
    status: LessonStatus.SCHEDULED,
    startTime: new Date(start),
    endTime: new Date(end),
    notes: undefined as string | undefined,
    googleCalendarEventId: undefined as string | undefined,
    students: { getItems: () => [handoverStudent] },
    ...extra,
  });

  /** Route em.findOne by entity class to the given course and tutor. */
  const mockEmLookups = (course: unknown, tutor: unknown) => {
    em.findOne.mockImplementation((entity: unknown) => {
      if (entity === Course) return Promise.resolve(course);
      if (entity === User) return Promise.resolve(tutor);
      return Promise.resolve(null);
    });
  };

  describe("previewTutorChange", () => {
    beforeEach(() => {
      courseRepo.findOne.mockResolvedValue(makeCourse());
      mockEmLookups(makeCourse(), newTutor);
    });

    it("counts lessons to move and unlogged past lessons", async () => {
      lessonRepo.find
        .mockResolvedValueOnce([
          makeLesson("l1", "2099-01-05T15:00:00Z", "2099-01-05T16:00:00Z"),
          makeLesson("l2", "2099-01-12T15:00:00Z", "2099-01-12T16:00:00Z"),
        ])
        .mockResolvedValueOnce([]);
      lessonRepo.count.mockResolvedValue(3);

      const result = await service.previewTutorChange("course-1", "tutor-2");

      expect(result).toEqual({
        lessonsToMove: 2,
        unloggedPastLessons: 3,
        clashes: [],
      });
      expect(lessonRepo.find).toHaveBeenNthCalledWith(1, {
        course: "course-1",
        status: LessonStatus.SCHEDULED,
        startTime: { $gt: expect.any(Date) },
      });
      expect(lessonRepo.count).toHaveBeenCalledWith({
        course: "course-1",
        status: LessonStatus.SCHEDULED,
        startTime: { $lte: expect.any(Date) },
      });
    });

    it("reports overlapping lessons of the new tutor as clashes and ignores non-overlapping ones", async () => {
      lessonRepo.find
        .mockResolvedValueOnce([
          makeLesson("l1", "2099-01-05T15:00:00Z", "2099-01-05T16:00:00Z"),
          makeLesson("l2", "2099-01-12T15:00:00Z", "2099-01-12T16:00:00Z"),
        ])
        .mockResolvedValueOnce([
          // overlaps l1 by 30 minutes
          {
            id: "o1",
            startTime: new Date("2099-01-05T15:30:00Z"),
            endTime: new Date("2099-01-05T16:30:00Z"),
            course: { title: "Other course" },
          },
          // also overlaps l1, in a second course: reported separately
          {
            id: "o3",
            startTime: new Date("2099-01-05T14:30:00Z"),
            endTime: new Date("2099-01-05T15:15:00Z"),
            course: { title: "Second course" },
          },
          // touches l2's end exactly: not a clash
          {
            id: "o2",
            startTime: new Date("2099-01-12T16:00:00Z"),
            endTime: new Date("2099-01-12T17:00:00Z"),
            course: { title: "Back to back" },
          },
        ]);

      const result = await service.previewTutorChange("course-1", "tutor-2");

      expect(result.clashes).toEqual([
        {
          lessonId: "l1",
          startTime: new Date("2099-01-05T15:00:00Z"),
          endTime: new Date("2099-01-05T16:00:00Z"),
          otherCourseTitle: "Other course",
        },
        {
          lessonId: "l1",
          startTime: new Date("2099-01-05T15:00:00Z"),
          endTime: new Date("2099-01-05T16:00:00Z"),
          otherCourseTitle: "Second course",
        },
      ]);
    });

    it("queries the new tutor's other lessons excluding this course and non-scheduled lessons", async () => {
      lessonRepo.find
        .mockResolvedValueOnce([
          makeLesson("l1", "2099-01-05T15:00:00Z", "2099-01-05T16:00:00Z"),
        ])
        .mockResolvedValueOnce([]);

      await service.previewTutorChange("course-1", "tutor-2");

      expect(lessonRepo.find).toHaveBeenNthCalledWith(
        2,
        {
          tutor: "tutor-2",
          status: LessonStatus.SCHEDULED,
          course: { $ne: "course-1" },
          startTime: {
            $gt: expect.any(Date),
            $lt: new Date("2099-01-05T16:00:00Z"),
          },
        },
        { populate: ["course"] },
      );
    });

    it("skips the clash query when no lessons would move", async () => {
      lessonRepo.find.mockResolvedValueOnce([]);

      const result = await service.previewTutorChange("course-1", "tutor-2");

      expect(result.clashes).toEqual([]);
      expect(lessonRepo.find).toHaveBeenCalledTimes(1);
    });

    it("throws NotFoundException for an unknown course", async () => {
      courseRepo.findOne.mockResolvedValue(null);

      await expect(
        service.previewTutorChange("missing", "tutor-2"),
      ).rejects.toThrow(NotFoundException);
    });

    it("throws NotFoundException for an unknown or non-tutor user", async () => {
      mockEmLookups(makeCourse(), null);

      await expect(
        service.previewTutorChange("course-1", "student-1"),
      ).rejects.toThrow(NotFoundException);
      expect(em.findOne).toHaveBeenCalledWith(User, {
        id: "student-1",
        role: UserRole.TUTOR,
      });
    });

    it("throws BadRequestException for the current tutor", async () => {
      mockEmLookups(makeCourse(), oldTutor);

      await expect(
        service.previewTutorChange("course-1", "tutor-1"),
      ).rejects.toThrow(BadRequestException);
    });
  });

  describe("changeTutor", () => {
    const actor = { id: "admin-1", role: UserRole.ADMIN } as unknown as User;

    it("moves the course and its upcoming scheduled lessons to the new tutor", async () => {
      const course = makeCourse();
      const upcoming = [
        makeLesson("l1", "2099-01-05T15:00:00Z", "2099-01-05T16:00:00Z"),
        makeLesson("l2", "2099-01-12T15:00:00Z", "2099-01-12T16:00:00Z", {
          originalStartTime: new Date("2099-01-11T15:00:00Z"),
        }),
      ];
      mockEmLookups(course, newTutor);
      em.find.mockResolvedValue(upcoming);
      const updated = { ...course, tutor: newTutor };
      courseRepo.findOne.mockResolvedValue(updated);

      const result = await service.changeTutor("course-1", "tutor-2", actor);

      expect(em.transactional).toHaveBeenCalled();
      expect(course.tutor).toBe(newTutor);
      expect(upcoming.every((lesson) => lesson.tutor === newTutor)).toBe(true);
      expect(em.flush).toHaveBeenCalled();
      expect(result).toBe(updated);
    });

    it("only queries scheduled, not-yet-started lessons of the course (completed, no-show, cancelled and started ones stay)", async () => {
      const course = makeCourse();
      mockEmLookups(course, newTutor);
      const moved = makeLesson(
        "l1",
        "2099-01-05T15:00:00Z",
        "2099-01-05T16:00:00Z",
      );
      em.find.mockResolvedValue([moved]);
      courseRepo.findOne.mockResolvedValue(course);

      await service.changeTutor("course-1", "tutor-2", actor);

      expect(em.find).toHaveBeenCalledTimes(1);
      const [entity, criteria, options] = em.find.mock.calls[0];
      expect(entity).toBe(Lesson);
      expect(criteria).toEqual({
        course: "course-1",
        status: LessonStatus.SCHEDULED,
        startTime: { $gt: expect.any(Date) },
      });
      // Manually rescheduled lessons are included: no originalStartTime filter.
      expect(criteria).not.toHaveProperty("originalStartTime");
      expect(criteria.startTime.$gt.getTime()).toBeLessThanOrEqual(Date.now());
      expect(options).toEqual({ populate: ["students"] });
      expect(moved.tutor).toBe(newTutor);
    });

    it("leaves hoursBalance and needsRenewal unchanged", async () => {
      const course = makeCourse();
      mockEmLookups(course, newTutor);
      em.find.mockResolvedValue([
        makeLesson("l1", "2099-01-05T15:00:00Z", "2099-01-05T16:00:00Z"),
      ]);
      courseRepo.findOne.mockResolvedValue(course);

      await service.changeTutor("course-1", "tutor-2", actor);

      expect(course.hoursBalance).toBe(7);
      expect(course.needsRenewal).toBe(false);
    });

    it("retitles calendar events of moved lessons after commit", async () => {
      const course = makeCourse();
      mockEmLookups(course, newTutor);
      em.find.mockResolvedValue([
        makeLesson("l1", "2099-01-05T15:00:00Z", "2099-01-05T16:00:00Z", {
          googleCalendarEventId: "gcal-1",
          notes: "Bring book",
        }),
        makeLesson("l2", "2099-01-12T15:00:00Z", "2099-01-12T16:00:00Z"),
      ]);
      courseRepo.findOne.mockResolvedValue(course);

      await service.changeTutor("course-1", "tutor-2", actor);

      expect(googleCalendar.updateEvent).toHaveBeenCalledTimes(1);
      expect(googleCalendar.updateEvent).toHaveBeenCalledWith("gcal-1", {
        summary: "Spanish Class: Jim Smith with Ana Lopez",
        description: "Bring book",
        startTime: new Date("2099-01-05T15:00:00Z"),
        endTime: new Date("2099-01-05T16:00:00Z"),
        attendeeEmails: ["jim@example.com", "ana@example.com"],
      });
    });

    it("does not fail the handover when a calendar update fails", async () => {
      const course = makeCourse();
      mockEmLookups(course, newTutor);
      em.find.mockResolvedValue([
        makeLesson("l1", "2099-01-05T15:00:00Z", "2099-01-05T16:00:00Z", {
          googleCalendarEventId: "gcal-1",
        }),
      ]);
      googleCalendar.updateEvent.mockResolvedValue(false);
      courseRepo.findOne.mockResolvedValue({ ...course, tutor: newTutor });

      const result = await service.changeTutor("course-1", "tutor-2", actor);

      expect(result.tutor).toBe(newTutor);
      expect(course.tutor).toBe(newTutor);
    });

    it("throws NotFoundException for an unknown course and flushes nothing", async () => {
      mockEmLookups(null, newTutor);

      await expect(
        service.changeTutor("missing", "tutor-2", actor),
      ).rejects.toThrow(NotFoundException);
      expect(em.flush).not.toHaveBeenCalled();
    });

    it("throws NotFoundException for an unknown or non-tutor user and flushes nothing", async () => {
      const course = makeCourse();
      mockEmLookups(course, null);

      await expect(
        service.changeTutor("course-1", "student-1", actor),
      ).rejects.toThrow(NotFoundException);
      expect(em.findOne).toHaveBeenCalledWith(User, {
        id: "student-1",
        role: UserRole.TUTOR,
      });
      expect(em.flush).not.toHaveBeenCalled();
      expect(course.tutor).toBe(oldTutor);
    });

    it("throws BadRequestException for an inactive tutor", async () => {
      const course = makeCourse();
      mockEmLookups(course, { ...newTutor, isActive: false });

      await expect(
        service.changeTutor("course-1", "tutor-2", actor),
      ).rejects.toThrow(BadRequestException);
      expect(em.flush).not.toHaveBeenCalled();
      expect(course.tutor).toBe(oldTutor);
    });

    it("throws BadRequestException when the tutor is already the course tutor", async () => {
      const course = makeCourse();
      mockEmLookups(course, oldTutor);

      await expect(
        service.changeTutor("course-1", "tutor-1", actor),
      ).rejects.toThrow(BadRequestException);
      expect(em.flush).not.toHaveBeenCalled();
      expect(em.find).not.toHaveBeenCalled();
    });
  });
});
