import { Injectable, NotFoundException, BadRequestException, Logger } from '@nestjs/common';
import { EntityManager, EntityRepository } from '@mikro-orm/core';
import { InjectRepository } from '@mikro-orm/nestjs';
import { Appointment, AppointmentStatus } from './entities/appointment.entity';
import { Availability } from './entities/availability.entity';
import { Attendance, AttendanceStatus } from './entities/attendance.entity';
import { ClassReport } from './entities/class-report.entity';
import { User, UserRole } from '../users/entities/user.entity';
import { Course } from '../courses/entities/course.entity';
import { EmailService } from '../email/email.service';
import {
  CreateAppointmentDto,
  UpdateAppointmentDto,
  CreateAvailabilityDto,
  UpdateAvailabilityDto,
  CreateAttendanceDto,
  UpdateAttendanceDto,
  CreateClassReportDto,
  UpdateClassReportDto,
} from './dto';

@Injectable()
export class SchedulingService {
  private readonly logger = new Logger(SchedulingService.name);
  // private calendar: calendar_v3.Calendar;
  private readonly calendarId: string;

  constructor(
    @InjectRepository(Appointment)
    private readonly appointmentRepository: EntityRepository<Appointment>,
    @InjectRepository(Availability)
    private readonly availabilityRepository: EntityRepository<Availability>,
    @InjectRepository(Attendance)
    private readonly attendanceRepository: EntityRepository<Attendance>,
    @InjectRepository(ClassReport)
    private readonly classReportRepository: EntityRepository<ClassReport>,
    @InjectRepository(User)
    private readonly userRepository: EntityRepository<User>,
    @InjectRepository(Course)
    private readonly courseRepository: EntityRepository<Course>,
    private readonly em: EntityManager,
    private readonly emailService: EmailService,
  ) {
    // Initialize Google Calendar API
    // const auth = new OAuth2Client(
    //   process.env.GOOGLE_CLIENT_ID,
    //   process.env.GOOGLE_CLIENT_SECRET,
    //   process.env.GOOGLE_REDIRECT_URI
    // );
    
    // // Set credentials from environment or configuration
    // auth.setCredentials({
    //   refresh_token: process.env.GOOGLE_REFRESH_TOKEN,
    // });
    
    // this.calendar = google.calendar({ version: 'v3', auth });
    this.calendarId = process.env.GOOGLE_CALENDAR_ID || 'primary';
  }

  // Appointment methods
  async findAllAppointments() {
    return this.appointmentRepository.findAll({
      populate: ['student', 'tutor', 'course'],
      orderBy: { startTime: 'ASC' },
    });
  }

  async findAppointmentById(id: string) {
    const appointment = await this.appointmentRepository.findOne({ id }, {
      populate: ['student', 'tutor', 'course'],
    });
    
    if (!appointment) {
      throw new NotFoundException(`Appointment with ID ${id} not found`);
    }
    
    return appointment;
  }

  async findAppointmentsByStudent(studentId: string) {
    return this.appointmentRepository.find(
      { student: studentId },
      {
        populate: ['student', 'tutor'],
        orderBy: { startTime: 'ASC' },
      }
    );
  }

  async findAppointmentsByTutor(tutorId: string) {
    return this.appointmentRepository.find(
      { tutor: tutorId },
      {
        populate: ['student', 'tutor'],
        orderBy: { startTime: 'ASC' },
      }
    );
  }

  async findUpcomingAppointmentsByStudent(studentId: string) {
    const now = new Date();
    return this.appointmentRepository.find(
      { 
        student: studentId,
        startTime: { $gt: now },
        status: AppointmentStatus.SCHEDULED,
      },
      {
        populate: ['student', 'tutor'],
        orderBy: { startTime: 'ASC' },
      }
    );
  }

  async findUpcomingAppointmentsByTutor(tutorId: string) {
    const now = new Date();
    return this.appointmentRepository.find(
      { 
        tutor: tutorId,
        startTime: { $gt: now },
        status: AppointmentStatus.SCHEDULED,
      },
      {
        populate: ['student', 'tutor'],
        orderBy: { startTime: 'ASC' },
      }
    );
  }

  async createAppointment(createAppointmentDto: CreateAppointmentDto) {
    const student = await this.userRepository.findOne({ 
      id: createAppointmentDto.studentId,
      role: UserRole.STUDENT,
    });
    
    if (!student) {
      throw new NotFoundException(`Student with ID ${createAppointmentDto.studentId} not found`);
    }
    
    const tutor = await this.userRepository.findOne({ 
      id: createAppointmentDto.tutorId,
      role: UserRole.TUTOR,
    });
    
    if (!tutor) {
      throw new NotFoundException(`Tutor with ID ${createAppointmentDto.tutorId} not found`);
    }
    
    // Verify time is within tutor's availability
    const isAvailable = await this.checkTutorAvailability(
      tutor.id,
      createAppointmentDto.startTime,
      createAppointmentDto.endTime
    );
    
    if (!isAvailable) {
      throw new BadRequestException('The selected time is not within the tutor\'s availability');
    }
    
    // Check for time conflicts
    const conflicts = await this.checkTimeConflicts(
      tutor.id,
      createAppointmentDto.startTime,
      createAppointmentDto.endTime
    );
    
    if (conflicts) {
      throw new BadRequestException('The selected time conflicts with another appointment');
    }
    
    // Validate course if provided
    let course = undefined;
    if (createAppointmentDto.courseId) {
      course = await this.courseRepository.findOne({ id: createAppointmentDto.courseId });
      if (!course) {
        throw new NotFoundException(`Course with ID ${createAppointmentDto.courseId} not found`);
      }
    }
    
    const appointment = new Appointment(
      student,
      tutor,
      createAppointmentDto.startTime,
      createAppointmentDto.endTime,
      AppointmentStatus.SCHEDULED,
      course
    );
    
    if (createAppointmentDto.notes) {
      appointment.notes = createAppointmentDto.notes;
    }
    
    // Create Google Calendar event
    const calendarEventId = await this.createGoogleCalendarEvent(
      appointment.student.fullName,
      appointment.tutor.fullName,
      appointment.startTime,
      appointment.endTime,
      appointment.notes
    );
    
    if (calendarEventId) {
      appointment.googleCalendarEventId = calendarEventId;
    }
    
    await this.em.persistAndFlush(appointment);
    
    // Send confirmation emails to student and tutor
    try {
      await this.emailService.sendClassConfirmationEmail(appointment);
      appointment.confirmationEmailSent = true;
      await this.em.flush();
    } catch (error) {
      this.logger.error('Failed to send confirmation email', error.stack);
      // Don't fail the appointment creation if email fails
    }
    
    return appointment;
  }

  async updateAppointment(id: string, updateAppointmentDto: UpdateAppointmentDto) {
    const appointment = await this.findAppointmentById(id);
    
    // If updating times, verify availability and conflicts
    if (updateAppointmentDto.startTime || updateAppointmentDto.endTime) {
      const startTime = updateAppointmentDto.startTime || appointment.startTime;
      const endTime = updateAppointmentDto.endTime || appointment.endTime;
      
      // Verify time is within tutor's availability
      const isAvailable = await this.checkTutorAvailability(
        appointment.tutor.id,
        startTime,
        endTime
      );
      
      if (!isAvailable) {
        throw new BadRequestException('The selected time is not within the tutor\'s availability');
      }
      
      // Check for time conflicts (excluding this appointment)
      const conflicts = await this.checkTimeConflicts(
        appointment.tutor.id,
        startTime,
        endTime,
        id
      );
      
      if (conflicts) {
        throw new BadRequestException('The selected time conflicts with another appointment');
      }
      
      // Update Google Calendar event if times are changing
      if (appointment.googleCalendarEventId) {
        await this.updateGoogleCalendarEvent(
          appointment.googleCalendarEventId,
          appointment.student.fullName,
          appointment.tutor.fullName,
          startTime,
          endTime,
          updateAppointmentDto.notes || appointment.notes
        );
      }
    }
    
    // Update status in Google Calendar if changing status
    if (updateAppointmentDto.status && appointment.googleCalendarEventId) {
      if (updateAppointmentDto.status === AppointmentStatus.CANCELLED) {
        await this.cancelGoogleCalendarEvent(appointment.googleCalendarEventId);
      }
    }
    
    this.em.assign(appointment, updateAppointmentDto);
    await this.em.flush();
    return appointment;
  }

  async cancelAppointment(id: string) {
    const appointment = await this.findAppointmentById(id);
    appointment.status = AppointmentStatus.CANCELLED;
    
    // Cancel Google Calendar event
    if (appointment.googleCalendarEventId) {
      await this.cancelGoogleCalendarEvent(appointment.googleCalendarEventId);
    }
    
    await this.em.flush();
    
    // Send cancellation emails
    try {
      await this.emailService.sendClassCancellationEmail(appointment);
    } catch (error) {
      this.logger.error('Failed to send cancellation email', error.stack);
      // Don't fail the appointment cancellation if email fails
    }
    
    return appointment;
  }

  async completeAppointment(id: string) {
    const appointment = await this.findAppointmentById(id);
    appointment.status = AppointmentStatus.COMPLETED;
    
    // Update Google Calendar event to mark as completed
    if (appointment.googleCalendarEventId) {
      await this.updateGoogleCalendarEvent(
        appointment.googleCalendarEventId,
        appointment.student.fullName,
        appointment.tutor.fullName,
        appointment.startTime,
        appointment.endTime,
        appointment.notes,
        true // marked as completed
      );
    }
    
    await this.em.flush();
    return appointment;
  }

  // Availability methods
  async findAvailabilityById(id: string) {
    const availability = await this.availabilityRepository.findOne({ id }, {
      populate: ['tutor'],
    });
    
    if (!availability) {
      throw new NotFoundException(`Availability with ID ${id} not found`);
    }
    
    return availability;
  }

  async findAvailabilityByTutor(tutorId: string) {
    return this.availabilityRepository.find(
      { tutor: tutorId },
      {
        populate: ['tutor'],
        orderBy: [
          { dayOfWeek: 'ASC' },
          { startTime: 'ASC' },
        ],
      }
    );
  }

  async createAvailability(createAvailabilityDto: CreateAvailabilityDto) {
    const tutor = await this.userRepository.findOne({ 
      id: createAvailabilityDto.tutorId,
      role: UserRole.TUTOR,
    });
    
    if (!tutor) {
      throw new NotFoundException(`Tutor with ID ${createAvailabilityDto.tutorId} not found`);
    }
    
    const availability = new Availability(
      tutor,
      createAvailabilityDto.dayOfWeek,
      createAvailabilityDto.startTime,
      createAvailabilityDto.endTime,
      createAvailabilityDto.isRecurring !== undefined ? createAvailabilityDto.isRecurring : true,
      createAvailabilityDto.specificDate
    );
    
    await this.em.persistAndFlush(availability);
    return availability;
  }

  async updateAvailability(id: string, updateAvailabilityDto: UpdateAvailabilityDto) {
    const availability = await this.findAvailabilityById(id);
    this.em.assign(availability, updateAvailabilityDto);
    await this.em.flush();
    return availability;
  }

  async removeAvailability(id: string) {
    const availability = await this.findAvailabilityById(id);
    await this.em.removeAndFlush(availability);
    return { id, deleted: true };
  }

  // Helper methods
  private async checkTutorAvailability(
    tutorId: string,
    startTime: Date,
    endTime: Date
  ): Promise<boolean> {
    const day = startTime.getDay();
    const timeStart = `${startTime.getHours().toString().padStart(2, '0')}:${startTime.getMinutes().toString().padStart(2, '0')}`;
    const timeEnd = `${endTime.getHours().toString().padStart(2, '0')}:${endTime.getMinutes().toString().padStart(2, '0')}`;
    
    // Check recurring availability
    const recurringAvailability = await this.availabilityRepository.findOne({
      tutor: tutorId,
      dayOfWeek: day,
      isRecurring: true,
      startTime: { $lte: timeStart },
      endTime: { $gte: timeEnd },
    });
    
    if (recurringAvailability) {
      return true;
    }
    
    // Check specific date availability
    const specificDate = new Date(startTime);
    specificDate.setHours(0, 0, 0, 0);
    
    const specificAvailability = await this.availabilityRepository.findOne({
      tutor: tutorId,
      isRecurring: false,
      specificDate,
      startTime: { $lte: timeStart },
      endTime: { $gte: timeEnd },
    });
    
    return !!specificAvailability;
  }

  private async checkTimeConflicts(
    tutorId: string,
    startTime: Date,
    endTime: Date,
    excludeAppointmentId?: string
  ): Promise<boolean> {
    const query = {
      tutor: tutorId,
      status: AppointmentStatus.SCHEDULED,
      $or: [
        // Case 1: New appointment starts during an existing appointment
        { startTime: { $lt: endTime }, endTime: { $gt: startTime } },
        // Case 2: New appointment contains an existing appointment
        { startTime: { $gte: startTime, $lt: endTime } },
        // Case 3: New appointment ends during an existing appointment
        { startTime: { $lt: startTime }, endTime: { $gt: startTime, $lte: endTime } },
      ],
    };
    
    if (excludeAppointmentId) {
      Object.assign(query, { id: { $ne: excludeAppointmentId } });
    }
    
    const conflictingAppointments = await this.appointmentRepository.count(query);
    return conflictingAppointments > 0;
  }

  // Google Calendar integration methods
  private async createGoogleCalendarEvent(
    studentName: string,
    tutorName: string,
    startTime: Date,
    endTime: Date,
    notes?: string
  ): Promise<string | null> {
    try {
      const event = {
        summary: `Spanish Class: ${studentName} with ${tutorName}`,
        description: notes || 'Spanish language lesson',
        start: {
          dateTime: startTime.toISOString(),
          timeZone: 'UTC',
        },
        end: {
          dateTime: endTime.toISOString(),
          timeZone: 'UTC',
        },
        attendees: [
          { email: `${studentName.replace(/\s+/g, '.')}@example.com`, displayName: studentName },
          { email: `${tutorName.replace(/\s+/g, '.')}@example.com`, displayName: tutorName },
        ],
        reminders: {
          useDefault: false,
          overrides: [
            { method: 'email', minutes: 24 * 60 }, // 1 day before
            { method: 'popup', minutes: 30 }, // 30 minutes before
          ],
        },
      };

      // const response = await this.calendar.events.insert({
      //   calendarId: this.calendarId,
      //   requestBody: event,
      // });

      // return response.data.id || null;
      return null;
    } catch (error) {
      this.logger.error('Error creating Google Calendar event', error.stack);
      return null;
    }
  }

  private async updateGoogleCalendarEvent(
    eventId: string,
    studentName: string,
    tutorName: string,
    startTime: Date,
    endTime: Date,
    notes?: string,
    completed: boolean = false
  ): Promise<boolean> {
    try {
      // First get the existing event
      // const existingEvent = await this.calendar.events.get({
      //   calendarId: this.calendarId,
      //   eventId: eventId,
      // });

      // Update the event
      // const event = {
      //   summary: `Spanish Class: ${studentName} with ${tutorName}${completed ? ' (Completed)' : ''}`,
      //   description: notes || 'Spanish language lesson',
      //   start: {
      //     dateTime: startTime.toISOString(),
      //     timeZone: 'UTC',
      //   },
      //   end: {
      //     dateTime: endTime.toISOString(),
      //     timeZone: 'UTC',
      //   },
      //   attendees: existingEvent.data.attendees,
      //   reminders: existingEvent.data.reminders,
      // };

      // await this.calendar.events.update({
      //   calendarId: this.calendarId,
      //   eventId: eventId,
      //   requestBody: event,
      // });

      return true;
    } catch (error) {
      this.logger.error('Error updating Google Calendar event', error.stack);
      return false;
    }
  }

  private async cancelGoogleCalendarEvent(eventId: string): Promise<boolean> {
    try {
      // Mark as cancelled in Google Calendar
      // await this.calendar.events.update({
      //   calendarId: this.calendarId,
      //   eventId: eventId,
      //   requestBody: {
      //     status: 'cancelled',
      //   },
      // });

      return true;
    } catch (error) {
      this.logger.error('Error cancelling Google Calendar event', error.stack);
      return false;
    }
  }

  // Dashboard stats
  async getSchedulingStats() {
    const now = new Date();
    
    // Get upcoming appointments
    const upcomingAppointments = await this.appointmentRepository.find(
      { 
        startTime: { $gt: now },
        status: AppointmentStatus.SCHEDULED,
      },
      {
        populate: ['student', 'tutor'],
        orderBy: { startTime: 'ASC' },
        limit: 5,
      }
    );
    
    // Get completed appointments this month
    const firstDayOfMonth = new Date(now.getFullYear(), now.getMonth(), 1);
    const completedAppointmentsThisMonth = await this.appointmentRepository.count({
      status: AppointmentStatus.COMPLETED,
      startTime: { $gte: firstDayOfMonth, $lte: now },
    });
    
    // Get total hours taught (completed appointments)
    const completedAppointments = await this.appointmentRepository.find({
      status: AppointmentStatus.COMPLETED,
    });
    
    let totalHoursTaught = 0;
    completedAppointments.forEach(appointment => {
      const durationHours = (appointment.endTime.getTime() - appointment.startTime.getTime()) / (1000 * 60 * 60);
      totalHoursTaught += durationHours;
    });
    
    // Get total scheduled hours
    const scheduledAppointments = await this.appointmentRepository.find({
      status: AppointmentStatus.SCHEDULED,
      startTime: { $gt: now },
    });
    
    let totalScheduledHours = 0;
    scheduledAppointments.forEach(appointment => {
      const durationHours = (appointment.endTime.getTime() - appointment.startTime.getTime()) / (1000 * 60 * 60);
      totalScheduledHours += durationHours;
    });
    
    return {
      upcomingAppointments,
      completedAppointmentsThisMonth,
      totalHoursTaught,
      totalScheduledHours,
      totalCompletedAppointments: completedAppointments.length,
      totalScheduledAppointments: scheduledAppointments.length,
    };
  }

  // Attendance methods
  async createAttendance(createAttendanceDto: CreateAttendanceDto) {
    const appointment = await this.appointmentRepository.findOne({ id: createAttendanceDto.appointmentId });
    if (!appointment) {
      throw new NotFoundException(`Appointment with ID ${createAttendanceDto.appointmentId} not found`);
    }

    const student = await this.userRepository.findOne({ 
      id: createAttendanceDto.studentId,
      role: UserRole.STUDENT 
    });
    if (!student) {
      throw new NotFoundException(`Student with ID ${createAttendanceDto.studentId} not found`);
    }

    // Check if attendance already exists for this appointment
    const existingAttendance = await this.attendanceRepository.findOne({ appointment });
    if (existingAttendance) {
      throw new BadRequestException('Attendance already recorded for this appointment');
    }

    const attendance = new Attendance(
      appointment,
      student,
      createAttendanceDto.status,
      createAttendanceDto.notes,
      createAttendanceDto.markedByTutor
    );

    await this.em.persistAndFlush(attendance);
    return attendance;
  }

  async findAttendanceByAppointment(appointmentId: string) {
    return this.attendanceRepository.findOne(
      { appointment: appointmentId },
      { populate: ['appointment', 'student'] }
    );
  }

  async findAttendanceByStudent(studentId: string) {
    return this.attendanceRepository.find(
      { student: studentId },
      { 
        populate: ['appointment', 'student'],
        orderBy: { createdAt: 'DESC' }
      }
    );
  }

  async updateAttendance(id: string, updateAttendanceDto: UpdateAttendanceDto) {
    const attendance = await this.attendanceRepository.findOne({ id });
    if (!attendance) {
      throw new NotFoundException(`Attendance with ID ${id} not found`);
    }

    this.em.assign(attendance, updateAttendanceDto);
    await this.em.flush();
    return attendance;
  }

  // Class Report methods
  async createClassReport(createClassReportDto: CreateClassReportDto) {
    const appointment = await this.appointmentRepository.findOne({ id: createClassReportDto.appointmentId });
    if (!appointment) {
      throw new NotFoundException(`Appointment with ID ${createClassReportDto.appointmentId} not found`);
    }

    const tutor = await this.userRepository.findOne({ 
      id: createClassReportDto.tutorId,
      role: UserRole.TUTOR 
    });
    if (!tutor) {
      throw new NotFoundException(`Tutor with ID ${createClassReportDto.tutorId} not found`);
    }

    // Check if class report already exists for this appointment
    const existingReport = await this.classReportRepository.findOne({ appointment });
    if (existingReport) {
      throw new BadRequestException('Class report already exists for this appointment');
    }

    const classReport = new ClassReport(
      appointment,
      tutor,
      createClassReportDto.subject,
      createClassReportDto.content,
      createClassReportDto.homeworkAssigned,
      createClassReportDto.studentProgress,
      createClassReportDto.nextLessonNotes
    );

    await this.em.persistAndFlush(classReport);
    return classReport;
  }

  async findClassReportByAppointment(appointmentId: string) {
    return this.classReportRepository.findOne(
      { appointment: appointmentId },
      { populate: ['appointment', 'tutor'] }
    );
  }

  async findClassReportsByTutor(tutorId: string) {
    return this.classReportRepository.find(
      { tutor: tutorId },
      { 
        populate: ['appointment', 'tutor'],
        orderBy: { createdAt: 'DESC' }
      }
    );
  }

  async updateClassReport(id: string, updateClassReportDto: UpdateClassReportDto) {
    const classReport = await this.classReportRepository.findOne({ id });
    if (!classReport) {
      throw new NotFoundException(`Class report with ID ${id} not found`);
    }

    this.em.assign(classReport, updateClassReportDto);
    await this.em.flush();
    return classReport;
  }

  async removeClassReport(id: string) {
    const classReport = await this.classReportRepository.findOne({ id });
    if (!classReport) {
      throw new NotFoundException(`Class report with ID ${id} not found`);
    }

    await this.em.removeAndFlush(classReport);
    return { id, deleted: true };
  }

  async getAttendanceStats(studentId?: string, tutorId?: string) {
    const criteria: any = {};
    if (studentId) criteria.student = studentId;
    if (tutorId) criteria.appointment = { tutor: tutorId };

    const [
      totalAttendance,
      presentCount,
      absentCount,
      onTimeCancellationCount
    ] = await Promise.all([
      this.attendanceRepository.count(criteria),
      this.attendanceRepository.count({ ...criteria, status: AttendanceStatus.PRESENT }),
      this.attendanceRepository.count({ ...criteria, status: AttendanceStatus.ABSENT }),
      this.attendanceRepository.count({ ...criteria, status: AttendanceStatus.ON_TIME_CANCELLATION })
    ]);

    const attendanceRate = totalAttendance > 0 ? (presentCount / totalAttendance) * 100 : 0;

    return {
      totalAttendance,
      presentCount,
      absentCount,
      onTimeCancellationCount,
      attendanceRate: Math.round(attendanceRate * 100) / 100
    };
  }
}