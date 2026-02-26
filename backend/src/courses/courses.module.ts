import { Module } from "@nestjs/common";
import { MikroOrmModule } from "@mikro-orm/nestjs";
import { Course } from "./entities/course.entity";
import { CourseSchedule } from "./entities/course-schedule.entity";
import { CoursesController } from "./courses.controller";
import { CoursesService } from "./courses.service";
import { User } from "../users/entities/user.entity";

@Module({
  imports: [MikroOrmModule.forFeature([Course, CourseSchedule, User])],
  controllers: [CoursesController],
  providers: [CoursesService],
  exports: [CoursesService],
})
export class CoursesModule {}
