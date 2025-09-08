import { Module } from '@nestjs/common';
import { MikroOrmModule } from '@mikro-orm/nestjs';
import { SeederService } from './seeder.service';
import { Package } from '../payments/entities/package.entity';

@Module({
  imports: [
    MikroOrmModule.forFeature([Package]),
  ],
  providers: [SeederService],
  exports: [SeederService],
})
export class SeederModule {}