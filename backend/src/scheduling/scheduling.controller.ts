import {
  Controller,
  Get,
  Post,
  Patch,
  Delete,
  Body,
  Param,
  Query,
  UseGuards,
  Req,
} from "@nestjs/common";
import type { Request } from "express";
import { SchedulingService } from "./scheduling.service";
import { JwtAuthGuard } from "../common/guards/jwt-auth.guard";
import { RolesGuard } from "../common/guards/roles.guard";
import { Roles } from "../common/decorators/roles.decorator";
import { User, UserRole } from "../users/entities/user.entity";
import {
  CreateLessonDto,
  UpdateLessonDto,
  CancelLessonDto,
  CompleteLessonDto,
  RescheduleLessonDto,
  CreateAvailabilityDto,
  UpdateAvailabilityDto,
  CreateAttendanceDto,
  UpdateAttendanceDto,
  CreateClassReportDto,
  UpdateClassReportDto,
} from "./dto";

@Controller("scheduling")
@UseGuards(JwtAuthGuard, RolesGuard)
export class SchedulingController {
  constructor(private readonly schedulingService: SchedulingService) {}

  // Lesson endpoints
  @Get("lessons")
  @Roles(UserRole.ADMIN)
  async findAllLessons() {
    return this.schedulingService.findAllLessons();
  }

  @Get("lessons/:id")
  async findLessonById(@Param("id") id: string) {
    return this.schedulingService.findLessonById(id);
  }

  @Get("courses/:courseId/lessons")
  async findLessonsByCourse(
    @Param("courseId") courseId: string,
    @Query("category") category: "upcoming" | "needs-attendance" | "recent" | undefined,
    @Req() req: Request & { user: User },
  ) {
    return this.schedulingService.findLessonsByCourse(courseId, req.user, category);
  }

  @Get("students/:id/lessons")
  async findLessonsByStudent(@Param("id") id: string) {
    return this.schedulingService.findLessonsByStudent(id);
  }

  @Get("tutors/:id/lessons")
  async findLessonsByTutor(@Param("id") id: string) {
    return this.schedulingService.findLessonsByTutor(id);
  }

  @Get("students/:id/upcoming-lessons")
  async findUpcomingLessonsByStudent(@Param("id") id: string) {
    return this.schedulingService.findUpcomingLessonsByStudent(id);
  }

  @Get("tutors/:id/upcoming-lessons")
  async findUpcomingLessonsByTutor(@Param("id") id: string) {
    return this.schedulingService.findUpcomingLessonsByTutor(id);
  }

  @Post("lessons")
  async createLesson(@Body() createLessonDto: CreateLessonDto) {
    return this.schedulingService.createLesson(createLessonDto);
  }

  @Patch("lessons/:id")
  async updateLesson(
    @Param("id") id: string,
    @Body() updateLessonDto: UpdateLessonDto,
  ) {
    return this.schedulingService.updateLesson(id, updateLessonDto);
  }

  @Patch("lessons/:id/reschedule")
  @Roles(UserRole.TUTOR, UserRole.ADMIN)
  async rescheduleLesson(
    @Param("id") id: string,
    @Body() dto: RescheduleLessonDto,
  ) {
    return this.schedulingService.rescheduleLesson(id, dto);
  }

  @Patch("lessons/:id/cancel")
  async cancelLesson(
    @Param("id") id: string,
    @Body() dto: CancelLessonDto,
  ) {
    return this.schedulingService.cancelLesson(id, dto);
  }

  @Post("lessons/:id/complete")
  @Roles(UserRole.TUTOR, UserRole.ADMIN)
  async completeLesson(
    @Param("id") id: string,
    @Body() dto: CompleteLessonDto,
    @Req() req: Request & { user: User },
  ) {
    return this.schedulingService.completeLesson(id, dto, req.user);
  }

  // Availability endpoints
  @Get("availability/:id")
  async findAvailabilityById(@Param("id") id: string) {
    return this.schedulingService.findAvailabilityById(id);
  }

  @Get("tutors/:id/availability")
  async findAvailabilityByTutor(@Param("id") id: string) {
    return this.schedulingService.findAvailabilityByTutor(id);
  }

  @Post("availability")
  @Roles(UserRole.TUTOR, UserRole.ADMIN)
  async createAvailability(
    @Body() createAvailabilityDto: CreateAvailabilityDto,
  ) {
    return this.schedulingService.createAvailability(createAvailabilityDto);
  }

  @Patch("availability/:id")
  @Roles(UserRole.TUTOR, UserRole.ADMIN)
  async updateAvailability(
    @Param("id") id: string,
    @Body() updateAvailabilityDto: UpdateAvailabilityDto,
  ) {
    return this.schedulingService.updateAvailability(id, updateAvailabilityDto);
  }

  @Delete("availability/:id")
  @Roles(UserRole.TUTOR, UserRole.ADMIN)
  async removeAvailability(@Param("id") id: string) {
    return this.schedulingService.removeAvailability(id);
  }

  // Attendance endpoints
  @Post("attendance")
  @Roles(UserRole.ADMIN, UserRole.TUTOR)
  async createAttendance(@Body() createAttendanceDto: CreateAttendanceDto) {
    return this.schedulingService.createAttendance(createAttendanceDto);
  }

  @Get("attendance/lesson/:lessonId")
  async getAttendanceByLesson(@Param("lessonId") lessonId: string) {
    return this.schedulingService.findAttendanceByLesson(lessonId);
  }

  @Get("attendance/student/:studentId")
  @Roles(UserRole.ADMIN, UserRole.TUTOR)
  async getAttendanceByStudent(@Param("studentId") studentId: string) {
    return this.schedulingService.findAttendanceByStudent(studentId);
  }

  @Patch("attendance/:id")
  @Roles(UserRole.ADMIN, UserRole.TUTOR)
  async updateAttendance(
    @Param("id") id: string,
    @Body() updateAttendanceDto: UpdateAttendanceDto,
  ) {
    return this.schedulingService.updateAttendance(id, updateAttendanceDto);
  }

  @Get("attendance/stats")
  @Roles(UserRole.ADMIN)
  async getAttendanceStats(
    @Query("studentId") studentId?: string,
    @Query("tutorId") tutorId?: string,
  ) {
    return this.schedulingService.getAttendanceStats(studentId, tutorId);
  }

  // Class Report endpoints
  @Post("class-reports")
  @Roles(UserRole.TUTOR)
  async createClassReport(@Body() createClassReportDto: CreateClassReportDto) {
    return this.schedulingService.createClassReport(createClassReportDto);
  }

  @Get("class-reports/lesson/:lessonId")
  async getClassReportByLesson(@Param("lessonId") lessonId: string) {
    return this.schedulingService.findClassReportByLesson(lessonId);
  }

  @Get("class-reports/tutor/:tutorId")
  @Roles(UserRole.ADMIN, UserRole.TUTOR)
  async getClassReportsByTutor(@Param("tutorId") tutorId: string) {
    return this.schedulingService.findClassReportsByTutor(tutorId);
  }

  @Patch("class-reports/:id")
  @Roles(UserRole.TUTOR)
  async updateClassReport(
    @Param("id") id: string,
    @Body() updateClassReportDto: UpdateClassReportDto,
  ) {
    return this.schedulingService.updateClassReport(id, updateClassReportDto);
  }

  @Delete("class-reports/:id")
  @Roles(UserRole.TUTOR, UserRole.ADMIN)
  async removeClassReport(@Param("id") id: string) {
    return this.schedulingService.removeClassReport(id);
  }

  // Stats endpoint
  @Get("stats")
  @Roles(UserRole.ADMIN)
  async getSchedulingStats() {
    return this.schedulingService.getSchedulingStats();
  }
}
