import { Injectable, OnModuleInit } from '@nestjs/common';
import { EntityManager } from '@mikro-orm/core';
import { seedPackages } from './package.seeder';

@Injectable()
export class SeederService implements OnModuleInit {
  constructor(private readonly em: EntityManager) {}

  async onModuleInit() {
    console.log('🌱 Running database seeders...');
    
    try {
      // Create a fork to avoid conflicts with the main entity manager
      const fork = this.em.fork();
      
      // Run package seeder
      await seedPackages(fork);
      
      // Add more seeders here as needed
      // await seedCourses(fork);
      // await seedUsers(fork);
      
      console.log('✅ All seeders completed successfully');
    } catch (error) {
      console.error('❌ Error running seeders:', error);
    }
  }
}