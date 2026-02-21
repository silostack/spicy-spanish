import { Controller, Post, Body, Logger, HttpCode, HttpStatus } from '@nestjs/common';
import { IsEmail, IsNotEmpty, IsString } from 'class-validator';
import { EmailService } from '../email/email.service';

class ContactDto {
  @IsNotEmpty()
  @IsString()
  name: string;

  @IsNotEmpty()
  @IsEmail()
  email: string;

  @IsNotEmpty()
  @IsString()
  subject: string;

  @IsNotEmpty()
  @IsString()
  message: string;
}

@Controller('contact')
export class ContactController {
  private readonly logger = new Logger(ContactController.name);

  constructor(private readonly emailService: EmailService) {}

  @Post()
  @HttpCode(HttpStatus.OK)
  async submitContactForm(@Body() contactDto: ContactDto) {
    this.logger.log(`Contact form submission from ${contactDto.email}`);

    try {
      await this.emailService.sendContactEmail(
        contactDto.name,
        contactDto.email,
        contactDto.subject,
        contactDto.message,
      );
    } catch (error) {
      this.logger.error(`Failed to send contact email: ${error.message}`);
      // Still return success to the user - we don't want to expose email failures
      // The message was received even if email delivery had issues
    }

    return { message: 'Your message has been received. We will get back to you within 24 hours.' };
  }
}
