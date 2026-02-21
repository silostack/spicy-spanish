import { Logger } from '@nestjs/common';
import { EntityManager } from '@mikro-orm/core';
import { Package } from '../payments/entities/package.entity';

const logger = new Logger('PackageSeeder');

export const defaultPackages = [
  {
    name: 'Starter Package',
    description: 'Perfect for beginners wanting to try out our Spanish lessons. Includes personalized lesson plans and progress tracking.',
    hours: 4,
    priceUsd: 49,
    isActive: true
  },
  {
    name: 'Popular Package',
    description: 'Our most popular package for consistent learning. Ideal for students committed to regular practice and steady progress.',
    hours: 8,
    priceUsd: 89,
    isActive: true
  },
  {
    name: 'Intensive Package',
    description: 'For serious learners who want to progress quickly. Includes priority scheduling and additional learning resources.',
    hours: 16,
    priceUsd: 159,
    isActive: true
  },
  {
    name: 'Premium Package',
    description: 'Maximum flexibility and value for dedicated students. Includes all premium features and personalized curriculum design.',
    hours: 32,
    priceUsd: 299,
    isActive: true
  }
];

export async function seedPackages(em: EntityManager): Promise<void> {
  logger.log('Checking packages...');

  // Check if packages already exist
  const existingPackages = await em.find(Package, {});

  if (existingPackages.length === 0) {
    logger.log('No packages found, creating default packages...');

    for (const pkgData of defaultPackages) {
      const pkg = new Package(
        pkgData.name,
        pkgData.description,
        pkgData.hours,
        pkgData.priceUsd,
        pkgData.isActive
      );

      em.persist(pkg);
      logger.log(`Created package: ${pkg.name} (${pkg.hours} hours - $${pkg.priceUsd})`);
    }

    await em.flush();
    logger.log('Default packages created successfully');
  } else {
    logger.log(`Found ${existingPackages.length} existing packages, skipping seed`);
  }
}