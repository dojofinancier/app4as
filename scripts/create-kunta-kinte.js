const { PrismaClient } = require('@prisma/client')
const { createClient } = require('@supabase/supabase-js')

const prisma = new PrismaClient()

// Supabase client setup
const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL
const supabaseServiceKey = process.env.SUPABASE_SERVICE_ROLE_KEY

if (!supabaseUrl || !supabaseServiceKey) {
  console.error('❌ Missing Supabase environment variables')
  console.error('Required: NEXT_PUBLIC_SUPABASE_URL and SUPABASE_SERVICE_ROLE_KEY')
  process.exit(1)
}

const supabase = createClient(supabaseUrl, supabaseServiceKey)

async function createKuntaKinte() {
  console.log('🚀 Creating Kunta Kinte tutor setup...\n')
  
  try {
    // Step 1: Create Supabase Auth user
    console.log('1️⃣ Creating Supabase Auth user...')
    const { data: authData, error: authError } = await supabase.auth.admin.createUser({
      email: 'kunta@kinte.com',
      password: '123456',
      email_confirm: true, // Auto-confirm email
      user_metadata: {
        first_name: 'Kunta',
        last_name: 'Kinte'
      }
    })
    
    if (authError) {
      console.error('❌ Error creating Supabase Auth user:', authError.message)
      return
    }
    
    console.log('✅ Supabase Auth user created successfully')
    console.log(`   User ID: ${authData.user.id}`)
    console.log(`   Email: ${authData.user.email}`)
    
    const userId = authData.user.id
    
    // Step 2: Create user record in users table
    console.log('\n2️⃣ Creating user record in users table...')
    const user = await prisma.user.create({
      data: {
        id: userId,
        email: 'kunta@kinte.com',
        firstName: 'Kunta',
        lastName: 'Kinte',
        role: 'tutor',
        phone: '+1-555-0123'
      }
    })
    
    console.log('✅ User record created successfully')
    console.log(`   User ID: ${user.id}`)
    console.log(`   Name: ${user.firstName} ${user.lastName}`)
    console.log(`   Role: ${user.role}`)
    
    // Step 3: Create tutor profile
    console.log('\n3️⃣ Creating tutor profile...')
    const tutor = await prisma.tutor.create({
      data: {
        id: userId, // Same ID as user (one-to-one relationship)
        displayName: 'Kunta Kinte',
        bioFr: 'Tuteur expérimenté avec une approche pédagogique innovante. Spécialisé dans l\'enseignement personnalisé et l\'accompagnement des étudiants.',
        hourlyBaseRateCad: 75.00,
        priority: 5,
        active: true
      }
    })
    
    console.log('✅ Tutor profile created successfully')
    console.log(`   Tutor ID: ${tutor.id}`)
    console.log(`   Display Name: ${tutor.displayName}`)
    console.log(`   Hourly Rate: $${tutor.hourlyBaseRateCad}/hour`)
    console.log(`   Bio: ${tutor.bioFr}`)
    
    // Step 4: Get available courses and assign them
    console.log('\n4️⃣ Assigning courses to Kunta Kinte...')
    const courses = await prisma.course.findMany({
      where: { active: true },
      select: { id: true, titleFr: true, slug: true }
    })
    
    console.log(`📚 Found ${courses.length} available courses:`)
    courses.forEach((course, index) => {
      console.log(`   ${index + 1}. ${course.titleFr} (${course.slug})`)
    })
    
    // Assign all courses to Kunta Kinte
    const tutorCourses = await Promise.all(
      courses.map(course => 
        prisma.tutorCourse.create({
          data: {
            tutorId: userId,
            courseId: course.id,
            active: true
          }
        })
      )
    )
    
    console.log(`✅ Assigned ${tutorCourses.length} courses to Kunta Kinte`)
    
    // Step 5: Verification
    console.log('\n5️⃣ Verification...')
    
    // Check Supabase Auth
    const { data: authUser } = await supabase.auth.admin.getUserById(userId)
    console.log(`✅ Supabase Auth: ${authUser?.user?.email} (${authUser?.user?.id})`)
    
    // Check users table
    const userCheck = await prisma.user.findUnique({
      where: { id: userId },
      select: { id: true, email: true, firstName: true, lastName: true, role: true }
    })
    console.log(`✅ Users table: ${userCheck?.firstName} ${userCheck?.lastName} (${userCheck?.role})`)
    
    // Check tutors table
    const tutorCheck = await prisma.tutor.findUnique({
      where: { id: userId },
      select: { id: true, displayName: true, hourlyBaseRateCad: true, active: true }
    })
    console.log(`✅ Tutors table: ${tutorCheck?.displayName} ($${tutorCheck?.hourlyBaseRateCad}/hour)`)
    
    // Check course assignments
    const courseAssignments = await prisma.tutorCourse.findMany({
      where: { tutorId: userId },
      include: { course: { select: { titleFr: true } } }
    })
    console.log(`✅ Course assignments: ${courseAssignments.length} courses`)
    courseAssignments.forEach(assignment => {
      console.log(`   - ${assignment.course.titleFr}`)
    })
    
    console.log('\n🎉 Kunta Kinte setup completed successfully!')
    console.log('\n📋 Summary:')
    console.log(`   Email: kunta@kinte.com`)
    console.log(`   Password: 123456`)
    console.log(`   User ID: ${userId}`)
    console.log(`   Display Name: Kunta Kinte`)
    console.log(`   Hourly Rate: $75.00`)
    console.log(`   Courses: ${courseAssignments.length}`)
    console.log(`   Status: Active`)
    
    console.log('\n🚀 Ready for Phase 3 development!')
    
  } catch (error) {
    console.error('❌ Error creating Kunta Kinte:', error)
    
    // Cleanup on error
    console.log('\n🧹 Attempting cleanup...')
    try {
      // Delete from tutors table if created
      await prisma.tutor.deleteMany({
        where: { id: { contains: 'kunta' } }
      }).catch(() => {})
      
      // Delete from users table if created
      await prisma.user.deleteMany({
        where: { email: 'kunta@kinte.com' }
      }).catch(() => {})
      
      // Delete from Supabase Auth if created
      const { data: users } = await supabase.auth.admin.listUsers()
      const kuntaUser = users.users.find(u => u.email === 'kunta@kinte.com')
      if (kuntaUser) {
        await supabase.auth.admin.deleteUser(kuntaUser.id)
      }
      
      console.log('✅ Cleanup completed')
    } catch (cleanupError) {
      console.error('❌ Cleanup failed:', cleanupError)
    }
  } finally {
    await prisma.$disconnect()
  }
}

createKuntaKinte()
