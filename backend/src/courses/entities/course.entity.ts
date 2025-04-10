import { Entity, ManyToOne, PrimaryKey, Property, Collection, OneToMany } from '@mikro-orm/core';
import { v4 } from 'uuid';
import { User } from '../../users/entities/user.entity';
import { CourseLesson } from './course-lesson.entity';

@Entity()
export class Course {
  @PrimaryKey()
  id: string = v4();

  @Property()
  title: string;

  @Property({ type: 'text' })
  description: string;

  @OneToMany(() => CourseLesson, lesson => lesson.course, { orphanRemoval: true })
  lessons = new Collection<CourseLesson>(this);

  @Property({ default: true })
  isActive: boolean;

  @Property()
  createdAt: Date = new Date();

  @Property({ onUpdate: () => new Date() })
  updatedAt: Date = new Date();

  constructor(
    title: string,
    description: string,
    isActive: boolean = true,
  ) {
    this.title = title;
    this.description = description;
    this.isActive = isActive;
  }
}