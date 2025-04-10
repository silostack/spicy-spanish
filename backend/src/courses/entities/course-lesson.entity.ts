import { Entity, ManyToOne, PrimaryKey, Property } from '@mikro-orm/core';
import { v4 } from 'uuid';
import { Course } from './course.entity';

@Entity()
export class CourseLesson {
  @PrimaryKey()
  id: string = v4();

  @ManyToOne(() => Course)
  course!: Course;

  @Property()
  title: string;

  @Property({ type: 'text' })
  content: string;

  @Property()
  order: number;

  @Property()
  createdAt: Date = new Date();

  @Property({ onUpdate: () => new Date() })
  updatedAt: Date = new Date();

  constructor(
    course: Course,
    title: string,
    content: string,
    order: number,
  ) {
    this.course = course;
    this.title = title;
    this.content = content;
    this.order = order;
  }
}