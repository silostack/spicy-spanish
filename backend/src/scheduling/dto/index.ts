import { IsString, IsEnum, IsOptional, IsBoolean, IsUUID, IsNumber, IsDateString, Min, Max, Matches } from 'class-validator';
import { AppointmentStatus } from '../entities/appointment.entity';
import { AttendanceStatus } from '../entities/attendance.entity';

export class CreateAppointmentDto {
  @IsUUID()
  studentId: string;

  @IsUUID()
  tutorId: string;

  @IsDateString()
  startTime: Date;

  @IsDateString()
  endTime: Date;

  @IsOptional()
  @IsUUID()
  courseId?: string;

  @IsOptional()
  @IsString()
  notes?: string;
}

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
  @IsUUID()
  courseId?: string;

  @IsOptional()
  @IsString()
  notes?: string;
}

export class CreateAvailabilityDto {
  @IsUUID()
  tutorId: string;

  @IsNumber()
  @Min(0)
  @Max(6)
  dayOfWeek: number;

  @Matches(/^\d{2}:\d{2}$/, { message: 'startTime must be in HH:MM format' })
  startTime: string;

  @Matches(/^\d{2}:\d{2}$/, { message: 'endTime must be in HH:MM format' })
  endTime: string;

  @IsOptional()
  @IsBoolean()
  isRecurring?: boolean;

  @IsOptional()
  @IsDateString()
  specificDate?: Date;
}

export class UpdateAvailabilityDto {
  @IsOptional()
  @IsNumber()
  @Min(0)
  @Max(6)
  dayOfWeek?: number;

  @IsOptional()
  @Matches(/^\d{2}:\d{2}$/, { message: 'startTime must be in HH:MM format' })
  startTime?: string;

  @IsOptional()
  @Matches(/^\d{2}:\d{2}$/, { message: 'endTime must be in HH:MM format' })
  endTime?: string;

  @IsOptional()
  @IsBoolean()
  isRecurring?: boolean;

  @IsOptional()
  @IsDateString()
  specificDate?: Date;
}

export class CreateAttendanceDto {
  @IsUUID()
  appointmentId: string;

  @IsUUID()
  studentId: string;

  @IsEnum(AttendanceStatus)
  status: AttendanceStatus;

  @IsOptional()
  @IsString()
  notes?: string;

  @IsOptional()
  @IsBoolean()
  markedByTutor?: boolean;
}

export class UpdateAttendanceDto {
  @IsOptional()
  @IsEnum(AttendanceStatus)
  status?: AttendanceStatus;

  @IsOptional()
  @IsString()
  notes?: string;
}

export class CreateClassReportDto {
  @IsUUID()
  appointmentId: string;

  @IsUUID()
  tutorId: string;

  @IsString()
  subject: string;

  @IsString()
  content: string;

  @IsOptional()
  @IsString()
  homeworkAssigned?: string;

  @IsOptional()
  @IsString()
  studentProgress?: string;

  @IsOptional()
  @IsString()
  nextLessonNotes?: string;
}

export class UpdateClassReportDto {
  @IsOptional()
  @IsString()
  subject?: string;

  @IsOptional()
  @IsString()
  content?: string;

  @IsOptional()
  @IsString()
  homeworkAssigned?: string;

  @IsOptional()
  @IsString()
  studentProgress?: string;

  @IsOptional()
  @IsString()
  nextLessonNotes?: string;
}
