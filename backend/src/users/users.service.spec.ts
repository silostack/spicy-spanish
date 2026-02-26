import { Test, TestingModule } from '@nestjs/testing';
import { getRepositoryToken } from '@mikro-orm/nestjs';
import { EntityManager, EntityRepository } from '@mikro-orm/core';
import { NotFoundException, ConflictException } from '@nestjs/common';
import { UsersService } from './users.service';
import { User, UserRole } from './entities/user.entity';
import { Transaction, TransactionStatus } from '../payments/entities/transaction.entity';
import { Appointment } from '../scheduling/entities/appointment.entity';
import * as bcrypt from 'bcrypt';

jest.mock('bcrypt');

describe('UsersService', () => {
  let service: UsersService;
  let userRepository: jest.Mocked<EntityRepository<User>>;
  let em: jest.Mocked<EntityManager>;

  const mockUser = (overrides: Partial<User> = {}): User => {
    const user = Object.assign(Object.create(User.prototype), {
      id: 'user-1',
      firstName: 'John',
      lastName: 'Doe',
      email: 'john@example.com',
      password: 'hashed-password',
      role: UserRole.STUDENT,
      isActive: true,
      createdAt: new Date('2026-01-15'),
      updatedAt: new Date('2026-01-15'),
      ...overrides,
    });
    return user;
  };

  beforeEach(async () => {
    const mockUserRepository = {
      find: jest.fn(),
      findOne: jest.fn(),
      findAndCount: jest.fn(),
      count: jest.fn(),
    };

    const mockEntityManager = {
      assign: jest.fn(),
      flush: jest.fn(),
      removeAndFlush: jest.fn(),
      find: jest.fn(),
      findOne: jest.fn(),
      count: jest.fn(),
    };

    const module: TestingModule = await Test.createTestingModule({
      providers: [
        UsersService,
        {
          provide: getRepositoryToken(User),
          useValue: mockUserRepository,
        },
        {
          provide: EntityManager,
          useValue: mockEntityManager,
        },
      ],
    }).compile();

    service = module.get<UsersService>(UsersService);
    userRepository = module.get(getRepositoryToken(User));
    em = module.get(EntityManager);
  });

  afterEach(() => {
    jest.clearAllMocks();
  });

  describe('findAll', () => {
    it('should return all users ordered by createdAt DESC when no role is provided', async () => {
      const users = [mockUser(), mockUser({ id: 'user-2', email: 'jane@example.com' })];
      userRepository.find.mockResolvedValue(users);

      const result = await service.findAll();

      expect(userRepository.find).toHaveBeenCalledWith({}, { orderBy: { createdAt: 'DESC' } });
      expect(result).toEqual(users);
    });

    it('should filter by role when role is provided', async () => {
      const students = [mockUser()];
      userRepository.find.mockResolvedValue(students);

      const result = await service.findAll(UserRole.STUDENT);

      expect(userRepository.find).toHaveBeenCalledWith(
        { role: UserRole.STUDENT },
        { orderBy: { createdAt: 'DESC' } },
      );
      expect(result).toEqual(students);
    });

    it('should return empty array when no users exist', async () => {
      userRepository.find.mockResolvedValue([]);

      const result = await service.findAll();

      expect(result).toEqual([]);
    });
  });

  describe('findOne', () => {
    it('should return a user when found', async () => {
      const user = mockUser();
      userRepository.findOne.mockResolvedValue(user);

      const result = await service.findOne('user-1');

      expect(userRepository.findOne).toHaveBeenCalledWith({ id: 'user-1' });
      expect(result).toEqual(user);
    });

    it('should throw NotFoundException when user is not found', async () => {
      userRepository.findOne.mockResolvedValue(null);

      await expect(service.findOne('nonexistent')).rejects.toThrow(NotFoundException);
      await expect(service.findOne('nonexistent')).rejects.toThrow(
        'User with ID nonexistent not found',
      );
    });
  });

  describe('findByEmail', () => {
    it('should return a user when found by email', async () => {
      const user = mockUser();
      userRepository.findOne.mockResolvedValue(user);

      const result = await service.findByEmail('john@example.com');

      expect(userRepository.findOne).toHaveBeenCalledWith({ email: 'john@example.com' });
      expect(result).toEqual(user);
    });

    it('should return null when email is not found', async () => {
      userRepository.findOne.mockResolvedValue(null);

      const result = await service.findByEmail('nonexistent@example.com');

      expect(result).toBeNull();
    });
  });

  describe('update', () => {
    it('should update a user and return the updated user', async () => {
      const user = mockUser();
      // First call: findOne in this.findOne(id)
      userRepository.findOne.mockResolvedValueOnce(user);

      const updateData = { firstName: 'Jane' };
      em.assign.mockImplementation((target, data) => Object.assign(target, data));

      const result = await service.update('user-1', updateData);

      expect(em.assign).toHaveBeenCalledWith(user, updateData);
      expect(em.flush).toHaveBeenCalled();
      expect(result).toEqual(user);
    });

    it('should hash the password when updating password', async () => {
      const user = mockUser();
      userRepository.findOne.mockResolvedValueOnce(user);
      (bcrypt.hash as jest.Mock).mockResolvedValue('new-hashed-password');

      const updateData = { password: 'newpassword123' };

      await service.update('user-1', updateData);

      expect(bcrypt.hash).toHaveBeenCalledWith('newpassword123', 10);
      expect(em.assign).toHaveBeenCalledWith(user, { password: 'new-hashed-password' });
    });

    it('should check email uniqueness when updating email', async () => {
      const user = mockUser();
      // findOne for the user being updated
      userRepository.findOne.mockResolvedValueOnce(user);
      // findByEmail check returns null (email available)
      userRepository.findOne.mockResolvedValueOnce(null);

      const updateData = { email: 'newemail@example.com' };

      await service.update('user-1', updateData);

      // Second call should be the email check
      expect(userRepository.findOne).toHaveBeenCalledWith({ email: 'newemail@example.com' });
      expect(em.assign).toHaveBeenCalled();
    });

    it('should throw ConflictException when email is already in use', async () => {
      const user = mockUser();
      const existingUser = mockUser({ id: 'user-2', email: 'existing@example.com' });

      // findOne for the user being updated
      userRepository.findOne.mockResolvedValueOnce(user);
      // findByEmail check returns an existing user
      userRepository.findOne.mockResolvedValueOnce(existingUser);

      await expect(
        service.update('user-1', { email: 'existing@example.com' }),
      ).rejects.toThrow(ConflictException);
    });

    it('should not check email uniqueness when email is the same', async () => {
      const user = mockUser({ email: 'john@example.com' });
      userRepository.findOne.mockResolvedValueOnce(user);

      await service.update('user-1', { email: 'john@example.com' });

      // findOne should be called only once (for the user lookup)
      expect(userRepository.findOne).toHaveBeenCalledTimes(1);
    });

    it('should throw NotFoundException when user to update is not found', async () => {
      userRepository.findOne.mockResolvedValue(null);

      await expect(service.update('nonexistent', { firstName: 'X' })).rejects.toThrow(
        NotFoundException,
      );
    });
  });

  describe('remove', () => {
    it('should remove a user and return confirmation', async () => {
      const user = mockUser();
      userRepository.findOne.mockResolvedValue(user);

      const result = await service.remove('user-1');

      expect(em.removeAndFlush).toHaveBeenCalledWith(user);
      expect(result).toEqual({ id: 'user-1', deleted: true });
    });

    it('should throw NotFoundException when user to remove is not found', async () => {
      userRepository.findOne.mockResolvedValue(null);

      await expect(service.remove('nonexistent')).rejects.toThrow(NotFoundException);
    });
  });

  describe('getTutors', () => {
    it('should return all users with TUTOR role', async () => {
      const tutors = [mockUser({ id: 'tutor-1', role: UserRole.TUTOR })];
      userRepository.find.mockResolvedValue(tutors);

      const result = await service.getTutors();

      expect(userRepository.find).toHaveBeenCalledWith(
        { role: UserRole.TUTOR },
        { orderBy: { createdAt: 'DESC' } },
      );
      expect(result).toEqual(tutors);
    });
  });

  describe('countUsers', () => {
    it('should return aggregated user counts', async () => {
      userRepository.count
        .mockResolvedValueOnce(50) // totalStudents
        .mockResolvedValueOnce(10) // totalTutors
        .mockResolvedValueOnce(50) // activeStudents
        .mockResolvedValueOnce(5); // newUsersThisMonth

      const result = await service.countUsers();

      expect(result).toEqual({
        totalStudents: 50,
        totalTutors: 10,
        activeStudents: 50,
        newUsersThisMonth: 5,
        total: 60,
      });

      expect(userRepository.count).toHaveBeenCalledTimes(4);
      // First call: totalStudents
      expect(userRepository.count).toHaveBeenCalledWith({ role: UserRole.STUDENT });
      // Second call: totalTutors
      expect(userRepository.count).toHaveBeenCalledWith({ role: UserRole.TUTOR });
    });
  });

  describe('getStudentsWithPagination', () => {
    it('should return paginated students with defaults', async () => {
      const students = [mockUser()];
      userRepository.findAndCount.mockResolvedValue([students, 1]);
      em.count.mockResolvedValue(1);
      em.find.mockResolvedValue([{ hours: 5 } as any]);
      em.findOne.mockResolvedValue(null);

      const result = await service.getStudentsWithPagination();

      expect(userRepository.findAndCount).toHaveBeenCalledWith(
        { role: UserRole.STUDENT },
        { orderBy: { createdAt: 'DESC' }, limit: 10, offset: 0 },
      );
      expect(result.items).toHaveLength(1);
      expect(result.total).toBe(1);
      expect(result.page).toBe(1);
      expect(result.limit).toBe(10);
      expect(result.totalPages).toBe(1);
    });

    it('should apply search filter with $or clause', async () => {
      userRepository.findAndCount.mockResolvedValue([[], 0]);

      await service.getStudentsWithPagination({ search: 'john' });

      const calledCriteria = userRepository.findAndCount.mock.calls[0][0] as any;
      expect(calledCriteria.$or).toEqual([
        { firstName: { $ilike: '%john%' } },
        { lastName: { $ilike: '%john%' } },
        { email: { $ilike: '%john%' } },
      ]);
    });

    it('should apply active filter', async () => {
      userRepository.findAndCount.mockResolvedValue([[], 0]);

      await service.getStudentsWithPagination({ filter: 'active' });

      const calledCriteria = userRepository.findAndCount.mock.calls[0][0] as any;
      expect(calledCriteria.isActive).toBe(true);
    });

    it('should apply inactive filter', async () => {
      userRepository.findAndCount.mockResolvedValue([[], 0]);

      await service.getStudentsWithPagination({ filter: 'inactive' });

      const calledCriteria = userRepository.findAndCount.mock.calls[0][0] as any;
      expect(calledCriteria.isActive).toBe(false);
    });

    it('should apply new filter with createdAt >= first of month', async () => {
      userRepository.findAndCount.mockResolvedValue([[], 0]);

      await service.getStudentsWithPagination({ filter: 'new' });

      const calledCriteria = userRepository.findAndCount.mock.calls[0][0] as any;
      expect(calledCriteria.createdAt).toBeDefined();
      expect(calledCriteria.createdAt.$gte).toBeInstanceOf(Date);
    });

    it('should handle pagination offset correctly', async () => {
      userRepository.findAndCount.mockResolvedValue([[], 0]);

      await service.getStudentsWithPagination({ page: 3, limit: 5 });

      expect(userRepository.findAndCount).toHaveBeenCalledWith(
        expect.any(Object),
        expect.objectContaining({ limit: 5, offset: 10 }),
      );
    });

    it('should filter by tutorId when provided', async () => {
      const student = mockUser();
      em.find.mockImplementation((entity: any, criteria: any, options?: any) => {
        if (entity === Appointment && criteria?.tutor === 'tutor-1') {
          return Promise.resolve([
            { students: { getItems: () => [{ id: 'user-1' }] } },
          ]);
        }
        // transactions
        return Promise.resolve([]);
      });
      userRepository.findAndCount.mockResolvedValue([[student], 1]);
      em.count.mockResolvedValue(0);
      em.findOne.mockResolvedValue(null);

      const result = await service.getStudentsWithPagination({ tutorId: 'tutor-1' });

      expect(em.find).toHaveBeenCalledWith(
        Appointment,
        { tutor: 'tutor-1' },
        { populate: ['students'] },
      );
      expect(result.items).toHaveLength(1);
    });

    it('should return empty result when tutorId has no students', async () => {
      em.find.mockResolvedValue([]);

      const result = await service.getStudentsWithPagination({ tutorId: 'tutor-no-students' });

      expect(result.items).toEqual([]);
      expect(result.total).toBe(0);
    });

    it('should calculate availableHours from transactions', async () => {
      const student = mockUser();
      userRepository.findAndCount.mockResolvedValue([[student], 1]);
      em.count.mockResolvedValue(2);
      em.find.mockResolvedValue([{ hours: 5 }, { hours: 3 }] as any);
      em.findOne.mockResolvedValue(null);

      const result = await service.getStudentsWithPagination();

      expect(result.items[0].availableHours).toBe(8);
      expect(result.items[0].coursesEnrolled).toBe(2);
    });

    it('should include lastActive from last appointment', async () => {
      const student = mockUser();
      const appointmentDate = new Date('2026-02-01');
      userRepository.findAndCount.mockResolvedValue([[student], 1]);
      em.count.mockResolvedValue(0);
      em.find.mockResolvedValue([]);
      em.findOne.mockResolvedValue({ startTime: appointmentDate } as any);

      const result = await service.getStudentsWithPagination();

      expect(result.items[0].lastActive).toEqual(appointmentDate);
    });
  });

  describe('getStudentById', () => {
    it('should return a student with detailed information', async () => {
      const student = mockUser({ id: 'student-1', role: UserRole.STUDENT });
      userRepository.findOne.mockResolvedValue(student);

      const startTime = new Date('2026-02-01T10:00:00Z');
      const endTime = new Date('2026-02-01T11:00:00Z');

      em.find.mockImplementation((entity: any) => {
        if (entity === Transaction) {
          return Promise.resolve([{ hours: 10 }, { hours: 5 }]);
        }
        if (entity === Appointment) {
          return Promise.resolve([
            { status: 'completed', startTime, endTime },
          ]);
        }
        return Promise.resolve([]);
      });

      const result = await service.getStudentById('student-1');

      expect(userRepository.findOne).toHaveBeenCalledWith({
        id: 'student-1',
        role: UserRole.STUDENT,
      });
      expect(result.totalHoursPurchased).toBe(15);
      expect(result.hoursUsed).toBe(1); // 1 hour between startTime and endTime
      expect(result.availableHours).toBe(14);
      expect(result.recentAppointments).toHaveLength(1);
    });

    it('should throw NotFoundException when student is not found', async () => {
      userRepository.findOne.mockResolvedValue(null);

      await expect(service.getStudentById('nonexistent')).rejects.toThrow(NotFoundException);
      await expect(service.getStudentById('nonexistent')).rejects.toThrow(
        'Student with ID nonexistent not found',
      );
    });

    it('should return zero hours when no transactions or appointments exist', async () => {
      const student = mockUser({ id: 'student-1', role: UserRole.STUDENT });
      userRepository.findOne.mockResolvedValue(student);
      em.find.mockResolvedValue([]);

      const result = await service.getStudentById('student-1');

      expect(result.totalHoursPurchased).toBe(0);
      expect(result.hoursUsed).toBe(0);
      expect(result.availableHours).toBe(0);
    });
  });

  describe('getStudentsByTutorId', () => {
    it('should return paginated students for a valid tutor', async () => {
      const tutor = mockUser({ id: 'tutor-1', role: UserRole.TUTOR });
      // First findOne call: verify tutor exists
      userRepository.findOne.mockResolvedValueOnce(tutor);

      // getStudentsWithPagination internals
      em.find.mockImplementation((entity: any, criteria: any) => {
        if (entity === Appointment && criteria?.tutor === 'tutor-1') {
          return Promise.resolve([
            { students: { getItems: () => [{ id: 'student-1' }] } },
          ]);
        }
        return Promise.resolve([]);
      });
      const student = mockUser({ id: 'student-1' });
      userRepository.findAndCount.mockResolvedValue([[student], 1]);
      em.count.mockResolvedValue(0);
      em.findOne.mockResolvedValue(null);

      const result = await service.getStudentsByTutorId('tutor-1');

      expect(userRepository.findOne).toHaveBeenCalledWith({
        id: 'tutor-1',
        role: UserRole.TUTOR,
      });
      expect(result.items).toHaveLength(1);
    });

    it('should throw NotFoundException when tutor is not found', async () => {
      userRepository.findOne.mockResolvedValue(null);

      await expect(service.getStudentsByTutorId('nonexistent')).rejects.toThrow(
        NotFoundException,
      );
      await expect(service.getStudentsByTutorId('nonexistent')).rejects.toThrow(
        'Tutor with ID nonexistent not found',
      );
    });

    it('should pass query parameters through to getStudentsWithPagination', async () => {
      const tutor = mockUser({ id: 'tutor-1', role: UserRole.TUTOR });
      userRepository.findOne.mockResolvedValueOnce(tutor);
      em.find.mockResolvedValue([]);

      const query = { page: 2, limit: 5, search: 'test' };
      const result = await service.getStudentsByTutorId('tutor-1', query);

      expect(result.total).toBe(0);
      expect(result.page).toBe(2);
      expect(result.limit).toBe(5);
    });
  });
});
