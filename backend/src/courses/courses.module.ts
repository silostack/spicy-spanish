import { Module } from '@nestjs/common';
import { MikroOrmModule } from '@mikro-orm/nestjs';
import { Course } from './entities/course.entity';
import { CourseLesson } from './entities/course-lesson.entity';
import { StudentCourse } from './entities/student-course.entity';
import { CoursesController } from './courses.controller';
import { CoursesService } from './courses.service';
import { User } from '../users/entities/user.entity';

@Module({
  imports: [MikroOrmModule.forFeature([Course, CourseLesson, StudentCourse, User])],
  controllers: [CoursesController],
  providers: [CoursesService],
  exports: [CoursesService],
})
export class CoursesModule {}
