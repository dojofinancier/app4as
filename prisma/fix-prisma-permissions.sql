-- Fix Prisma Permissions for Schema Changes
-- Run this in Supabase SQL Editor

-- Grant ownership of all tables to postgres (if not already)
-- Then grant necessary privileges to prisma user

-- Option 1: Grant ownership to postgres role (if using postgres user)
-- This ensures the postgres user can modify all tables
DO $$
DECLARE
    r RECORD;
BEGIN
    FOR r IN (SELECT tablename FROM pg_tables WHERE schemaname = 'public') LOOP
        EXECUTE format('ALTER TABLE %I OWNER TO postgres', r.tablename);
    END LOOP;
END $$;

-- Option 2: Grant all privileges to prisma user (if using prisma user for migrations)
-- Make sure prisma user exists first
DO $$
BEGIN
    IF EXISTS (SELECT FROM pg_user WHERE usename = 'prisma') THEN
        -- Grant ownership of all tables to prisma
        FOR r IN (SELECT tablename FROM pg_tables WHERE schemaname = 'public') LOOP
            EXECUTE format('ALTER TABLE %I OWNER TO prisma', r.tablename);
        END LOOP;
        
        -- Grant ownership of all sequences to prisma
        FOR r IN (SELECT sequence_name FROM information_schema.sequences WHERE sequence_schema = 'public') LOOP
            EXECUTE format('ALTER SEQUENCE %I OWNER TO prisma', r.sequence_name);
        END LOOP;
    END IF;
END $$;

-- Grant all privileges on schema public to postgres (ensure full access)
GRANT ALL ON SCHEMA public TO postgres;
GRANT ALL ON ALL TABLES IN SCHEMA public TO postgres;
GRANT ALL ON ALL SEQUENCES IN SCHEMA public TO postgres;
GRANT ALL ON ALL FUNCTIONS IN SCHEMA public TO postgres;

-- Set default privileges for future objects
ALTER DEFAULT PRIVILEGES IN SCHEMA public GRANT ALL ON TABLES TO postgres;
ALTER DEFAULT PRIVILEGES IN SCHEMA public GRANT ALL ON SEQUENCES TO postgres;
ALTER DEFAULT PRIVILEGES IN SCHEMA public GRANT ALL ON FUNCTIONS TO postgres;

-- If using prisma user, grant all privileges
DO $$
BEGIN
    IF EXISTS (SELECT FROM pg_user WHERE usename = 'prisma') THEN
        GRANT ALL ON SCHEMA public TO prisma;
        GRANT ALL ON ALL TABLES IN SCHEMA public TO prisma;
        GRANT ALL ON ALL SEQUENCES IN SCHEMA public TO prisma;
        GRANT ALL ON ALL FUNCTIONS IN SCHEMA public TO prisma;
        
        ALTER DEFAULT PRIVILEGES IN SCHEMA public GRANT ALL ON TABLES TO prisma;
        ALTER DEFAULT PRIVILEGES IN SCHEMA public GRANT ALL ON SEQUENCES TO prisma;
        ALTER DEFAULT PRIVILEGES IN SCHEMA public GRANT ALL ON FUNCTIONS TO prisma;
    END IF;
END $$;

