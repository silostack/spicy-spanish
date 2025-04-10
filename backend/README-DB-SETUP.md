# Database Setup Instructions

Before running the application, you need to set up a PostgreSQL database.

## Setting up PostgreSQL database

### 1. Create a database

```bash
# Login to PostgreSQL as your user
psql

# Inside the PostgreSQL shell, create the database
CREATE DATABASE spicy_spanish;

# Exit the PostgreSQL shell
\q
```

### 2. Update environment variables

Update the `.env` file with your PostgreSQL connection information:

```
DATABASE_URL=postgresql://your_username:your_password@localhost:5432/spicy_spanish
MIKRO_ORM_DB_NAME=spicy_spanish
MIKRO_ORM_USER=your_username
MIKRO_ORM_PASSWORD=your_password
MIKRO_ORM_HOST=localhost
MIKRO_ORM_PORT=5432
```

Replace `your_username` and `your_password` with your PostgreSQL credentials.

### 3. Create database schema

After setting up the database and updating the environment variables, run:

```bash
cd /Users/si/projects/maxi/spicy-claude/spicy-spanish/backend
npx mikro-orm schema:create --run
```

This will create all the necessary tables in your database.

## Common issues

### Connection errors

If you get a connection error, make sure:

1. PostgreSQL is running on your machine
2. The username, password, and database name in your `.env` file are correct
3. The PostgreSQL user has permission to create tables in the specified database

### Role does not exist

If you get "role 'username' does not exist", you need to create that PostgreSQL user:

```bash
# Login to PostgreSQL as superuser
sudo -u postgres psql

# Create a new user (role)
CREATE USER your_username WITH PASSWORD 'your_password';

# Grant privileges
GRANT ALL PRIVILEGES ON DATABASE spicy_spanish TO your_username;

# Exit
\q
```