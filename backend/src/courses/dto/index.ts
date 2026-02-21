import { IsString, IsEnum, IsOptional, IsBoolean, IsUUID, IsNumber, Min, Max } from 'class-validator';
import { LearningLevel } from '../entities/course.entity';

export class CreateCourseDto {
  @IsString()
  title: string;

  @IsString()
  description: string;

  @IsEnum(LearningLevel)
  learningLevel: LearningLevel;

  @IsOptional()
  @IsBoolean()
  isActive?: boolean;
}

export class UpdateCourseDto {
  @IsOptional()
  @IsString()
  title?: string;

  @IsOptional()
  @IsString()
  description?: string;

  @IsOptional()
  @IsEnum(LearningLevel)
  learningLevel?: LearningLevel;

  @IsOptional()
  @IsBoolean()
  isActive?: boolean;
}

export class CreateLessonDto {
  @IsUUID()
  courseId: string;

  @IsString()
  title: string;

  @IsString()
  content: string;

  @IsNumber()
  @Min(0)
  order: number;
}

export class UpdateLessonDto {
  @IsOptional()
  @IsString()
  title?: string;

  @IsOptional()
  @IsString()
  content?: string;

  @IsOptional()
  @IsNumber()
  @Min(0)
  order?: number;
}

export class AssignCourseDto {
  @IsUUID()
  courseId: string;

  @IsUUID()
  studentId: string;

  @IsUUID()
  tutorId: string;
}

export class UpdateProgressDto {
  @IsNumber()
  @Min(0)
  @Max(100)
  progress: number;
}
