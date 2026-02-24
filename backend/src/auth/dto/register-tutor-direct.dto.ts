// backend/src/auth/dto/register-tutor-direct.dto.ts
import { IsEmail, IsNotEmpty, IsString, IsOptional, MinLength } from 'class-validator';

export class RegisterTutorDirectDto {
  @IsString()
  @IsNotEmpty()
  firstName: string;

  @IsString()
  @IsNotEmpty()
  lastName: string;

  @IsEmail()
  @IsNotEmpty()
  email: string;

  @IsString()
  @IsNotEmpty()
  @MinLength(8)
  password: string;

  @IsString()
  @IsOptional()
  timezone?: string;

  @IsString()
  @IsOptional()
  phoneNumber?: string;
}
