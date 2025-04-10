import { Module } from '@nestjs/common';
import { MikroOrmModule } from '@mikro-orm/nestjs';
import { Availability } from './entities/availability.entity';
import { Appointment } from './entities/appointment.entity';
import { SchedulingController } from './scheduling.controller';
import { SchedulingService } from './scheduling.service';

@Module({
  imports: [MikroOrmModule.forFeature([Availability, Appointment])],
  controllers: [SchedulingController],
  providers: [SchedulingService],
  exports: [],
})
export class SchedulingModule {}
