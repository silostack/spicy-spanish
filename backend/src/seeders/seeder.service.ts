import { Injectable, OnModuleInit, Logger } from '@nestjs/common';
import { EntityManager } from '@mikro-orm/core';
import { seedPackages } from './package.seeder';

@Injectable()
export class SeederService implements OnModuleInit {
  private readonly logger = new Logger(SeederService.name);

  constructor(private readonly em: EntityManager) {}

  async onModuleInit() {
    this.logger.log('Running database seeders...');

    try {
      // Create a fork to avoid conflicts with the main entity manager
      const fork = this.em.fork();

      // Run package seeder
      await seedPackages(fork);

      // Add more seeders here as needed
      // await seedCourses(fork);
      // await seedUsers(fork);

      this.logger.log('All seeders completed successfully');
    } catch (error) {
      this.logger.error('Error running seeders', error.stack);
    }
  }
}