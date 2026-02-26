import { Test, TestingModule } from "@nestjs/testing";
import { getRepositoryToken } from "@mikro-orm/nestjs";
import { EntityManager } from "@mikro-orm/core";
import { NotFoundException, BadRequestException } from "@nestjs/common";
import { SchedulingService } from "./scheduling.service";
import { GoogleCalendarService } from "./google-calendar.service";
import { EmailService } from "../email/email.service";
import { Appointment, AppointmentStatus } from "./entities/appointment.entity";
import { Availability } from "./entities/availability.entity";
import { Attendance, AttendanceStatus } from "./entities/attendance.entity";
import { ClassReport } from "./entities/class-report.entity";
import { User, UserRole } from "../users/entities/user.entity";
import { Course } from "../courses/entities/course.entity";

// Mock the Appointment entity so that `new Appointment(...)` in the service
// returns a plain object with a simple students collection stub rather than a
// real MikroORM Collection (which requires metadata to be initialised and
// therefore fails in unit-test context).
jest.mock("./entities/appointment.entity", () => {
  const original = jest.requireActual("./entities/appointment.entity");
  class MockAppointment {
    id = "appt-new";
    students = { add: jest.fn(), getItems: () => [] };
    tutor: any;
    course: any;
    startTime: Date;
    endTime: Date;
    status = original.AppointmentStatus.SCHEDULED;
    notes?: string;
    googleCalendarEventId?: string;
    confirmationEmailSent = false;
    reminderSent = false;
    dayBeforeReminderSent = false;
    creditedBack?: boolean;
    createdAt = new Date();
    updatedAt = new Date();

    constructor(tutor: any, course: any, startTime: Date, endTime: Date) {
      this.tutor = tutor;
      this.course = course;
      this.startTime = startTime;
      this.endTime = endTime;
    }
  }
  return { ...original, Appointment: MockAppointment };
});

// ---------------------------------------------------------------------------
// Helpers to build mock entities
// ---------------------------------------------------------------------------

function createMockUser(overrides: Partial<User> & { role: UserRole }): User {
  const u = {
    id: "user-" + Math.random().toString(36).slice(2, 8),
    firstName: "Test",
    lastName: "User",
    email: "test@example.com",
    password: "hashed",
    fullName: "Test User",
    isActive: true,
    createdAt: new Date(),
    updatedAt: new Date(),
    ...overrides,
  } as unknown as User;
  // The getter `fullName` is a getter on the real entity, but in our mock it's
  // just a plain property.  Re-derive it if first/last were overridden.
  (u as any).fullName = `${u.firstName} ${u.lastName}`;
  return u;
}

function createMockAppointment(overrides?: Partial<any>): any {
  const student = createMockUser({
    role: UserRole.STUDENT,
    firstName: "Stu",
    lastName: "Dent",
    email: "stu@test.com",
  });
  const tutor = createMockUser({
    role: UserRole.TUTOR,
    firstName: "Tu",
    lastName: "Tor",
    email: "tut@test.com",
  });
  const course = {
    id: "course-1",
    hoursBalance: 5,
    needsRenewal: false,
  };
  return {
    id: "appt-1",
    students: {
      getItems: () => [student],
      add: jest.fn(),
      isInitialized: () => true,
    },
    tutor,
    course,
    startTime: new Date("2026-03-01T10:00:00Z"),
    endTime: new Date("2026-03-01T11:00:00Z"),
    status: AppointmentStatus.SCHEDULED,
    notes: undefined,
    creditedBack: undefined,
    googleCalendarEventId: undefined,
    confirmationEmailSent: false,
    reminderSent: false,
    dayBeforeReminderSent: false,
    createdAt: new Date(),
    updatedAt: new Date(),
    ...overrides,
  };
}

// ---------------------------------------------------------------------------
// Mock factories
// ---------------------------------------------------------------------------

const mockRepository = () => ({
  findAll: jest.fn(),
  findOne: jest.fn(),
  find: jest.fn(),
  count: jest.fn(),
});

const mockEntityManager = () => ({
  persistAndFlush: jest.fn(),
  flush: jest.fn(),
  removeAndFlush: jest.fn(),
  assign: jest.fn((entity, dto) => Object.assign(entity, dto)),
  find: jest.fn(),
});

const mockGoogleCalendarService = () => ({
  createEvent: jest.fn().mockResolvedValue("gcal-event-123"),
  updateEvent: jest.fn().mockResolvedValue(true),
  deleteEvent: jest.fn().mockResolvedValue(true),
  isEnabled: jest.fn().mockReturnValue(true),
});

const mockEmailService = () => ({
  sendClassConfirmationEmail: jest.fn().mockResolvedValue(undefined),
  sendClassCancellationEmail: jest.fn().mockResolvedValue(undefined),
});

// ---------------------------------------------------------------------------
// Tests
// ---------------------------------------------------------------------------

describe("SchedulingService", () => {
  let service: SchedulingService;
  let appointmentRepo: ReturnType<typeof mockRepository>;
  let availabilityRepo: ReturnType<typeof mockRepository>;
  let attendanceRepo: ReturnType<typeof mockRepository>;
  let classReportRepo: ReturnType<typeof mockRepository>;
  let userRepo: ReturnType<typeof mockRepository>;
  let courseRepo: ReturnType<typeof mockRepository>;
  let em: ReturnType<typeof mockEntityManager>;
  let googleCalendar: ReturnType<typeof mockGoogleCalendarService>;
  let emailService: ReturnType<typeof mockEmailService>;

  beforeEach(async () => {
    appointmentRepo = mockRepository();
    availabilityRepo = mockRepository();
    attendanceRepo = mockRepository();
    classReportRepo = mockRepository();
    userRepo = mockRepository();
    courseRepo = mockRepository();
    em = mockEntityManager();
    googleCalendar = mockGoogleCalendarService();
    emailService = mockEmailService();

    const module: TestingModule = await Test.createTestingModule({
      providers: [
        SchedulingService,
        { provide: getRepositoryToken(Appointment), useValue: appointmentRepo },
        {
          provide: getRepositoryToken(Availability),
          useValue: availabilityRepo,
        },
        { provide: getRepositoryToken(Attendance), useValue: attendanceRepo },
        { provide: getRepositoryToken(ClassReport), useValue: classReportRepo },
        { provide: getRepositoryToken(User), useValue: userRepo },
        { provide: getRepositoryToken(Course), useValue: courseRepo },
        { provide: EntityManager, useValue: em },
        { provide: GoogleCalendarService, useValue: googleCalendar },
        { provide: EmailService, useValue: emailService },
      ],
    }).compile();

    service = module.get<SchedulingService>(SchedulingService);
  });

  it("should be defined", () => {
    expect(service).toBeDefined();
  });

  // -----------------------------------------------------------------------
  // Appointment CRUD
  // -----------------------------------------------------------------------

  describe("findAllAppointments", () => {
    it("should return all appointments", async () => {
      const appointments = [createMockAppointment()];
      appointmentRepo.findAll.mockResolvedValue(appointments);

      const result = await service.findAllAppointments();
      expect(result).toEqual(appointments);
      expect(appointmentRepo.findAll).toHaveBeenCalledWith({
        populate: ["students", "tutor", "course"],
        orderBy: { startTime: "ASC" },
      });
    });
  });

  describe("findAppointmentById", () => {
    it("should return appointment when found", async () => {
      const appt = createMockAppointment();
      appointmentRepo.findOne.mockResolvedValue(appt);

      const result = await service.findAppointmentById("appt-1");
      expect(result).toEqual(appt);
    });

    it("should throw NotFoundException when not found", async () => {
      appointmentRepo.findOne.mockResolvedValue(null);
      await expect(service.findAppointmentById("bad-id")).rejects.toThrow(
        NotFoundException,
      );
    });
  });

  describe("findAppointmentsByStudent", () => {
    it("should query by student id through ManyToMany", async () => {
      appointmentRepo.find.mockResolvedValue([]);
      await service.findAppointmentsByStudent("stu-1");
      expect(appointmentRepo.find).toHaveBeenCalledWith(
        { students: "stu-1" },
        expect.objectContaining({ populate: ["students", "tutor", "course"] }),
      );
    });
  });

  describe("findAppointmentsByTutor", () => {
    it("should query by tutor id", async () => {
      appointmentRepo.find.mockResolvedValue([]);
      await service.findAppointmentsByTutor("tut-1");
      expect(appointmentRepo.find).toHaveBeenCalledWith(
        { tutor: "tut-1" },
        expect.objectContaining({ populate: ["students", "tutor", "course"] }),
      );
    });
  });

  describe("findUpcomingAppointmentsByStudent", () => {
    it("should filter by future scheduled appointments through ManyToMany", async () => {
      appointmentRepo.find.mockResolvedValue([]);
      await service.findUpcomingAppointmentsByStudent("stu-1");
      expect(appointmentRepo.find).toHaveBeenCalledWith(
        expect.objectContaining({
          students: "stu-1",
          status: AppointmentStatus.SCHEDULED,
        }),
        expect.objectContaining({ orderBy: { startTime: "ASC" } }),
      );
    });
  });

  describe("findUpcomingAppointmentsByTutor", () => {
    it("should filter by future scheduled appointments for tutor", async () => {
      appointmentRepo.find.mockResolvedValue([]);
      await service.findUpcomingAppointmentsByTutor("tut-1");
      expect(appointmentRepo.find).toHaveBeenCalledWith(
        expect.objectContaining({
          tutor: "tut-1",
          status: AppointmentStatus.SCHEDULED,
        }),
        expect.objectContaining({ orderBy: { startTime: "ASC" } }),
      );
    });
  });

  describe("createAppointment", () => {
    const student = createMockUser({
      id: "stu-1",
      role: UserRole.STUDENT,
      firstName: "Stu",
      lastName: "Dent",
      email: "stu@test.com",
    });
    const tutor = createMockUser({
      id: "tut-1",
      role: UserRole.TUTOR,
      firstName: "Tu",
      lastName: "Tor",
      email: "tut@test.com",
    });
    const mockCourse = {
      id: "course-1",
      hoursBalance: 10,
      needsRenewal: false,
    };

    const dto = {
      studentIds: ["stu-1"],
      tutorId: "tut-1",
      courseId: "course-1",
      startTime: new Date("2026-03-01T10:00:00Z"),
      endTime: new Date("2026-03-01T11:00:00Z"),
      notes: "Test lesson",
    };

    beforeEach(() => {
      userRepo.findOne.mockImplementation(async (criteria) => {
        if (criteria.id === "stu-1" && criteria.role === UserRole.STUDENT)
          return student;
        if (criteria.id === "tut-1" && criteria.role === UserRole.TUTOR)
          return tutor;
        return null;
      });
      courseRepo.findOne.mockResolvedValue(mockCourse);
      // No conflicts
      appointmentRepo.count.mockResolvedValue(0);
    });

    it("should create an appointment with google calendar event", async () => {
      const result = await service.createAppointment(dto);

      expect(result).toBeDefined();
      expect(result.tutor).toEqual(tutor);
      expect(result.googleCalendarEventId).toBe("gcal-event-123");
      expect(googleCalendar.createEvent).toHaveBeenCalledWith(
        expect.objectContaining({
          summary: expect.stringContaining("Stu Dent"),
          startTime: dto.startTime,
          endTime: dto.endTime,
        }),
      );
      expect(em.persistAndFlush).toHaveBeenCalled();
      expect(emailService.sendClassConfirmationEmail).toHaveBeenCalled();
    });

    it("should throw NotFoundException if student not found", async () => {
      userRepo.findOne.mockResolvedValue(null);
      await expect(service.createAppointment(dto)).rejects.toThrow(
        NotFoundException,
      );
    });

    it("should throw NotFoundException if tutor not found", async () => {
      userRepo.findOne.mockImplementation(async (criteria) => {
        if (criteria.role === UserRole.STUDENT) return student;
        return null;
      });
      await expect(service.createAppointment(dto)).rejects.toThrow(
        NotFoundException,
      );
    });

    it("should throw NotFoundException when course not found", async () => {
      courseRepo.findOne.mockResolvedValue(null);
      await expect(service.createAppointment(dto)).rejects.toThrow(
        NotFoundException,
      );
    });

    it("should throw BadRequestException on time conflict", async () => {
      appointmentRepo.count.mockResolvedValue(1);
      await expect(service.createAppointment(dto)).rejects.toThrow(
        BadRequestException,
      );
    });

    it("should not fail appointment creation when email fails", async () => {
      emailService.sendClassConfirmationEmail.mockRejectedValue(
        new Error("SMTP down"),
      );
      const result = await service.createAppointment(dto);
      expect(result).toBeDefined();
      expect(em.persistAndFlush).toHaveBeenCalled();
    });
  });

  describe("updateAppointment", () => {
    it("should update simple fields", async () => {
      const appt = createMockAppointment();
      appointmentRepo.findOne.mockResolvedValue(appt);

      await service.updateAppointment("appt-1", {
        notes: "updated",
      });
      expect(em.assign).toHaveBeenCalledWith(appt, { notes: "updated" });
      expect(em.flush).toHaveBeenCalled();
    });

    it("should check availability and conflicts when times change", async () => {
      const appt = createMockAppointment({ googleCalendarEventId: "gcal-1" });
      appointmentRepo.findOne.mockResolvedValue(appt);
      availabilityRepo.findOne.mockResolvedValue({ id: "avail-1" });
      appointmentRepo.count.mockResolvedValue(0);

      const newStart = new Date("2026-03-01T12:00:00Z");
      await service.updateAppointment("appt-1", { startTime: newStart });

      expect(googleCalendar.updateEvent).toHaveBeenCalledWith(
        "gcal-1",
        expect.anything(),
      );
      expect(em.flush).toHaveBeenCalled();
    });

    it("should delete google calendar event when status set to cancelled", async () => {
      const appt = createMockAppointment({ googleCalendarEventId: "gcal-1" });
      appointmentRepo.findOne.mockResolvedValue(appt);

      await service.updateAppointment("appt-1", {
        status: AppointmentStatus.CANCELLED,
      });
      expect(googleCalendar.deleteEvent).toHaveBeenCalledWith("gcal-1");
    });

    it("should throw BadRequestException when new time is unavailable", async () => {
      const appt = createMockAppointment();
      appointmentRepo.findOne.mockResolvedValue(appt);
      availabilityRepo.findOne.mockResolvedValue(null);

      await expect(
        service.updateAppointment("appt-1", {
          startTime: new Date("2026-03-01T14:00:00Z"),
        }),
      ).rejects.toThrow(BadRequestException);
    });
  });

  describe("cancelAppointment", () => {
    it("should set status to CANCELLED and delete calendar event", async () => {
      const appt = createMockAppointment({ googleCalendarEventId: "gcal-1" });
      appointmentRepo.findOne.mockResolvedValue(appt);

      const result = await service.cancelAppointment("appt-1", {
        creditHoursBack: false,
      });
      expect(result.status).toBe(AppointmentStatus.CANCELLED);
      expect(googleCalendar.deleteEvent).toHaveBeenCalledWith("gcal-1");
      expect(emailService.sendClassCancellationEmail).toHaveBeenCalledWith(
        appt,
      );
    });

    it("should not fail if cancellation email fails", async () => {
      const appt = createMockAppointment();
      appointmentRepo.findOne.mockResolvedValue(appt);
      emailService.sendClassCancellationEmail.mockRejectedValue(
        new Error("email fail"),
      );

      const result = await service.cancelAppointment("appt-1", {
        creditHoursBack: false,
      });
      expect(result.status).toBe(AppointmentStatus.CANCELLED);
    });

    it("should cancel and credit hours back to course when creditHoursBack is true", async () => {
      const course = { id: "course-1", hoursBalance: 5, needsRenewal: false };
      const appt = createMockAppointment({ course });
      appointmentRepo.findOne.mockResolvedValue(appt);
      em.flush.mockResolvedValue(undefined);

      const result = await service.cancelAppointment("appt-1", {
        creditHoursBack: true,
      });

      expect(result.status).toBe(AppointmentStatus.CANCELLED);
      expect(result.creditedBack).toBe(true);
      expect(course.hoursBalance).toBe(6); // 5 + 1 hour
    });

    it("should cancel without crediting hours when creditHoursBack is false", async () => {
      const course = { id: "course-1", hoursBalance: 5, needsRenewal: false };
      const appt = createMockAppointment({ course });
      appointmentRepo.findOne.mockResolvedValue(appt);
      em.flush.mockResolvedValue(undefined);

      const result = await service.cancelAppointment("appt-1", {
        creditHoursBack: false,
      });

      expect(result.status).toBe(AppointmentStatus.CANCELLED);
      expect(result.creditedBack).toBe(false);
      expect(course.hoursBalance).toBe(5); // unchanged
    });
  });

  describe("completeAppointment", () => {
    it("should set status to COMPLETED and update calendar with student names", async () => {
      const appt = createMockAppointment({ googleCalendarEventId: "gcal-1" });
      appointmentRepo.findOne.mockResolvedValue(appt);

      const result = await service.completeAppointment("appt-1");
      expect(result.status).toBe(AppointmentStatus.COMPLETED);
      expect(googleCalendar.updateEvent).toHaveBeenCalledWith(
        "gcal-1",
        expect.objectContaining({
          summary: expect.stringContaining("(Completed)"),
        }),
      );
      expect(em.flush).toHaveBeenCalled();
    });
  });

  // -----------------------------------------------------------------------
  // Availability CRUD
  // -----------------------------------------------------------------------

  describe("findAvailabilityById", () => {
    it("should return availability when found", async () => {
      const avail = { id: "avail-1", dayOfWeek: 1 };
      availabilityRepo.findOne.mockResolvedValue(avail);
      const result = await service.findAvailabilityById("avail-1");
      expect(result).toEqual(avail);
    });

    it("should throw NotFoundException when not found", async () => {
      availabilityRepo.findOne.mockResolvedValue(null);
      await expect(service.findAvailabilityById("bad")).rejects.toThrow(
        NotFoundException,
      );
    });
  });

  describe("findAvailabilityByTutor", () => {
    it("should query by tutor id", async () => {
      availabilityRepo.find.mockResolvedValue([]);
      await service.findAvailabilityByTutor("tut-1");
      expect(availabilityRepo.find).toHaveBeenCalledWith(
        { tutor: "tut-1" },
        expect.objectContaining({ populate: ["tutor"] }),
      );
    });
  });

  describe("createAvailability", () => {
    it("should create availability for an existing tutor", async () => {
      const tutor = createMockUser({ id: "tut-1", role: UserRole.TUTOR });
      userRepo.findOne.mockResolvedValue(tutor);

      const dto = {
        tutorId: "tut-1",
        dayOfWeek: 1,
        startTime: "09:00",
        endTime: "17:00",
      };

      const result = await service.createAvailability(dto);
      expect(result).toBeDefined();
      expect(em.persistAndFlush).toHaveBeenCalled();
    });

    it("should throw NotFoundException if tutor not found", async () => {
      userRepo.findOne.mockResolvedValue(null);
      await expect(
        service.createAvailability({
          tutorId: "bad",
          dayOfWeek: 1,
          startTime: "09:00",
          endTime: "17:00",
        }),
      ).rejects.toThrow(NotFoundException);
    });
  });

  describe("updateAvailability", () => {
    it("should update availability", async () => {
      const avail = {
        id: "avail-1",
        dayOfWeek: 1,
        startTime: "09:00",
        endTime: "17:00",
      };
      availabilityRepo.findOne.mockResolvedValue(avail);

      await service.updateAvailability("avail-1", {
        startTime: "10:00",
      });
      expect(em.assign).toHaveBeenCalledWith(avail, { startTime: "10:00" });
      expect(em.flush).toHaveBeenCalled();
    });
  });

  describe("removeAvailability", () => {
    it("should remove availability and return confirmation", async () => {
      const avail = { id: "avail-1" };
      availabilityRepo.findOne.mockResolvedValue(avail);

      const result = await service.removeAvailability("avail-1");
      expect(result).toEqual({ id: "avail-1", deleted: true });
      expect(em.removeAndFlush).toHaveBeenCalledWith(avail);
    });

    it("should throw NotFoundException if availability not found", async () => {
      availabilityRepo.findOne.mockResolvedValue(null);
      await expect(service.removeAvailability("bad")).rejects.toThrow(
        NotFoundException,
      );
    });
  });

  // -----------------------------------------------------------------------
  // Attendance
  // -----------------------------------------------------------------------

  describe("createAttendance", () => {
    const appt = createMockAppointment();
    const student = createMockUser({ id: "stu-1", role: UserRole.STUDENT });

    it("should create attendance record", async () => {
      appointmentRepo.findOne.mockResolvedValue(appt);
      userRepo.findOne.mockResolvedValue(student);
      attendanceRepo.findOne.mockResolvedValue(null); // no existing

      const dto = {
        appointmentId: "appt-1",
        studentId: "stu-1",
        status: AttendanceStatus.PRESENT,
        notes: "On time",
        markedByTutor: true,
      };

      const result = await service.createAttendance(dto);
      expect(result).toBeDefined();
      expect(result.status).toBe(AttendanceStatus.PRESENT);
      expect(em.persistAndFlush).toHaveBeenCalled();
    });

    it("should throw NotFoundException if appointment not found", async () => {
      appointmentRepo.findOne.mockResolvedValue(null);
      await expect(
        service.createAttendance({
          appointmentId: "bad",
          studentId: "stu-1",
          status: AttendanceStatus.PRESENT,
        }),
      ).rejects.toThrow(NotFoundException);
    });

    it("should throw NotFoundException if student not found", async () => {
      appointmentRepo.findOne.mockResolvedValue(appt);
      userRepo.findOne.mockResolvedValue(null);
      await expect(
        service.createAttendance({
          appointmentId: "appt-1",
          studentId: "bad",
          status: AttendanceStatus.PRESENT,
        }),
      ).rejects.toThrow(NotFoundException);
    });

    it("should throw BadRequestException if attendance already exists", async () => {
      appointmentRepo.findOne.mockResolvedValue(appt);
      userRepo.findOne.mockResolvedValue(student);
      attendanceRepo.findOne.mockResolvedValue({ id: "att-existing" });

      await expect(
        service.createAttendance({
          appointmentId: "appt-1",
          studentId: "stu-1",
          status: AttendanceStatus.PRESENT,
        }),
      ).rejects.toThrow(BadRequestException);
    });
  });

  describe("findAttendanceByAppointment", () => {
    it("should query by appointment id", async () => {
      attendanceRepo.findOne.mockResolvedValue(null);
      await service.findAttendanceByAppointment("appt-1");
      expect(attendanceRepo.findOne).toHaveBeenCalledWith(
        { appointment: "appt-1" },
        expect.objectContaining({ populate: ["appointment", "student"] }),
      );
    });
  });

  describe("findAttendanceByStudent", () => {
    it("should query by student id", async () => {
      attendanceRepo.find.mockResolvedValue([]);
      await service.findAttendanceByStudent("stu-1");
      expect(attendanceRepo.find).toHaveBeenCalledWith(
        { student: "stu-1" },
        expect.objectContaining({ populate: ["appointment", "student"] }),
      );
    });
  });

  describe("updateAttendance", () => {
    it("should update attendance", async () => {
      const att = { id: "att-1", status: AttendanceStatus.PRESENT };
      attendanceRepo.findOne.mockResolvedValue(att);

      await service.updateAttendance("att-1", {
        status: AttendanceStatus.ABSENT,
      });
      expect(em.assign).toHaveBeenCalledWith(att, {
        status: AttendanceStatus.ABSENT,
      });
      expect(em.flush).toHaveBeenCalled();
    });

    it("should throw NotFoundException when attendance not found", async () => {
      attendanceRepo.findOne.mockResolvedValue(null);
      await expect(
        service.updateAttendance("bad", { status: AttendanceStatus.ABSENT }),
      ).rejects.toThrow(NotFoundException);
    });
  });

  // -----------------------------------------------------------------------
  // Class Reports
  // -----------------------------------------------------------------------

  describe("createClassReport", () => {
    const appt = createMockAppointment();
    const tutor = createMockUser({ id: "tut-1", role: UserRole.TUTOR });

    it("should create a class report", async () => {
      appointmentRepo.findOne.mockResolvedValue(appt);
      userRepo.findOne.mockResolvedValue(tutor);
      classReportRepo.findOne.mockResolvedValue(null); // no existing

      const dto = {
        appointmentId: "appt-1",
        tutorId: "tut-1",
        subject: "Past tense",
        content: "Covered regular verbs",
        homeworkAssigned: "Exercises 1-10",
        studentProgress: "Good",
        nextLessonNotes: "Irregular verbs",
      };

      const result = await service.createClassReport(dto);
      expect(result).toBeDefined();
      expect(result.subject).toBe("Past tense");
      expect(em.persistAndFlush).toHaveBeenCalled();
    });

    it("should throw NotFoundException if appointment not found", async () => {
      appointmentRepo.findOne.mockResolvedValue(null);
      await expect(
        service.createClassReport({
          appointmentId: "bad",
          tutorId: "tut-1",
          subject: "s",
          content: "c",
        }),
      ).rejects.toThrow(NotFoundException);
    });

    it("should throw NotFoundException if tutor not found", async () => {
      appointmentRepo.findOne.mockResolvedValue(appt);
      userRepo.findOne.mockResolvedValue(null);
      await expect(
        service.createClassReport({
          appointmentId: "appt-1",
          tutorId: "bad",
          subject: "s",
          content: "c",
        }),
      ).rejects.toThrow(NotFoundException);
    });

    it("should throw BadRequestException if report already exists", async () => {
      appointmentRepo.findOne.mockResolvedValue(appt);
      userRepo.findOne.mockResolvedValue(tutor);
      classReportRepo.findOne.mockResolvedValue({ id: "existing" });

      await expect(
        service.createClassReport({
          appointmentId: "appt-1",
          tutorId: "tut-1",
          subject: "s",
          content: "c",
        }),
      ).rejects.toThrow(BadRequestException);
    });
  });

  describe("findClassReportByAppointment", () => {
    it("should query by appointment id", async () => {
      classReportRepo.findOne.mockResolvedValue(null);
      await service.findClassReportByAppointment("appt-1");
      expect(classReportRepo.findOne).toHaveBeenCalledWith(
        { appointment: "appt-1" },
        expect.objectContaining({ populate: ["appointment", "tutor"] }),
      );
    });
  });

  describe("findClassReportsByTutor", () => {
    it("should query by tutor id", async () => {
      classReportRepo.find.mockResolvedValue([]);
      await service.findClassReportsByTutor("tut-1");
      expect(classReportRepo.find).toHaveBeenCalledWith(
        { tutor: "tut-1" },
        expect.objectContaining({ populate: ["appointment", "tutor"] }),
      );
    });
  });

  describe("updateClassReport", () => {
    it("should update class report", async () => {
      const report = { id: "rep-1", subject: "Old" };
      classReportRepo.findOne.mockResolvedValue(report);

      await service.updateClassReport("rep-1", { subject: "New" });
      expect(em.assign).toHaveBeenCalledWith(report, { subject: "New" });
      expect(em.flush).toHaveBeenCalled();
    });

    it("should throw NotFoundException when report not found", async () => {
      classReportRepo.findOne.mockResolvedValue(null);
      await expect(
        service.updateClassReport("bad", { subject: "New" }),
      ).rejects.toThrow(NotFoundException);
    });
  });

  describe("removeClassReport", () => {
    it("should remove class report and return confirmation", async () => {
      const report = { id: "rep-1" };
      classReportRepo.findOne.mockResolvedValue(report);

      const result = await service.removeClassReport("rep-1");
      expect(result).toEqual({ id: "rep-1", deleted: true });
      expect(em.removeAndFlush).toHaveBeenCalledWith(report);
    });

    it("should throw NotFoundException when report not found", async () => {
      classReportRepo.findOne.mockResolvedValue(null);
      await expect(service.removeClassReport("bad")).rejects.toThrow(
        NotFoundException,
      );
    });
  });

  // -----------------------------------------------------------------------
  // Scheduling stats
  // -----------------------------------------------------------------------

  describe("getSchedulingStats", () => {
    it("should return correct stats", async () => {
      const appt1 = createMockAppointment({
        status: AppointmentStatus.COMPLETED,
        startTime: new Date("2026-03-01T10:00:00Z"),
        endTime: new Date("2026-03-01T11:00:00Z"),
      });
      const appt2 = createMockAppointment({
        status: AppointmentStatus.SCHEDULED,
        startTime: new Date("2026-12-01T10:00:00Z"),
        endTime: new Date("2026-12-01T12:00:00Z"),
      });

      // upcoming appointments
      appointmentRepo.find.mockResolvedValueOnce([appt2]); // upcoming
      appointmentRepo.count.mockResolvedValueOnce(3); // completedThisMonth
      appointmentRepo.find.mockResolvedValueOnce([appt1]); // completed
      appointmentRepo.find.mockResolvedValueOnce([appt2]); // scheduled

      const result = await service.getSchedulingStats();
      expect(result).toHaveProperty("upcomingAppointments");
      expect(result).toHaveProperty("completedAppointmentsThisMonth", 3);
      expect(result).toHaveProperty("totalHoursTaught");
      expect(result).toHaveProperty("totalScheduledHours");
      expect(result).toHaveProperty("totalCompletedAppointments");
      expect(result).toHaveProperty("totalScheduledAppointments");
    });
  });

  // -----------------------------------------------------------------------
  // Attendance stats
  // -----------------------------------------------------------------------

  describe("getAttendanceStats", () => {
    it("should return stats with calculated attendance rate", async () => {
      attendanceRepo.count
        .mockResolvedValueOnce(10) // total
        .mockResolvedValueOnce(7) // present
        .mockResolvedValueOnce(2) // absent
        .mockResolvedValueOnce(1); // on_time_cancellation

      const result = await service.getAttendanceStats("stu-1");
      expect(result.totalAttendance).toBe(10);
      expect(result.presentCount).toBe(7);
      expect(result.absentCount).toBe(2);
      expect(result.onTimeCancellationCount).toBe(1);
      expect(result.attendanceRate).toBe(70);
    });

    it("should return 0% when no attendance records", async () => {
      attendanceRepo.count.mockResolvedValue(0);
      const result = await service.getAttendanceStats();
      expect(result.attendanceRate).toBe(0);
    });
  });
});
