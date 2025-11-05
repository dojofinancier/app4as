-- Check current data in the database
-- Run this in Supabase SQL Editor to see what exists

-- Check users by role
SELECT 'USERS BY ROLE' as info, role, COUNT(*) as count FROM users GROUP BY role;

-- Check tutors
SELECT 'TUTORS' as info, t.display_name, t.hourly_base_rate_cad, u.email, t.active 
FROM tutors t 
JOIN users u ON t.id = u.id;

-- Check tutor-course assignments
SELECT 'TUTOR-COURSE ASSIGNMENTS' as info, t.display_name, c.title_fr, tc.active
FROM tutor_courses tc
JOIN tutors t ON tc.tutor_id = t.id
JOIN courses c ON tc.course_id = c.id;

-- Check availability rules
SELECT 'AVAILABILITY RULES' as info, t.display_name, ar.weekday, ar.start_time, ar.end_time
FROM availability_rules ar
JOIN tutors t ON ar.tutor_id = t.id
ORDER BY t.display_name, ar.weekday;
