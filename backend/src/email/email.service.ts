import { Injectable } from '@nestjs/common';
import { ConfigService } from '@nestjs/config';
import * as nodemailer from 'nodemailer';
import * as handlebars from 'handlebars';
import { User } from '../users/entities/user.entity';
import { Appointment } from '../scheduling/entities/appointment.entity';
import { Transaction } from '../payments/entities/transaction.entity';

@Injectable()
export class EmailService {
  private transporter: nodemailer.Transporter;

  constructor(private configService: ConfigService) {
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

  async sendClassReminder(appointment: Appointment): Promise<void> {
    const student = appointment.student;
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
    const template = `
      <h1>New Payment Received</h1>
      <p>A new payment has been processed on Spicy Spanish:</p>
      <ul>
        <li><strong>Student:</strong> {{studentName}}</li>
        <li><strong>Email:</strong> {{studentEmail}}</li>
        <li><strong>Amount:</strong> ${{amount}}</li>
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
}