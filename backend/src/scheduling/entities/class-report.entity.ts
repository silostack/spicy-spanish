import { Entity, ManyToOne, PrimaryKey, Property } from '@mikro-orm/core';
import { v4 } from 'uuid';
import { Appointment } from './appointment.entity';
import { User } from '../../users/entities/user.entity';

@Entity()
export class ClassReport {
  @PrimaryKey()
  id: string = v4();

  @ManyToOne(() => Appointment)
  appointment!: Appointment;

  @ManyToOne(() => User)
  tutor!: User;

  @Property()
  subject: string;

  @Property({ type: 'text' })
  content: string;

  @Property({ nullable: true })
  homeworkAssigned?: string;

  @Property({ nullable: true })
  studentProgress?: string;

  @Property({ nullable: true })
  nextLessonNotes?: string;

  @Property()
  createdAt: Date = new Date();

  @Property({ onUpdate: () => new Date() })
  updatedAt: Date = new Date();

  constructor(
    appointment: Appointment,
    tutor: User,
    subject: string,
    content: string,
    homeworkAssigned?: string,
    studentProgress?: string,
    nextLessonNotes?: string,
  ) {
    this.appointment = appointment;
    this.tutor = tutor;
    this.subject = subject;
    this.content = content;
    this.homeworkAssigned = homeworkAssigned;
    this.studentProgress = studentProgress;
    this.nextLessonNotes = nextLessonNotes;
  }
}