# Course Redesign Implementation Plan

> **For Claude:** REQUIRED SUB-SKILL: Use superpowers:executing-plans to implement this plan task-by-task.

**Goal:** Replace the catalog-style Course with a scheduled class group — a recurring schedule of classes for one or more students with a tutor, backed by a pool of credited hours.

**Architecture:** Rewrite the Course entity to hold a tutor, students (M2M), hours balance, and schedule slots. Change Appointment from single-student to multi-student (M2M). Add a daily cron job that auto-generates appointments 4 weeks ahead. Remove CourseLesson and StudentCourse entities entirely.

**Tech Stack:** NestJS, MikroORM 5 (PostgreSQL), TypeScript, Jest, `@nestjs/schedule` (already configured)

---

### Task 1: Rewrite Course Entity

**Files:**
- Modify: `backend/src/courses/entities/course.entity.ts`

**Step 1: Rewrite the Course entity**

Replace the entire contents of `course.entity.ts` with:

```typescript
import { Entity, ManyToOne, ManyToMany, PrimaryKey, Property, Collection, OneToMany } from '@mikro-orm/core';
import { v4 } from 'uuid';
import { User } from '../../users/entities/user.entity';

@Entity()
export class Course {
  @PrimaryKey()
  id: string = v4();

  @Property()
  title: string;

  @ManyToOne(() => User)
  tutor!: User;

  @ManyToMany(() => User, undefined, { owner: true })
  students = new Collection<User>(this);

  @Property()
  startDate: Date;

  @Property({ default: true })
  isActive: boolean = true;

  @Property({ type: 'decimal', precision: 6, scale: 2, default: 0 })
  hoursBalance: number = 0;

  @Property({ default: false })
  needsRenewal: boolean = false;

  @Property()
  createdAt: Date = new Date();

  @Property({ onUpdate: () => new Date() })
  updatedAt: Date = new Date();

  constructor(title: string, tutor: User, startDate: Date) {
    this.title = title;
    this.tutor = tutor;
    this.startDate = startDate;
  }
}
```

**Step 2: Verify it compiles**

Run: `cd backend && npx tsc --noEmit --pretty 2>&1 | head -30`

Expected: Compilation errors related to other files still referencing old Course fields (LearningLevel, description, lessons). This is expected — we'll fix those in later tasks.

**Step 3: Commit**

```bash
git add backend/src/courses/entities/course.entity.ts
git commit -m "refactor: rewrite Course entity as scheduled class group"
```

---

### Task 2: Create CourseSchedule Entity

**Files:**
- Create: `backend/src/courses/entities/course-schedule.entity.ts`

**Step 1: Create the CourseSchedule entity**

Create `backend/src/courses/entities/course-schedule.entity.ts`:

```typescript
import { Entity, ManyToOne, PrimaryKey, Property } from '@mikro-orm/core';
import { v4 } from 'uuid';
import { Course } from './course.entity';

@Entity()
export class CourseSchedule {
  @PrimaryKey()
  id: string = v4();

  @ManyToOne(() => Course)
  course!: Course;

  @Property()
  dayOfWeek: number;

  @Property()
  startTime: string;

  @Property()
  endTime: string;

  @Property()
  createdAt: Date = new Date();

  @Property({ onUpdate: () => new Date() })
  updatedAt: Date = new Date();

  constructor(course: Course, dayOfWeek: number, startTime: string, endTime: string) {
    this.course = course;
    this.dayOfWeek = dayOfWeek;
    this.startTime = startTime;
    this.endTime = endTime;
  }
}
```

**Step 2: Add OneToMany back-reference on Course**

In `course.entity.ts`, add the import and the relationship:

Add import at top:
```typescript
import { CourseSchedule } from './course-schedule.entity';
```

Add field after `needsRenewal`:
```typescript
  @OneToMany(() => CourseSchedule, schedule => schedule.course, { orphanRemoval: true })
  schedules = new Collection<CourseSchedule>(this);
```

**Step 3: Commit**

```bash
git add backend/src/courses/entities/course-schedule.entity.ts backend/src/courses/entities/course.entity.ts
git commit -m "feat: add CourseSchedule entity for recurring time slots"
```

---

### Task 3: Update Appointment Entity for Multi-Student

**Files:**
- Modify: `backend/src/scheduling/entities/appointment.entity.ts`

**Step 1: Update Appointment entity**

Replace the entire contents of `appointment.entity.ts` with:

```typescript
import { Entity, ManyToOne, ManyToMany, PrimaryKey, Property, Enum, Collection } from '@mikro-orm/core';
import { v4 } from 'uuid';
import { User } from '../../users/entities/user.entity';
import { Course } from '../../courses/entities/course.entity';

export enum AppointmentStatus {
  SCHEDULED = 'scheduled',
  COMPLETED = 'completed',
  CANCELLED = 'cancelled',
  NO_SHOW = 'no_show',
}

@Entity()
export class Appointment {
  @PrimaryKey()
  id: string = v4();

  @ManyToMany(() => User, undefined, { owner: true })
  students = new Collection<User>(this);

  @ManyToOne(() => User)
  tutor!: User;

  @ManyToOne(() => Course)
  course!: Course;

  @Property()
  startTime: Date;

  @Property()
  endTime: Date;

  @Enum(() => AppointmentStatus)
  status: AppointmentStatus = AppointmentStatus.SCHEDULED;

  @Property({ nullable: true })
  googleCalendarEventId?: string;

  @Property({ nullable: true })
  notes?: string;

  @Property({ nullable: true })
  creditedBack?: boolean;

  @Property()
  createdAt: Date = new Date();

  @Property({ onUpdate: () => new Date() })
  updatedAt: Date = new Date();

  @Property({ default: false })
  reminderSent: boolean = false;

  @Property({ nullable: true })
  reminderSentAt?: Date;

  @Property({ default: false })
  dayBeforeReminderSent: boolean = false;

  @Property({ nullable: true })
  dayBeforeReminderSentAt?: Date;

  @Property({ default: false })
  confirmationEmailSent: boolean = false;

  constructor(
    tutor: User,
    course: Course,
    startTime: Date,
    endTime: Date,
    status: AppointmentStatus = AppointmentStatus.SCHEDULED,
  ) {
    this.tutor = tutor;
    this.course = course;
    this.startTime = startTime;
    this.endTime = endTime;
    this.status = status;
  }
}
```

Key changes:
- `student` (ManyToOne) → `students` (ManyToMany Collection)
- `course` is now required (not nullable)
- Added `creditedBack` nullable boolean
- Constructor no longer takes `student` — students are added via `appointment.students.add(...)`

**Step 2: Commit**

```bash
git add backend/src/scheduling/entities/appointment.entity.ts
git commit -m "refactor: change Appointment to multi-student with required course"
```

---

### Task 4: Delete Old Entities

**Files:**
- Delete: `backend/src/courses/entities/course-lesson.entity.ts`
- Delete: `backend/src/courses/entities/student-course.entity.ts`

**Step 1: Delete the files**

```bash
rm backend/src/courses/entities/course-lesson.entity.ts
rm backend/src/courses/entities/student-course.entity.ts
```

**Step 2: Commit**

```bash
git add -u backend/src/courses/entities/
git commit -m "refactor: remove CourseLesson and StudentCourse entities"
```

---

### Task 5: Rewrite Course DTOs

**Files:**
- Modify: `backend/src/courses/dto/index.ts`

**Step 1: Rewrite DTOs**

Replace the entire contents of `dto/index.ts` with:

```typescript
import { IsString, IsOptional, IsBoolean, IsUUID, IsNumber, IsDateString, IsArray, Min, Max, Matches, ValidateNested, ArrayMinSize } from 'class-validator';
import { Type } from 'class-transformer';

export class ScheduleSlotDto {
  @IsNumber()
  @Min(0)
  @Max(6)
  dayOfWeek: number;

  @Matches(/^\d{2}:\d{2}$/, { message: 'startTime must be in HH:MM format' })
  startTime: string;

  @Matches(/^\d{2}:\d{2}$/, { message: 'endTime must be in HH:MM format' })
  endTime: string;
}

export class CreateCourseDto {
  @IsString()
  title: string;

  @IsUUID()
  tutorId: string;

  @IsArray()
  @IsUUID(undefined, { each: true })
  @ArrayMinSize(1)
  studentIds: string[];

  @IsDateString()
  startDate: string;

  @IsArray()
  @ValidateNested({ each: true })
  @Type(() => ScheduleSlotDto)
  @ArrayMinSize(1)
  schedules: ScheduleSlotDto[];
}

export class UpdateCourseDto {
  @IsOptional()
  @IsString()
  title?: string;

  @IsOptional()
  @IsBoolean()
  isActive?: boolean;
}

export class AddStudentDto {
  @IsUUID()
  studentId: string;
}

export class RemoveStudentDto {
  @IsUUID()
  studentId: string;
}

export class AddScheduleDto {
  @IsNumber()
  @Min(0)
  @Max(6)
  dayOfWeek: number;

  @Matches(/^\d{2}:\d{2}$/, { message: 'startTime must be in HH:MM format' })
  startTime: string;

  @Matches(/^\d{2}:\d{2}$/, { message: 'endTime must be in HH:MM format' })
  endTime: string;
}

export class AdjustHoursDto {
  @IsNumber()
  hours: number;
}
```

**Step 2: Commit**

```bash
git add backend/src/courses/dto/index.ts
git commit -m "refactor: rewrite course DTOs for scheduled class group model"
```

---

### Task 6: Rewrite Course Module Registration

**Files:**
- Modify: `backend/src/courses/courses.module.ts`

**Step 1: Update module**

Replace the entire contents of `courses.module.ts` with:

```typescript
import { Module } from '@nestjs/common';
import { MikroOrmModule } from '@mikro-orm/nestjs';
import { Course } from './entities/course.entity';
import { CourseSchedule } from './entities/course-schedule.entity';
import { CoursesController } from './courses.controller';
import { CoursesService } from './courses.service';
import { User } from '../users/entities/user.entity';

@Module({
  imports: [MikroOrmModule.forFeature([Course, CourseSchedule, User])],
  controllers: [CoursesController],
  providers: [CoursesService],
  exports: [CoursesService],
})
export class CoursesModule {}
```

**Step 2: Commit**

```bash
git add backend/src/courses/courses.module.ts
git commit -m "refactor: update CoursesModule for new entity registrations"
```

---

### Task 7: Rewrite Course Service — Tests First

**Files:**
- Modify: `backend/src/courses/courses.service.spec.ts`
- Modify: `backend/src/courses/courses.service.ts`

**Step 1: Write the failing tests**

Replace the entire contents of `courses.service.spec.ts` with:

```typescript
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
```

**Step 2: Run tests to verify they fail**

Run: `cd backend && npx jest --testPathPattern=courses.service.spec --no-coverage 2>&1 | tail -20`

Expected: FAIL — CoursesService doesn't have the new methods yet.

**Step 3: Write the Course service implementation**

Replace the entire contents of `courses.service.ts` with:

```typescript
import { Injectable, NotFoundException } from '@nestjs/common';
import { EntityManager, EntityRepository } from '@mikro-orm/core';
import { InjectRepository } from '@mikro-orm/nestjs';
import { Course } from './entities/course.entity';
import { CourseSchedule } from './entities/course-schedule.entity';
import { User, UserRole } from '../users/entities/user.entity';
import { CreateCourseDto, UpdateCourseDto, AddStudentDto, RemoveStudentDto, AddScheduleDto, AdjustHoursDto } from './dto';

@Injectable()
export class CoursesService {
  constructor(
    @InjectRepository(Course)
    private readonly courseRepository: EntityRepository<Course>,
    @InjectRepository(CourseSchedule)
    private readonly scheduleRepository: EntityRepository<CourseSchedule>,
    @InjectRepository(User)
    private readonly userRepository: EntityRepository<User>,
    private readonly em: EntityManager,
  ) {}

  async findAllCourses() {
    return this.courseRepository.findAll({
      populate: ['tutor', 'students', 'schedules'],
      orderBy: { title: 'ASC' },
    });
  }

  async findActiveCourses() {
    return this.courseRepository.find(
      { isActive: true },
      { populate: ['tutor', 'students', 'schedules'], orderBy: { title: 'ASC' } },
    );
  }

  async findCourseById(id: string) {
    const course = await this.courseRepository.findOne(
      { id },
      { populate: ['tutor', 'students', 'schedules'] },
    );

    if (!course) {
      throw new NotFoundException(`Course with ID ${id} not found`);
    }

    return course;
  }

  async findCoursesByTutor(tutorId: string) {
    return this.courseRepository.find(
      { tutor: tutorId },
      { populate: ['tutor', 'students', 'schedules'], orderBy: { title: 'ASC' } },
    );
  }

  async findCoursesByStudent(studentId: string) {
    return this.courseRepository.find(
      { students: studentId },
      { populate: ['tutor', 'students', 'schedules'], orderBy: { title: 'ASC' } },
    );
  }

  async createCourse(dto: CreateCourseDto) {
    const tutor = await this.userRepository.findOne({ id: dto.tutorId, role: UserRole.TUTOR });
    if (!tutor) {
      throw new NotFoundException(`Tutor with ID ${dto.tutorId} not found`);
    }

    const students: User[] = [];
    for (const studentId of dto.studentIds) {
      const student = await this.userRepository.findOne({ id: studentId, role: UserRole.STUDENT });
      if (!student) {
        throw new NotFoundException(`Student with ID ${studentId} not found`);
      }
      students.push(student);
    }

    const course = new Course(dto.title, tutor, new Date(dto.startDate));
    course.students.add(...students);

    for (const slot of dto.schedules) {
      const schedule = new CourseSchedule(course, slot.dayOfWeek, slot.startTime, slot.endTime);
      course.schedules.add(schedule);
    }

    await this.em.persistAndFlush(course);
    return course;
  }

  async updateCourse(id: string, dto: UpdateCourseDto) {
    const course = await this.findCourseById(id);
    this.em.assign(course, dto);
    await this.em.flush();
    return course;
  }

  async removeCourse(id: string) {
    const course = await this.findCourseById(id);
    await this.em.removeAndFlush(course);
    return { id, deleted: true };
  }

  // Student management
  async addStudent(courseId: string, dto: AddStudentDto) {
    const course = await this.findCourseById(courseId);
    const student = await this.userRepository.findOne({ id: dto.studentId, role: UserRole.STUDENT });
    if (!student) {
      throw new NotFoundException(`Student with ID ${dto.studentId} not found`);
    }
    course.students.add(student);
    await this.em.flush();
    return course;
  }

  async removeStudent(courseId: string, dto: RemoveStudentDto) {
    const course = await this.findCourseById(courseId);
    const student = await this.userRepository.findOne({ id: dto.studentId, role: UserRole.STUDENT });
    if (!student) {
      throw new NotFoundException(`Student with ID ${dto.studentId} not found`);
    }
    course.students.remove(student);
    await this.em.flush();
    return course;
  }

  // Schedule management
  async addSchedule(courseId: string, dto: AddScheduleDto) {
    const course = await this.findCourseById(courseId);
    const schedule = new CourseSchedule(course, dto.dayOfWeek, dto.startTime, dto.endTime);
    await this.em.persistAndFlush(schedule);
    return schedule;
  }

  async removeSchedule(scheduleId: string) {
    const schedule = await this.scheduleRepository.findOne({ id: scheduleId });
    if (!schedule) {
      throw new NotFoundException(`Schedule with ID ${scheduleId} not found`);
    }
    await this.em.removeAndFlush(schedule);
    return { id: scheduleId, deleted: true };
  }

  // Hours management
  async adjustHours(courseId: string, dto: AdjustHoursDto) {
    const course = await this.findCourseById(courseId);
    course.hoursBalance = Number(course.hoursBalance) + dto.hours;
    course.needsRenewal = course.hoursBalance <= 0;
    await this.em.flush();
    return course;
  }

  // Stats
  async getCourseStats() {
    const totalCourses = await this.courseRepository.count();
    const activeCourses = await this.courseRepository.count({ isActive: true });
    const needsRenewalCourses = await this.courseRepository.count({ needsRenewal: true });
    const recentCourses = await this.courseRepository.find(
      {},
      {
        populate: ['tutor', 'students'],
        orderBy: { createdAt: 'DESC' },
        limit: 5,
      },
    );

    return {
      totalCourses,
      activeCourses,
      needsRenewalCourses,
      recentCourses,
    };
  }
}
```

**Step 4: Run tests to verify they pass**

Run: `cd backend && npx jest --testPathPattern=courses.service.spec --no-coverage 2>&1 | tail -20`

Expected: PASS

**Step 5: Commit**

```bash
git add backend/src/courses/courses.service.ts backend/src/courses/courses.service.spec.ts
git commit -m "feat: rewrite CoursesService with schedule, students, and hours management"
```

---

### Task 8: Rewrite Course Controller

**Files:**
- Modify: `backend/src/courses/courses.controller.ts`

**Step 1: Rewrite the controller**

Replace the entire contents of `courses.controller.ts` with:

```typescript
import { Controller, Get, Post, Body, Patch, Param, Delete, UseGuards } from '@nestjs/common';
import { CoursesService } from './courses.service';
import { JwtAuthGuard } from '../common/guards/jwt-auth.guard';
import { RolesGuard } from '../common/guards/roles.guard';
import { Roles } from '../common/decorators/roles.decorator';
import { UserRole } from '../users/entities/user.entity';
import { CreateCourseDto, UpdateCourseDto, AddStudentDto, RemoveStudentDto, AddScheduleDto, AdjustHoursDto } from './dto';

@Controller('courses')
@UseGuards(JwtAuthGuard, RolesGuard)
export class CoursesController {
  constructor(private readonly coursesService: CoursesService) {}

  @Get()
  findAllCourses() {
    return this.coursesService.findAllCourses();
  }

  @Get('active')
  findActiveCourses() {
    return this.coursesService.findActiveCourses();
  }

  @Get(':id')
  findCourseById(@Param('id') id: string) {
    return this.coursesService.findCourseById(id);
  }

  @Get('tutor/:tutorId')
  findCoursesByTutor(@Param('tutorId') tutorId: string) {
    return this.coursesService.findCoursesByTutor(tutorId);
  }

  @Get('student/:studentId')
  findCoursesByStudent(@Param('studentId') studentId: string) {
    return this.coursesService.findCoursesByStudent(studentId);
  }

  @Post()
  @Roles(UserRole.ADMIN)
  createCourse(@Body() dto: CreateCourseDto) {
    return this.coursesService.createCourse(dto);
  }

  @Patch(':id')
  @Roles(UserRole.ADMIN)
  updateCourse(@Param('id') id: string, @Body() dto: UpdateCourseDto) {
    return this.coursesService.updateCourse(id, dto);
  }

  @Delete(':id')
  @Roles(UserRole.ADMIN)
  removeCourse(@Param('id') id: string) {
    return this.coursesService.removeCourse(id);
  }

  // Student management
  @Post(':id/students')
  @Roles(UserRole.ADMIN)
  addStudent(@Param('id') id: string, @Body() dto: AddStudentDto) {
    return this.coursesService.addStudent(id, dto);
  }

  @Delete(':id/students')
  @Roles(UserRole.ADMIN)
  removeStudent(@Param('id') id: string, @Body() dto: RemoveStudentDto) {
    return this.coursesService.removeStudent(id, dto);
  }

  // Schedule management
  @Post(':id/schedules')
  @Roles(UserRole.ADMIN)
  addSchedule(@Param('id') id: string, @Body() dto: AddScheduleDto) {
    return this.coursesService.addSchedule(id, dto);
  }

  @Delete('schedules/:scheduleId')
  @Roles(UserRole.ADMIN)
  removeSchedule(@Param('scheduleId') scheduleId: string) {
    return this.coursesService.removeSchedule(scheduleId);
  }

  // Hours management
  @Patch(':id/hours')
  @Roles(UserRole.ADMIN)
  adjustHours(@Param('id') id: string, @Body() dto: AdjustHoursDto) {
    return this.coursesService.adjustHours(id, dto);
  }

  // Stats
  @Get('stats')
  @Roles(UserRole.ADMIN)
  getCourseStats() {
    return this.coursesService.getCourseStats();
  }
}
```

**Step 2: Commit**

```bash
git add backend/src/courses/courses.controller.ts
git commit -m "feat: rewrite CoursesController with student, schedule, and hours endpoints"
```

---

### Task 9: Update Scheduling DTOs

**Files:**
- Modify: `backend/src/scheduling/dto/index.ts`

**Step 1: Update CreateAppointmentDto and add CancelAppointmentDto**

In `backend/src/scheduling/dto/index.ts`, make these changes:

Replace `CreateAppointmentDto`:

```typescript
export class CreateAppointmentDto {
  @IsArray()
  @IsUUID(undefined, { each: true })
  @ArrayMinSize(1)
  studentIds: string[];

  @IsUUID()
  tutorId: string;

  @IsDateString()
  startTime: Date;

  @IsDateString()
  endTime: Date;

  @IsUUID()
  courseId: string;

  @IsOptional()
  @IsString()
  notes?: string;
}
```

Add the `IsArray` and `ArrayMinSize` imports at the top:

```typescript
import { IsString, IsEnum, IsOptional, IsBoolean, IsUUID, IsNumber, IsDateString, IsArray, Min, Max, Matches, ArrayMinSize } from 'class-validator';
```

Replace `UpdateAppointmentDto`:

```typescript
export class UpdateAppointmentDto {
  @IsOptional()
  @IsDateString()
  startTime?: Date;

  @IsOptional()
  @IsDateString()
  endTime?: Date;

  @IsOptional()
  @IsEnum(AppointmentStatus)
  status?: AppointmentStatus;

  @IsOptional()
  @IsString()
  notes?: string;
}
```

Add new DTO after `UpdateAppointmentDto`:

```typescript
export class CancelAppointmentDto {
  @IsBoolean()
  creditHoursBack: boolean;
}
```

**Step 2: Commit**

```bash
git add backend/src/scheduling/dto/index.ts
git commit -m "refactor: update scheduling DTOs for multi-student appointments and cancellation"
```

---

### Task 10: Update Scheduling Service — Tests First

**Files:**
- Modify: `backend/src/scheduling/scheduling.service.spec.ts`
- Modify: `backend/src/scheduling/scheduling.service.ts`

This is the largest task. Focus on the key changes:

1. `createAppointment` — accepts multiple studentIds, requires courseId
2. `cancelAppointment` — accepts `creditHoursBack` boolean, adjusts course balance
3. `findAppointmentsByStudent` — queries through ManyToMany
4. `completeAppointment` — handles multiple students in Google Calendar summary
5. Query updates — all `populate: ['student', ...]` → `populate: ['students', ...]`

**Step 1: Update the scheduling service spec**

Update `scheduling.service.spec.ts`. The key changes to existing tests:

- Mock fixtures: Replace `student` field with `students` collection mock
- `createAppointment` tests: Pass `studentIds` array and `courseId` (required)
- `cancelAppointment` tests: Add test for hour crediting
- All `populate` expectations: `'student'` → `'students'`

Due to the size of this file, update the mock appointment fixture:

```typescript
const mockAppointment = {
  id: 'apt-1',
  students: {
    getItems: () => [mockStudent],
    add: jest.fn(),
    isInitialized: () => true,
  },
  tutor: mockTutor,
  course: mockCourse,
  startTime: new Date('2026-03-05T10:00:00'),
  endTime: new Date('2026-03-05T11:00:00'),
  status: AppointmentStatus.SCHEDULED,
  notes: null,
  creditedBack: null,
  googleCalendarEventId: null,
  reminderSent: false,
  confirmationEmailSent: false,
  createdAt: new Date(),
  updatedAt: new Date(),
};
```

Add a test for cancel with hour crediting:

```typescript
describe('cancelAppointment', () => {
  it('should cancel and credit hours back to course when creditHoursBack is true', async () => {
    const course = { ...mockCourse, hoursBalance: 5, needsRenewal: false };
    const appointment = { ...mockAppointment, course };
    appointmentRepo.findOne.mockResolvedValue(appointment);
    em.flush.mockResolvedValue(undefined);

    const result = await service.cancelAppointment('apt-1', { creditHoursBack: true });

    expect(result.status).toBe(AppointmentStatus.CANCELLED);
    expect(result.creditedBack).toBe(true);
    expect(course.hoursBalance).toBe(6); // 5 + 1 hour
  });

  it('should cancel without crediting hours when creditHoursBack is false', async () => {
    const course = { ...mockCourse, hoursBalance: 5 };
    const appointment = { ...mockAppointment, course };
    appointmentRepo.findOne.mockResolvedValue(appointment);
    em.flush.mockResolvedValue(undefined);

    const result = await service.cancelAppointment('apt-1', { creditHoursBack: false });

    expect(result.status).toBe(AppointmentStatus.CANCELLED);
    expect(result.creditedBack).toBe(false);
    expect(course.hoursBalance).toBe(5); // unchanged
  });
});
```

**Step 2: Run tests to verify they fail**

Run: `cd backend && npx jest --testPathPattern=scheduling.service.spec --no-coverage 2>&1 | tail -20`

Expected: FAIL

**Step 3: Update the scheduling service implementation**

Key changes to `scheduling.service.ts`:

**3a. Update `createAppointment`:**

```typescript
async createAppointment(createAppointmentDto: CreateAppointmentDto) {
  const students: User[] = [];
  for (const studentId of createAppointmentDto.studentIds) {
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
    id: createAppointmentDto.tutorId,
    role: UserRole.TUTOR,
  });
  if (!tutor) {
    throw new NotFoundException(`Tutor with ID ${createAppointmentDto.tutorId} not found`);
  }

  const course = await this.courseRepository.findOne({ id: createAppointmentDto.courseId });
  if (!course) {
    throw new NotFoundException(`Course with ID ${createAppointmentDto.courseId} not found`);
  }

  // Check for time conflicts
  const conflicts = await this.checkTimeConflicts(
    tutor.id,
    createAppointmentDto.startTime,
    createAppointmentDto.endTime,
  );
  if (conflicts) {
    throw new BadRequestException('The selected time conflicts with another appointment');
  }

  const appointment = new Appointment(
    tutor,
    course,
    createAppointmentDto.startTime,
    createAppointmentDto.endTime,
  );
  appointment.students.add(...students);

  if (createAppointmentDto.notes) {
    appointment.notes = createAppointmentDto.notes;
  }

  // Create Google Calendar event
  const studentNames = students.map(s => s.fullName).join(', ');
  const calendarEventId = await this.googleCalendar.createEvent({
    summary: `Spanish Class: ${studentNames} with ${tutor.fullName}`,
    description: appointment.notes,
    startTime: appointment.startTime,
    endTime: appointment.endTime,
    attendeeEmails: [...students.map(s => s.email), tutor.email],
  });

  if (calendarEventId) {
    appointment.googleCalendarEventId = calendarEventId;
  }

  await this.em.persistAndFlush(appointment);

  try {
    await this.emailService.sendClassConfirmationEmail(appointment);
    appointment.confirmationEmailSent = true;
    await this.em.flush();
  } catch (error) {
    this.logger.error('Failed to send confirmation email', error.stack);
  }

  return appointment;
}
```

**3b. Update `cancelAppointment`:**

```typescript
async cancelAppointment(id: string, dto: CancelAppointmentDto) {
  const appointment = await this.findAppointmentById(id);
  appointment.status = AppointmentStatus.CANCELLED;
  appointment.creditedBack = dto.creditHoursBack;

  if (dto.creditHoursBack) {
    const durationHours = (appointment.endTime.getTime() - appointment.startTime.getTime()) / (1000 * 60 * 60);
    const course = appointment.course;
    course.hoursBalance = Number(course.hoursBalance) + durationHours;
    if (course.hoursBalance > 0) {
      course.needsRenewal = false;
    }
  }

  if (appointment.googleCalendarEventId) {
    await this.googleCalendar.deleteEvent(appointment.googleCalendarEventId);
  }

  await this.em.flush();

  try {
    await this.emailService.sendClassCancellationEmail(appointment);
  } catch (error) {
    this.logger.error('Failed to send cancellation email', error.stack);
  }

  return appointment;
}
```

**3c. Update all `populate` calls:**

Change every `populate: ['student', 'tutor']` and `populate: ['student', 'tutor', 'course']` to `populate: ['students', 'tutor', 'course']`.

**3d. Update `findAppointmentsByStudent`:**

```typescript
async findAppointmentsByStudent(studentId: string) {
  return this.appointmentRepository.find(
    { students: studentId },
    {
      populate: ['students', 'tutor', 'course'],
      orderBy: { startTime: 'ASC' },
    },
  );
}
```

**3e. Update `completeAppointment`:**

```typescript
async completeAppointment(id: string) {
  const appointment = await this.findAppointmentById(id);
  appointment.status = AppointmentStatus.COMPLETED;

  if (appointment.googleCalendarEventId) {
    const studentNames = appointment.students.getItems().map(s => s.fullName).join(', ');
    await this.googleCalendar.updateEvent(appointment.googleCalendarEventId, {
      summary: `Spanish Class: ${studentNames} with ${appointment.tutor.fullName} (Completed)`,
      description: appointment.notes,
      startTime: appointment.startTime,
      endTime: appointment.endTime,
    });
  }

  await this.em.flush();
  return appointment;
}
```

**3f. Update imports** — add `CancelAppointmentDto` to the import from `./dto`.

**Step 4: Run tests to verify they pass**

Run: `cd backend && npx jest --testPathPattern=scheduling.service.spec --no-coverage 2>&1 | tail -20`

Expected: PASS

**Step 5: Commit**

```bash
git add backend/src/scheduling/scheduling.service.ts backend/src/scheduling/scheduling.service.spec.ts
git commit -m "feat: update SchedulingService for multi-student appointments and hour crediting"
```

---

### Task 11: Update Scheduling Controller

**Files:**
- Modify: `backend/src/scheduling/scheduling.controller.ts`

**Step 1: Update the cancel endpoint to accept CancelAppointmentDto**

Change the cancel endpoint from:

```typescript
@Patch('appointments/:id/cancel')
async cancelAppointment(@Param('id') id: string) {
  return this.schedulingService.cancelAppointment(id);
}
```

To:

```typescript
@Patch('appointments/:id/cancel')
async cancelAppointment(@Param('id') id: string, @Body() dto: CancelAppointmentDto) {
  return this.schedulingService.cancelAppointment(id, dto);
}
```

Add `CancelAppointmentDto` to the import from `./dto`.

**Step 2: Commit**

```bash
git add backend/src/scheduling/scheduling.controller.ts
git commit -m "feat: update cancel endpoint to accept creditHoursBack"
```

---

### Task 12: Update Scheduling Module

**Files:**
- Modify: `backend/src/scheduling/scheduling.module.ts`

**Step 1: Add CourseSchedule to module imports**

```typescript
import { CourseSchedule } from '../courses/entities/course-schedule.entity';
```

Update the `MikroOrmModule.forFeature` array to include `CourseSchedule`:

```typescript
MikroOrmModule.forFeature([Availability, Appointment, Attendance, ClassReport, User, Course, CourseSchedule]),
```

**Step 2: Commit**

```bash
git add backend/src/scheduling/scheduling.module.ts
git commit -m "refactor: register CourseSchedule in SchedulingModule"
```

---

### Task 13: Add Appointment Auto-Generation Cron Job

**Files:**
- Create: `backend/src/scheduling/appointment-generator.service.ts`
- Create: `backend/src/scheduling/appointment-generator.service.spec.ts`
- Modify: `backend/src/scheduling/scheduling.module.ts`

**Step 1: Write the failing test**

Create `backend/src/scheduling/appointment-generator.service.spec.ts`:

```typescript
import { Test, TestingModule } from '@nestjs/testing';
import { EntityManager } from '@mikro-orm/core';
import { getRepositoryToken } from '@mikro-orm/nestjs';
import { AppointmentGeneratorService } from './appointment-generator.service';
import { Course } from '../courses/entities/course.entity';
import { CourseSchedule } from '../courses/entities/course-schedule.entity';
import { Appointment, AppointmentStatus } from './entities/appointment.entity';
import { User, UserRole } from '../users/entities/user.entity';

type MockRepo = Record<string, jest.Mock>;

describe('AppointmentGeneratorService', () => {
  let service: AppointmentGeneratorService;
  let courseRepo: MockRepo;
  let appointmentRepo: MockRepo;
  let em: Record<string, jest.Mock>;

  const mockTutor = {
    id: 'tutor-1',
    firstName: 'Maria',
    lastName: 'Garcia',
    role: UserRole.TUTOR,
  };

  const mockStudent = {
    id: 'student-1',
    firstName: 'Jim',
    lastName: 'Smith',
    role: UserRole.STUDENT,
  };

  const mockSchedule = {
    id: 'sched-1',
    dayOfWeek: 3, // Wednesday
    startTime: '10:00',
    endTime: '11:00',
  };

  const mockCourse = {
    id: 'course-1',
    title: 'Test Course',
    tutor: mockTutor,
    students: { getItems: () => [mockStudent], isInitialized: () => true },
    schedules: { getItems: () => [mockSchedule], isInitialized: () => true },
    startDate: new Date('2026-02-01'),
    isActive: true,
    hoursBalance: 10,
    needsRenewal: false,
  };

  beforeEach(async () => {
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

    service = module.get<AppointmentGeneratorService>(AppointmentGeneratorService);
  });

  it('should be defined', () => {
    expect(service).toBeDefined();
  });

  describe('generateAppointments', () => {
    it('should generate appointments for active courses with schedules', async () => {
      courseRepo.find.mockResolvedValue([mockCourse]);
      appointmentRepo.count.mockResolvedValue(0); // no existing appointments
      em.persistAndFlush.mockResolvedValue(undefined);
      em.flush.mockResolvedValue(undefined);

      await service.generateAppointments();

      expect(courseRepo.find).toHaveBeenCalledWith(
        { isActive: true },
        { populate: ['tutor', 'students', 'schedules'] },
      );
      // Should have created appointments (exact count depends on how many Wednesdays in 4 weeks)
      expect(em.persistAndFlush).toHaveBeenCalled();
    });

    it('should skip dates before course start date', async () => {
      const futureCourse = {
        ...mockCourse,
        startDate: new Date('2026-12-01'), // far future
      };
      courseRepo.find.mockResolvedValue([futureCourse]);

      await service.generateAppointments();

      // No appointments should be generated since start date is in the future
      expect(em.persistAndFlush).not.toHaveBeenCalled();
    });

    it('should skip slots where an appointment already exists', async () => {
      courseRepo.find.mockResolvedValue([mockCourse]);
      appointmentRepo.count.mockResolvedValue(1); // appointment already exists

      await service.generateAppointments();

      expect(em.persistAndFlush).not.toHaveBeenCalled();
    });

    it('should deduct hours from course balance', async () => {
      const course = { ...mockCourse, hoursBalance: 10 };
      courseRepo.find.mockResolvedValue([course]);
      appointmentRepo.count.mockResolvedValue(0);
      em.persistAndFlush.mockResolvedValue(undefined);
      em.flush.mockResolvedValue(undefined);

      await service.generateAppointments();

      // hoursBalance should be reduced
      expect(course.hoursBalance).toBeLessThan(10);
    });

    it('should set needsRenewal when balance reaches zero', async () => {
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
```

**Step 2: Run tests to verify they fail**

Run: `cd backend && npx jest --testPathPattern=appointment-generator --no-coverage 2>&1 | tail -20`

Expected: FAIL — file doesn't exist yet.

**Step 3: Write the implementation**

Create `backend/src/scheduling/appointment-generator.service.ts`:

```typescript
import { Injectable, Logger } from '@nestjs/common';
import { Cron, CronExpression } from '@nestjs/schedule';
import { EntityManager, EntityRepository } from '@mikro-orm/core';
import { InjectRepository } from '@mikro-orm/nestjs';
import { Course } from '../courses/entities/course.entity';
import { Appointment, AppointmentStatus } from './entities/appointment.entity';

@Injectable()
export class AppointmentGeneratorService {
  private readonly logger = new Logger(AppointmentGeneratorService.name);

  constructor(
    @InjectRepository(Course)
    private readonly courseRepository: EntityRepository<Course>,
    @InjectRepository(Appointment)
    private readonly appointmentRepository: EntityRepository<Appointment>,
    private readonly em: EntityManager,
  ) {}

  @Cron(CronExpression.EVERY_DAY_AT_2AM)
  async generateAppointments() {
    this.logger.log('Starting appointment generation...');

    const courses = await this.courseRepository.find(
      { isActive: true },
      { populate: ['tutor', 'students', 'schedules'] },
    );

    for (const course of courses) {
      const schedules = course.schedules.getItems();
      if (schedules.length === 0) continue;

      const students = course.students.getItems();
      if (students.length === 0) continue;

      const today = new Date();
      today.setHours(0, 0, 0, 0);

      const fourWeeksOut = new Date(today);
      fourWeeksOut.setDate(fourWeeksOut.getDate() + 28);

      const courseStart = new Date(course.startDate);
      courseStart.setHours(0, 0, 0, 0);

      const appointmentsToCreate: Appointment[] = [];

      for (const schedule of schedules) {
        // Walk each day from today (or course start, whichever is later) to 4 weeks out
        const start = courseStart > today ? courseStart : today;
        const current = new Date(start);

        while (current <= fourWeeksOut) {
          if (current.getDay() === schedule.dayOfWeek) {
            // Build the appointment start/end times
            const [startH, startM] = schedule.startTime.split(':').map(Number);
            const [endH, endM] = schedule.endTime.split(':').map(Number);

            const appointmentStart = new Date(current);
            appointmentStart.setHours(startH, startM, 0, 0);

            const appointmentEnd = new Date(current);
            appointmentEnd.setHours(endH, endM, 0, 0);

            // Skip if appointment already exists for this course + time
            const existing = await this.appointmentRepository.count({
              course: course.id,
              startTime: appointmentStart,
              status: { $ne: AppointmentStatus.CANCELLED },
            });

            if (existing === 0) {
              const appointment = new Appointment(
                course.tutor,
                course,
                appointmentStart,
                appointmentEnd,
              );
              appointment.students.add(...students);

              appointmentsToCreate.push(appointment);

              // Deduct hours
              const durationHours = (appointmentEnd.getTime() - appointmentStart.getTime()) / (1000 * 60 * 60);
              course.hoursBalance = Number(course.hoursBalance) - durationHours;
            }
          }

          current.setDate(current.getDate() + 1);
        }
      }

      if (appointmentsToCreate.length > 0) {
        await this.em.persistAndFlush(appointmentsToCreate);

        if (course.hoursBalance <= 0) {
          course.needsRenewal = true;
        }
        await this.em.flush();

        this.logger.log(`Generated ${appointmentsToCreate.length} appointments for course "${course.title}"`);
      }
    }

    this.logger.log('Appointment generation complete.');
  }
}
```

**Step 4: Register in scheduling module**

In `scheduling.module.ts`, add the import and provider:

```typescript
import { AppointmentGeneratorService } from './appointment-generator.service';
```

Add `AppointmentGeneratorService` to the `providers` array:

```typescript
providers: [SchedulingService, GoogleCalendarService, AppointmentGeneratorService],
```

**Step 5: Run tests to verify they pass**

Run: `cd backend && npx jest --testPathPattern=appointment-generator --no-coverage 2>&1 | tail -20`

Expected: PASS

**Step 6: Commit**

```bash
git add backend/src/scheduling/appointment-generator.service.ts backend/src/scheduling/appointment-generator.service.spec.ts backend/src/scheduling/scheduling.module.ts
git commit -m "feat: add daily cron job to auto-generate appointments 4 weeks ahead"
```

---

### Task 14: Fix Remaining Compilation Errors

At this point, there may be references to old Course fields (LearningLevel, description, lessons) or old Appointment fields (student singular) scattered across the codebase. These need to be found and fixed.

**Files:**
- Any file referencing `LearningLevel`, `CourseLesson`, `StudentCourse`, or `appointment.student` (singular)

**Step 1: Find all broken references**

Run: `cd backend && npx tsc --noEmit --pretty 2>&1`

Fix each error. Common fixes:
- Remove imports of `LearningLevel`, `CourseLesson`, `StudentCourse`
- Change `appointment.student` → `appointment.students`
- Update seed files if they reference old course structure
- Update any admin module references

**Step 2: Run full test suite**

Run: `cd backend && npx jest --no-coverage 2>&1 | tail -30`

Expected: All tests pass.

**Step 3: Commit**

```bash
git add -A
git commit -m "fix: resolve all compilation errors from course redesign"
```

---

### Task 15: Create Database Migration

**Files:**
- Create: `backend/src/migrations/Migration_YYYYMMDD_CourseRedesign.ts` (auto-generated)

**Step 1: Generate migration**

Run: `cd backend && npx mikro-orm migration:create`

This will generate a migration file that:
- Drops `course_lesson` table
- Drops `student_course` table
- Alters `course` table (removes description, learning_level, adds tutor_id, start_date, hours_balance, needs_renewal)
- Creates `course_schedule` table
- Creates `course_students` pivot table (for Course ManyToMany)
- Alters `appointment` table (removes student_id, adds credited_back)
- Creates `appointment_students` pivot table (for Appointment ManyToMany)

**Step 2: Review the generated migration**

Read the generated file and verify it looks correct. Ensure it doesn't drop data without warning.

**Step 3: Run the migration**

Run: `cd backend && npx mikro-orm migration:up`

Expected: Migration applied successfully.

**Step 4: Commit**

```bash
git add backend/src/migrations/
git commit -m "feat: add migration for course redesign schema changes"
```

---

### Task 16: Update Frontend CoursesContext

**Files:**
- Modify: `frontend/src/app/contexts/CoursesContext.tsx`

**Step 1: Rewrite type definitions**

Replace the Course-related types with:

```typescript
interface CourseSchedule {
  id: string;
  dayOfWeek: number;
  startTime: string;
  endTime: string;
}

interface Course {
  id: string;
  title: string;
  tutor: { id: string; firstName: string; lastName: string; email: string };
  students: { id: string; firstName: string; lastName: string; email: string }[];
  schedules: CourseSchedule[];
  startDate: string;
  isActive: boolean;
  hoursBalance: number;
  needsRenewal: boolean;
  createdAt: string;
  updatedAt: string;
}
```

**Step 2: Remove old types**

Remove `CourseLesson`, `StudentCourse`, and `LearningLevel` types.

**Step 3: Update context methods**

Replace methods to match new API:
- `fetchCourses()` — stays the same endpoint, new response shape
- Remove `fetchStudentCourses()`, `fetchLessonById()`, `enrollInCourse()`, `updateLessonProgress()`
- Add `createCourse(dto)`, `addStudent(courseId, studentId)`, `removeStudent(courseId, studentId)`, `adjustHours(courseId, hours)`

**Step 4: Commit**

```bash
git add frontend/src/app/contexts/CoursesContext.tsx
git commit -m "refactor: update CoursesContext for new course model"
```

---

### Task 17: Update Frontend SchedulingContext

**Files:**
- Modify: `frontend/src/app/contexts/SchedulingContext.tsx`

**Step 1: Update appointment type**

Change `student` field to `students` array in the Appointment interface.

**Step 2: Update cancelAppointment**

Update the `cancelAppointment` method to accept and send `creditHoursBack`:

```typescript
const cancelAppointment = async (appointmentId: string, creditHoursBack: boolean) => {
  await api.patch(`/scheduling/appointments/${appointmentId}/cancel`, { creditHoursBack });
  // refresh appointments...
};
```

**Step 3: Commit**

```bash
git add frontend/src/app/contexts/SchedulingContext.tsx
git commit -m "refactor: update SchedulingContext for multi-student appointments"
```

---

### Task 18: Update Frontend Course Pages

**Files:**
- Modify: `frontend/src/app/dashboard/courses/page.tsx`
- Modify: `frontend/src/app/dashboard/courses/new/page.tsx` (or create if different path)

**Step 1: Update course list page**

Update the courses list to display:
- Course title
- Tutor name
- Student names
- Schedule slots (e.g., "Wed 10:00-11:00, Fri 10:00-11:00")
- Hours balance with renewal badge
- Active/inactive status

**Step 2: Update course creation page**

Update the create form to include:
- Title input
- Tutor selector (dropdown)
- Student multi-selector
- Schedule slot builder (add/remove day+time pairs)
- Start date picker

**Step 3: Commit**

```bash
git add frontend/src/app/dashboard/courses/
git commit -m "feat: update course pages for new scheduled class group model"
```

---

### Task 19: Final Verification

**Step 1: Run full backend test suite**

Run: `cd backend && npm test 2>&1 | tail -30`

Expected: All tests pass.

**Step 2: Run backend build**

Run: `cd backend && npm run build`

Expected: Build succeeds.

**Step 3: Run frontend build**

Run: `cd frontend && npm run build`

Expected: Build succeeds.

**Step 4: Run linting**

Run: `cd backend && npm run lint && cd ../frontend && npm run lint`

Expected: No lint errors.

**Step 5: Commit any remaining fixes**

```bash
git add -A
git commit -m "chore: final cleanup from course redesign"
```
