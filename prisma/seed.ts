import { PrismaClient } from '@prisma/client'

const prisma = new PrismaClient()

async function main() {
  console.log('🌱 Starting database seed...')

  // Create sample courses
  const mathematiques = await prisma.course.upsert({
    where: { slug: 'mathematiques-secondaire' },
    update: {},
    create: {
      code: 'MATH-SEC',
      slug: 'mathematiques-secondaire',
      titleFr: 'Mathématiques - Secondaire',
      descriptionFr:
        'Cours de mathématiques pour étudiants du secondaire. Algèbre, géométrie, trigonométrie et plus.',
      active: true,
    },
  })

  await prisma.course.upsert({
    where: { slug: 'francais-secondaire' },
    update: {},
    create: {
      code: 'FR-SEC',
      slug: 'francais-secondaire',
      titleFr: 'Français - Secondaire',
      descriptionFr:
        'Cours de français langue maternelle: grammaire, orthographe, littérature et rédaction.',
      active: true,
    },
  })

  await prisma.course.upsert({
    where: { slug: 'sciences-secondaire' },
    update: {},
    create: {
      code: 'SCI-SEC',
      slug: 'sciences-secondaire',
      titleFr: 'Sciences - Secondaire',
      descriptionFr:
        'Cours de sciences: biologie, chimie et physique pour le secondaire.',
      active: true,
    },
  })

  console.log('✅ Created 3 courses')

  // Create sample users for tutors (you'll need to create these in Supabase Auth first)
  // For now, we'll create placeholder tutors
  const tutorIds = [
    '00000000-0000-0000-0000-000000000001',
    '00000000-0000-0000-0000-000000000002',
    '00000000-0000-0000-0000-000000000003',
  ]

  // Create sample tutors (Note: You need to create corresponding users in Supabase Auth)
  console.log(
    '⚠️  Note: You need to manually create tutor users in Supabase Auth with IDs:'
  )
  tutorIds.forEach((id) => console.log(`   - ${id}`))

  // Create coupons
  await prisma.coupon.upsert({
    where: { code: 'ETE2024' },
    update: {},
    create: {
      code: 'ETE2024',
      type: 'percent',
      value: 15,
      active: true,
      startsAt: new Date('2024-06-01'),
      endsAt: new Date('2024-08-31'),
      maxRedemptions: 100,
      redemptionCount: 0,
    },
  })

  await prisma.coupon.upsert({
    where: { code: 'BIENVENUE50' },
    update: {},
    create: {
      code: 'BIENVENUE50',
      type: 'fixed',
      value: 50,
      active: true,
      startsAt: null,
      endsAt: null,
      maxRedemptions: null,
      redemptionCount: 0,
    },
  })

  console.log('✅ Created 2 coupons (ETE2024, BIENVENUE50)')

  console.log('')
  console.log('🎉 Seed completed!')
  console.log('')
  console.log('Next steps:')
  console.log('1. Create tutor accounts in Supabase Auth')
  console.log('2. Update the users table with role=tutor for those accounts')
  console.log('3. Create tutor profiles in the tutors table')
  console.log(
    '4. Create availability rules for tutors (weekly recurring schedule)'
  )
  console.log('5. Assign tutors to courses via tutor_courses table')
  console.log('')
  console.log('Example SQL to create a tutor:')
  console.log(`
-- After creating user in Supabase Auth, run:
UPDATE users SET role = 'tutor' WHERE id = 'your-user-id';

INSERT INTO tutors (id, display_name, bio_fr, hourly_base_rate_cad, priority, active)
VALUES (
  'your-user-id',
  'Marie Dubois',
  'Tutrice expérimentée en mathématiques avec 10 ans d''expérience',
  75.00,
  1,
  true
);

-- Add weekly availability (Monday to Friday, 9am-5pm)
INSERT INTO availability_rules (id, tutor_id, weekday, start_time, end_time)
VALUES
  (gen_random_uuid(), 'your-user-id', 1, '09:00', '17:00'),
  (gen_random_uuid(), 'your-user-id', 2, '09:00', '17:00'),
  (gen_random_uuid(), 'your-user-id', 3, '09:00', '17:00'),
  (gen_random_uuid(), 'your-user-id', 4, '09:00', '17:00'),
  (gen_random_uuid(), 'your-user-id', 5, '09:00', '17:00');

-- Assign tutor to course
INSERT INTO tutor_courses (id, tutor_id, course_id, active)
VALUES (gen_random_uuid(), 'your-user-id', '${mathematiques.id}', true);
  `)
}

main()
  .then(async () => {
    await prisma.$disconnect()
  })
  .catch(async (e) => {
    console.error(e)
    await prisma.$disconnect()
    process.exit(1)
  })


