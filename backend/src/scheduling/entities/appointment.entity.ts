import { Entity, ManyToOne, ManyToMany, PrimaryKey, Property, Enum, Collection } from '@mikro-orm/core';
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

  @ManyToMany(() => User, undefined, { owner: true })
  students = new Collection<User>(this);

  @ManyToOne(() => User)
  tutor!: User;

  @ManyToOne(() => Course)
  course!: Course;

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

  @Property({ nullable: true })
  creditedBack?: boolean;

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
    tutor: User,
    course: Course,
    startTime: Date,
    endTime: Date,
    status: AppointmentStatus = AppointmentStatus.SCHEDULED,
  ) {
    this.tutor = tutor;
    this.course = course;
    this.startTime = startTime;
    this.endTime = endTime;
    this.status = status;
  }
}
