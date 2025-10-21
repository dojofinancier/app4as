-- Quick check to see what data exists
SELECT 'COURSES' as table_name, COUNT(*) as count FROM courses
UNION ALL
SELECT 'TUTORS' as table_name, COUNT(*) as count FROM tutors
UNION ALL
SELECT 'TUTOR_COURSES' as table_name, COUNT(*) as count FROM tutor_courses
UNION ALL
SELECT 'AVAILABILITY_RULES' as table_name, COUNT(*) as count FROM availability_rules;
