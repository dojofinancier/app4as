-- Add only missing data (safe to run multiple times)
-- Run this in Supabase SQL Editor

-- 1. Create tutor profile for your user (if it doesn't exist)
INSERT INTO tutors (id, display_name, bio_fr, hourly_base_rate_cad, priority, active) 
VALUES ('7141cc13-fee3-460a-8b60-3f933eb7cebf', 'Marie Dubois', 'Tutrice expérimentée en mathématiques avec 10 ans d''expérience. Spécialisée en algèbre et géométrie.', 75.00, 1, true)
ON CONFLICT (id) DO NOTHING;

-- 2. Assign tutor to all courses (if not already assigned)
INSERT INTO tutor_courses (id, tutor_id, course_id, active) 
VALUES 
('550e8400-e29b-41d4-a716-446655440011', '7141cc13-fee3-460a-8b60-3f933eb7cebf', '550e8400-e29b-41d4-a716-446655440001', true),
('550e8400-e29b-41d4-a716-446655440012', '7141cc13-fee3-460a-8b60-3f933eb7cebf', '550e8400-e29b-41d4-a716-446655440002', true),
('550e8400-e29b-41d4-a716-446655440013', '7141cc13-fee3-460a-8b60-3f933eb7cebf', '550e8400-e29b-41d4-a716-446655440003', true)
ON CONFLICT (id) DO NOTHING;

-- 3. Create availability rules (if they don't exist)
INSERT INTO availability_rules (id, tutor_id, weekday, start_time, end_time) 
VALUES 
('550e8400-e29b-41d4-a716-446655440021', '7141cc13-fee3-460a-8b60-3f933eb7cebf', 1, '09:00', '17:00'),
('550e8400-e29b-41d4-a716-446655440022', '7141cc13-fee3-460a-8b60-3f933eb7cebf', 2, '09:00', '17:00'),
('550e8400-e29b-41d4-a716-446655440023', '7141cc13-fee3-460a-8b60-3f933eb7cebf', 3, '09:00', '17:00'),
('550e8400-e29b-41d4-a716-446655440024', '7141cc13-fee3-460a-8b60-3f933eb7cebf', 4, '09:00', '17:00'),
('550e8400-e29b-41d4-a716-446655440025', '7141cc13-fee3-460a-8b60-3f933eb7cebf', 5, '09:00', '17:00')
ON CONFLICT (id) DO NOTHING;
