const { PrismaClient } = require('@prisma/client')

const prisma = new PrismaClient()

async function createTutorProfile() {
  console.log('🔍 Looking for users with role=tutor but no tutor profile...')
  
  // Find users with tutor role but no tutor profile
  const usersWithoutTutorProfile = await prisma.user.findMany({
    where: {
      role: 'tutor',
      tutor: null
    },
    select: {
      id: true,
      firstName: true,
      lastName: true,
      email: true,
      role: true
    }
  })

  if (usersWithoutTutorProfile.length === 0) {
    console.log('✅ All tutor users have profiles!')
    return
  }

  console.log(`📋 Found ${usersWithoutTutorProfile.length} users without tutor profiles:`)
  usersWithoutTutorProfile.forEach((user, index) => {
    console.log(`${index + 1}. ${user.firstName} ${user.lastName} (${user.email}) - ID: ${user.id}`)
  })

  // Get all courses for assignment
  const courses = await prisma.course.findMany({
    where: { active: true },
    select: { id: true, titleFr: true, slug: true }
  })

  console.log('\n📚 Available courses:')
  courses.forEach((course, index) => {
    console.log(`${index + 1}. ${course.titleFr} (${course.slug})`)
  })

  // Create tutor profiles for all users without them
  for (const user of usersWithoutTutorProfile) {
    console.log(`\n👨‍🏫 Creating tutor profile for ${user.firstName} ${user.lastName}...`)
    
    try {
      // Create tutor profile
      const tutor = await prisma.tutor.create({
        data: {
          id: user.id,
          displayName: `${user.firstName} ${user.lastName}`,
          bioFr: `Tuteur expérimenté en ${user.firstName === 'Marie' ? 'mathématiques' : 'matières générales'} avec plusieurs années d'expérience.`,
          hourlyBaseRateCad: 75.00,
          priority: 1,
          active: true
        }
      })

      console.log(`✅ Created tutor profile for ${tutor.displayName}`)

      // Create weekly availability (Monday to Friday, 9am-5pm)
      const availabilityRules = []
      for (let weekday = 1; weekday <= 5; weekday++) {
        const rule = await prisma.availabilityRule.create({
          data: {
            tutorId: user.id,
            weekday: weekday,
            startTime: '09:00',
            endTime: '17:00'
          }
        })
        availabilityRules.push(rule)
      }
      console.log(`✅ Created ${availabilityRules.length} availability rules`)

      // Assign tutor to all courses
      const tutorCourses = []
      for (const course of courses) {
        const tutorCourse = await prisma.tutorCourse.create({
          data: {
            tutorId: user.id,
            courseId: course.id,
            active: true
          }
        })
        tutorCourses.push(tutorCourse)
      }
      console.log(`✅ Assigned tutor to ${tutorCourses.length} courses`)

    } catch (error) {
      console.error(`❌ Error creating tutor profile for ${user.firstName} ${user.lastName}:`, error)
    }
  }

  console.log('\n🎉 Tutor profile creation completed!')
  console.log('\nYou can now log in as a tutor and access the tutor dashboard.')
}

createTutorProfile()
  .then(async () => {
    await prisma.$disconnect()
  })
  .catch(async (e) => {
    console.error(e)
    await prisma.$disconnect()
    process.exit(1)
  })
