import {
  Controller,
  Get,
  Post,
  Patch,
  Delete,
  Body,
  Param,
  Query,
  UseGuards
} from '@nestjs/common';
import { SchedulingService } from './scheduling.service';
import { JwtAuthGuard } from '../common/guards/jwt-auth.guard';
import { RolesGuard } from '../common/guards/roles.guard';
import { Roles } from '../common/decorators/roles.decorator';
import { UserRole } from '../users/entities/user.entity';
import {
  CreateAppointmentDto,
  UpdateAppointmentDto,
  CancelAppointmentDto,
  CreateAvailabilityDto,
  UpdateAvailabilityDto,
  CreateAttendanceDto,
  UpdateAttendanceDto,
  CreateClassReportDto,
  UpdateClassReportDto,
} from './dto';

@Controller('scheduling')
@UseGuards(JwtAuthGuard, RolesGuard)
export class SchedulingController {
  constructor(private readonly schedulingService: SchedulingService) {}

  // Appointment endpoints
  @Get('appointments')
  @Roles(UserRole.ADMIN)
  async findAllAppointments() {
    return this.schedulingService.findAllAppointments();
  }

  @Get('appointments/:id')
  async findAppointmentById(@Param('id') id: string) {
    return this.schedulingService.findAppointmentById(id);
  }

  @Get('students/:id/appointments')
  async findAppointmentsByStudent(@Param('id') id: string) {
    return this.schedulingService.findAppointmentsByStudent(id);
  }

  @Get('tutors/:id/appointments')
  async findAppointmentsByTutor(@Param('id') id: string) {
    return this.schedulingService.findAppointmentsByTutor(id);
  }

  @Get('students/:id/upcoming-appointments')
  async findUpcomingAppointmentsByStudent(@Param('id') id: string) {
    return this.schedulingService.findUpcomingAppointmentsByStudent(id);
  }

  @Get('tutors/:id/upcoming-appointments')
  async findUpcomingAppointmentsByTutor(@Param('id') id: string) {
    return this.schedulingService.findUpcomingAppointmentsByTutor(id);
  }

  @Post('appointments')
  async createAppointment(@Body() createAppointmentDto: CreateAppointmentDto) {
    return this.schedulingService.createAppointment(createAppointmentDto);
  }

  @Patch('appointments/:id')
  async updateAppointment(
    @Param('id') id: string,
    @Body() updateAppointmentDto: UpdateAppointmentDto
  ) {
    return this.schedulingService.updateAppointment(id, updateAppointmentDto);
  }

  @Patch('appointments/:id/cancel')
  async cancelAppointment(@Param('id') id: string, @Body() dto: CancelAppointmentDto) {
    return this.schedulingService.cancelAppointment(id, dto);
  }

  @Patch('appointments/:id/complete')
  @Roles(UserRole.TUTOR, UserRole.ADMIN)
  async completeAppointment(@Param('id') id: string) {
    return this.schedulingService.completeAppointment(id);
  }

  // Availability endpoints
  @Get('availability/:id')
  async findAvailabilityById(@Param('id') id: string) {
    return this.schedulingService.findAvailabilityById(id);
  }

  @Get('tutors/:id/availability')
  async findAvailabilityByTutor(@Param('id') id: string) {
    return this.schedulingService.findAvailabilityByTutor(id);
  }

  @Post('availability')
  @Roles(UserRole.TUTOR, UserRole.ADMIN)
  async createAvailability(@Body() createAvailabilityDto: CreateAvailabilityDto) {
    return this.schedulingService.createAvailability(createAvailabilityDto);
  }

  @Patch('availability/:id')
  @Roles(UserRole.TUTOR, UserRole.ADMIN)
  async updateAvailability(
    @Param('id') id: string,
    @Body() updateAvailabilityDto: UpdateAvailabilityDto
  ) {
    return this.schedulingService.updateAvailability(id, updateAvailabilityDto);
  }

  @Delete('availability/:id')
  @Roles(UserRole.TUTOR, UserRole.ADMIN)
  async removeAvailability(@Param('id') id: string) {
    return this.schedulingService.removeAvailability(id);
  }

  // Attendance endpoints
  @Post('attendance')
  @Roles(UserRole.ADMIN, UserRole.TUTOR)
  async createAttendance(@Body() createAttendanceDto: CreateAttendanceDto) {
    return this.schedulingService.createAttendance(createAttendanceDto);
  }

  @Get('attendance/appointment/:appointmentId')
  async getAttendanceByAppointment(@Param('appointmentId') appointmentId: string) {
    return this.schedulingService.findAttendanceByAppointment(appointmentId);
  }

  @Get('attendance/student/:studentId')
  @Roles(UserRole.ADMIN, UserRole.TUTOR)
  async getAttendanceByStudent(@Param('studentId') studentId: string) {
    return this.schedulingService.findAttendanceByStudent(studentId);
  }

  @Patch('attendance/:id')
  @Roles(UserRole.ADMIN, UserRole.TUTOR)
  async updateAttendance(@Param('id') id: string, @Body() updateAttendanceDto: UpdateAttendanceDto) {
    return this.schedulingService.updateAttendance(id, updateAttendanceDto);
  }

  @Get('attendance/stats')
  @Roles(UserRole.ADMIN)
  async getAttendanceStats(@Query('studentId') studentId?: string, @Query('tutorId') tutorId?: string) {
    return this.schedulingService.getAttendanceStats(studentId, tutorId);
  }

  // Class Report endpoints
  @Post('class-reports')
  @Roles(UserRole.TUTOR)
  async createClassReport(@Body() createClassReportDto: CreateClassReportDto) {
    return this.schedulingService.createClassReport(createClassReportDto);
  }

  @Get('class-reports/appointment/:appointmentId')
  async getClassReportByAppointment(@Param('appointmentId') appointmentId: string) {
    return this.schedulingService.findClassReportByAppointment(appointmentId);
  }

  @Get('class-reports/tutor/:tutorId')
  @Roles(UserRole.ADMIN, UserRole.TUTOR)
  async getClassReportsByTutor(@Param('tutorId') tutorId: string) {
    return this.schedulingService.findClassReportsByTutor(tutorId);
  }

  @Patch('class-reports/:id')
  @Roles(UserRole.TUTOR)
  async updateClassReport(@Param('id') id: string, @Body() updateClassReportDto: UpdateClassReportDto) {
    return this.schedulingService.updateClassReport(id, updateClassReportDto);
  }

  @Delete('class-reports/:id')
  @Roles(UserRole.TUTOR, UserRole.ADMIN)
  async removeClassReport(@Param('id') id: string) {
    return this.schedulingService.removeClassReport(id);
  }

  // Stats endpoint
  @Get('stats')
  @Roles(UserRole.ADMIN)
  async getSchedulingStats() {
    return this.schedulingService.getSchedulingStats();
  }
}