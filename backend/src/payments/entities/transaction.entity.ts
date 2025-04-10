import { Entity, ManyToOne, PrimaryKey, Property, Enum } from '@mikro-orm/core';
import { v4 } from 'uuid';
import { User } from '../../users/entities/user.entity';
import { Package } from './package.entity';

export enum PaymentMethod {
  CREDIT_CARD = 'credit_card',
  CRYPTO = 'crypto',
  ZELLE = 'zelle',
  PAYPAL = 'paypal',
  MANUAL = 'manual',
}

export enum TransactionStatus {
  PENDING = 'pending',
  COMPLETED = 'completed',
  FAILED = 'failed',
  REFUNDED = 'refunded',
}

@Entity()
export class Transaction {
  @PrimaryKey()
  id: string = v4();

  @ManyToOne(() => User)
  student!: User;

  @ManyToOne(() => Package, { nullable: true })
  package?: Package;

  @Property()
  amountUsd: number;

  @Property()
  hours: number;

  @Enum(() => PaymentMethod)
  paymentMethod: PaymentMethod;

  @Enum(() => TransactionStatus)
  status: TransactionStatus = TransactionStatus.PENDING;

  @Property({ nullable: true })
  stripePaymentId?: string;

  @Property({ nullable: true })
  cryptoTransactionId?: string;

  @Property({ nullable: true })
  notes?: string;

  @Property({ nullable: true })
  invoiceUrl?: string;

  @Property()
  createdAt: Date = new Date();

  @Property({ onUpdate: () => new Date() })
  updatedAt: Date = new Date();

  constructor(
    student: User,
    amountUsd: number,
    hours: number,
    paymentMethod: PaymentMethod,
    status: TransactionStatus = TransactionStatus.PENDING,
    package?: Package,
  ) {
    this.student = student;
    this.amountUsd = amountUsd;
    this.hours = hours;
    this.paymentMethod = paymentMethod;
    this.status = status;
    this.package = package;
  }
}