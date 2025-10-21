-- Sample data for testing the tutor booking application
-- Run this in Supabase SQL Editor

-- 1. Create sample courses
INSERT INTO courses (id, slug, title_fr, description_fr, active, created_at) VALUES
('550e8400-e29b-41d4-a716-446655440001', 'mathematiques-secondaire', 'Mathématiques - Secondaire', 'Cours de mathématiques pour étudiants du secondaire. Algèbre, géométrie, trigonométrie et plus.', true, NOW()),
('550e8400-e29b-41d4-a716-446655440002', 'francais-secondaire', 'Français - Secondaire', 'Cours de français langue maternelle: grammaire, orthographe, littérature et rédaction.', true, NOW()),
('550e8400-e29b-41d4-a716-446655440003', 'sciences-secondaire', 'Sciences - Secondaire', 'Cours de sciences: biologie, chimie et physique pour le secondaire.', true, NOW());

-- 2. Create sample tutors (you'll need to replace the user IDs with actual ones from your users table)
-- First, let's see what users exist:
-- SELECT id, email, role FROM users;

-- Then create tutor profiles (replace the IDs with actual user IDs from your users table)
INSERT INTO tutors (id, display_name, bio_fr, hourly_base_rate_cad, priority, active) VALUES
-- Replace 'your-user-id-1' with actual user ID from users table
('your-user-id-1', 'Marie Dubois', 'Tutrice expérimentée en mathématiques avec 10 ans d''expérience. Spécialisée en algèbre et géométrie.', 75.00, 1, true),
('your-user-id-2', 'Jean Tremblay', 'Professeur de français passionné, expert en littérature québécoise et grammaire.', 70.00, 2, true),
('your-user-id-3', 'Sophie Martin', 'Scientifique de formation, excellente pédagogue pour les sciences naturelles.', 80.00, 3, true);

-- 3. Assign tutors to courses
INSERT INTO tutor_courses (id, tutor_id, course_id, active) VALUES
-- Mathématiques
('550e8400-e29b-41d4-a716-446655440011', 'your-user-id-1', '550e8400-e29b-41d4-a716-446655440001', true),
-- Français  
('550e8400-e29b-41d4-a716-446655440012', 'your-user-id-2', '550e8400-e29b-41d4-a716-446655440002', true),
-- Sciences
('550e8400-e29b-41d4-a716-446655440013', 'your-user-id-3', '550e8400-e29b-41d4-a716-446655440003', true);

-- 4. Create availability rules (Monday to Friday, 9am-5pm for all tutors)
INSERT INTO availability_rules (id, tutor_id, weekday, start_time, end_time) VALUES
-- Marie (Math) - Monday to Friday 9am-5pm
('550e8400-e29b-41d4-a716-446655440021', 'your-user-id-1', 1, '09:00', '17:00'),
('550e8400-e29b-41d4-a716-446655440022', 'your-user-id-1', 2, '09:00', '17:00'),
('550e8400-e29b-41d4-a716-446655440023', 'your-user-id-1', 3, '09:00', '17:00'),
('550e8400-e29b-41d4-a716-446655440024', 'your-user-id-1', 4, '09:00', '17:00'),
('550e8400-e29b-41d4-a716-446655440025', 'your-user-id-1', 5, '09:00', '17:00'),

-- Jean (Français) - Monday to Friday 9am-5pm
('550e8400-e29b-41d4-a716-446655440031', 'your-user-id-2', 1, '09:00', '17:00'),
('550e8400-e29b-41d4-a716-446655440032', 'your-user-id-2', 2, '09:00', '17:00'),
('550e8400-e29b-41d4-a716-446655440033', 'your-user-id-2', 3, '09:00', '17:00'),
('550e8400-e29b-41d4-a716-446655440034', 'your-user-id-2', 4, '09:00', '17:00'),
('550e8400-e29b-41d4-a716-446655440035', 'your-user-id-2', 5, '09:00', '17:00'),

-- Sophie (Sciences) - Monday to Friday 9am-5pm
('550e8400-e29b-41d4-a716-446655440041', 'your-user-id-3', 1, '09:00', '17:00'),
('550e8400-e29b-41d4-a716-446655440042', 'your-user-id-3', 2, '09:00', '17:00'),
('550e8400-e29b-41d4-a716-446655440043', 'your-user-id-3', 3, '09:00', '17:00'),
('550e8400-e29b-41d4-a716-446655440044', 'your-user-id-3', 4, '09:00', '17:00'),
('550e8400-e29b-41d4-a716-446655440045', 'your-user-id-3', 5, '09:00', '17:00');

-- 5. Create sample coupons
INSERT INTO coupons (id, code, type, value, active, starts_at, ends_at, max_redemptions, redemption_count) VALUES
('550e8400-e29b-41d4-a716-446655440051', 'ETE2024', 'percent', 15, true, '2024-06-01', '2024-08-31', 100, 0),
('550e8400-e29b-41d4-a716-446655440052', 'BIENVENUE50', 'fixed', 50, true, NULL, NULL, NULL, 0);
