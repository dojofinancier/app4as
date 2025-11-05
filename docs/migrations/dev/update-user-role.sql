-- Update existing user's role to test different dashboards
-- Replace 'your-user-id' with your actual user ID

-- To test Admin Dashboard:
UPDATE users 
SET role = 'admin' 
WHERE id = '7141cc13-fee3-460a-8b60-3f933eb7cebf';

-- To test Tutor Dashboard:
-- UPDATE users 
-- SET role = 'tutor' 
-- WHERE id = '7141cc13-fee3-460a-8b60-3f933eb7cebf';

-- To test Student Dashboard (default):
-- UPDATE users 
-- SET role = 'student' 
-- WHERE id = '7141cc13-fee3-460a-8b60-3f933eb7cebf';

-- Check current role
SELECT id, email, first_name, last_name, role FROM users 
WHERE id = '7141cc13-fee3-460a-8b60-3f933eb7cebf';
