import { Controller, Post, Body, UseGuards, Req, Get } from "@nestjs/common";
import { AuthService } from "./auth.service";
import { UsersService } from "../users/users.service";
import { LoginDto } from "./dto/login.dto";
import { RegisterStudentDto } from "./dto/register-student.dto";
import { RegisterTutorDto } from "./dto/register-tutor.dto";
import { RegisterTutorDirectDto } from "./dto/register-tutor-direct.dto";
import { JwtAuthGuard } from "../common/guards/jwt-auth.guard";
import { RolesGuard } from "../common/guards/roles.guard";
import { Roles } from "../common/decorators/roles.decorator";
import { UserRole } from "../users/entities/user.entity";

@Controller("auth")
export class AuthController {
  constructor(
    private readonly authService: AuthService,
    private readonly usersService: UsersService,
  ) {}

  @Get("test")
  test() {
    return { message: "Auth controller is working!" };
  }

  @Post("login")
  async login(@Body() loginDto: LoginDto) {
    return this.authService.login(loginDto);
  }

  @Post("register/student")
  async registerStudent(@Body() registerDto: RegisterStudentDto) {
    return this.authService.registerStudent(registerDto);
  }

  @Post("register/tutor")
  async registerTutor(@Body() registerDto: RegisterTutorDto) {
    return this.authService.registerTutor(registerDto);
  }

  @Post("forgot-password")
  async forgotPassword(@Body() { email }: { email: string }) {
    return this.authService.forgotPassword(email);
  }

  @Post("reset-password")
  async resetPassword(
    @Body() { token, password }: { token: string; password: string },
  ) {
    return this.authService.resetPassword(token, password);
  }

  @Get("public-tutors")
  async getPublicTutors() {
    const tutors = await this.usersService.getTutors();
    return tutors
      .filter((tutor) => tutor.isActive)
      .map((tutor) => ({
        id: tutor.id,
        firstName: tutor.firstName,
        lastName: tutor.lastName,
        bio: tutor.bio,
        tutorExperience: tutor.tutorExperience,
        profilePicture: tutor.profilePicture,
      }));
  }

  @UseGuards(JwtAuthGuard, RolesGuard)
  @Roles(UserRole.ADMIN)
  @Post("invite/tutor")
  async inviteTutor(@Body() { email }: { email: string }) {
    return this.authService.createTutorInvitation(email);
  }

  @UseGuards(JwtAuthGuard, RolesGuard)
  @Roles(UserRole.ADMIN)
  @Post("register/tutor/direct")
  async registerTutorDirect(@Body() dto: RegisterTutorDirectDto) {
    return this.authService.registerTutorDirect(dto);
  }

  @UseGuards(JwtAuthGuard)
  @Get("profile")
  getProfile(@Req() req) {
    return req.user;
  }
}
