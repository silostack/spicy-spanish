import { Entity, ManyToOne, ManyToMany, PrimaryKey, Property, Collection, OneToMany } from '@mikro-orm/core';
import { v4 } from 'uuid';
import { User } from '../../users/entities/user.entity';

@Entity()
export class Course {
  @PrimaryKey()
  id: string = v4();

  @Property()
  title: string;

  @ManyToOne(() => User)
  tutor!: User;

  @ManyToMany(() => User, undefined, { owner: true })
  students = new Collection<User>(this);

  @Property()
  startDate: Date;

  @Property({ default: true })
  isActive: boolean = true;

  @Property({ type: 'decimal', precision: 6, scale: 2, default: 0 })
  hoursBalance: number = 0;

  @Property({ default: false })
  needsRenewal: boolean = false;

  @Property()
  createdAt: Date = new Date();

  @Property({ onUpdate: () => new Date() })
  updatedAt: Date = new Date();

  constructor(title: string, tutor: User, startDate: Date) {
    this.title = title;
    this.tutor = tutor;
    this.startDate = startDate;
  }
}
