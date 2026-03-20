import { Logger } from "@nestjs/common";
import { EntityManager } from "@mikro-orm/core";
import { Package } from "../payments/entities/package.entity";

const logger = new Logger("PackageSeeder");

export const defaultPackages = [
  {
    name: "Basic Package",
    description:
      "A great way to get started with personalized Spanish lessons.",
    hours: 5,
    priceUsd: 143,
    isActive: true,
  },
  {
    name: "Standard Package",
    description:
      "Our most popular option for consistent progress.",
    hours: 10,
    priceUsd: 264,
    isActive: true,
  },
  {
    name: "Premium Package",
    description:
      "For dedicated learners ready to accelerate their fluency.",
    hours: 20,
    priceUsd: 462,
    isActive: true,
  },
  {
    name: "Premium Plus",
    description:
      "The ultimate immersive experience — 3 months of intensive Spanish.",
    hours: 90,
    priceUsd: 1836,
    isActive: true,
  },
];

export async function seedPackages(em: EntityManager): Promise<void> {
  logger.log("Checking packages...");

  // Check if packages already exist
  const existingPackages = await em.find(Package, {});

  if (existingPackages.length === 0) {
    logger.log("No packages found, creating default packages...");

    for (const pkgData of defaultPackages) {
      const pkg = new Package(
        pkgData.name,
        pkgData.description,
        pkgData.hours,
        pkgData.priceUsd,
        pkgData.isActive,
      );

      em.persist(pkg);
      logger.log(
        `Created package: ${pkg.name} (${pkg.hours} hours - $${pkg.priceUsd})`,
      );
    }

    await em.flush();
    logger.log("Default packages created successfully");
  } else {
    logger.log(
      `Found ${existingPackages.length} existing packages, skipping seed`,
    );
  }
}
