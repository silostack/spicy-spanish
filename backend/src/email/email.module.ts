import { Module } from '@nestjs/common';
import { MikroOrmModule } from '@mikro-orm/nestjs';
import { EmailService } from './email.service';
import { Appointment } from '../scheduling/entities/appointment.entity';

@Module({
  imports: [
    MikroOrmModule.forFeature([Appointment]),
  ],
  providers: [EmailService],
  exports: [EmailService],
})
export class EmailModule {}