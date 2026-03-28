import { Entity, PrimaryKey, Property } from "@mikro-orm/core";
import { v4 } from "uuid";

@Entity()
export class EbookSubscriber {
  @PrimaryKey()
  id: string = v4();

  @Property({ unique: true })
  email: string;

  @Property()
  createdAt: Date = new Date();
}
