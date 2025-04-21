import { Entity, PrimaryKey, Property } from '@mikro-orm/core';
import { v4 } from 'uuid';

@Entity()
export class Package {
  @PrimaryKey()
  id: string = v4();

  @Property()
  name: string;

  @Property()
  description: string;

  @Property()
  hours: number;

  @Property()
  priceUsd: number;

  @Property({ default: true })
  isActive: boolean;

  @Property({ nullable: true })
  stripeProductId?: string;

  @Property({ nullable: true })
  stripePriceId?: string;

  @Property()
  createdAt: Date = new Date();

  @Property({ onUpdate: () => new Date() })
  updatedAt: Date = new Date();

  constructor(
    name: string,
    description: string,
    hours: number,
    priceUsd: number,
    isActive: boolean = true,
    stripeProductId?: string,
    stripePriceId?: string,
  ) {
    this.name = name;
    this.description = description;
    this.hours = hours;
    this.priceUsd = priceUsd;
    this.isActive = isActive;
    this.stripeProductId = stripeProductId;
    this.stripePriceId = stripePriceId;
  }
}