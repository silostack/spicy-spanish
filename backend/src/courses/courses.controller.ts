import {
  Controller,
  Get,
  Post,
  Body,
  Patch,
  Param,
  Delete,
  UseGuards,
} from "@nestjs/common";
import { CoursesService } from "./courses.service";
import { JwtAuthGuard } from "../common/guards/jwt-auth.guard";
import { RolesGuard } from "../common/guards/roles.guard";
import { Roles } from "../common/decorators/roles.decorator";
import { UserRole } from "../users/entities/user.entity";
import {
  CreateCourseDto,
  UpdateCourseDto,
  AddStudentDto,
  RemoveStudentDto,
  AddScheduleDto,
  AdjustHoursDto,
} from "./dto";

@Controller("courses")
@UseGuards(JwtAuthGuard, RolesGuard)
export class CoursesController {
  constructor(private readonly coursesService: CoursesService) {}

  @Get()
  findAllCourses() {
    return this.coursesService.findAllCourses();
  }

  @Get("active")
  findActiveCourses() {
    return this.coursesService.findActiveCourses();
  }

  @Get("tutor/:tutorId")
  findCoursesByTutor(@Param("tutorId") tutorId: string) {
    return this.coursesService.findCoursesByTutor(tutorId);
  }

  @Get("student/:studentId")
  findCoursesByStudent(@Param("studentId") studentId: string) {
    return this.coursesService.findCoursesByStudent(studentId);
  }

  @Get("stats")
  @Roles(UserRole.ADMIN)
  getCourseStats() {
    return this.coursesService.getCourseStats();
  }

  @Get(":id")
  findCourseById(@Param("id") id: string) {
    return this.coursesService.findCourseById(id);
  }

  @Post()
  @Roles(UserRole.ADMIN)
  createCourse(@Body() dto: CreateCourseDto) {
    return this.coursesService.createCourse(dto);
  }

  @Patch(":id")
  @Roles(UserRole.ADMIN)
  updateCourse(@Param("id") id: string, @Body() dto: UpdateCourseDto) {
    return this.coursesService.updateCourse(id, dto);
  }

  // Student management
  @Post(":id/students")
  @Roles(UserRole.ADMIN)
  addStudent(@Param("id") id: string, @Body() dto: AddStudentDto) {
    return this.coursesService.addStudent(id, dto);
  }

  @Delete(":id/students")
  @Roles(UserRole.ADMIN)
  removeStudent(@Param("id") id: string, @Body() dto: RemoveStudentDto) {
    return this.coursesService.removeStudent(id, dto);
  }

  // Schedule management
  @Post(":id/schedules")
  @Roles(UserRole.ADMIN)
  addSchedule(@Param("id") id: string, @Body() dto: AddScheduleDto) {
    return this.coursesService.addSchedule(id, dto);
  }

  @Delete("schedules/:scheduleId")
  @Roles(UserRole.ADMIN)
  removeSchedule(@Param("scheduleId") scheduleId: string) {
    return this.coursesService.removeSchedule(scheduleId);
  }

  // Hours management
  @Patch(":id/hours")
  @Roles(UserRole.ADMIN)
  adjustHours(@Param("id") id: string, @Body() dto: AdjustHoursDto) {
    return this.coursesService.adjustHours(id, dto);
  }

  @Delete(":id")
  @Roles(UserRole.ADMIN)
  removeCourse(@Param("id") id: string) {
    return this.coursesService.removeCourse(id);
  }
}
