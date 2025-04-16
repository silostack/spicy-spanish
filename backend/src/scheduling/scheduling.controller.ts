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
import { AppointmentStatus } from './entities/appointment.entity';

// DTO interfaces for type safety
interface CreateAppointmentDto {
  studentId: string;
  tutorId: string;
  startTime: Date;
  endTime: Date;
  notes?: string;
}

interface UpdateAppointmentDto {
  startTime?: Date;
  endTime?: Date;
  status?: AppointmentStatus;
  notes?: string;
}

interface CreateAvailabilityDto {
  tutorId: string;
  dayOfWeek: number;
  startTime: string;
  endTime: string;
  isRecurring?: boolean;
  specificDate?: Date;
}

interface UpdateAvailabilityDto {
  dayOfWeek?: number;
  startTime?: string;
  endTime?: string;
  isRecurring?: boolean;
  specificDate?: Date;
}

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
  async cancelAppointment(@Param('id') id: string) {
    return this.schedulingService.cancelAppointment(id);
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

  // Stats endpoint
  @Get('stats')
  @Roles(UserRole.ADMIN)
  async getSchedulingStats() {
    return this.schedulingService.getSchedulingStats();
  }
}