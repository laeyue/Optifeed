# PostgreSQL Setup Guide for OptiFeed

## Step 1: Install PostgreSQL

### Windows:
1. Download PostgreSQL from: https://www.postgresql.org/download/windows/
2. Run the installer (PostgreSQL 16 or later recommended)
3. During installation:
   - Set a password for the `postgres` superuser (remember this!)
   - Default port: 5432
   - Install Stack Builder components (optional)

### Verify Installation:
```powershell
psql --version
```

## Step 2: Create the Database

Open PowerShell and connect to PostgreSQL:

```powershell
# Connect as postgres superuser
psql -U postgres

# Or if the above doesn't work:
& "C:\Program Files\PostgreSQL\16\bin\psql.exe" -U postgres
```

Enter your postgres password when prompted.

In the PostgreSQL shell, create the database:

```sql
CREATE DATABASE optifeed;
\q
```

## Step 3: Run the Schema

```powershell
# Navigate to your project directory
cd C:\Users\karyl\Downloads\sincity

# Run the schema file
psql -U postgres -d optifeed -f database/schema.sql

# Or:
& "C:\Program Files\PostgreSQL\16\bin\psql.exe" -U postgres -d optifeed -f database/schema.sql
```

## Step 4: Verify Setup

Connect to the database:

```powershell
psql -U postgres -d optifeed
```

Check the tables:

```sql
-- List all tables
\dt

-- Check users table
SELECT username, name, role FROM users;

-- Check sensors table
SELECT id, name, sensor_type, status FROM sensors;

-- Check sample readings count
SELECT COUNT(*) FROM sensor_readings;

-- Exit
\q
```

## Step 5: Create a Node.js Backend (Next Step)

You'll need to create a backend API to connect your frontend to PostgreSQL. The backend files are being created next.

## Connection Details (for backend)

- **Host**: localhost
- **Port**: 5432
- **Database**: optifeed
- **Username**: postgres (or create a dedicated user)
- **Password**: [your postgres password]

## Optional: Create a Dedicated Database User

For security, create a user specifically for your application:

```sql
-- Connect to PostgreSQL
psql -U postgres

-- Create user
CREATE USER optifeed_app WITH PASSWORD 'your_secure_password';

-- Grant privileges
GRANT ALL PRIVILEGES ON DATABASE optifeed TO optifeed_app;

-- Connect to optifeed database
\c optifeed

-- Grant schema privileges
GRANT ALL PRIVILEGES ON ALL TABLES IN SCHEMA public TO optifeed_app;
GRANT ALL PRIVILEGES ON ALL SEQUENCES IN SCHEMA public TO optifeed_app;

\q
```

## Troubleshooting

### Issue: `psql` command not found
**Solution**: Add PostgreSQL to your PATH:
1. Open System Properties → Environment Variables
2. Edit PATH variable
3. Add: `C:\Program Files\PostgreSQL\16\bin`
4. Restart PowerShell

### Issue: Password authentication failed
**Solution**: 
1. Check `pg_hba.conf` file (usually in `C:\Program Files\PostgreSQL\16\data\`)
2. Ensure it has: `host all all 127.0.0.1/32 md5`
3. Restart PostgreSQL service

### Issue: Connection refused
**Solution**: Start PostgreSQL service:
```powershell
Start-Service postgresql-x64-16
```

## Next Steps

After database setup is complete:
1. Install Node.js backend dependencies
2. Configure environment variables
3. Start the API server
4. Update frontend to use API instead of localStorage

The backend setup files are being created next!
