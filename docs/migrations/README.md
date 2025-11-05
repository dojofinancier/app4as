# Database Migrations

This directory contains SQL migration files organized by purpose.

## Directory Structure

### `dev/` - Development/Test Scripts
Scripts used for development and testing. **DO NOT run these in production.**

- `check-current-data.sql` - Check current data in database
- `check-existing-data.sql` - Check what data already exists
- `create-sample-tutors.sql` - Create sample tutors (development only)
- `create-sample-tutors-safe.sql` - Safe version of sample tutor creation
- `create-test-users.sql` - Create test users with different roles
- `disable-rls-temporarily.sql` - ⚠️ **DANGEROUS** - Temporarily disables RLS (testing only)
- `setup-sample-data.sql` - Setup sample data for testing
- `setup-sample-data-step1.sql` - Step 1 of sample data setup
- `setup-sample-data-complete.sql` - Complete sample data setup
- `update-user-role.sql` - Update user role for testing (contains hardcoded user ID)

### `manual/` - One-Time Manual Migrations
These are one-time manual migrations that have been applied to production. They are kept for historical reference.

**Status:** All migrations in this directory have been applied to production.

- `add-message-attachments.sql` - Add message_attachments table
- `add-messaging-system.sql` - Add messages table for student-tutor messaging
- `add-missing-data.sql` - Add missing data (courses, tutors, availability rules)
- `add-order-refund-fields.sql` - Add order refund fields to refund_requests table
- `add-reservation-management.sql` - Add reservation management and credit bank system
- `add-user-profile-fields.sql` - Add Stripe customer ID and payment method fields

### `rls/` - Row Level Security (RLS) Policies
Scripts for setting up Row Level Security policies and storage bucket policies.

- `setup-message-attachments-rls.sql` - RLS policies for message attachments
- `setup-missing-data.sql` - Setup missing data (may be duplicate)
- `setup-simple-storage-policies.sql` - Simple storage policies
- `setup-storage-policies.sql` - Storage policies for message-attachments bucket
- `setup-ultra-simple-storage.sql` - Ultra simple storage policies

## Important Notes

1. **Production Database:** All manual migrations have been applied. Do not run them again.
2. **Development Scripts:** Use dev scripts only in development/staging environments.
3. **RLS Policies:** RLS setup scripts may need to be run when setting up new environments.
4. **Prisma Migrations:** Actual schema changes should be managed through Prisma migrations in `prisma/migrations/` (when using Prisma Migrate).

## Applying Migrations

### For New Environments

1. First, ensure Prisma schema is applied: `npm run prisma:push`
2. Review and apply any necessary RLS policies from `rls/` directory
3. Use `dev/` scripts only for development/testing

### For Production

- **DO NOT** run any scripts from `dev/` directory
- Manual migrations in `manual/` have already been applied
- RLS policies should already be configured

## Migration Status

All migrations in `manual/` have been applied to production. The database schema is managed through:
- Prisma schema (`prisma/schema.prisma`)
- Prisma migrations (when using Prisma Migrate)
- Manual SQL migrations (documented here for historical reference)

