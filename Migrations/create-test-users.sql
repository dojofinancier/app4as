-- Create test users with different roles for dashboard testing
-- Run this in Supabase SQL Editor

-- Test Admin User
INSERT INTO users (id, email, first_name, last_name, phone, role, created_at, updated_at)
VALUES (
  'admin-test-1234-5678-9abc-def012345678',
  'admin@test.com',
  'Admin',
  'Test',
  '(514) 111-1111',
  'admin',
  NOW(),
  NOW()
) ON CONFLICT (id) DO NOTHING;

-- Test Tutor User  
INSERT INTO users (id, email, first_name, last_name, phone, role, created_at, updated_at)
VALUES (
  'tutor-test-1234-5678-9abc-def012345678',
  'tutor@test.com',
  'Tutor',
  'Test',
  '(514) 222-2222',
  'tutor',
  NOW(),
  NOW()
) ON CONFLICT (id) DO NOTHING;

-- Test Student User
INSERT INTO users (id, email, first_name, last_name, phone, role, created_at, updated_at)
VALUES (
  'student-test-1234-5678-9abc-def012345678',
  'student@test.com',
  'Student',
  'Test',
  '(514) 333-3333',
  'student',
  NOW(),
  NOW()
) ON CONFLICT (id) DO NOTHING;

-- Create corresponding Supabase Auth users (you'll need to do this manually in Supabase Auth)
-- Or use the Supabase Admin API to create them

-- Check the created users
SELECT id, email, first_name, last_name, role FROM users 
WHERE email IN ('admin@test.com', 'tutor@test.com', 'student@test.com');
