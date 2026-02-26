import { Test, TestingModule } from '@nestjs/testing';
import { NotFoundException } from '@nestjs/common';
import { EntityManager, Collection } from '@mikro-orm/core';
import { getRepositoryToken } from '@mikro-orm/nestjs';
import { CoursesService } from './courses.service';
import { Course } from './entities/course.entity';
import { CourseSchedule } from './entities/course-schedule.entity';
import { User, UserRole } from '../users/entities/user.entity';

type MockRepo = Record<string, jest.Mock>;

describe('CoursesService', () => {
  let service: CoursesService;
  let courseRepo: MockRepo;
  let scheduleRepo: MockRepo;
  let userRepo: MockRepo;
  let em: Record<string, jest.Mock>;

  const mockTutor = {
    id: 'tutor-1',
    firstName: 'Maria',
    lastName: 'Garcia',
    email: 'maria@example.com',
    role: UserRole.TUTOR,
  };

  const mockStudent1 = {
    id: 'student-1',
    firstName: 'Jim',
    lastName: 'Smith',
    email: 'jim@example.com',
    role: UserRole.STUDENT,
  };

  const mockStudent2 = {
    id: 'student-2',
    firstName: 'Bob',
    lastName: 'Jones',
    email: 'bob@example.com',
    role: UserRole.STUDENT,
  };

  const mockCourse = {
    id: 'course-1',
    title: 'Jim & Bob - Conversational Spanish',
    tutor: mockTutor,
    students: { getItems: () => [mockStudent1, mockStudent2], add: jest.fn(), remove: jest.fn(), isInitialized: () => true },
    startDate: new Date('2026-03-01'),
    isActive: true,
    hoursBalance: 10,
    needsRenewal: false,
    schedules: { getItems: () => [], isInitialized: () => true },
    createdAt: new Date(),
    updatedAt: new Date(),
  };

  beforeEach(async () => {
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

    userRepo = {
      findOne: jest.fn(),
      find: jest.fn(),
    };

    em = {
      persistAndFlush: jest.fn(),
      flush: jest.fn(),
      removeAndFlush: jest.fn(),
      assign: jest.fn(),
    };

    const module: TestingModule = await Test.createTestingModule({
      providers: [
        CoursesService,
        { provide: getRepositoryToken(Course), useValue: courseRepo },
        { provide: getRepositoryToken(CourseSchedule), useValue: scheduleRepo },
        { provide: getRepositoryToken(User), useValue: userRepo },
        { provide: EntityManager, useValue: em },
      ],
    }).compile();

    service = module.get<CoursesService>(CoursesService);
  });

  it('should be defined', () => {
    expect(service).toBeDefined();
  });

  // ────────────────────────────────────────────────────────────────
  // Course CRUD
  // ────────────────────────────────────────────────────────────────

  describe('findAllCourses', () => {
    it('should return all courses with tutor and students populated', async () => {
      courseRepo.findAll.mockResolvedValue([mockCourse]);

      const result = await service.findAllCourses();

      expect(result).toEqual([mockCourse]);
      expect(courseRepo.findAll).toHaveBeenCalledWith({
        populate: ['tutor', 'students', 'schedules'],
        orderBy: { title: 'ASC' },
      });
    });
  });

  describe('findActiveCourses', () => {
    it('should return only active courses', async () => {
      courseRepo.find.mockResolvedValue([mockCourse]);

      const result = await service.findActiveCourses();

      expect(result).toEqual([mockCourse]);
      expect(courseRepo.find).toHaveBeenCalledWith(
        { isActive: true },
        { populate: ['tutor', 'students', 'schedules'], orderBy: { title: 'ASC' } },
      );
    });
  });

  describe('findCourseById', () => {
    it('should return a course with all relations populated', async () => {
      courseRepo.findOne.mockResolvedValue(mockCourse);

      const result = await service.findCourseById('course-1');

      expect(result).toBe(mockCourse);
      expect(courseRepo.findOne).toHaveBeenCalledWith(
        { id: 'course-1' },
        { populate: ['tutor', 'students', 'schedules'] },
      );
    });

    it('should throw NotFoundException when course does not exist', async () => {
      courseRepo.findOne.mockResolvedValue(null);

      await expect(service.findCourseById('nonexistent')).rejects.toThrow(NotFoundException);
    });
  });

  describe('createCourse', () => {
    it('should create a course with tutor, students, and schedule slots', async () => {
      userRepo.findOne
        .mockResolvedValueOnce(mockTutor)     // tutor lookup
        .mockResolvedValueOnce(mockStudent1)  // student 1 lookup
        .mockResolvedValueOnce(mockStudent2); // student 2 lookup
      em.persistAndFlush.mockResolvedValue(undefined);

      const dto = {
        title: 'Jim & Bob - Spanish',
        tutorId: 'tutor-1',
        studentIds: ['student-1', 'student-2'],
        startDate: '2026-03-01',
        schedules: [
          { dayOfWeek: 3, startTime: '10:00', endTime: '11:00' },
          { dayOfWeek: 5, startTime: '10:00', endTime: '11:00' },
        ],
      };

      const result = await service.createCourse(dto);

      expect(result).toBeInstanceOf(Course);
      expect(result.title).toBe('Jim & Bob - Spanish');
      expect(result.tutor).toBe(mockTutor);
      expect(em.persistAndFlush).toHaveBeenCalled();
    });

    it('should throw NotFoundException when tutor does not exist', async () => {
      userRepo.findOne.mockResolvedValue(null);

      const dto = {
        title: 'Test',
        tutorId: 'nonexistent',
        studentIds: ['student-1'],
        startDate: '2026-03-01',
        schedules: [{ dayOfWeek: 1, startTime: '10:00', endTime: '11:00' }],
      };

      await expect(service.createCourse(dto)).rejects.toThrow(NotFoundException);
    });

    it('should throw NotFoundException when a student does not exist', async () => {
      userRepo.findOne
        .mockResolvedValueOnce(mockTutor)
        .mockResolvedValueOnce(null); // student not found

      const dto = {
        title: 'Test',
        tutorId: 'tutor-1',
        studentIds: ['nonexistent'],
        startDate: '2026-03-01',
        schedules: [{ dayOfWeek: 1, startTime: '10:00', endTime: '11:00' }],
      };

      await expect(service.createCourse(dto)).rejects.toThrow(NotFoundException);
    });
  });

  describe('updateCourse', () => {
    it('should update course fields and flush', async () => {
      courseRepo.findOne.mockResolvedValue(mockCourse);
      em.flush.mockResolvedValue(undefined);

      const result = await service.updateCourse('course-1', { title: 'Updated' });

      expect(em.assign).toHaveBeenCalledWith(mockCourse, { title: 'Updated' });
      expect(em.flush).toHaveBeenCalled();
    });
  });

  describe('removeCourse', () => {
    it('should remove a course and return confirmation', async () => {
      courseRepo.findOne.mockResolvedValue(mockCourse);
      em.removeAndFlush.mockResolvedValue(undefined);

      const result = await service.removeCourse('course-1');

      expect(result).toEqual({ id: 'course-1', deleted: true });
    });
  });

  // ────────────────────────────────────────────────────────────────
  // Student management
  // ────────────────────────────────────────────────────────────────

  describe('addStudent', () => {
    it('should add a student to the course', async () => {
      courseRepo.findOne.mockResolvedValue(mockCourse);
      userRepo.findOne.mockResolvedValue(mockStudent1);
      em.flush.mockResolvedValue(undefined);

      await service.addStudent('course-1', { studentId: 'student-1' });

      expect(mockCourse.students.add).toHaveBeenCalledWith(mockStudent1);
      expect(em.flush).toHaveBeenCalled();
    });

    it('should throw NotFoundException when student not found', async () => {
      courseRepo.findOne.mockResolvedValue(mockCourse);
      userRepo.findOne.mockResolvedValue(null);

      await expect(
        service.addStudent('course-1', { studentId: 'nonexistent' }),
      ).rejects.toThrow(NotFoundException);
    });
  });

  describe('removeStudent', () => {
    it('should remove a student from the course', async () => {
      courseRepo.findOne.mockResolvedValue(mockCourse);
      userRepo.findOne.mockResolvedValue(mockStudent1);
      em.flush.mockResolvedValue(undefined);

      await service.removeStudent('course-1', { studentId: 'student-1' });

      expect(mockCourse.students.remove).toHaveBeenCalledWith(mockStudent1);
      expect(em.flush).toHaveBeenCalled();
    });
  });

  // ────────────────────────────────────────────────────────────────
  // Schedule management
  // ────────────────────────────────────────────────────────────────

  describe('addSchedule', () => {
    it('should add a schedule slot to the course', async () => {
      courseRepo.findOne.mockResolvedValue(mockCourse);
      em.persistAndFlush.mockResolvedValue(undefined);

      const dto = { dayOfWeek: 1, startTime: '14:00', endTime: '15:00' };
      const result = await service.addSchedule('course-1', dto);

      expect(result).toBeInstanceOf(CourseSchedule);
      expect(result.dayOfWeek).toBe(1);
      expect(result.startTime).toBe('14:00');
      expect(result.endTime).toBe('15:00');
    });
  });

  describe('removeSchedule', () => {
    it('should remove a schedule slot', async () => {
      const mockSchedule = { id: 'sched-1' };
      scheduleRepo.findOne.mockResolvedValue(mockSchedule);
      em.removeAndFlush.mockResolvedValue(undefined);

      const result = await service.removeSchedule('sched-1');

      expect(result).toEqual({ id: 'sched-1', deleted: true });
    });

    it('should throw NotFoundException when schedule not found', async () => {
      scheduleRepo.findOne.mockResolvedValue(null);

      await expect(service.removeSchedule('nonexistent')).rejects.toThrow(NotFoundException);
    });
  });

  // ────────────────────────────────────────────────────────────────
  // Hours management
  // ────────────────────────────────────────────────────────────────

  describe('adjustHours', () => {
    it('should add hours to course balance', async () => {
      const course = { ...mockCourse, hoursBalance: 5, needsRenewal: true };
      courseRepo.findOne.mockResolvedValue(course);
      em.flush.mockResolvedValue(undefined);

      const result = await service.adjustHours('course-1', { hours: 10 });

      expect(result.hoursBalance).toBe(15);
      expect(result.needsRenewal).toBe(false);
    });

    it('should set needsRenewal when balance goes to zero or below', async () => {
      const course = { ...mockCourse, hoursBalance: 5, needsRenewal: false };
      courseRepo.findOne.mockResolvedValue(course);
      em.flush.mockResolvedValue(undefined);

      const result = await service.adjustHours('course-1', { hours: -5 });

      expect(result.hoursBalance).toBe(0);
      expect(result.needsRenewal).toBe(true);
    });
  });

  // ────────────────────────────────────────────────────────────────
  // Stats
  // ────────────────────────────────────────────────────────────────

  describe('getCourseStats', () => {
    it('should return course statistics', async () => {
      courseRepo.count.mockResolvedValue(5);
      courseRepo.find.mockResolvedValue([mockCourse]);

      const result = await service.getCourseStats();

      expect(result.totalCourses).toBe(5);
      expect(result.needsRenewalCourses).toBeDefined();
    });
  });
});
