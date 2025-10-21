-- Add the missing data (courses, tutors, availability rules)
-- Run this in Supabase SQL Editor

-- 1. Create sample courses
INSERT INTO courses (id, slug, title_fr, description_fr, active, created_at) VALUES
('550e8400-e29b-41d4-a716-446655440001', 'mathematiques-secondaire', 'Mathématiques - Secondaire', 'Cours de mathématiques pour étudiants du secondaire. Algèbre, géométrie, trigonométrie et plus.', true, NOW()),
('550e8400-e29b-41d4-a716-446655440002', 'francais-secondaire', 'Français - Secondaire', 'Cours de français langue maternelle: grammaire, orthographe, littérature et rédaction.', true, NOW()),
('550e8400-e29b-41d4-a716-446655440003', 'sciences-secondaire', 'Sciences - Secondaire', 'Cours de sciences: biologie, chimie et physique pour le secondaire.', true, NOW());

-- 2. Create tutor profile for your user
INSERT INTO tutors (id, display_name, bio_fr, hourly_base_rate_cad, priority, active) 
VALUES ('7141cc13-fee3-460a-8b60-3f933eb7cebf', 'Marie Dubois', 'Tutrice expérimentée en mathématiques avec 10 ans d''expérience. Spécialisée en algèbre et géométrie.', 75.00, 1, true);

-- 3. Assign tutor to all courses
INSERT INTO tutor_courses (id, tutor_id, course_id, active) VALUES
('550e8400-e29b-41d4-a716-446655440011', '7141cc13-fee3-460a-8b60-3f933eb7cebf', '550e8400-e29b-41d4-a716-446655440001', true),
('550e8400-e29b-41d4-a716-446655440012', '7141cc13-fee3-460a-8b60-3f933eb7cebf', '550e8400-e29b-41d4-a716-446655440002', true),
('550e8400-e29b-41d4-a716-446655440013', '7141cc13-fee3-460a-8b60-3f933eb7cebf', '550e8400-e29b-41d4-a716-446655440003', true);

-- 4. Create availability rules (Monday to Friday, 9am-5pm)
INSERT INTO availability_rules (id, tutor_id, weekday, start_time, end_time) VALUES
('550e8400-e29b-41d4-a716-446655440021', '7141cc13-fee3-460a-8b60-3f933eb7cebf', 1, '09:00', '17:00'),
('550e8400-e29b-41d4-a716-446655440022', '7141cc13-fee3-460a-8b60-3f933eb7cebf', 2, '09:00', '17:00'),
('550e8400-e29b-41d4-a716-446655440023', '7141cc13-fee3-460a-8b60-3f933eb7cebf', 3, '09:00', '17:00'),
('550e8400-e29b-41d4-a716-446655440024', '7141cc13-fee3-460a-8b60-3f933eb7cebf', 4, '09:00', '17:00'),
('550e8400-e29b-41d4-a716-446655440025', '7141cc13-fee3-460a-8b60-3f933eb7cebf', 5, '09:00', '17:00');
