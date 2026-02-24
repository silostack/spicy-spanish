import { Injectable, UnauthorizedException, ConflictException, NotFoundException, Logger } from '@nestjs/common';
import { JwtService } from '@nestjs/jwt';
import * as bcrypt from 'bcrypt';
import { v4 as uuidv4 } from 'uuid';
import { EntityManager } from '@mikro-orm/core';
import { User, UserRole } from '../users/entities/user.entity';
import { EmailService } from '../email/email.service';
import { LoginDto } from './dto/login.dto';
import { RegisterStudentDto } from './dto/register-student.dto';
import { RegisterTutorDto } from './dto/register-tutor.dto';
import { RegisterTutorDirectDto } from './dto/register-tutor-direct.dto';

@Injectable()
export class AuthService {
  private readonly logger = new Logger(AuthService.name);

  constructor(
    private readonly em: EntityManager,
    private readonly jwtService: JwtService,
    private readonly emailService: EmailService,
  ) {}

  async validateUser(email: string, password: string): Promise<any> {
    const user = await this.em.findOne(User, { email });
    if (!user) {
      return null;
    }

    const isPasswordValid = await bcrypt.compare(password, user.password);
    if (!isPasswordValid) {
      return null;
    }

    const { password: _, ...result } = user;
    return result;
  }

  async login(loginDto: LoginDto) {
    const user = await this.validateUser(loginDto.email, loginDto.password);
    if (!user) {
      throw new UnauthorizedException('Invalid credentials');
    }

    const payload = { sub: user.id, email: user.email, role: user.role };
    return {
      access_token: this.jwtService.sign(payload),
      user: {
        id: user.id,
        email: user.email,
        firstName: user.firstName,
        lastName: user.lastName,
        role: user.role,
      },
    };
  }

  async registerStudent(registerDto: RegisterStudentDto) {
    const existingUser = await this.em.findOne(User, { email: registerDto.email });
    if (existingUser) {
      throw new ConflictException('Email already exists');
    }

    const hashedPassword = await bcrypt.hash(registerDto.password, 10);
    const user = new User(
      registerDto.firstName,
      registerDto.lastName,
      registerDto.email,
      hashedPassword,
      UserRole.STUDENT,
    );

    user.timezone = registerDto.timezone;
    user.phoneNumber = registerDto.phoneNumber;

    await this.em.persistAndFlush(user);

    // Try to send email, but don't fail registration if email fails
    try {
      await this.emailService.sendNewStudentRegistrationEmail(user);
    } catch (error) {
      this.logger.error(`Failed to send registration email to ${user.email}`, error.stack);
    }

    const { password: _, ...result } = user;
    return result;
  }

  async registerTutor(registerDto: RegisterTutorDto) {
    const user = await this.em.findOne(User, { invitationToken: registerDto.token });
    if (!user || user.role !== UserRole.TUTOR) {
      throw new NotFoundException('Invalid invitation token');
    }

    const hashedPassword = await bcrypt.hash(registerDto.password, 10);
    user.password = hashedPassword;
    user.firstName = registerDto.firstName;
    user.lastName = registerDto.lastName;
    user.phoneNumber = registerDto.phoneNumber;
    user.timezone = registerDto.timezone;
    user.bio = registerDto.bio;
    user.invitationToken = null;

    await this.em.flush();

    const { password: _, ...result } = user;
    return result;
  }

  async forgotPassword(email: string) {
    const user = await this.em.findOne(User, { email });

    // Always return success to avoid email enumeration
    if (!user) {
      return { message: 'If an account with that email exists, a reset link has been sent.' };
    }

    const resetToken = uuidv4();
    user.resetPasswordToken = resetToken;
    user.resetPasswordExpires = new Date(Date.now() + 60 * 60 * 1000); // 1 hour

    await this.em.flush();

    try {
      await this.emailService.sendPasswordResetEmail(user, resetToken);
    } catch (error) {
      this.logger.error(`Failed to send password reset email to ${email}`, error.stack);
    }

    return { message: 'If an account with that email exists, a reset link has been sent.' };
  }

  async resetPassword(token: string, newPassword: string) {
    const user = await this.em.findOne(User, {
      resetPasswordToken: token,
      resetPasswordExpires: { $gt: new Date() },
    });

    if (!user) {
      throw new UnauthorizedException('Invalid or expired reset token');
    }

    user.password = await bcrypt.hash(newPassword, 10);
    user.resetPasswordToken = null;
    user.resetPasswordExpires = null;

    await this.em.flush();

    return { message: 'Password has been reset successfully' };
  }

  async createTutorInvitation(email: string) {
    const existingUser = await this.em.findOne(User, { email });
    if (existingUser) {
      throw new ConflictException('Email already exists');
    }

    const invitationToken = uuidv4();
    const user = new User(
      '', // First name will be set during registration
      '', // Last name will be set during registration
      email,
      '', // Password will be set during registration
      UserRole.TUTOR,
    );
    user.invitationToken = invitationToken;

    await this.em.persistAndFlush(user);
    
    // Try to send email, but don't fail invitation if email fails
    try {
      await this.emailService.sendTutorInvitation(email, invitationToken);
    } catch (error) {
      this.logger.error(`Failed to send tutor invitation email to ${email}`, error.stack);
    }

    return { message: 'Invitation sent successfully' };
  }
  async registerTutorDirect(dto: RegisterTutorDirectDto) {
    const existingUser = await this.em.findOne(User, { email: dto.email });
    if (existingUser) {
      throw new ConflictException('Email already exists');
    }

    const hashedPassword = await bcrypt.hash(dto.password, 10);
    const user = new User(
      dto.firstName,
      dto.lastName,
      dto.email,
      hashedPassword,
      UserRole.TUTOR,
    );

    user.timezone = dto.timezone;
    user.phoneNumber = dto.phoneNumber;
    user.isActive = true;

    await this.em.persistAndFlush(user);

    const { password: _, ...result } = user;
    return result;
  }

}