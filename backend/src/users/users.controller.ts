import {
  Controller,
  Get,
  Body,
  Patch,
  Param,
  Delete,
  UseGuards,
  Query,
  Logger,
} from "@nestjs/common";
import {
  IsEmail,
  IsOptional,
  IsString,
  IsDateString,
  IsBoolean,
  MinLength,
  IsNumber,
  IsIn,
} from "class-validator";
import { Type } from "class-transformer";
import { UsersService } from "./users.service";
import { JwtAuthGuard } from "../common/guards/jwt-auth.guard";
import { RolesGuard } from "../common/guards/roles.guard";
import { Roles } from "../common/decorators/roles.decorator";
import { UserRole } from "./entities/user.entity";

class UpdateUserDto {
  @IsOptional()
  @IsString()
  firstName?: string;

  @IsOptional()
  @IsString()
  lastName?: string;

  @IsOptional()
  @IsEmail()
  email?: string;

  @IsOptional()
  @IsString()
  @MinLength(8)
  password?: string;

  @IsOptional()
  @IsString()
  phoneNumber?: string;

  @IsOptional()
  @IsString()
  timezone?: string;

  @IsOptional()
  @IsString()
  bio?: string;

  @IsOptional()
  @IsDateString()
  dateOfBirth?: string;

  @IsOptional()
  @IsString()
  nationality?: string;

  @IsOptional()
  @IsString()
  profession?: string;

  @IsOptional()
  @IsString()
  address?: string;

  @IsOptional()
  @IsBoolean()
  isActive?: boolean;

  @IsOptional()
  @IsString()
  tutorExperience?: string;
}

class StudentListQueryDto {
  @IsOptional()
  @Type(() => Number)
  @IsNumber()
  page?: number;

  @IsOptional()
  @Type(() => Number)
  @IsNumber()
  limit?: number;

  @IsOptional()
  @IsString()
  search?: string;

  @IsOptional()
  @IsIn(["all", "active", "inactive", "new"])
  filter?: "all" | "active" | "inactive" | "new";
}

@Controller("users")
@UseGuards(JwtAuthGuard, RolesGuard)
export class UsersController {
  private readonly logger = new Logger(UsersController.name);

  constructor(private readonly usersService: UsersService) {}

  @Get()
  @Roles(UserRole.ADMIN)
  findAll() {
    return this.usersService.findAll();
  }

  @Get("students")
  @Roles(UserRole.ADMIN)
  getStudents(@Query() query: StudentListQueryDto) {
    // Convert string query params to numbers
    const parsedQuery = {
      ...query,
      page: query.page ? Number(query.page) : undefined,
      limit: query.limit ? Number(query.limit) : undefined,
    };
    return this.usersService.getStudentsWithPagination(parsedQuery);
  }

  @Get("tutors")
  @Roles(UserRole.ADMIN, UserRole.STUDENT)
  getTutors() {
    return this.usersService.getTutors();
  }

  @Get("tutors/:tutorId/students")
  @Roles(UserRole.ADMIN, UserRole.TUTOR)
  getStudentsByTutor(
    @Param("tutorId") tutorId: string,
    @Query() query: StudentListQueryDto,
  ) {
    // Convert string query params to numbers
    const parsedQuery = {
      ...query,
      page: query.page ? Number(query.page) : undefined,
      limit: query.limit ? Number(query.limit) : undefined,
    };
    return this.usersService.getStudentsByTutorId(tutorId, parsedQuery);
  }

  @Get("students/:id")
  @Roles(UserRole.ADMIN, UserRole.TUTOR)
  getStudentById(@Param("id") id: string) {
    return this.usersService.getStudentById(id);
  }

  @Get("count")
  @Roles(UserRole.ADMIN)
  countUsers() {
    return this.usersService.countUsers();
  }

  @Get(":id")
  @Roles(UserRole.ADMIN)
  findOne(@Param("id") id: string) {
    return this.usersService.findOne(id);
  }

  @Patch(":id")
  @Roles(UserRole.ADMIN, UserRole.TUTOR, UserRole.STUDENT)
  update(@Param("id") id: string, @Body() updateUserDto: UpdateUserDto) {
    this.logger.log(`Updating user ${id}`);

    // Transform the DTO to match User entity types
    const updateData: any = { ...updateUserDto };

    // Convert dateOfBirth string to Date if provided
    if (updateData.dateOfBirth && typeof updateData.dateOfBirth === "string") {
      updateData.dateOfBirth = new Date(updateData.dateOfBirth);
    }

    return this.usersService.update(id, updateData);
  }

  @Delete(":id")
  @Roles(UserRole.ADMIN)
  remove(@Param("id") id: string) {
    return this.usersService.remove(id);
  }
}
