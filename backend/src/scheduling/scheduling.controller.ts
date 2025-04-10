import { Controller, Get } from '@nestjs/common';
import { SchedulingService } from './scheduling.service';

@Controller('scheduling')
export class SchedulingController {
  constructor(private readonly schedulingService: SchedulingService) {}

  @Get()
  findAll() {
    return { message: 'Scheduling endpoint is working', data: this.schedulingService.findAll() };
  }
}
