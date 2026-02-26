import { Injectable, Logger } from '@nestjs/common';
import { ConfigService } from '@nestjs/config';
import { Cron, CronExpression } from '@nestjs/schedule';
import { EntityManager, EntityRepository } from '@mikro-orm/core';
import { InjectRepository } from '@mikro-orm/nestjs';
import * as nodemailer from 'nodemailer';
import * as handlebars from 'handlebars';
import { User } from '../users/entities/user.entity';
import { Appointment, AppointmentStatus } from '../scheduling/entities/appointment.entity';
import { Transaction } from '../payments/entities/transaction.entity';

@Injectable()
export class EmailService {
  private transporter: nodemailer.Transporter;
  private readonly logger = new Logger(EmailService.name);

  constructor(
    private configService: ConfigService,
    @InjectRepository(Appointment)
    private readonly appointmentRepository: EntityRepository<Appointment>,
    private readonly em: EntityManager,
  ) {
    this.transporter = nodemailer.createTransport({
      host: this.configService.get('EMAIL_HOST'),
      port: this.configService.get('EMAIL_PORT'),
      secure: this.configService.get('EMAIL_PORT') === 465,
      auth: {
        user: this.configService.get('EMAIL_USER'),
        pass: this.configService.get('EMAIL_PASSWORD'),
      },
    });
  }

  async sendNewStudentRegistrationEmail(student: User): Promise<void> {
    const template = `
      <h1>New Student Registration</h1>
      <p>A new student has registered on Spicy Spanish:</p>
      <ul>
        <li><strong>Name:</strong> {{name}}</li>
        <li><strong>Email:</strong> {{email}}</li>
        <li><strong>Registration Date:</strong> {{date}}</li>
      </ul>
      <p>You can log in to the admin dashboard to view their profile.</p>
    `;

    const compiledTemplate = handlebars.compile(template);
    const html = compiledTemplate({
      name: student.fullName,
      email: student.email,
      date: new Date().toLocaleString(),
    });

    await this.transporter.sendMail({
      from: this.configService.get('EMAIL_FROM'),
      to: this.configService.get('ADMIN_EMAIL'),
      subject: 'New Student Registration - Spicy Spanish',
      html,
    });
  }

  async sendTutorInvitation(tutorEmail: string, invitationToken: string): Promise<void> {
    const frontendUrl = this.configService.get('FRONTEND_URL');
    const invitationLink = `${frontendUrl}/register/tutor?token=${invitationToken}`;
    
    const template = `
      <h1>You're Invited to Join Spicy Spanish as a Tutor</h1>
      <p>Carla has invited you to join Spicy Spanish as a tutor.</p>
      <p>Please click the link below to complete your registration:</p>
      <p><a href="{{invitationLink}}">Complete Registration</a></p>
      <p>This link will expire in 48 hours.</p>
    `;

    const compiledTemplate = handlebars.compile(template);
    const html = compiledTemplate({
      invitationLink,
    });

    await this.transporter.sendMail({
      from: this.configService.get('EMAIL_FROM'),
      to: tutorEmail,
      subject: 'Invitation to Join Spicy Spanish as a Tutor',
      html,
    });
  }

  async sendPasswordResetEmail(user: User, resetToken: string): Promise<void> {
    const frontendUrl = this.configService.get('FRONTEND_URL') || 'http://localhost:8008';
    const resetLink = `${frontendUrl}/reset-password?token=${resetToken}`;

    const template = `
      <h1>Password Reset Request</h1>
      <p>Hello {{name}},</p>
      <p>We received a request to reset your password for your Spicy Spanish account.</p>
      <p>Click the link below to set a new password:</p>
      <p><a href="{{resetLink}}" style="display:inline-block;padding:12px 24px;background-color:#E53E3E;color:white;text-decoration:none;border-radius:8px;">Reset Password</a></p>
      <p>This link will expire in 1 hour.</p>
      <p>If you did not request a password reset, you can safely ignore this email.</p>
    `;

    const compiledTemplate = handlebars.compile(template);
    const html = compiledTemplate({
      name: user.firstName,
      resetLink,
    });

    await this.transporter.sendMail({
      from: this.configService.get('EMAIL_FROM'),
      to: user.email,
      subject: 'Password Reset - Spicy Spanish',
      html,
    });
  }

  async sendClassReminder(appointment: Appointment): Promise<void> {
    const students = appointment.students.getItems();
    const student = students[0];
    const tutor = appointment.tutor;
    
    const template = `
      <h1>Reminder: Upcoming Spanish Class</h1>
      <p>Hello {{studentName}},</p>
      <p>This is a reminder that you have an upcoming Spanish class with {{tutorName}} in one hour.</p>
      <ul>
        <li><strong>Date:</strong> {{date}}</li>
        <li><strong>Start Time:</strong> {{startTime}}</li>
        <li><strong>End Time:</strong> {{endTime}}</li>
      </ul>
      <p>If you need to reschedule, please contact us as soon as possible.</p>
      <p>¡Hasta pronto!</p>
    `;

    const startTime = new Date(appointment.startTime);
    const endTime = new Date(appointment.endTime);

    const compiledTemplate = handlebars.compile(template);
    const html = compiledTemplate({
      studentName: student.firstName,
      tutorName: tutor.fullName,
      date: startTime.toLocaleDateString(),
      startTime: startTime.toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' }),
      endTime: endTime.toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' }),
    });

    await this.transporter.sendMail({
      from: this.configService.get('EMAIL_FROM'),
      to: student.email,
      subject: 'Reminder: Your Spanish Class is in 1 Hour',
      html,
    });
  }

  async sendPaymentNotification(transaction: Transaction): Promise<void> {
        // <li><strong>Amount:</strong> ${{amount}}</li>
    const template = `
      <h1>New Payment Received</h1>
      <p>A new payment has been processed on Spicy Spanish:</p>
      <ul>
        <li><strong>Student:</strong> {{studentName}}</li>
        <li><strong>Email:</strong> {{studentEmail}}</li>
        <li><strong>Hours Purchased:</strong> {{hours}}</li>
        <li><strong>Payment Method:</strong> {{paymentMethod}}</li>
        <li><strong>Date:</strong> {{date}}</li>
      </ul>
      <p>You can log in to the admin dashboard to view transaction details.</p>
    `;

    const student = transaction.student;
    const compiledTemplate = handlebars.compile(template);
    const html = compiledTemplate({
      studentName: student.fullName,
      studentEmail: student.email,
      amount: transaction.amountUsd.toFixed(2),
      hours: transaction.hours,
      paymentMethod: transaction.paymentMethod,
      date: transaction.createdAt.toLocaleString(),
    });

    await this.transporter.sendMail({
      from: this.configService.get('EMAIL_FROM'),
      to: this.configService.get('ADMIN_EMAIL'),
      subject: 'New Payment Received - Spicy Spanish',
      html,
    });
  }

  async sendClassConfirmationEmail(appointment: Appointment): Promise<void> {
    const students = appointment.students.getItems();
    const student = students[0];
    const tutor = appointment.tutor;
    
    const template = `
      <h1>Spanish Class Confirmation</h1>
      <p>Hello {{studentName}},</p>
      <p>Your Spanish class has been scheduled successfully:</p>
      <ul>
        <li><strong>Tutor:</strong> {{tutorName}}</li>
        <li><strong>Date:</strong> {{date}}</li>
        <li><strong>Start Time:</strong> {{startTime}}</li>
        <li><strong>End Time:</strong> {{endTime}}</li>
        <li><strong>Duration:</strong> {{duration}} hour(s)</li>
      </ul>
      <p>You'll receive a reminder email before the class.</p>
      <p>If you need to cancel or reschedule, please log in to your dashboard or contact us.</p>
      <p>¡Hasta pronto!</p>
    `;

    const startTime = new Date(appointment.startTime);
    const endTime = new Date(appointment.endTime);
    const durationHours = (endTime.getTime() - startTime.getTime()) / (1000 * 60 * 60);

    const compiledTemplate = handlebars.compile(template);
    const html = compiledTemplate({
      studentName: student.firstName,
      tutorName: tutor.fullName,
      date: startTime.toLocaleDateString(),
      startTime: startTime.toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' }),
      endTime: endTime.toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' }),
      duration: durationHours,
    });

    await this.transporter.sendMail({
      from: this.configService.get('EMAIL_FROM'),
      to: student.email,
      subject: 'Your Spanish Class is Confirmed - Spicy Spanish',
      html,
    });

    // Also send notification to the tutor
    const tutorTemplate = `
      <h1>New Class Scheduled</h1>
      <p>Hello {{tutorName}},</p>
      <p>A new Spanish class has been scheduled with you:</p>
      <ul>
        <li><strong>Student:</strong> {{studentName}}</li>
        <li><strong>Date:</strong> {{date}}</li>
        <li><strong>Start Time:</strong> {{startTime}}</li>
        <li><strong>End Time:</strong> {{endTime}}</li>
        <li><strong>Duration:</strong> {{duration}} hour(s)</li>
      </ul>
      <p>Please log in to your dashboard to view the details.</p>
      <p>¡Hasta pronto!</p>
    `;

    const compiledTutorTemplate = handlebars.compile(tutorTemplate);
    const tutorHtml = compiledTutorTemplate({
      tutorName: tutor.firstName,
      studentName: student.fullName,
      date: startTime.toLocaleDateString(),
      startTime: startTime.toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' }),
      endTime: endTime.toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' }),
      duration: durationHours,
    });

    await this.transporter.sendMail({
      from: this.configService.get('EMAIL_FROM'),
      to: tutor.email,
      subject: 'New Spanish Class Scheduled - Spicy Spanish',
      html: tutorHtml,
    });
  }

  async sendClassCancellationEmail(appointment: Appointment): Promise<void> {
    const students = appointment.students.getItems();
    const student = students[0];
    const tutor = appointment.tutor;
    
    const template = `
      <h1>Spanish Class Cancellation</h1>
      <p>Hello {{recipientName}},</p>
      <p>Your Spanish class has been cancelled:</p>
      <ul>
        <li><strong>With:</strong> {{otherPartyName}}</li>
        <li><strong>Date:</strong> {{date}}</li>
        <li><strong>Start Time:</strong> {{startTime}}</li>
        <li><strong>End Time:</strong> {{endTime}}</li>
      </ul>
      <p>You can log in to your dashboard to schedule a new class.</p>
      <p>If you have any questions, please contact us.</p>
    `;

    const startTime = new Date(appointment.startTime);
    const endTime = new Date(appointment.endTime);

    // Send to student
    const studentHtml = handlebars.compile(template)({
      recipientName: student.firstName,
      otherPartyName: tutor.fullName,
      date: startTime.toLocaleDateString(),
      startTime: startTime.toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' }),
      endTime: endTime.toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' }),
    });

    await this.transporter.sendMail({
      from: this.configService.get('EMAIL_FROM'),
      to: student.email,
      subject: 'Spanish Class Cancellation - Spicy Spanish',
      html: studentHtml,
    });

    // Send to tutor
    const tutorHtml = handlebars.compile(template)({
      recipientName: tutor.firstName,
      otherPartyName: student.fullName,
      date: startTime.toLocaleDateString(),
      startTime: startTime.toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' }),
      endTime: endTime.toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' }),
    });

    await this.transporter.sendMail({
      from: this.configService.get('EMAIL_FROM'),
      to: tutor.email,
      subject: 'Spanish Class Cancellation - Spicy Spanish',
      html: tutorHtml,
    });
  }

  // Scheduled task that runs every 5 minutes to check for upcoming appointments
  @Cron(CronExpression.EVERY_5_MINUTES)
  async sendScheduledReminders(): Promise<void> {
    // Use a forked EntityManager for the scheduled task
    const em = this.em.fork();
    
    try {
      this.logger.log('Running scheduled email reminders check');
      
      // Get appointments starting in the next hour
      const now = new Date();
      const oneHourFromNow = new Date(now.getTime() + 60 * 60 * 1000);
      const reminder = await this.findUpcomingAppointmentsForReminder(em, now, oneHourFromNow);
      
      if (reminder.length > 0) {
        this.logger.log(`Sending reminders for ${reminder.length} upcoming appointments`);
        
        for (const appointment of reminder) {
          try {
            await this.sendClassReminder(appointment);
            await this.markReminderSent(em, appointment.id);
            this.logger.log(`Sent reminder for appointment ${appointment.id}`);
          } catch (error) {
            this.logger.error(`Failed to send reminder for appointment ${appointment.id}: ${error.message}`);
          }
        }
      }
      
      // Get appointments for 24 hour reminder
      const oneDayFromNow = new Date(now.getTime() + 24 * 60 * 60 * 1000);
      const dayBefore = await this.findUpcomingAppointmentsForDayBeforeReminder(em, now, oneDayFromNow);
      
      if (dayBefore.length > 0) {
        this.logger.log(`Sending day-before reminders for ${dayBefore.length} appointments`);
        
        for (const appointment of dayBefore) {
          try {
            await this.sendDayBeforeReminder(appointment);
            await this.markDayBeforeReminderSent(em, appointment.id);
            this.logger.log(`Sent day-before reminder for appointment ${appointment.id}`);
          } catch (error) {
            this.logger.error(`Failed to send day-before reminder for appointment ${appointment.id}: ${error.message}`);
          }
        }
      }
    } catch (error) {
      this.logger.error(`Error in scheduled reminder: ${error.message}`);
    } finally {
      await em.flush();
    }
  }

  // Method to find appointments that need reminders sent
  private async findUpcomingAppointmentsForReminder(em: EntityManager, now: Date, cutoff: Date): Promise<Appointment[]> {
    return em.find(Appointment, {
      startTime: { $gte: now, $lte: cutoff },
      status: AppointmentStatus.SCHEDULED,
      reminderSent: false,
    }, {
      populate: ['students', 'tutor'],
    });
  }

  // Method to find appointments that need day-before reminders sent
  private async findUpcomingAppointmentsForDayBeforeReminder(em: EntityManager, now: Date, cutoff: Date): Promise<Appointment[]> {
    return em.find(Appointment, {
      startTime: { $gte: now, $lte: cutoff },
      status: AppointmentStatus.SCHEDULED,
      dayBeforeReminderSent: false,
    }, {
      populate: ['students', 'tutor'],
    });
  }
  
  // Mark reminder as sent in the database
  private async markReminderSent(em: EntityManager, appointmentId: string): Promise<void> {
    const appointment = await em.findOne(Appointment, { id: appointmentId });
    if (appointment) {
      appointment.reminderSent = true;
      appointment.reminderSentAt = new Date();
      // Flush will be handled by the calling method
    }
  }
  
  // Mark day-before reminder as sent in the database
  private async markDayBeforeReminderSent(em: EntityManager, appointmentId: string): Promise<void> {
    const appointment = await em.findOne(Appointment, { id: appointmentId });
    if (appointment) {
      appointment.dayBeforeReminderSent = true;
      appointment.dayBeforeReminderSentAt = new Date();
      // Flush will be handled by the calling method
    }
  }
  
  async sendContactEmail(name: string, email: string, subject: string, message: string): Promise<void> {
    const template = `
      <h1>New Contact Form Submission</h1>
      <p>A visitor has submitted the contact form on Spicy Spanish:</p>
      <ul>
        <li><strong>Name:</strong> {{name}}</li>
        <li><strong>Email:</strong> {{email}}</li>
        <li><strong>Subject:</strong> {{subject}}</li>
      </ul>
      <h2>Message:</h2>
      <p>{{message}}</p>
      <hr />
      <p><em>You can reply directly to this email to respond to the sender.</em></p>
    `;

    const compiledTemplate = handlebars.compile(template);
    const html = compiledTemplate({ name, email, subject, message });

    await this.transporter.sendMail({
      from: this.configService.get('EMAIL_FROM'),
      to: this.configService.get('ADMIN_EMAIL'),
      replyTo: email,
      subject: `Contact Form: ${subject} - Spicy Spanish`,
      html,
    });
  }

  async sendDayBeforeReminder(appointment: Appointment): Promise<void> {
    const students = appointment.students.getItems();
    const student = students[0];
    const tutor = appointment.tutor;
    
    const template = `
      <h1>Reminder: Your Spanish Class Tomorrow</h1>
      <p>Hello {{studentName}},</p>
      <p>This is a friendly reminder that you have a Spanish class scheduled for tomorrow:</p>
      <ul>
        <li><strong>Tutor:</strong> {{tutorName}}</li>
        <li><strong>Date:</strong> {{date}}</li>
        <li><strong>Start Time:</strong> {{startTime}}</li>
        <li><strong>End Time:</strong> {{endTime}}</li>
      </ul>
      <p>Please make sure you're prepared for your lesson.</p>
      <p>If you need to reschedule, please contact us as soon as possible.</p>
      <p>¡Hasta mañana!</p>
    `;

    const startTime = new Date(appointment.startTime);
    const endTime = new Date(appointment.endTime);

    const compiledTemplate = handlebars.compile(template);
    const html = compiledTemplate({
      studentName: student.firstName,
      tutorName: tutor.fullName,
      date: startTime.toLocaleDateString(),
      startTime: startTime.toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' }),
      endTime: endTime.toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' }),
    });

    await this.transporter.sendMail({
      from: this.configService.get('EMAIL_FROM'),
      to: student.email,
      subject: 'Reminder: Your Spanish Class Tomorrow - Spicy Spanish',
      html,
    });
  }
}