-- Check what data already exists
-- Run this in Supabase SQL Editor to see what's already there

-- Check courses
SELECT 'COURSES' as table_name, id, slug, title_fr FROM courses;

-- Check tutors
SELECT 'TUTORS' as table_name, id, display_name FROM tutors;

-- Check tutor_courses
SELECT 'TUTOR_COURSES' as table_name, tc.id, t.display_name, c.title_fr 
FROM tutor_courses tc
JOIN tutors t ON tc.tutor_id = t.id
JOIN courses c ON tc.course_id = c.id;

-- Check availability_rules
SELECT 'AVAILABILITY_RULES' as table_name, ar.id, t.display_name, ar.weekday, ar.start_time, ar.end_time
FROM availability_rules ar
JOIN tutors t ON ar.tutor_id = t.id;

-- Check coupons
SELECT 'COUPONS' as table_name, id, code, type, value FROM coupons;
