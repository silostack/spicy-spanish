import { Test, TestingModule } from '@nestjs/testing';
import { NotFoundException } from '@nestjs/common';
import { EntityManager } from '@mikro-orm/core';
import { getRepositoryToken } from '@mikro-orm/nestjs';
import { CoursesService } from './courses.service';
import { Course, LearningLevel } from './entities/course.entity';
import { CourseLesson } from './entities/course-lesson.entity';
import { StudentCourse } from './entities/student-course.entity';
import { User, UserRole } from '../users/entities/user.entity';

// Use a loose mock type to avoid MikroORM Loaded<> generic conflicts
type MockRepo = Record<string, jest.Mock>;

describe('CoursesService', () => {
  let service: CoursesService;
  let courseRepo: MockRepo;
  let lessonRepo: MockRepo;
  let studentCourseRepo: MockRepo;
  let userRepo: MockRepo;
  let em: Record<string, jest.Mock>;

  // Reusable test fixtures
  const mockCourse = {
    id: 'course-1',
    title: 'Spanish 101',
    description: 'Beginner Spanish',
    learningLevel: LearningLevel.BEGINNER,
    isActive: true,
    lessons: [],
    createdAt: new Date(),
    updatedAt: new Date(),
  };

  const mockLesson = {
    id: 'lesson-1',
    title: 'Greetings',
    content: 'Hola means hello',
    order: 1,
    course: mockCourse,
    createdAt: new Date(),
    updatedAt: new Date(),
  };

  const mockStudent = {
    id: 'student-1',
    firstName: 'John',
    lastName: 'Doe',
    email: 'john@example.com',
    role: UserRole.STUDENT,
  };

  const mockTutor = {
    id: 'tutor-1',
    firstName: 'Maria',
    lastName: 'Garcia',
    email: 'maria@example.com',
    role: UserRole.TUTOR,
  };

  const mockStudentCourse = {
    id: 'sc-1',
    student: mockStudent,
    tutor: mockTutor,
    course: mockCourse,
    progress: 0,
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

    lessonRepo = {
      findOne: jest.fn(),
      count: jest.fn(),
    };

    studentCourseRepo = {
      findOne: jest.fn(),
      find: jest.fn(),
      findAll: jest.fn(),
      count: jest.fn(),
    };

    userRepo = {
      findOne: jest.fn(),
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
        { provide: getRepositoryToken(CourseLesson), useValue: lessonRepo },
        { provide: getRepositoryToken(StudentCourse), useValue: studentCourseRepo },
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
    it('should return all courses ordered by title', async () => {
      courseRepo.findAll.mockResolvedValue([mockCourse]);

      const result = await service.findAllCourses();

      expect(result).toEqual([mockCourse]);
      expect(courseRepo.findAll).toHaveBeenCalledWith({
        orderBy: { title: 'ASC' },
      });
    });

    it('should return an empty array when no courses exist', async () => {
      courseRepo.findAll.mockResolvedValue([]);

      const result = await service.findAllCourses();

      expect(result).toEqual([]);
    });
  });

  describe('findActiveCourses', () => {
    it('should return only active courses ordered by title', async () => {
      courseRepo.find.mockResolvedValue([mockCourse]);

      const result = await service.findActiveCourses();

      expect(result).toEqual([mockCourse]);
      expect(courseRepo.find).toHaveBeenCalledWith(
        { isActive: true },
        { orderBy: { title: 'ASC' } },
      );
    });

    it('should return an empty array when no active courses exist', async () => {
      courseRepo.find.mockResolvedValue([]);

      const result = await service.findActiveCourses();

      expect(result).toEqual([]);
    });
  });

  describe('findCoursesByLevel', () => {
    it('should return active courses filtered by learning level', async () => {
      courseRepo.find.mockResolvedValue([mockCourse]);

      const result = await service.findCoursesByLevel(LearningLevel.BEGINNER);

      expect(result).toEqual([mockCourse]);
      expect(courseRepo.find).toHaveBeenCalledWith(
        { learningLevel: LearningLevel.BEGINNER, isActive: true },
        { orderBy: { title: 'ASC' } },
      );
    });

    it('should return empty array when no courses match the level', async () => {
      courseRepo.find.mockResolvedValue([]);

      const result = await service.findCoursesByLevel(LearningLevel.ADVANCED);

      expect(result).toEqual([]);
    });
  });

  describe('findCourseById', () => {
    it('should return a course with lessons populated', async () => {
      courseRepo.findOne.mockResolvedValue(mockCourse);

      const result = await service.findCourseById('course-1');

      expect(result).toBe(mockCourse);
      expect(courseRepo.findOne).toHaveBeenCalledWith(
        { id: 'course-1' },
        { populate: ['lessons'] },
      );
    });

    it('should throw NotFoundException when course does not exist', async () => {
      courseRepo.findOne.mockResolvedValue(null);

      await expect(service.findCourseById('nonexistent')).rejects.toThrow(
        NotFoundException,
      );
      await expect(service.findCourseById('nonexistent')).rejects.toThrow(
        'Course with ID nonexistent not found',
      );
    });
  });

  describe('createCourse', () => {
    it('should create and persist a new course', async () => {
      em.persistAndFlush.mockResolvedValue(undefined);

      const dto = {
        title: 'Spanish 101',
        description: 'Beginner Spanish',
        learningLevel: LearningLevel.BEGINNER,
      };

      const result = await service.createCourse(dto);

      expect(result).toBeInstanceOf(Course);
      expect(result.title).toBe('Spanish 101');
      expect(result.description).toBe('Beginner Spanish');
      expect(result.learningLevel).toBe(LearningLevel.BEGINNER);
      expect(result.isActive).toBe(true);
      expect(em.persistAndFlush).toHaveBeenCalledWith(result);
    });

    it('should respect isActive=false when provided', async () => {
      em.persistAndFlush.mockResolvedValue(undefined);

      const dto = {
        title: 'Draft Course',
        description: 'Not yet active',
        learningLevel: LearningLevel.INTERMEDIATE,
        isActive: false,
      };

      const result = await service.createCourse(dto);

      expect(result.isActive).toBe(false);
    });

    it('should default isActive to true when not provided', async () => {
      em.persistAndFlush.mockResolvedValue(undefined);

      const dto = {
        title: 'New Course',
        description: 'A course',
        learningLevel: LearningLevel.BEGINNER,
      };

      const result = await service.createCourse(dto);

      expect(result.isActive).toBe(true);
    });
  });

  describe('updateCourse', () => {
    it('should update a course and flush changes', async () => {
      courseRepo.findOne.mockResolvedValue(mockCourse);
      em.flush.mockResolvedValue(undefined);

      const dto = { title: 'Updated Title' };
      const result = await service.updateCourse('course-1', dto);

      expect(result).toBe(mockCourse);
      expect(em.assign).toHaveBeenCalledWith(mockCourse, dto);
      expect(em.flush).toHaveBeenCalled();
    });

    it('should throw NotFoundException when course does not exist', async () => {
      courseRepo.findOne.mockResolvedValue(null);

      await expect(
        service.updateCourse('nonexistent', { title: 'X' }),
      ).rejects.toThrow(NotFoundException);
    });
  });

  describe('removeCourse', () => {
    it('should remove a course and return deletion confirmation', async () => {
      courseRepo.findOne.mockResolvedValue(mockCourse);
      em.removeAndFlush.mockResolvedValue(undefined);

      const result = await service.removeCourse('course-1');

      expect(result).toEqual({ id: 'course-1', deleted: true });
      expect(em.removeAndFlush).toHaveBeenCalledWith(mockCourse);
    });

    it('should throw NotFoundException when course does not exist', async () => {
      courseRepo.findOne.mockResolvedValue(null);

      await expect(service.removeCourse('nonexistent')).rejects.toThrow(
        NotFoundException,
      );
    });
  });

  // ────────────────────────────────────────────────────────────────
  // Lesson CRUD
  // ────────────────────────────────────────────────────────────────

  describe('findLessonById', () => {
    it('should return a lesson with course populated', async () => {
      lessonRepo.findOne.mockResolvedValue(mockLesson);

      const result = await service.findLessonById('lesson-1');

      expect(result).toBe(mockLesson);
      expect(lessonRepo.findOne).toHaveBeenCalledWith(
        { id: 'lesson-1' },
        { populate: ['course'] },
      );
    });

    it('should throw NotFoundException when lesson does not exist', async () => {
      lessonRepo.findOne.mockResolvedValue(null);

      await expect(service.findLessonById('nonexistent')).rejects.toThrow(
        NotFoundException,
      );
      await expect(service.findLessonById('nonexistent')).rejects.toThrow(
        'Lesson with ID nonexistent not found',
      );
    });
  });

  describe('createLesson', () => {
    it('should create a lesson linked to a course', async () => {
      courseRepo.findOne.mockResolvedValue(mockCourse);
      em.persistAndFlush.mockResolvedValue(undefined);

      const dto = {
        courseId: 'course-1',
        title: 'Greetings',
        content: 'Hola means hello',
        order: 1,
      };

      const result = await service.createLesson(dto);

      expect(result).toBeInstanceOf(CourseLesson);
      expect(result.title).toBe('Greetings');
      expect(result.content).toBe('Hola means hello');
      expect(result.order).toBe(1);
      expect(result.course).toBe(mockCourse);
      expect(em.persistAndFlush).toHaveBeenCalledWith(result);
    });

    it('should throw NotFoundException when course does not exist', async () => {
      courseRepo.findOne.mockResolvedValue(null);

      const dto = {
        courseId: 'nonexistent',
        title: 'Lesson',
        content: 'Content',
        order: 1,
      };

      await expect(service.createLesson(dto)).rejects.toThrow(NotFoundException);
    });
  });

  describe('updateLesson', () => {
    it('should update a lesson and flush changes', async () => {
      lessonRepo.findOne.mockResolvedValue(mockLesson);
      em.flush.mockResolvedValue(undefined);

      const dto = { title: 'Updated Lesson Title' };
      const result = await service.updateLesson('lesson-1', dto);

      expect(result).toBe(mockLesson);
      expect(em.assign).toHaveBeenCalledWith(mockLesson, dto);
      expect(em.flush).toHaveBeenCalled();
    });

    it('should throw NotFoundException when lesson does not exist', async () => {
      lessonRepo.findOne.mockResolvedValue(null);

      await expect(
        service.updateLesson('nonexistent', { title: 'X' }),
      ).rejects.toThrow(NotFoundException);
    });
  });

  describe('removeLesson', () => {
    it('should remove a lesson and return deletion confirmation', async () => {
      lessonRepo.findOne.mockResolvedValue(mockLesson);
      em.removeAndFlush.mockResolvedValue(undefined);

      const result = await service.removeLesson('lesson-1');

      expect(result).toEqual({ id: 'lesson-1', deleted: true });
      expect(em.removeAndFlush).toHaveBeenCalledWith(mockLesson);
    });

    it('should throw NotFoundException when lesson does not exist', async () => {
      lessonRepo.findOne.mockResolvedValue(null);

      await expect(service.removeLesson('nonexistent')).rejects.toThrow(
        NotFoundException,
      );
    });
  });

  // ────────────────────────────────────────────────────────────────
  // StudentCourse assignments and progress
  // ────────────────────────────────────────────────────────────────

  describe('findStudentCoursesById', () => {
    it('should return a student course with relations populated', async () => {
      studentCourseRepo.findOne.mockResolvedValue(mockStudentCourse);

      const result = await service.findStudentCoursesById('sc-1');

      expect(result).toBe(mockStudentCourse);
      expect(studentCourseRepo.findOne).toHaveBeenCalledWith(
        { id: 'sc-1' },
        { populate: ['student', 'tutor', 'course'] },
      );
    });

    it('should throw NotFoundException when student course does not exist', async () => {
      studentCourseRepo.findOne.mockResolvedValue(null);

      await expect(
        service.findStudentCoursesById('nonexistent'),
      ).rejects.toThrow(NotFoundException);
      await expect(
        service.findStudentCoursesById('nonexistent'),
      ).rejects.toThrow('StudentCourse with ID nonexistent not found');
    });
  });

  describe('findStudentCoursesByStudent', () => {
    it('should return student courses for a given student', async () => {
      studentCourseRepo.find.mockResolvedValue([mockStudentCourse]);

      const result = await service.findStudentCoursesByStudent('student-1');

      expect(result).toEqual([mockStudentCourse]);
      expect(studentCourseRepo.find).toHaveBeenCalledWith(
        { student: 'student-1' },
        {
          populate: ['student', 'tutor', 'course'],
          orderBy: { createdAt: 'DESC' },
        },
      );
    });

    it('should return empty array when student has no courses', async () => {
      studentCourseRepo.find.mockResolvedValue([]);

      const result = await service.findStudentCoursesByStudent('student-1');

      expect(result).toEqual([]);
    });
  });

  describe('findStudentCoursesByTutor', () => {
    it('should return student courses for a given tutor', async () => {
      studentCourseRepo.find.mockResolvedValue([mockStudentCourse]);

      const result = await service.findStudentCoursesByTutor('tutor-1');

      expect(result).toEqual([mockStudentCourse]);
      expect(studentCourseRepo.find).toHaveBeenCalledWith(
        { tutor: 'tutor-1' },
        {
          populate: ['student', 'tutor', 'course'],
          orderBy: { createdAt: 'DESC' },
        },
      );
    });

    it('should return empty array when tutor has no assigned courses', async () => {
      studentCourseRepo.find.mockResolvedValue([]);

      const result = await service.findStudentCoursesByTutor('tutor-1');

      expect(result).toEqual([]);
    });
  });

  describe('assignCourse', () => {
    it('should assign a course to a student with a tutor', async () => {
      userRepo.findOne
        .mockResolvedValueOnce(mockStudent)
        .mockResolvedValueOnce(mockTutor);
      courseRepo.findOne.mockResolvedValue(mockCourse);
      em.persistAndFlush.mockResolvedValue(undefined);

      const dto = {
        studentId: 'student-1',
        tutorId: 'tutor-1',
        courseId: 'course-1',
      };

      const result = await service.assignCourse(dto);

      expect(result).toBeInstanceOf(StudentCourse);
      expect(result.student).toBe(mockStudent);
      expect(result.tutor).toBe(mockTutor);
      expect(result.course).toBe(mockCourse);
      expect(em.persistAndFlush).toHaveBeenCalledWith(result);
    });

    it('should throw NotFoundException when student is not found', async () => {
      userRepo.findOne.mockResolvedValue(null);

      const dto = {
        studentId: 'nonexistent',
        tutorId: 'tutor-1',
        courseId: 'course-1',
      };

      await expect(service.assignCourse(dto)).rejects.toThrow(NotFoundException);
      await expect(service.assignCourse(dto)).rejects.toThrow(
        'Student with ID nonexistent not found',
      );
    });

    it('should throw NotFoundException when tutor is not found', async () => {
      // Set up mocks for two invocations (one per expect().rejects.toThrow())
      userRepo.findOne
        .mockResolvedValueOnce(mockStudent)
        .mockResolvedValueOnce(null)
        .mockResolvedValueOnce(mockStudent)
        .mockResolvedValueOnce(null);

      const dto = {
        studentId: 'student-1',
        tutorId: 'nonexistent',
        courseId: 'course-1',
      };

      await expect(service.assignCourse(dto)).rejects.toThrow(NotFoundException);
      await expect(service.assignCourse(dto)).rejects.toThrow(
        'Tutor with ID nonexistent not found',
      );
    });

    it('should throw NotFoundException when course is not found', async () => {
      userRepo.findOne
        .mockResolvedValueOnce(mockStudent)
        .mockResolvedValueOnce(mockTutor);
      courseRepo.findOne.mockResolvedValue(null);

      const dto = {
        studentId: 'student-1',
        tutorId: 'tutor-1',
        courseId: 'nonexistent',
      };

      await expect(service.assignCourse(dto)).rejects.toThrow(NotFoundException);
    });

    it('should query student with STUDENT role and tutor with TUTOR role', async () => {
      userRepo.findOne
        .mockResolvedValueOnce(mockStudent)
        .mockResolvedValueOnce(mockTutor);
      courseRepo.findOne.mockResolvedValue(mockCourse);
      em.persistAndFlush.mockResolvedValue(undefined);

      const dto = {
        studentId: 'student-1',
        tutorId: 'tutor-1',
        courseId: 'course-1',
      };

      await service.assignCourse(dto);

      expect(userRepo.findOne).toHaveBeenCalledWith({
        id: 'student-1',
        role: UserRole.STUDENT,
      });
      expect(userRepo.findOne).toHaveBeenCalledWith({
        id: 'tutor-1',
        role: UserRole.TUTOR,
      });
    });
  });

  describe('updateStudentCourseProgress', () => {
    it('should update progress and flush', async () => {
      const scWithProgress = { ...mockStudentCourse, progress: 0 };
      studentCourseRepo.findOne.mockResolvedValue(scWithProgress);
      em.flush.mockResolvedValue(undefined);

      const result = await service.updateStudentCourseProgress('sc-1', 75);

      expect(result.progress).toBe(75);
      expect(em.flush).toHaveBeenCalled();
    });

    it('should throw NotFoundException when student course does not exist', async () => {
      studentCourseRepo.findOne.mockResolvedValue(null);

      await expect(
        service.updateStudentCourseProgress('nonexistent', 50),
      ).rejects.toThrow(NotFoundException);
    });
  });

  describe('removeStudentCourse', () => {
    it('should remove a student course and return deletion confirmation', async () => {
      studentCourseRepo.findOne.mockResolvedValue(mockStudentCourse);
      em.removeAndFlush.mockResolvedValue(undefined);

      const result = await service.removeStudentCourse('sc-1');

      expect(result).toEqual({ id: 'sc-1', deleted: true });
      expect(em.removeAndFlush).toHaveBeenCalledWith(mockStudentCourse);
    });

    it('should throw NotFoundException when student course does not exist', async () => {
      studentCourseRepo.findOne.mockResolvedValue(null);

      await expect(
        service.removeStudentCourse('nonexistent'),
      ).rejects.toThrow(NotFoundException);
    });
  });

  // ────────────────────────────────────────────────────────────────
  // Dashboard stats
  // ────────────────────────────────────────────────────────────────

  describe('getCourseStats', () => {
    it('should return aggregate course statistics', async () => {
      courseRepo.count.mockResolvedValue(5);
      lessonRepo.count.mockImplementation(async (filter?: any) => {
        if (filter && filter.course) return 10;
        return 30;
      });
      studentCourseRepo.count.mockResolvedValue(12);
      studentCourseRepo.findAll.mockResolvedValue([]);
      studentCourseRepo.find.mockResolvedValue([]);

      const result = await service.getCourseStats();

      expect(result.totalCourses).toBe(5);
      expect(result.totalLessons).toBe(30);
      expect(result.activeCourseAssignments).toBe(12);
      expect(result.completedLessons).toBe(0);
      expect(result.recentAssignments).toEqual([]);
    });

    it('should calculate completed lessons from progress', async () => {
      const scWithProgress = {
        id: 'sc-1',
        progress: 50,
        course: mockCourse,
      };

      courseRepo.count.mockResolvedValue(1);
      lessonRepo.count.mockImplementation(async (filter?: any) => {
        if (filter && filter.course) return 10;
        return 10;
      });
      studentCourseRepo.count.mockResolvedValue(1);
      studentCourseRepo.findAll.mockResolvedValue([scWithProgress]);
      studentCourseRepo.find.mockResolvedValue([]);

      const result = await service.getCourseStats();

      // 10 lessons * (50 / 100) = 5 completed lessons
      expect(result.completedLessons).toBe(5);
    });

    it('should sum completed lessons across multiple student courses', async () => {
      const sc1 = { id: 'sc-1', progress: 100, course: { id: 'c1' } };
      const sc2 = { id: 'sc-2', progress: 50, course: { id: 'c2' } };
      const sc3 = { id: 'sc-3', progress: 0, course: { id: 'c3' } };

      courseRepo.count.mockResolvedValue(3);
      lessonRepo.count.mockImplementation(async (filter?: any) => {
        if (filter && filter.course) return 4;
        return 12;
      });
      studentCourseRepo.count.mockResolvedValue(3);
      studentCourseRepo.findAll.mockResolvedValue([sc1, sc2, sc3]);
      studentCourseRepo.find.mockResolvedValue([]);

      const result = await service.getCourseStats();

      // sc1: floor(4 * 100/100) = 4
      // sc2: floor(4 * 50/100) = 2
      // sc3: progress is 0, skipped
      // total = 6
      expect(result.completedLessons).toBe(6);
    });

    it('should fetch recent assignments with limit 5', async () => {
      const recentAssignments = [mockStudentCourse];
      courseRepo.count.mockResolvedValue(1);
      lessonRepo.count.mockResolvedValue(5);
      studentCourseRepo.count.mockResolvedValue(1);
      studentCourseRepo.findAll.mockResolvedValue([]);
      studentCourseRepo.find.mockResolvedValue(recentAssignments);

      const result = await service.getCourseStats();

      expect(result.recentAssignments).toEqual(recentAssignments);
      expect(studentCourseRepo.find).toHaveBeenCalledWith(
        {},
        {
          populate: ['student', 'tutor', 'course'],
          orderBy: { createdAt: 'DESC' },
          limit: 5,
        },
      );
    });
  });
});
