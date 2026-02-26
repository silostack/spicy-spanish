import { Entity, ManyToOne, PrimaryKey, Property, Enum } from "@mikro-orm/core";
import { v4 } from "uuid";
import { Appointment } from "./appointment.entity";
import { User } from "../../users/entities/user.entity";

export enum AttendanceStatus {
  PRESENT = "present",
  ABSENT = "absent",
  ON_TIME_CANCELLATION = "on_time_cancellation",
}

@Entity()
export class Attendance {
  @PrimaryKey()
  id: string = v4();

  @ManyToOne(() => Appointment)
  appointment!: Appointment;

  @ManyToOne(() => User)
  student!: User;

  @Enum(() => AttendanceStatus)
  status: AttendanceStatus;

  @Property({ nullable: true })
  notes?: string;

  @Property({ nullable: true })
  markedByTutor?: boolean;

  @Property()
  markedAt: Date = new Date();

  @Property()
  createdAt: Date = new Date();

  @Property({ onUpdate: () => new Date() })
  updatedAt: Date = new Date();

  constructor(
    appointment: Appointment,
    student: User,
    status: AttendanceStatus,
    notes?: string,
    markedByTutor: boolean = false,
  ) {
    this.appointment = appointment;
    this.student = student;
    this.status = status;
    this.notes = notes;
    this.markedByTutor = markedByTutor;
  }
}
