import { Entity, ManyToOne, PrimaryKey, Property } from "@mikro-orm/core";
import { v4 } from "uuid";
import { Lesson } from "./lesson.entity";
import { User } from "../../users/entities/user.entity";

@Entity()
export class ClassReport {
  @PrimaryKey()
  id: string = v4();

  @ManyToOne(() => Lesson)
  lesson!: Lesson;

  @ManyToOne(() => User)
  tutor!: User;

  @Property()
  subject: string;

  @Property({ type: "text" })
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
    lesson: Lesson,
    tutor: User,
    subject: string,
    content: string,
    homeworkAssigned?: string,
    studentProgress?: string,
    nextLessonNotes?: string,
  ) {
    this.lesson = lesson;
    this.tutor = tutor;
    this.subject = subject;
    this.content = content;
    this.homeworkAssigned = homeworkAssigned;
    this.studentProgress = studentProgress;
    this.nextLessonNotes = nextLessonNotes;
  }
}
