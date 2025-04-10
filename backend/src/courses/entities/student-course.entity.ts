import { Entity, ManyToOne, PrimaryKey, Property } from '@mikro-orm/core';
import { v4 } from 'uuid';
import { User } from '../../users/entities/user.entity';
import { Course } from './course.entity';

@Entity()
export class StudentCourse {
  @PrimaryKey()
  id: string = v4();

  @ManyToOne(() => User)
  student!: User;

  @ManyToOne(() => User)
  tutor!: User;

  @ManyToOne(() => Course)
  course!: Course;

  @Property({ default: 0 })
  progress: number;

  @Property()
  createdAt: Date = new Date();

  @Property({ onUpdate: () => new Date() })
  updatedAt: Date = new Date();

  constructor(
    student: User,
    tutor: User,
    course: Course,
    progress: number = 0,
  ) {
    this.student = student;
    this.tutor = tutor;
    this.course = course;
    this.progress = progress;
  }
}