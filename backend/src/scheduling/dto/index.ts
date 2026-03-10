import {
  IsString,
  IsEnum,
  IsOptional,
  IsBoolean,
  IsUUID,
  IsNumber,
  IsDateString,
  Min,
  Max,
  Matches,
  IsArray,
  ArrayMinSize,
  ValidateNested,
} from "class-validator";
import { Type } from "class-transformer";
import { LessonStatus } from "../entities/lesson.entity";
import { AttendanceStatus } from "../entities/attendance.entity";

export class CreateLessonDto {
  @IsArray()
  @ArrayMinSize(1)
  @IsUUID(undefined, { each: true })
  studentIds: string[];

  @IsUUID()
  tutorId: string;

  @IsDateString()
  startTime: Date;

  @IsDateString()
  endTime: Date;

  @IsUUID()
  courseId: string;

  @IsOptional()
  @IsString()
  notes?: string;
}

export class UpdateLessonDto {
  @IsOptional()
  @IsDateString()
  startTime?: Date;

  @IsOptional()
  @IsDateString()
  endTime?: Date;

  @IsOptional()
  @IsEnum(LessonStatus)
  status?: LessonStatus;

  @IsOptional()
  @IsString()
  notes?: string;
}

export class CancelLessonDto {
  @IsBoolean()
  creditHoursBack: boolean;
}

export class CreateAvailabilityDto {
  @IsUUID()
  tutorId: string;

  @IsNumber()
  @Min(0)
  @Max(6)
  dayOfWeek: number;

  @Matches(/^\d{2}:\d{2}$/, { message: "startTime must be in HH:MM format" })
  startTime: string;

  @Matches(/^\d{2}:\d{2}$/, { message: "endTime must be in HH:MM format" })
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
  @Matches(/^\d{2}:\d{2}$/, { message: "startTime must be in HH:MM format" })
  startTime?: string;

  @IsOptional()
  @Matches(/^\d{2}:\d{2}$/, { message: "endTime must be in HH:MM format" })
  endTime?: string;

  @IsOptional()
  @IsBoolean()
  isRecurring?: boolean;

  @IsOptional()
  @IsDateString()
  specificDate?: Date;
}

export class CreateAttendanceDto {
  @IsOptional()
  @IsUUID()
  lessonId?: string;

  @IsOptional()
  @IsUUID()
  appointmentId?: string;

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
  @IsOptional()
  @IsUUID()
  lessonId?: string;

  @IsOptional()
  @IsUUID()
  appointmentId?: string;

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

export class CompleteLessonAttendanceDto {
  @IsUUID()
  studentId: string;

  @IsEnum(AttendanceStatus)
  status: AttendanceStatus;

  @IsOptional()
  @IsString()
  notes?: string;
}

export class CompleteLessonReportDto {
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

export class CompleteLessonDto {
  @IsArray()
  @ArrayMinSize(1)
  @ValidateNested({ each: true })
  @Type(() => CompleteLessonAttendanceDto)
  attendances: CompleteLessonAttendanceDto[];

  @IsOptional()
  @ValidateNested()
  @Type(() => CompleteLessonReportDto)
  report?: CompleteLessonReportDto;
}

export class RescheduleLessonDto {
  @IsDateString()
  startTime: Date;

  @IsDateString()
  endTime: Date;

  @IsOptional()
  @IsString()
  notes?: string;
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
