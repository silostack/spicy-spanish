import { Controller, Get, Post, Body, Patch, Param, Delete, UseGuards, Query } from '@nestjs/common';
import { CoursesService } from './courses.service';
import { JwtAuthGuard } from '../common/guards/jwt-auth.guard';
import { RolesGuard } from '../common/guards/roles.guard';
import { Roles } from '../common/decorators/roles.decorator';
import { UserRole } from '../users/entities/user.entity';
import { LearningLevel } from './entities/course.entity';

// DTOs
class CreateCourseDto {
  title: string;
  description: string;
  learningLevel: LearningLevel;
  isActive?: boolean;
}

class UpdateCourseDto {
  title?: string;
  description?: string;
  learningLevel?: LearningLevel;
  isActive?: boolean;
}

class CreateLessonDto {
  courseId: string;
  title: string;
  content: string;
  order: number;
}

class UpdateLessonDto {
  title?: string;
  content?: string;
  order?: number;
}

class AssignCourseDto {
  courseId: string;
  studentId: string;
  tutorId: string;
}

@Controller('courses')
@UseGuards(JwtAuthGuard, RolesGuard)
export class CoursesController {
  constructor(private readonly coursesService: CoursesService) {}

  // Course endpoints
  @Get()
  findAllCourses() {
    return this.coursesService.findAllCourses();
  }

  @Get('active')
  findActiveCourses() {
    return this.coursesService.findActiveCourses();
  }

  @Get('level/:learningLevel')
  findCoursesByLevel(@Param('learningLevel') learningLevel: LearningLevel) {
    return this.coursesService.findCoursesByLevel(learningLevel);
  }

  @Get(':id')
  findCourseById(@Param('id') id: string) {
    return this.coursesService.findCourseById(id);
  }

  @Post()
  @Roles(UserRole.ADMIN)
  createCourse(@Body() createCourseDto: CreateCourseDto) {
    return this.coursesService.createCourse(createCourseDto);
  }

  @Patch(':id')
  @Roles(UserRole.ADMIN)
  updateCourse(@Param('id') id: string, @Body() updateCourseDto: UpdateCourseDto) {
    return this.coursesService.updateCourse(id, updateCourseDto);
  }

  @Delete(':id')
  @Roles(UserRole.ADMIN)
  removeCourse(@Param('id') id: string) {
    return this.coursesService.removeCourse(id);
  }

  // Lesson endpoints
  @Get('lessons/:id')
  findLessonById(@Param('id') id: string) {
    return this.coursesService.findLessonById(id);
  }

  @Post('lessons')
  @Roles(UserRole.ADMIN)
  createLesson(@Body() createLessonDto: CreateLessonDto) {
    return this.coursesService.createLesson(createLessonDto);
  }

  @Patch('lessons/:id')
  @Roles(UserRole.ADMIN)
  updateLesson(@Param('id') id: string, @Body() updateLessonDto: UpdateLessonDto) {
    return this.coursesService.updateLesson(id, updateLessonDto);
  }

  @Delete('lessons/:id')
  @Roles(UserRole.ADMIN)
  removeLesson(@Param('id') id: string) {
    return this.coursesService.removeLesson(id);
  }

  // Student Course endpoints
  @Get('assignments/:id')
  findStudentCoursesById(@Param('id') id: string) {
    return this.coursesService.findStudentCoursesById(id);
  }

  @Get('assignments/student/:studentId')
  findStudentCoursesByStudent(@Param('studentId') studentId: string) {
    return this.coursesService.findStudentCoursesByStudent(studentId);
  }

  @Get('assignments/tutor/:tutorId')
  findStudentCoursesByTutor(@Param('tutorId') tutorId: string) {
    return this.coursesService.findStudentCoursesByTutor(tutorId);
  }

  @Post('assignments')
  @Roles(UserRole.ADMIN)
  assignCourse(@Body() assignCourseDto: AssignCourseDto) {
    return this.coursesService.assignCourse(assignCourseDto);
  }

  @Patch('assignments/:id/progress')
  updateStudentCourseProgress(@Param('id') id: string, @Body() updateData: { progress: number }) {
    return this.coursesService.updateStudentCourseProgress(id, updateData.progress);
  }

  @Delete('assignments/:id')
  @Roles(UserRole.ADMIN)
  removeStudentCourse(@Param('id') id: string) {
    return this.coursesService.removeStudentCourse(id);
  }

  // Stats
  @Get('stats')
  @Roles(UserRole.ADMIN)
  getCourseStats() {
    return this.coursesService.getCourseStats();
  }
}