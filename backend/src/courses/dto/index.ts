import {
  IsString,
  IsOptional,
  IsBoolean,
  IsUUID,
  IsNumber,
  IsDateString,
  IsArray,
  Min,
  Max,
  Matches,
  ValidateNested,
  ArrayMinSize,
} from "class-validator";
import { Type } from "class-transformer";

export class ScheduleSlotDto {
  @IsNumber()
  @Min(0)
  @Max(6)
  dayOfWeek: number;

  @Matches(/^\d{2}:\d{2}$/, { message: "startTime must be in HH:MM format" })
  startTime: string;

  @Matches(/^\d{2}:\d{2}$/, { message: "endTime must be in HH:MM format" })
  endTime: string;
}

export class CreateCourseDto {
  @IsString()
  title: string;

  @IsUUID()
  tutorId: string;

  @IsArray()
  @IsUUID(undefined, { each: true })
  @ArrayMinSize(1)
  studentIds: string[];

  @IsDateString()
  startDate: string;

  @IsArray()
  @ValidateNested({ each: true })
  @Type(() => ScheduleSlotDto)
  @ArrayMinSize(1)
  schedules: ScheduleSlotDto[];
}

export class UpdateCourseDto {
  @IsOptional()
  @IsString()
  title?: string;

  @IsOptional()
  @IsBoolean()
  isActive?: boolean;
}

export class AddStudentDto {
  @IsUUID()
  studentId: string;
}

export class RemoveStudentDto {
  @IsUUID()
  studentId: string;
}

export class AddScheduleDto {
  @IsNumber()
  @Min(0)
  @Max(6)
  dayOfWeek: number;

  @Matches(/^\d{2}:\d{2}$/, { message: "startTime must be in HH:MM format" })
  startTime: string;

  @Matches(/^\d{2}:\d{2}$/, { message: "endTime must be in HH:MM format" })
  endTime: string;
}

export class AdjustHoursDto {
  @IsNumber()
  @Min(-1000)
  hours: number;
}
