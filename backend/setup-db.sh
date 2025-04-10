#!/bin/bash

echo "Setting up database and seeding admin user..."

# Create schema
echo "Creating database schema..."
npx mikro-orm schema:create --run

# Seed admin user
echo "Seeding admin user..."
npm run seed

echo "Setup complete!"