-- Create additional sample tutors and users for testing (safe version)
-- Run this in Supabase SQL Editor

-- 1. Create additional users (students and tutors) - only if they don't exist
INSERT INTO users (id, role, first_name, last_name, email, created_at) VALUES
-- Additional tutors
('550e8400-e29b-41d4-a716-446655440061', 'tutor', 'Jean', 'Tremblay', 'jean.tremblay@example.com', NOW()),
('550e8400-e29b-41d4-a716-446655440062', 'tutor', 'Sophie', 'Martin', 'sophie.martin@example.com', NOW()),
('550e8400-e29b-41d4-a716-446655440063', 'tutor', 'Pierre', 'Lavoie', 'pierre.lavoie@example.com', NOW()),
-- Admin user
('550e8400-e29b-41d4-a716-446655440064', 'admin', 'Admin', 'User', 'admin@example.com', NOW()),
-- Student users
('550e8400-e29b-41d4-a716-446655440065', 'student', 'Emma', 'Dubois', 'emma.dubois@example.com', NOW()),
('550e8400-e29b-41d4-a716-446655440066', 'student', 'Lucas', 'Gagnon', 'lucas.gagnon@example.com', NOW()),
('550e8400-e29b-41d4-a716-446655440067', 'student', 'Chloé', 'Roy', 'chloe.roy@example.com', NOW())
ON CONFLICT (id) DO NOTHING;

-- 2. Create tutor profiles - only if they don't exist
INSERT INTO tutors (id, display_name, bio_fr, hourly_base_rate_cad, priority, active) VALUES
('550e8400-e29b-41d4-a716-446655440061', 'Jean Tremblay', 'Professeur de français passionné, expert en littérature québécoise et grammaire. 8 ans d''expérience.', 70.00, 2, true),
('550e8400-e29b-41d4-a716-446655440062', 'Sophie Martin', 'Scientifique de formation, excellente pédagogue pour les sciences naturelles. Spécialisée en biologie et chimie.', 80.00, 3, true),
('550e8400-e29b-41d4-a716-446655440063', 'Pierre Lavoie', 'Ingénieur retraité, passionné de mathématiques. Excellent pour expliquer les concepts complexes de manière simple.', 65.00, 4, true)
ON CONFLICT (id) DO NOTHING;

-- 3. Assign tutors to courses - only new assignments that don't exist
INSERT INTO tutor_courses (id, tutor_id, course_id, active) VALUES
-- Pierre Lavoie to Mathématiques (new assignment)
('550e8400-e29b-41d4-a716-446655440072', '550e8400-e29b-41d4-a716-446655440063', '550e8400-e29b-41d4-a716-446655440001', true),
-- Jean Tremblay to Français (new assignment)
('550e8400-e29b-41d4-a716-446655440073', '550e8400-e29b-41d4-a716-446655440061', '550e8400-e29b-41d4-a716-446655440002', true),
-- Marie to Français (new assignment)
('550e8400-e29b-41d4-a716-446655440074', '7141cc13-fee3-460a-8b60-3f933eb7cebf', '550e8400-e29b-41d4-a716-446655440002', true),
-- Sophie Martin to Sciences (new assignment)
('550e8400-e29b-41d4-a716-446655440075', '550e8400-e29b-41d4-a716-446655440062', '550e8400-e29b-41d4-a716-446655440003', true),
-- Marie to Sciences (new assignment)
('550e8400-e29b-41d4-a716-446655440076', '7141cc13-fee3-460a-8b60-3f933eb7cebf', '550e8400-e29b-41d4-a716-446655440003', true)
ON CONFLICT (id) DO NOTHING;

-- 4. Create availability rules for new tutors - only if they don't exist
-- Jean Tremblay (Français) - Monday to Friday 10am-6pm
INSERT INTO availability_rules (id, tutor_id, weekday, start_time, end_time) VALUES
('550e8400-e29b-41d4-a716-446655440081', '550e8400-e29b-41d4-a716-446655440061', 1, '10:00', '18:00'),
('550e8400-e29b-41d4-a716-446655440082', '550e8400-e29b-41d4-a716-446655440061', 2, '10:00', '18:00'),
('550e8400-e29b-41d4-a716-446655440083', '550e8400-e29b-41d4-a716-446655440061', 3, '10:00', '18:00'),
('550e8400-e29b-41d4-a716-446655440084', '550e8400-e29b-41d4-a716-446655440061', 4, '10:00', '18:00'),
('550e8400-e29b-41d4-a716-446655440085', '550e8400-e29b-41d4-a716-446655440061', 5, '10:00', '18:00'),

-- Sophie Martin (Sciences) - Tuesday to Saturday 8am-4pm
('550e8400-e29b-41d4-a716-446655440091', '550e8400-e29b-41d4-a716-446655440062', 2, '08:00', '16:00'),
('550e8400-e29b-41d4-a716-446655440092', '550e8400-e29b-41d4-a716-446655440062', 3, '08:00', '16:00'),
('550e8400-e29b-41d4-a716-446655440093', '550e8400-e29b-41d4-a716-446655440062', 4, '08:00', '16:00'),
('550e8400-e29b-41d4-a716-446655440094', '550e8400-e29b-41d4-a716-446655440062', 5, '08:00', '16:00'),
('550e8400-e29b-41d4-a716-446655440095', '550e8400-e29b-41d4-a716-446655440062', 6, '08:00', '16:00'),

-- Pierre Lavoie (Mathématiques) - Monday, Wednesday, Friday 1pm-7pm
('550e8400-e29b-41d4-a716-446655440101', '550e8400-e29b-41d4-a716-446655440063', 1, '13:00', '19:00'),
('550e8400-e29b-41d4-a716-446655440102', '550e8400-e29b-41d4-a716-446655440063', 3, '13:00', '19:00'),
('550e8400-e29b-41d4-a716-446655440103', '550e8400-e29b-41d4-a716-446655440063', 5, '13:00', '19:00')
ON CONFLICT (id) DO NOTHING;
