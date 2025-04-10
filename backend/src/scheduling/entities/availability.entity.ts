import { Entity, ManyToOne, PrimaryKey, Property } from '@mikro-orm/core';
import { v4 } from 'uuid';
import { User } from '../../users/entities/user.entity';

@Entity()
export class Availability {
  @PrimaryKey()
  id: string = v4();

  @ManyToOne(() => User)
  tutor!: User;

  @Property()
  dayOfWeek: number; // 0-6, where 0 is Sunday

  @Property()
  startTime: string; // "HH:MM" in 24-hour format

  @Property()
  endTime: string; // "HH:MM" in 24-hour format

  @Property({ default: true })
  isRecurring: boolean;

  @Property({ nullable: true })
  specificDate?: Date; // Only used if isRecurring is false

  @Property()
  createdAt: Date = new Date();

  @Property({ onUpdate: () => new Date() })
  updatedAt: Date = new Date();

  constructor(
    tutor: User,
    dayOfWeek: number,
    startTime: string,
    endTime: string,
    isRecurring: boolean = true,
    specificDate?: Date,
  ) {
    this.tutor = tutor;
    this.dayOfWeek = dayOfWeek;
    this.startTime = startTime;
    this.endTime = endTime;
    this.isRecurring = isRecurring;
    this.specificDate = specificDate;
  }
}