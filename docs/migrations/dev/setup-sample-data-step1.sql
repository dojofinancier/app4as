-- Step 1: Create sample courses (no dependencies)
INSERT INTO courses (id, slug, title_fr, description_fr, active, created_at) VALUES
('550e8400-e29b-41d4-a716-446655440001', 'mathematiques-secondaire', 'Mathématiques - Secondaire', 'Cours de mathématiques pour étudiants du secondaire. Algèbre, géométrie, trigonométrie et plus.', true, NOW()),
('550e8400-e29b-41d4-a716-446655440002', 'francais-secondaire', 'Français - Secondaire', 'Cours de français langue maternelle: grammaire, orthographe, littérature et rédaction.', true, NOW()),
('550e8400-e29b-41d4-a716-446655440003', 'sciences-secondaire', 'Sciences - Secondaire', 'Cours de sciences: biologie, chimie et physique pour le secondaire.', true, NOW());

-- Step 2: Create sample coupons (no dependencies)
INSERT INTO coupons (id, code, type, value, active, starts_at, ends_at, max_redemptions, redemption_count) VALUES
('550e8400-e29b-41d4-a716-446655440051', 'ETE2024', 'percent', 15, true, '2024-06-01', '2024-08-31', 100, 0),
('550e8400-e29b-41d4-a716-446655440052', 'BIENVENUE50', 'fixed', 50, true, NULL, NULL, NULL, 0);
