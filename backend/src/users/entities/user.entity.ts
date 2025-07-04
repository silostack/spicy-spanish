import { Entity, Enum, PrimaryKey, Property, OneToMany, Collection } from '@mikro-orm/core';
import { v4 } from 'uuid';
import { Exclude } from 'class-transformer';

export enum UserRole {
  ADMIN = 'admin',
  TUTOR = 'tutor',
  STUDENT = 'student',
}

@Entity()
export class User {
  @PrimaryKey()
  id: string = v4();

  @Property()
  firstName: string;

  @Property()
  lastName: string;

  @Property({ unique: true })
  email: string;

  @Property()
  @Exclude({ toPlainOnly: true })
  password: string;

  @Enum(() => UserRole)
  role: UserRole;

  @Property({ nullable: true })
  profilePicture?: string;

  @Property({ nullable: true })
  bio?: string;

  @Property({ nullable: true })
  timezone?: string;

  @Property({ nullable: true })
  phoneNumber?: string;

  @Property({ nullable: true })
  invitationToken?: string;

  @Property({ nullable: true })
  resetPasswordToken?: string;

  @Property({ nullable: true })
  resetPasswordExpires?: Date;

  @Property({ nullable: true })
  stripeCustomerId?: string;

  @Property({ nullable: true })
  googleCalendarId?: string;

  @Property({ nullable: true })
  dateOfBirth?: Date;

  @Property({ nullable: true })
  nationality?: string;

  @Property({ nullable: true })
  profession?: string;

  @Property({ nullable: true })
  address?: string;

  @Property({ default: true })
  isActive: boolean = true;

  @Property({ nullable: true })
  tutorExperience?: string;

  @Property()
  createdAt: Date = new Date();

  @Property({ onUpdate: () => new Date() })
  updatedAt: Date = new Date();

  constructor(
    firstName: string,
    lastName: string,
    email: string,
    password: string,
    role: UserRole,
  ) {
    this.firstName = firstName;
    this.lastName = lastName;
    this.email = email;
    this.password = password;
    this.role = role;
  }

  get fullName(): string {
    return `${this.firstName} ${this.lastName}`;
  }
}