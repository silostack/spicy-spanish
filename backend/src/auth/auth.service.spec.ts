import { Test, TestingModule } from "@nestjs/testing";
import { JwtService } from "@nestjs/jwt";
import {
  UnauthorizedException,
  ConflictException,
  NotFoundException,
} from "@nestjs/common";
import { EntityManager } from "@mikro-orm/core";
import { AuthService } from "./auth.service";
import { EmailService } from "../email/email.service";
import { User, UserRole } from "../users/entities/user.entity";
import { RegisterTutorDirectDto } from "./dto/register-tutor-direct.dto";
import * as bcrypt from "bcrypt";

jest.mock("bcrypt", () => ({
  compare: jest.fn(),
  hash: jest.fn(),
}));

jest.mock("uuid", () => ({
  v4: jest.fn(() => "mock-uuid-token"),
}));

describe("AuthService", () => {
  let service: AuthService;
  let em: jest.Mocked<EntityManager>;
  let jwtService: jest.Mocked<JwtService>;
  let emailService: jest.Mocked<EmailService>;

  const mockUser = (): User => {
    const user = new User(
      "John",
      "Doe",
      "john@example.com",
      "hashed-password",
      UserRole.STUDENT,
    );
    // Override the auto-generated id with a deterministic one
    user.id = "user-id-123";
    return user;
  };

  beforeEach(async () => {
    const module: TestingModule = await Test.createTestingModule({
      providers: [
        AuthService,
        {
          provide: EntityManager,
          useValue: {
            findOne: jest.fn(),
            persistAndFlush: jest.fn(),
            flush: jest.fn(),
          },
        },
        {
          provide: JwtService,
          useValue: {
            sign: jest.fn().mockReturnValue("mock-jwt-token"),
          },
        },
        {
          provide: EmailService,
          useValue: {
            sendNewStudentRegistrationEmail: jest
              .fn()
              .mockResolvedValue(undefined),
            sendTutorInvitation: jest.fn().mockResolvedValue(undefined),
            sendPasswordResetEmail: jest.fn().mockResolvedValue(undefined),
          },
        },
      ],
    }).compile();

    service = module.get<AuthService>(AuthService);
    em = module.get(EntityManager);
    jwtService = module.get(JwtService);
    emailService = module.get(EmailService);

    jest.clearAllMocks();
  });

  it("should be defined", () => {
    expect(service).toBeDefined();
  });

  // ---------------------------------------------------------------------------
  // validateUser
  // ---------------------------------------------------------------------------
  describe("validateUser", () => {
    it("should return user data without password when credentials are valid", async () => {
      const user = mockUser();
      em.findOne.mockResolvedValue(user);
      (bcrypt.compare as jest.Mock).mockResolvedValue(true);

      const result = await service.validateUser(
        "john@example.com",
        "correct-password",
      );

      expect(em.findOne).toHaveBeenCalledWith(User, {
        email: "john@example.com",
      });
      expect(bcrypt.compare).toHaveBeenCalledWith(
        "correct-password",
        "hashed-password",
      );
      expect(result).toBeDefined();
      expect(result.email).toBe("john@example.com");
      expect(result.firstName).toBe("John");
      expect(result).not.toHaveProperty("password");
    });

    it("should return null when user is not found", async () => {
      em.findOne.mockResolvedValue(null);

      const result = await service.validateUser(
        "unknown@example.com",
        "password",
      );

      expect(result).toBeNull();
      expect(bcrypt.compare).not.toHaveBeenCalled();
    });

    it("should return null when password is invalid", async () => {
      const user = mockUser();
      em.findOne.mockResolvedValue(user);
      (bcrypt.compare as jest.Mock).mockResolvedValue(false);

      const result = await service.validateUser(
        "john@example.com",
        "wrong-password",
      );

      expect(result).toBeNull();
    });
  });

  // ---------------------------------------------------------------------------
  // login
  // ---------------------------------------------------------------------------
  describe("login", () => {
    it("should return access_token and user on valid credentials", async () => {
      const user = mockUser();
      em.findOne.mockResolvedValue(user);
      (bcrypt.compare as jest.Mock).mockResolvedValue(true);

      const result = await service.login({
        email: "john@example.com",
        password: "correct-password",
      });

      expect(result.access_token).toBe("mock-jwt-token");
      expect(result.user).toEqual({
        id: "user-id-123",
        email: "john@example.com",
        firstName: "John",
        lastName: "Doe",
        role: UserRole.STUDENT,
      });
      expect(jwtService.sign).toHaveBeenCalledWith({
        sub: "user-id-123",
        email: "john@example.com",
        role: UserRole.STUDENT,
      });
    });

    it("should throw UnauthorizedException on invalid credentials", async () => {
      em.findOne.mockResolvedValue(null);

      await expect(
        service.login({ email: "bad@example.com", password: "wrong" }),
      ).rejects.toThrow(UnauthorizedException);
    });

    it("should throw UnauthorizedException when password is wrong", async () => {
      const user = mockUser();
      em.findOne.mockResolvedValue(user);
      (bcrypt.compare as jest.Mock).mockResolvedValue(false);

      await expect(
        service.login({ email: "john@example.com", password: "wrong" }),
      ).rejects.toThrow(UnauthorizedException);
    });
  });

  // ---------------------------------------------------------------------------
  // registerStudent
  // ---------------------------------------------------------------------------
  describe("registerStudent", () => {
    const dto = {
      firstName: "Jane",
      lastName: "Smith",
      email: "jane@example.com",
      password: "securepass",
      timezone: "America/New_York",
      phoneNumber: "+1234567890",
    };

    it("should register a new student and return user without password", async () => {
      em.findOne.mockResolvedValue(null);
      (bcrypt.hash as jest.Mock).mockResolvedValue("hashed-new-password");

      const result = await service.registerStudent(dto);

      expect(em.findOne).toHaveBeenCalledWith(User, {
        email: "jane@example.com",
      });
      expect(bcrypt.hash).toHaveBeenCalledWith("securepass", 10);
      expect(em.persistAndFlush).toHaveBeenCalled();
      expect(result.email).toBe("jane@example.com");
      expect(result.firstName).toBe("Jane");
      expect(result.lastName).toBe("Smith");
      expect(result).not.toHaveProperty("password");
    });

    it("should set timezone and phoneNumber on the new user", async () => {
      em.findOne.mockResolvedValue(null);
      (bcrypt.hash as jest.Mock).mockResolvedValue("hashed");

      await service.registerStudent(dto);

      const persistedUser = (em.persistAndFlush as jest.Mock).mock
        .calls[0][0] as User;
      expect(persistedUser.timezone).toBe("America/New_York");
      expect(persistedUser.phoneNumber).toBe("+1234567890");
      expect(persistedUser.role).toBe(UserRole.STUDENT);
    });

    it("should throw ConflictException if email already exists", async () => {
      em.findOne.mockResolvedValue(mockUser());

      await expect(service.registerStudent(dto)).rejects.toThrow(
        ConflictException,
      );
      expect(em.persistAndFlush).not.toHaveBeenCalled();
    });

    it("should send registration email after creating the user", async () => {
      em.findOne.mockResolvedValue(null);
      (bcrypt.hash as jest.Mock).mockResolvedValue("hashed");

      await service.registerStudent(dto);

      expect(
        emailService.sendNewStudentRegistrationEmail,
      ).toHaveBeenCalledTimes(1);
    });

    it("should not fail registration when email sending fails", async () => {
      em.findOne.mockResolvedValue(null);
      (bcrypt.hash as jest.Mock).mockResolvedValue("hashed");
      emailService.sendNewStudentRegistrationEmail.mockRejectedValue(
        new Error("SMTP down"),
      );

      const result = await service.registerStudent(dto);

      expect(result.email).toBe("jane@example.com");
      expect(em.persistAndFlush).toHaveBeenCalled();
    });
  });

  // ---------------------------------------------------------------------------
  // registerTutor
  // ---------------------------------------------------------------------------
  describe("registerTutor", () => {
    const dto = {
      token: "valid-invitation-token",
      firstName: "Carlos",
      lastName: "Garcia",
      password: "tutorpass123",
      timezone: "Europe/Madrid",
      phoneNumber: "+34600000000",
      bio: "Native Spanish speaker",
    };

    it("should complete tutor registration with valid invitation token", async () => {
      const tutorUser = new User(
        "",
        "",
        "tutor@example.com",
        "",
        UserRole.TUTOR,
      );
      tutorUser.invitationToken = "valid-invitation-token";
      em.findOne.mockResolvedValue(tutorUser);
      (bcrypt.hash as jest.Mock).mockResolvedValue("hashed-tutor-pass");

      const result = await service.registerTutor(dto);

      expect(em.findOne).toHaveBeenCalledWith(User, {
        invitationToken: "valid-invitation-token",
      });
      expect(tutorUser.firstName).toBe("Carlos");
      expect(tutorUser.lastName).toBe("Garcia");
      expect(tutorUser.bio).toBe("Native Spanish speaker");
      expect(tutorUser.invitationToken).toBeNull();
      expect(em.flush).toHaveBeenCalled();
      expect(result).not.toHaveProperty("password");
      expect(result.email).toBe("tutor@example.com");
    });

    it("should throw NotFoundException for invalid invitation token", async () => {
      em.findOne.mockResolvedValue(null);

      await expect(service.registerTutor(dto)).rejects.toThrow(
        NotFoundException,
      );
    });

    it("should throw NotFoundException if user found is not a tutor", async () => {
      const studentUser = new User(
        "",
        "",
        "student@example.com",
        "",
        UserRole.STUDENT,
      );
      studentUser.invitationToken = "valid-invitation-token";
      em.findOne.mockResolvedValue(studentUser);

      await expect(service.registerTutor(dto)).rejects.toThrow(
        NotFoundException,
      );
    });
  });

  // ---------------------------------------------------------------------------
  // forgotPassword
  // ---------------------------------------------------------------------------
  describe("forgotPassword", () => {
    it("should set reset token and send email when user exists", async () => {
      const user = mockUser();
      em.findOne.mockResolvedValue(user);

      const result = await service.forgotPassword("john@example.com");

      expect(user.resetPasswordToken).toBe("mock-uuid-token");
      expect(user.resetPasswordExpires).toBeInstanceOf(Date);
      expect(em.flush).toHaveBeenCalled();
      expect(emailService.sendPasswordResetEmail).toHaveBeenCalledWith(
        user,
        "mock-uuid-token",
      );
      expect(result.message).toContain("reset link has been sent");
    });

    it("should return same message when user does not exist (no email enumeration)", async () => {
      em.findOne.mockResolvedValue(null);

      const result = await service.forgotPassword("nobody@example.com");

      expect(result.message).toContain("reset link has been sent");
      expect(em.flush).not.toHaveBeenCalled();
      expect(emailService.sendPasswordResetEmail).not.toHaveBeenCalled();
    });

    it("should not fail when email sending fails", async () => {
      const user = mockUser();
      em.findOne.mockResolvedValue(user);
      emailService.sendPasswordResetEmail.mockRejectedValue(
        new Error("SMTP error"),
      );

      const result = await service.forgotPassword("john@example.com");

      expect(result.message).toContain("reset link has been sent");
    });
  });

  // ---------------------------------------------------------------------------
  // resetPassword
  // ---------------------------------------------------------------------------
  describe("resetPassword", () => {
    it("should reset password with valid, non-expired token", async () => {
      const user = mockUser();
      user.resetPasswordToken = "valid-token";
      user.resetPasswordExpires = new Date(Date.now() + 3600_000);
      em.findOne.mockResolvedValue(user);
      (bcrypt.hash as jest.Mock).mockResolvedValue("new-hashed-password");

      const result = await service.resetPassword("valid-token", "newpass1234");

      expect(bcrypt.hash).toHaveBeenCalledWith("newpass1234", 10);
      expect(user.password).toBe("new-hashed-password");
      expect(user.resetPasswordToken).toBeNull();
      expect(user.resetPasswordExpires).toBeNull();
      expect(em.flush).toHaveBeenCalled();
      expect(result.message).toContain("reset successfully");
    });

    it("should throw UnauthorizedException for invalid or expired token", async () => {
      em.findOne.mockResolvedValue(null);

      await expect(
        service.resetPassword("bad-token", "newpass"),
      ).rejects.toThrow(UnauthorizedException);
    });
  });

  // ---------------------------------------------------------------------------
  // createTutorInvitation
  // ---------------------------------------------------------------------------
  describe("createTutorInvitation", () => {
    it("should create a tutor placeholder and send invitation email", async () => {
      em.findOne.mockResolvedValue(null);

      const result = await service.createTutorInvitation(
        "newtutor@example.com",
      );

      expect(em.persistAndFlush).toHaveBeenCalled();
      const persistedUser = (em.persistAndFlush as jest.Mock).mock
        .calls[0][0] as User;
      expect(persistedUser.role).toBe(UserRole.TUTOR);
      expect(persistedUser.email).toBe("newtutor@example.com");
      expect(persistedUser.invitationToken).toBe("mock-uuid-token");
      expect(emailService.sendTutorInvitation).toHaveBeenCalledWith(
        "newtutor@example.com",
        "mock-uuid-token",
      );
      expect(result.message).toContain("Invitation sent");
    });

    it("should throw ConflictException if email already exists", async () => {
      em.findOne.mockResolvedValue(mockUser());

      await expect(
        service.createTutorInvitation("john@example.com"),
      ).rejects.toThrow(ConflictException);
      expect(em.persistAndFlush).not.toHaveBeenCalled();
    });

    it("should not fail when invitation email sending fails", async () => {
      em.findOne.mockResolvedValue(null);
      emailService.sendTutorInvitation.mockRejectedValue(
        new Error("SMTP error"),
      );

      const result = await service.createTutorInvitation(
        "newtutor@example.com",
      );

      expect(result.message).toContain("Invitation sent");
      expect(em.persistAndFlush).toHaveBeenCalled();
    });
  });

  // ---------------------------------------------------------------------------
  // registerTutorDirect
  // ---------------------------------------------------------------------------
  describe("registerTutorDirect", () => {
    const dto: RegisterTutorDirectDto = {
      firstName: "Maria",
      lastName: "Lopez",
      email: "maria@example.com",
      password: "tutorpass123",
      timezone: "Europe/Madrid",
      phoneNumber: "+34600000000",
    };

    it("should create a tutor account and return user without password", async () => {
      em.findOne.mockResolvedValue(null);
      (bcrypt.hash as jest.Mock).mockResolvedValue("hashed-tutor-pass");

      const result = await service.registerTutorDirect(dto);

      expect(em.findOne).toHaveBeenCalledWith(User, {
        email: "maria@example.com",
      });
      expect(bcrypt.hash).toHaveBeenCalledWith("tutorpass123", 10);
      expect(em.persistAndFlush).toHaveBeenCalled();
      expect(result.email).toBe("maria@example.com");
      expect(result.firstName).toBe("Maria");
      expect(result.lastName).toBe("Lopez");
      expect(result).not.toHaveProperty("password");
    });

    it("should set role to TUTOR, isActive true, no invitationToken", async () => {
      em.findOne.mockResolvedValue(null);
      (bcrypt.hash as jest.Mock).mockResolvedValue("hashed");

      await service.registerTutorDirect(dto);

      const persistedUser = (em.persistAndFlush as jest.Mock).mock
        .calls[0][0] as User;
      expect(persistedUser.role).toBe(UserRole.TUTOR);
      expect(persistedUser.isActive).toBe(true);
      expect(persistedUser.invitationToken).toBeUndefined();
    });

    it("should set timezone and phoneNumber on the new user", async () => {
      em.findOne.mockResolvedValue(null);
      (bcrypt.hash as jest.Mock).mockResolvedValue("hashed");

      await service.registerTutorDirect(dto);

      const persistedUser = (em.persistAndFlush as jest.Mock).mock
        .calls[0][0] as User;
      expect(persistedUser.timezone).toBe("Europe/Madrid");
      expect(persistedUser.phoneNumber).toBe("+34600000000");
    });

    it("should throw ConflictException if email already in use", async () => {
      em.findOne.mockResolvedValue(mockUser());

      await expect(service.registerTutorDirect(dto)).rejects.toThrow(
        ConflictException,
      );
      expect(em.persistAndFlush).not.toHaveBeenCalled();
    });
  });
});
