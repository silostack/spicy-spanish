import { NestFactory } from '@nestjs/core';
import { Logger } from '@nestjs/common';
import { EntityManager } from '@mikro-orm/core';
import * as bcrypt from 'bcrypt';
import { v4 } from 'uuid';

import { AppModule } from './app.module';
import { User, UserRole } from './users/entities/user.entity';

async function bootstrap() {
  const app = await NestFactory.createApplicationContext(AppModule);
  const em = app.get(EntityManager);
  const logger = new Logger('Seed');

  try {
    // Check if admin user already exists
    const existingAdmin = await em.fork().findOne(User, { email: 'carla@spicyspanish.com' });
    
    if (!existingAdmin) {
      logger.log('Creating admin user: carla@spicyspanish.com');
      
      // Create admin user
      const hashedPassword = await bcrypt.hash('carla', 10);
      const admin = new User(
        'Carla',
        'Admin',
        'carla@spicyspanish.com',
        hashedPassword,
        UserRole.ADMIN
      );
      admin.id = v4();
      
      await em.fork().persistAndFlush(admin);
      logger.log('Admin user created successfully!');
    } else {
      logger.log('Admin user already exists, skipping creation.');
    }
  } catch (error) {
    logger.error('Error during seeding:', error);
  } finally {
    await app.close();
  }
}

bootstrap();