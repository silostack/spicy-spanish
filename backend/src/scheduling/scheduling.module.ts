import { Module } from "@nestjs/common";
import { MikroOrmModule } from "@mikro-orm/nestjs";
import { Availability } from "./entities/availability.entity";
import { Lesson } from "./entities/lesson.entity";
import { Attendance } from "./entities/attendance.entity";
import { ClassReport } from "./entities/class-report.entity";
import { User } from "../users/entities/user.entity";
import { Course } from "../courses/entities/course.entity";
import { CourseSchedule } from "../courses/entities/course-schedule.entity";
import { SchedulingController } from "./scheduling.controller";
import { SchedulingService } from "./scheduling.service";
import { GoogleCalendarService } from "./google-calendar.service";
import { LessonGeneratorService } from "./lesson-generator.service";
import { EmailModule } from "../email/email.module";

@Module({
  imports: [
    MikroOrmModule.forFeature([
      Availability,
      Lesson,
      Attendance,
      ClassReport,
      User,
      Course,
      CourseSchedule,
    ]),
    EmailModule,
  ],
  controllers: [SchedulingController],
  providers: [
    SchedulingService,
    GoogleCalendarService,
    LessonGeneratorService,
  ],
  exports: [SchedulingService],
})
export class SchedulingModule {}
