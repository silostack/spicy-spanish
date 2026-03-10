import { Module } from "@nestjs/common";
import { MikroOrmModule } from "@mikro-orm/nestjs";
import { User } from "./entities/user.entity";
import { Transaction } from "../payments/entities/transaction.entity";
import { Lesson } from "../scheduling/entities/lesson.entity";
import { UsersController } from "./users.controller";
import { UsersService } from "./users.service";

@Module({
  imports: [MikroOrmModule.forFeature([User, Transaction, Lesson])],
  controllers: [UsersController],
  providers: [UsersService],
  exports: [UsersService],
})
export class UsersModule {}
