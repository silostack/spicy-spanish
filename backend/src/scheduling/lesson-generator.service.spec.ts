import { Test, TestingModule } from "@nestjs/testing";
import { EntityManager, Collection } from "@mikro-orm/core";
import { getRepositoryToken } from "@mikro-orm/nestjs";
import { LessonGeneratorService } from "./lesson-generator.service";
import { Course } from "../courses/entities/course.entity";
import { Lesson, LessonStatus } from "./entities/lesson.entity";
import { UserRole } from "../users/entities/user.entity";

type MockRepo = Record<string, jest.Mock>;

describe("LessonGeneratorService", () => {
  let service: LessonGeneratorService;
  let courseRepo: MockRepo;
  let lessonRepo: MockRepo;
  let em: Record<string, jest.Mock>;

  const mockTutor = {
    id: "tutor-1",
    firstName: "Maria",
    lastName: "Garcia",
    role: UserRole.TUTOR,
  };

  const mockStudent = {
    id: "student-1",
    firstName: "Jim",
    lastName: "Smith",
    role: UserRole.STUDENT,
  };

  const mockSchedule = {
    id: "sched-1",
    dayOfWeek: 3, // Wednesday
    startTime: "10:00",
    endTime: "11:00",
  };

  const mockCourse = {
    id: "course-1",
    title: "Test Course",
    tutor: mockTutor,
    students: { getItems: () => [mockStudent], isInitialized: () => true },
    schedules: { getItems: () => [mockSchedule], isInitialized: () => true },
    startDate: new Date("2026-02-01"),
    isActive: true,
    hoursBalance: 10,
    needsRenewal: false,
  };

  beforeEach(async () => {
    // MikroORM Collection.add() accesses entity metadata (__meta) which is only
    // available when MikroORM is fully bootstrapped. In pure unit tests we mock
    // it so that Collection.add() calls on new entities don't throw.
    jest.spyOn(Collection.prototype, "add").mockImplementation(() => {});

    courseRepo = {
      find: jest.fn(),
    };

    lessonRepo = {
      findOne: jest.fn(),
      count: jest.fn(),
    };

    em = {
      persistAndFlush: jest.fn(),
    };

    const module: TestingModule = await Test.createTestingModule({
      providers: [
        LessonGeneratorService,
        { provide: getRepositoryToken(Course), useValue: courseRepo },
        { provide: getRepositoryToken(Lesson), useValue: lessonRepo },
        { provide: EntityManager, useValue: em },
      ],
    }).compile();

    service = module.get<LessonGeneratorService>(LessonGeneratorService);
  });

  it("should be defined", () => {
    expect(service).toBeDefined();
  });

  describe("generateLessons", () => {
    it("should generate lessons for active courses with schedules", async () => {
      courseRepo.find.mockResolvedValue([mockCourse]);
      lessonRepo.count.mockResolvedValue(0); // no existing lessons
      em.persistAndFlush.mockResolvedValue(undefined);

      await service.generateAppointments();

      expect(courseRepo.find).toHaveBeenCalledWith(
        { isActive: true },
        { populate: ["tutor", "students", "schedules"] },
      );
      // Should have created lessons (exact count depends on how many Wednesdays in 4 weeks)
      expect(em.persistAndFlush).toHaveBeenCalled();
    });

    it("should skip dates before course start date", async () => {
      const futureCourse = {
        ...mockCourse,
        startDate: new Date("2026-12-01"), // far future
      };
      courseRepo.find.mockResolvedValue([futureCourse]);

      await service.generateAppointments();

      // No lessons should be generated since start date is in the future
      expect(em.persistAndFlush).not.toHaveBeenCalled();
    });

    it("should anchor lesson times to the school timezone regardless of server TZ", async () => {
      // SCHEDULE_TIMEZONE defaults to America/Bogota (UTC-5, no DST), so a
      // 10:00–11:00 wall-clock slot must always become 15:00Z–16:00Z, and land
      // on its scheduled day (Wednesday), no matter what TZ the machine uses.
      courseRepo.find.mockResolvedValue([mockCourse]);
      lessonRepo.count.mockResolvedValue(0);
      em.persistAndFlush.mockResolvedValue(undefined);

      await service.generateAppointments();

      const created = em.persistAndFlush.mock.calls[0][0] as Array<{
        startTime: Date;
        endTime: Date;
      }>;
      expect(created.length).toBeGreaterThan(0);
      for (const lesson of created) {
        expect(lesson.startTime.getUTCHours()).toBe(15);
        expect(lesson.startTime.getUTCMinutes()).toBe(0);
        expect(lesson.endTime.getUTCHours()).toBe(16);
        expect(lesson.startTime.getUTCDay()).toBe(3); // Wednesday
      }
    });

    it("should skip slots where an lesson already exists", async () => {
      courseRepo.find.mockResolvedValue([mockCourse]);
      lessonRepo.count.mockResolvedValue(1); // lesson already exists

      await service.generateAppointments();

      expect(em.persistAndFlush).not.toHaveBeenCalled();
    });

    it("should treat a rescheduled-away occurrence as already covered", async () => {
      // The dedupe must match either a lesson sitting at the slot instant or one
      // moved away from it (originalStartTime), so a rescheduled lesson is not
      // recreated at its old time.
      courseRepo.find.mockResolvedValue([mockCourse]);
      lessonRepo.count.mockResolvedValue(0);
      em.persistAndFlush.mockResolvedValue(undefined);

      await service.generateAppointments();

      const countQuery = lessonRepo.count.mock.calls[0][0];
      expect(countQuery.status).toEqual({ $ne: LessonStatus.CANCELLED });
      expect(countQuery.$or).toEqual([
        { startTime: expect.any(Date) },
        { originalStartTime: expect.any(Date) },
      ]);
    });

    it("should not deduct hours from course balance", async () => {
      const course = { ...mockCourse, hoursBalance: 10 };
      courseRepo.find.mockResolvedValue([course]);
      lessonRepo.count.mockResolvedValue(0);
      em.persistAndFlush.mockResolvedValue(undefined);

      await service.generateAppointments();

      expect(course.hoursBalance).toBe(10);
    });

    it("should not toggle needsRenewal based on generated lessons", async () => {
      const course = { ...mockCourse, hoursBalance: 1, needsRenewal: false };
      courseRepo.find.mockResolvedValue([course]);
      lessonRepo.count.mockResolvedValue(0);
      em.persistAndFlush.mockResolvedValue(undefined);

      await service.generateAppointments();

      expect(course.needsRenewal).toBe(false);
    });
  });
});
