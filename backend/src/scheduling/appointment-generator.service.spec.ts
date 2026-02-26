import { Test, TestingModule } from "@nestjs/testing";
import { EntityManager, Collection } from "@mikro-orm/core";
import { getRepositoryToken } from "@mikro-orm/nestjs";
import { AppointmentGeneratorService } from "./appointment-generator.service";
import { Course } from "../courses/entities/course.entity";
import { Appointment } from "./entities/appointment.entity";
import { UserRole } from "../users/entities/user.entity";

type MockRepo = Record<string, jest.Mock>;

describe("AppointmentGeneratorService", () => {
  let service: AppointmentGeneratorService;
  let courseRepo: MockRepo;
  let appointmentRepo: MockRepo;
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

    appointmentRepo = {
      findOne: jest.fn(),
      count: jest.fn(),
    };

    em = {
      persistAndFlush: jest.fn(),
      flush: jest.fn(),
    };

    const module: TestingModule = await Test.createTestingModule({
      providers: [
        AppointmentGeneratorService,
        { provide: getRepositoryToken(Course), useValue: courseRepo },
        { provide: getRepositoryToken(Appointment), useValue: appointmentRepo },
        { provide: EntityManager, useValue: em },
      ],
    }).compile();

    service = module.get<AppointmentGeneratorService>(
      AppointmentGeneratorService,
    );
  });

  it("should be defined", () => {
    expect(service).toBeDefined();
  });

  describe("generateAppointments", () => {
    it("should generate appointments for active courses with schedules", async () => {
      courseRepo.find.mockResolvedValue([mockCourse]);
      appointmentRepo.count.mockResolvedValue(0); // no existing appointments
      em.persistAndFlush.mockResolvedValue(undefined);
      em.flush.mockResolvedValue(undefined);

      await service.generateAppointments();

      expect(courseRepo.find).toHaveBeenCalledWith(
        { isActive: true },
        { populate: ["tutor", "students", "schedules"] },
      );
      // Should have created appointments (exact count depends on how many Wednesdays in 4 weeks)
      expect(em.persistAndFlush).toHaveBeenCalled();
    });

    it("should skip dates before course start date", async () => {
      const futureCourse = {
        ...mockCourse,
        startDate: new Date("2026-12-01"), // far future
      };
      courseRepo.find.mockResolvedValue([futureCourse]);

      await service.generateAppointments();

      // No appointments should be generated since start date is in the future
      expect(em.persistAndFlush).not.toHaveBeenCalled();
    });

    it("should skip slots where an appointment already exists", async () => {
      courseRepo.find.mockResolvedValue([mockCourse]);
      appointmentRepo.count.mockResolvedValue(1); // appointment already exists

      await service.generateAppointments();

      expect(em.persistAndFlush).not.toHaveBeenCalled();
    });

    it("should deduct hours from course balance", async () => {
      const course = { ...mockCourse, hoursBalance: 10 };
      courseRepo.find.mockResolvedValue([course]);
      appointmentRepo.count.mockResolvedValue(0);
      em.persistAndFlush.mockResolvedValue(undefined);
      em.flush.mockResolvedValue(undefined);

      await service.generateAppointments();

      // hoursBalance should be reduced
      expect(course.hoursBalance).toBeLessThan(10);
    });

    it("should set needsRenewal when balance reaches zero", async () => {
      const course = { ...mockCourse, hoursBalance: 1, needsRenewal: false };
      courseRepo.find.mockResolvedValue([course]);
      appointmentRepo.count.mockResolvedValue(0);
      em.persistAndFlush.mockResolvedValue(undefined);
      em.flush.mockResolvedValue(undefined);

      await service.generateAppointments();

      expect(course.needsRenewal).toBe(true);
    });
  });
});
