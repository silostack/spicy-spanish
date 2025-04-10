import { IsEmail, IsNotEmpty, IsString, IsOptional, MinLength, IsPhoneNumber, IsUUID } from 'class-validator';

export class RegisterTutorDto {
  @IsUUID(4)
  @IsNotEmpty()
  token: string;

  @IsString()
  @IsNotEmpty()
  firstName: string;

  @IsString()
  @IsNotEmpty()
  lastName: string;

  @IsString()
  @IsNotEmpty()
  @MinLength(8)
  password: string;

  @IsString()
  @IsOptional()
  timezone?: string;

  @IsPhoneNumber()
  @IsOptional()
  phoneNumber?: string;

  @IsString()
  @IsOptional()
  bio?: string;
}