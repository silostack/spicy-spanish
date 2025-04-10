import { Injectable, NotFoundException } from '@nestjs/common';
import { EntityManager, EntityRepository } from '@mikro-orm/core';
import { InjectRepository } from '@mikro-orm/nestjs';
import { Course } from './entities/course.entity';
import { CourseLesson } from './entities/course-lesson.entity';
import { StudentCourse } from './entities/student-course.entity';
import { User, UserRole } from '../users/entities/user.entity';

interface CreateCourseDto {
  title: string;
  description: string;
  isActive?: boolean;
}

interface UpdateCourseDto {
  title?: string;
  description?: string;
  isActive?: boolean;
}

interface CreateLessonDto {
  courseId: string;
  title: string;
  content: string;
  order: number;
}

interface UpdateLessonDto {
  title?: string;
  content?: string;
  order?: number;
}

interface AssignCourseDto {
  courseId: string;
  studentId: string;
  tutorId: string;
}

@Injectable()
export class CoursesService {
  constructor(
    @InjectRepository(Course)
    private readonly courseRepository: EntityRepository<Course>,
    @InjectRepository(CourseLesson)
    private readonly lessonRepository: EntityRepository<CourseLesson>,
    @InjectRepository(StudentCourse)
    private readonly studentCourseRepository: EntityRepository<StudentCourse>,
    @InjectRepository(User)
    private readonly userRepository: EntityRepository<User>,
    private readonly em: EntityManager,
  ) {}

  // Course methods
  async findAllCourses() {
    return this.courseRepository.findAll({
      orderBy: { title: 'ASC' },
    });
  }

  async findActiveCourses() {
    return this.courseRepository.find({ isActive: true }, {
      orderBy: { title: 'ASC' },
    });
  }

  async findCourseById(id: string) {
    const course = await this.courseRepository.findOne({ id }, {
      populate: ['lessons'],
    });
    
    if (!course) {
      throw new NotFoundException(`Course with ID ${id} not found`);
    }
    
    return course;
  }

  async createCourse(createCourseDto: CreateCourseDto) {
    const course = new Course(
      createCourseDto.title,
      createCourseDto.description,
      createCourseDto.isActive !== undefined ? createCourseDto.isActive : true,
    );
    
    await this.em.persistAndFlush(course);
    return course;
  }

  async updateCourse(id: string, updateCourseDto: UpdateCourseDto) {
    const course = await this.findCourseById(id);
    this.em.assign(course, updateCourseDto);
    await this.em.flush();
    return course;
  }

  async removeCourse(id: string) {
    const course = await this.findCourseById(id);
    await this.em.removeAndFlush(course);
    return { id, deleted: true };
  }

  // Lesson methods
  async findLessonById(id: string) {
    const lesson = await this.lessonRepository.findOne({ id }, {
      populate: ['course'],
    });
    
    if (!lesson) {
      throw new NotFoundException(`Lesson with ID ${id} not found`);
    }
    
    return lesson;
  }

  async createLesson(createLessonDto: CreateLessonDto) {
    const course = await this.findCourseById(createLessonDto.courseId);
    
    const lesson = new CourseLesson(
      course,
      createLessonDto.title,
      createLessonDto.content,
      createLessonDto.order,
    );
    
    await this.em.persistAndFlush(lesson);
    return lesson;
  }

  async updateLesson(id: string, updateLessonDto: UpdateLessonDto) {
    const lesson = await this.findLessonById(id);
    this.em.assign(lesson, updateLessonDto);
    await this.em.flush();
    return lesson;
  }

  async removeLesson(id: string) {
    const lesson = await this.findLessonById(id);
    await this.em.removeAndFlush(lesson);
    return { id, deleted: true };
  }

  // Student Course methods
  async findStudentCoursesById(id: string) {
    const studentCourse = await this.studentCourseRepository.findOne({ id }, {
      populate: ['student', 'tutor', 'course'],
    });
    
    if (!studentCourse) {
      throw new NotFoundException(`StudentCourse with ID ${id} not found`);
    }
    
    return studentCourse;
  }

  async findStudentCoursesByStudent(studentId: string) {
    return this.studentCourseRepository.find(
      { student: studentId },
      {
        populate: ['student', 'tutor', 'course'],
        orderBy: { createdAt: 'DESC' },
      }
    );
  }

  async findStudentCoursesByTutor(tutorId: string) {
    return this.studentCourseRepository.find(
      { tutor: tutorId },
      {
        populate: ['student', 'tutor', 'course'],
        orderBy: { createdAt: 'DESC' },
      }
    );
  }

  async assignCourse(assignCourseDto: AssignCourseDto) {
    const student = await this.userRepository.findOne({ 
      id: assignCourseDto.studentId,
      role: UserRole.STUDENT 
    });
    
    if (!student) {
      throw new NotFoundException(`Student with ID ${assignCourseDto.studentId} not found`);
    }
    
    const tutor = await this.userRepository.findOne({ 
      id: assignCourseDto.tutorId,
      role: UserRole.TUTOR 
    });
    
    if (!tutor) {
      throw new NotFoundException(`Tutor with ID ${assignCourseDto.tutorId} not found`);
    }
    
    const course = await this.findCourseById(assignCourseDto.courseId);
    
    const studentCourse = new StudentCourse(
      student,
      tutor,
      course
    );
    
    await this.em.persistAndFlush(studentCourse);
    return studentCourse;
  }

  async updateStudentCourseProgress(id: string, progress: number) {
    const studentCourse = await this.findStudentCoursesById(id);
    studentCourse.progress = progress;
    await this.em.flush();
    return studentCourse;
  }

  async removeStudentCourse(id: string) {
    const studentCourse = await this.findStudentCoursesById(id);
    await this.em.removeAndFlush(studentCourse);
    return { id, deleted: true };
  }

  // Dashboard stats
  async getCourseStats() {
    const [
      totalCourses,
      totalLessons,
      activeCourseAssignments,
      studentCourses
    ] = await Promise.all([
      this.courseRepository.count(),
      this.lessonRepository.count(),
      this.studentCourseRepository.count(),
      this.studentCourseRepository.findAll()
    ]);
    
    // Calculate completed lessons from progress
    let completedLessons = 0;
    for (const sc of studentCourses) {
      if (sc.progress > 0) {
        // Get total lessons for this course
        const courseLessons = await this.lessonRepository.count({ course: sc.course });
        // Calculate completed lessons based on progress percentage
        const courseCompletedLessons = Math.floor(courseLessons * (sc.progress / 100));
        completedLessons += courseCompletedLessons;
      }
    }
    
    const recentAssignments = await this.studentCourseRepository.find(
      {},
      {
        populate: ['student', 'tutor', 'course'],
        orderBy: { createdAt: 'DESC' },
        limit: 5,
      }
    );
    
    return {
      totalCourses,
      totalLessons,
      activeCourseAssignments,
      completedLessons,
      recentAssignments,
    };
  }
}