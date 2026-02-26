import { Test, TestingModule } from "@nestjs/testing";
import { ConfigService } from "@nestjs/config";
import { getRepositoryToken } from "@mikro-orm/nestjs";
import { EntityManager } from "@mikro-orm/core";
import { EmailService } from "./email.service";
import { Appointment } from "../scheduling/entities/appointment.entity";
import { User } from "../users/entities/user.entity";
import {
  Transaction,
  PaymentMethod,
} from "../payments/entities/transaction.entity";

// Mock nodemailer
jest.mock("nodemailer", () => ({
  createTransport: jest.fn().mockReturnValue({
    sendMail: jest.fn().mockResolvedValue({ messageId: "test-id" }),
  }),
}));

describe("EmailService", () => {
  let service: EmailService;
  let mockTransporter: { sendMail: jest.Mock };
  let mockEm: Partial<EntityManager>;
  let mockAppointmentRepo: any;

  const mockConfigValues: Record<string, string> = {
    EMAIL_HOST: "smtp.test.com",
    EMAIL_PORT: "587",
    EMAIL_USER: "test@test.com",
    EMAIL_PASSWORD: "password",
    EMAIL_FROM: "noreply@spicyspanish.com",
    ADMIN_EMAIL: "admin@spicyspanish.com",
    FRONTEND_URL: "http://localhost:8008",
  };

  beforeEach(async () => {
    mockAppointmentRepo = {};
    mockEm = {
      find: jest.fn().mockResolvedValue([]),
      findOne: jest.fn().mockResolvedValue(null),
      flush: jest.fn().mockResolvedValue(undefined),
      fork: jest.fn(),
    };
    // fork returns itself for simplicity
    (mockEm.fork as jest.Mock).mockReturnValue(mockEm);

    const module: TestingModule = await Test.createTestingModule({
      providers: [
        EmailService,
        {
          provide: ConfigService,
          useValue: {
            get: jest.fn((key: string) => mockConfigValues[key]),
          },
        },
        {
          provide: getRepositoryToken(Appointment),
          useValue: mockAppointmentRepo,
        },
        {
          provide: EntityManager,
          useValue: mockEm,
        },
      ],
    }).compile();

    service = module.get<EmailService>(EmailService);

    // Get the mocked transporter
    mockTransporter = (service as any).transporter;
  });

  afterEach(() => {
    jest.clearAllMocks();
  });

  it("should be defined", () => {
    expect(service).toBeDefined();
  });

  describe("sendNewStudentRegistrationEmail", () => {
    it("should send registration notification to admin", async () => {
      const student = {
        fullName: "John Doe",
        email: "john@test.com",
        firstName: "John",
      } as User;

      await service.sendNewStudentRegistrationEmail(student);

      expect(mockTransporter.sendMail).toHaveBeenCalledWith(
        expect.objectContaining({
          from: "noreply@spicyspanish.com",
          to: "admin@spicyspanish.com",
          subject: "New Student Registration - Spicy Spanish",
        }),
      );
      expect(mockTransporter.sendMail).toHaveBeenCalledWith(
        expect.objectContaining({
          html: expect.stringContaining("John Doe"),
        }),
      );
    });
  });

  describe("sendTutorInvitation", () => {
    it("should send invitation email with correct link", async () => {
      await service.sendTutorInvitation("tutor@test.com", "abc123");

      expect(mockTransporter.sendMail).toHaveBeenCalledWith(
        expect.objectContaining({
          to: "tutor@test.com",
          subject: "Invitation to Join Spicy Spanish as a Tutor",
          html: expect.stringContaining("abc123"),
        }),
      );
    });
  });

  describe("sendPasswordResetEmail", () => {
    it("should send reset email with correct link", async () => {
      const user = {
        firstName: "Jane",
        email: "jane@test.com",
      } as User;

      await service.sendPasswordResetEmail(user, "reset-token-123");

      expect(mockTransporter.sendMail).toHaveBeenCalledWith(
        expect.objectContaining({
          to: "jane@test.com",
          subject: "Password Reset - Spicy Spanish",
          html: expect.stringContaining("reset-token-123"),
        }),
      );
    });
  });

  describe("sendClassReminder", () => {
    it("should send reminder to student", async () => {
      const appointment = {
        students: {
          getItems: () => [{ firstName: "John", email: "john@test.com" }],
        },
        tutor: { fullName: "Maria Garcia" },
        startTime: new Date("2026-03-01T14:00:00Z"),
        endTime: new Date("2026-03-01T15:00:00Z"),
      } as unknown as Appointment;

      await service.sendClassReminder(appointment);

      expect(mockTransporter.sendMail).toHaveBeenCalledWith(
        expect.objectContaining({
          to: "john@test.com",
          subject: "Reminder: Your Spanish Class is in 1 Hour",
          html: expect.stringContaining("John"),
        }),
      );
    });
  });

  describe("sendPaymentNotification", () => {
    it("should send payment notification to admin", async () => {
      const transaction = {
        student: { fullName: "John Doe", email: "john@test.com" },
        amountUsd: 230,
        hours: 10,
        paymentMethod: PaymentMethod.CREDIT_CARD,
        createdAt: new Date("2026-02-20"),
      } as Transaction;

      await service.sendPaymentNotification(transaction);

      expect(mockTransporter.sendMail).toHaveBeenCalledWith(
        expect.objectContaining({
          to: "admin@spicyspanish.com",
          subject: "New Payment Received - Spicy Spanish",
          html: expect.stringContaining("John Doe"),
        }),
      );
    });
  });

  describe("sendClassConfirmationEmail", () => {
    it("should send confirmation to both student and tutor", async () => {
      const appointment = {
        students: {
          getItems: () => [
            { firstName: "John", fullName: "John Doe", email: "john@test.com" },
          ],
        },
        tutor: {
          firstName: "Maria",
          fullName: "Maria Garcia",
          email: "maria@test.com",
        },
        startTime: new Date("2026-03-01T14:00:00Z"),
        endTime: new Date("2026-03-01T15:00:00Z"),
      } as unknown as Appointment;

      await service.sendClassConfirmationEmail(appointment);

      expect(mockTransporter.sendMail).toHaveBeenCalledTimes(2);
      expect(mockTransporter.sendMail).toHaveBeenCalledWith(
        expect.objectContaining({
          to: "john@test.com",
          subject: "Your Spanish Class is Confirmed - Spicy Spanish",
        }),
      );
      expect(mockTransporter.sendMail).toHaveBeenCalledWith(
        expect.objectContaining({
          to: "maria@test.com",
          subject: "New Spanish Class Scheduled - Spicy Spanish",
        }),
      );
    });
  });

  describe("sendClassCancellationEmail", () => {
    it("should send cancellation to both student and tutor", async () => {
      const appointment = {
        students: {
          getItems: () => [
            { firstName: "John", fullName: "John Doe", email: "john@test.com" },
          ],
        },
        tutor: {
          firstName: "Maria",
          fullName: "Maria Garcia",
          email: "maria@test.com",
        },
        startTime: new Date("2026-03-01T14:00:00Z"),
        endTime: new Date("2026-03-01T15:00:00Z"),
      } as unknown as Appointment;

      await service.sendClassCancellationEmail(appointment);

      expect(mockTransporter.sendMail).toHaveBeenCalledTimes(2);
      expect(mockTransporter.sendMail).toHaveBeenCalledWith(
        expect.objectContaining({ to: "john@test.com" }),
      );
      expect(mockTransporter.sendMail).toHaveBeenCalledWith(
        expect.objectContaining({ to: "maria@test.com" }),
      );
    });
  });

  describe("sendContactEmail", () => {
    it("should send contact form email to admin with replyTo", async () => {
      await service.sendContactEmail(
        "Visitor",
        "visitor@test.com",
        "Question",
        "Hello there",
      );

      expect(mockTransporter.sendMail).toHaveBeenCalledWith(
        expect.objectContaining({
          to: "admin@spicyspanish.com",
          replyTo: "visitor@test.com",
          subject: "Contact Form: Question - Spicy Spanish",
          html: expect.stringContaining("Visitor"),
        }),
      );
    });
  });

  describe("sendScheduledReminders", () => {
    it("should find and send reminders for upcoming appointments", async () => {
      const mockAppointment = {
        id: "apt-1",
        students: {
          getItems: () => [{ firstName: "John", email: "john@test.com" }],
        },
        tutor: { fullName: "Maria Garcia" },
        startTime: new Date(),
        endTime: new Date(),
        reminderSent: false,
      };

      (mockEm.find as jest.Mock)
        .mockResolvedValueOnce([mockAppointment]) // 1-hour reminders
        .mockResolvedValueOnce([]); // 24-hour reminders

      (mockEm.findOne as jest.Mock).mockResolvedValue(mockAppointment);

      await service.sendScheduledReminders();

      expect(mockTransporter.sendMail).toHaveBeenCalledTimes(1);
      expect(mockAppointment.reminderSent).toBe(true);
    });

    it("should handle send failures gracefully", async () => {
      const mockAppointment = {
        id: "apt-1",
        students: {
          getItems: () => [{ firstName: "John", email: "john@test.com" }],
        },
        tutor: { fullName: "Maria Garcia" },
        startTime: new Date(),
        endTime: new Date(),
        reminderSent: false,
      };

      (mockEm.find as jest.Mock)
        .mockResolvedValueOnce([mockAppointment])
        .mockResolvedValueOnce([]);

      mockTransporter.sendMail.mockRejectedValueOnce(new Error("SMTP error"));

      // Should not throw
      await expect(service.sendScheduledReminders()).resolves.not.toThrow();
    });
  });
});
