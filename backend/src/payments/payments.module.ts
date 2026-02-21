import { Module } from '@nestjs/common';
import { MikroOrmModule } from '@mikro-orm/nestjs';
import { Package } from './entities/package.entity';
import { Transaction } from './entities/transaction.entity';
import { PaymentsController } from './payments.controller';
import { PaymentsService } from './payments.service';
import { User } from '../users/entities/user.entity';
import { Appointment } from '../scheduling/entities/appointment.entity';

@Module({
  imports: [MikroOrmModule.forFeature([Package, Transaction, User, Appointment])],
  controllers: [PaymentsController],
  providers: [PaymentsService],
  exports: [PaymentsService],
})
export class PaymentsModule {}
