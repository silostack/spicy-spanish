import { Entity, ManyToOne, PrimaryKey, Property } from "@mikro-orm/core";
import { v4 } from "uuid";
import { Course } from "./course.entity";

@Entity()
export class CourseSchedule {
  @PrimaryKey()
  id: string = v4();

  @ManyToOne(() => Course)
  course!: Course;

  @Property()
  dayOfWeek: number;

  @Property()
  startTime: string;

  @Property()
  endTime: string;

  @Property()
  createdAt: Date = new Date();

  @Property({ onUpdate: () => new Date() })
  updatedAt: Date = new Date();

  constructor(
    course: Course,
    dayOfWeek: number,
    startTime: string,
    endTime: string,
  ) {
    this.course = course;
    this.dayOfWeek = dayOfWeek;
    this.startTime = startTime;
    this.endTime = endTime;
  }
}
