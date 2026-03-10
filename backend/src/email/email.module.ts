import { Module } from "@nestjs/common";
import { MikroOrmModule } from "@mikro-orm/nestjs";
import { EmailService } from "./email.service";
import { Lesson } from "../scheduling/entities/lesson.entity";

@Module({
  imports: [MikroOrmModule.forFeature([Lesson])],
  providers: [EmailService],
  exports: [EmailService],
})
export class EmailModule {}
