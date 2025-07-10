import { Module } from '@nestjs/common';
import { MikroOrmModule } from '@mikro-orm/nestjs';
import { User } from './entities/user.entity';
import { StudentCourse } from '../courses/entities/student-course.entity';
import { Transaction } from '../payments/entities/transaction.entity';
import { Appointment } from '../scheduling/entities/appointment.entity';
import { UsersController } from './users.controller';
import { UsersService } from './users.service';

@Module({
  imports: [MikroOrmModule.forFeature([User, StudentCourse, Transaction, Appointment])],
  controllers: [UsersController],
  providers: [UsersService],
  exports: [UsersService],
})
export class UsersModule {}
