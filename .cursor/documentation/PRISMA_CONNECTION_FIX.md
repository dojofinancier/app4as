# Fixing Database Connection for Prisma db push

## Problem
`prisma db push` fails with: "Can't reach database server at `aws-1-us-east-1.supabase.com:5432`"

## Root Cause
According to [Supabase Prisma documentation](https://supabase.com/docs/guides/database/prisma), `prisma db push` uses `DIRECT_URL` for migrations. The current `DIRECT_URL` format may be incorrect.

## Solution

### Option 1: Use Session Pooler (Recommended for migrations)
Update your `.env` file:

```env
# For Prisma migrations (db push) - Session pooler (port 5432)
DIRECT_URL="postgres://prisma.rmdmmipiwvzvmliaqsnj:your_secure_password_here@aws-1-us-east-1.pooler.supabase.com:5432/postgres"
DIRECT_URL="postgresql://postgres:your_secure_password_here@rmdmmipiwvzvmliaqsnj.supabase.com:5432/postgres?sslmode=require"

# For application runtime - Transaction pooler (port 6543) for serverless
DATABASE_URL="postgresql://prisma.[YOUR-PROJECT-REF]:[YOUR-PRISMA-PASSWORD]@aws-1-us-east-1.pooler.supabase.com:6543/postgres?pgbouncer=true&sslmode=require"
```
# Transaction pooler for application queries (port 6543)
DATABASE_URL="postgresql://prisma.rmdmmipiwvzvmliaqsnj:your_secure_password_here@aws-1-us-east-1.pooler.supabase.com:6543/postgres?pgbouncer=true&sslmode=require"

# Direct connection for migrations (port 5432, different hostname)
DIRECT_URL="postgresql://postgres:your_secure_password_here@rmdmmipiwvzvmliaqsnj.supabase.com:5432/postgres?sslmode=require"

### Option 2: Use Direct Connection (If pooler doesn't work)
Update your `.env` file:

```env
# For Prisma migrations (db push) - Direct connection (port 5432)
DIRECT_URL="postgresql://postgres:[YOUR-POSTGRES-PASSWORD]@db.[YOUR-PROJECT-REF].supabase.co:5432/postgres?sslmode=require"
DIRECT_URL="postgresql://postgres:your_secure_password_here@db.rmdmmipiwvzvmliaqsnj.supabase.co:5432/postgres?sslmode=require"

# For application runtime - Transaction pooler (port 6543)
DATABASE_URL="postgresql://prisma.[YOUR-PROJECT-REF]:[YOUR-PRISMA-PASSWORD]@aws-1-us-east-1.pooler.supabase.com:6543/postgres?pgbouncer=true&sslmode=require"
```

## Steps to Fix

1. **Get your connection strings from Supabase Dashboard:**
   - Go to **Settings** → **Database**
   - Find **Connection Pooler** section
   - Copy **Session mode** connection string (port 5432) → Use for `DIRECT_URL`
   - Copy **Transaction mode** connection string (port 6543) → Use for `DATABASE_URL`

2. **Replace placeholders:**
   - `[YOUR-PROJECT-REF]`: Your Supabase project reference (found in dashboard URL)
   - `[YOUR-PRISMA-PASSWORD]`: Password for your Prisma user (if you created one) or use postgres password
   - `[YOUR-POSTGRES-PASSWORD]`: Your postgres user password

3. **Ensure Prisma user exists** (if using prisma user):
   Run this in Supabase SQL Editor:
   ```sql
   -- Create custom user for Prisma
   CREATE USER "prisma" WITH PASSWORD 'your_secure_password_here' BYPASSRLS CREATEDB;
   
   -- Grant privileges
   GRANT "prisma" TO "postgres";
   GRANT USAGE ON SCHEMA public TO prisma;
   GRANT CREATE ON SCHEMA public TO prisma;
   GRANT ALL ON ALL TABLES IN SCHEMA public TO prisma;
   GRANT ALL ON ALL ROUTINES IN SCHEMA public TO prisma;
   GRANT ALL ON ALL SEQUENCES IN SCHEMA public TO prisma;
   
   -- Set default privileges
   ALTER DEFAULT PRIVILEGES FOR ROLE postgres IN SCHEMA public 
     GRANT ALL ON TABLES TO prisma;
   ALTER DEFAULT PRIVILEGES FOR ROLE postgres IN SCHEMA public 
     GRANT ALL ON ROUTINES TO prisma;
   ALTER DEFAULT PRIVILEGES FOR ROLE postgres IN SCHEMA public 
     GRANT ALL ON SEQUENCES TO prisma;
   ```

4. **Test the connection:**
   ```bash
   npm run prisma:push
   ```

## Important Notes

- **DIRECT_URL** is used by `prisma db push` and `prisma migrate` commands
- **DATABASE_URL** is used by your application at runtime
- Session pooler (port 5432) supports migrations
- Transaction pooler (port 6543) is optimized for serverless but doesn't support migrations
- Direct connection (db.[PROJECT-REF].supabase.co:5432) always works but bypasses connection pooling

## Common Issues

1. **Wrong port**: DIRECT_URL must use port 5432 (Session pooler or direct connection)
2. **Missing password**: Ensure password is URL-encoded if it contains special characters
3. **Project paused**: Check Supabase dashboard to ensure project is active
4. **Network/firewall**: Port 5432 might be blocked

## Quick Fix

The fastest solution is to use the **Direct Connection** format:

```env
DIRECT_URL="postgresql://postgres:[YOUR-POSTGRES-PASSWORD]@db.[YOUR-PROJECT-REF].supabase.co:5432/postgres?sslmode=require"
```

Replace `[YOUR-PROJECT-REF]` with your actual project reference (found in Supabase dashboard URL).

