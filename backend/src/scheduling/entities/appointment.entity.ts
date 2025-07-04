import { Entity, ManyToOne, PrimaryKey, Property, Enum } from '@mikro-orm/core';
import { v4 } from 'uuid';
import { User } from '../../users/entities/user.entity';
import { Course } from '../../courses/entities/course.entity';

export enum AppointmentStatus {
  SCHEDULED = 'scheduled',
  COMPLETED = 'completed',
  CANCELLED = 'cancelled',
  NO_SHOW = 'no_show',
}

@Entity()
export class Appointment {
  @PrimaryKey()
  id: string = v4();

  @ManyToOne(() => User)
  student!: User;

  @ManyToOne(() => User)
  tutor!: User;

  @ManyToOne(() => Course, { nullable: true })
  course?: Course;

  @Property()
  startTime: Date;

  @Property()
  endTime: Date;

  @Enum(() => AppointmentStatus)
  status: AppointmentStatus = AppointmentStatus.SCHEDULED;

  @Property({ nullable: true })
  googleCalendarEventId?: string;

  @Property({ nullable: true })
  notes?: string;

  @Property()
  createdAt: Date = new Date();

  @Property({ onUpdate: () => new Date() })
  updatedAt: Date = new Date();

  @Property({ default: false })
  reminderSent: boolean = false;
  
  @Property({ nullable: true })
  reminderSentAt?: Date;
  
  @Property({ default: false })
  dayBeforeReminderSent: boolean = false;
  
  @Property({ nullable: true })
  dayBeforeReminderSentAt?: Date;
  
  @Property({ default: false })
  confirmationEmailSent: boolean = false;

  constructor(
    student: User,
    tutor: User,
    startTime: Date,
    endTime: Date,
    status: AppointmentStatus = AppointmentStatus.SCHEDULED,
    course?: Course,
  ) {
    this.student = student;
    this.tutor = tutor;
    this.startTime = startTime;
    this.endTime = endTime;
    this.status = status;
    this.course = course;
  }
}