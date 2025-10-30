const { PrismaClient } = require('@prisma/client')

const prisma = new PrismaClient()

async function checkTutors() {
  console.log('🔍 Checking tutor setup in database...\n')
  
  try {
    // 1. Check users table for tutors
    console.log('📋 USERS TABLE - Tutors:')
    const tutorUsers = await prisma.user.findMany({
      where: { role: 'tutor' },
      select: {
        id: true,
        email: true,
        firstName: true,
        lastName: true,
        role: true,
        createdAt: true,
        stripeCustomerId: true
      }
    })
    
    if (tutorUsers.length === 0) {
      console.log('❌ No users with role="tutor" found in users table')
    } else {
      console.log(`✅ Found ${tutorUsers.length} tutor users:`)
      tutorUsers.forEach((user, index) => {
        console.log(`   ${index + 1}. ${user.firstName} ${user.lastName} (${user.email})`)
        console.log(`      ID: ${user.id}`)
        console.log(`      Created: ${user.createdAt}`)
        console.log(`      Stripe Customer: ${user.stripeCustomerId || 'Not set'}`)
        console.log('')
      })
    }
    
    // 2. Check tutors table
    console.log('👨‍🏫 TUTORS TABLE:')
    const tutors = await prisma.tutor.findMany({
      include: {
        user: {
          select: {
            id: true,
            email: true,
            firstName: true,
            lastName: true,
            role: true
          }
        },
        courses: {
          select: {
            course: {
              select: {
                titleFr: true,
                slug: true
              }
            }
          }
        }
      }
    })
    
    if (tutors.length === 0) {
      console.log('❌ No tutors found in tutors table')
    } else {
      console.log(`✅ Found ${tutors.length} tutors:`)
      tutors.forEach((tutor, index) => {
        console.log(`   ${index + 1}. ${tutor.displayName}`)
        console.log(`      User ID: ${tutor.userId}`)
        console.log(`      User Email: ${tutor.user?.email}`)
        console.log(`      User Role: ${tutor.user?.role}`)
        console.log(`      Hourly Rate: $${tutor.hourlyBaseRateCad}/hour`)
        console.log(`      Active: ${tutor.active ? 'Yes' : 'No'}`)
        console.log(`      Courses: ${tutor.courses.length}`)
        if (tutor.courses.length > 0) {
          tutor.courses.forEach(course => {
            console.log(`        - ${course.course.titleFr}`)
          })
        }
        console.log('')
      })
    }
    
    // 3. Check for users with tutor role but no tutor profile
    console.log('🔗 LINKING CHECK:')
    const usersWithoutTutorProfile = await prisma.user.findMany({
      where: {
        role: 'tutor',
        tutor: null
      },
      select: {
        id: true,
        email: true,
        firstName: true,
        lastName: true
      }
    })
    
    if (usersWithoutTutorProfile.length === 0) {
      console.log('✅ All tutor users have corresponding tutor profiles')
    } else {
      console.log(`⚠️  Found ${usersWithoutTutorProfile.length} users with role="tutor" but no tutor profile:`)
      usersWithoutTutorProfile.forEach((user, index) => {
        console.log(`   ${index + 1}. ${user.firstName} ${user.lastName} (${user.email})`)
      })
    }
    
    // 4. Check for tutors without user accounts
    const tutorsWithoutUsers = await prisma.tutor.findMany({
      where: {
        user: null
      },
      select: {
        id: true,
        displayName: true,
        userId: true
      }
    })
    
    if (tutorsWithoutUsers.length === 0) {
      console.log('✅ All tutors have corresponding user accounts')
    } else {
      console.log(`⚠️  Found ${tutorsWithoutUsers.length} tutors without user accounts:`)
      tutorsWithoutUsers.forEach((tutor, index) => {
        console.log(`   ${index + 1}. ${tutor.displayName} (User ID: ${tutor.userId})`)
      })
    }
    
    // 5. Summary
    console.log('\n📊 SUMMARY:')
    console.log(`   Users with role="tutor": ${tutorUsers.length}`)
    console.log(`   Tutor profiles: ${tutors.length}`)
    console.log(`   Users without tutor profiles: ${usersWithoutTutorProfile.length}`)
    console.log(`   Tutors without user accounts: ${tutorsWithoutUsers.length}`)
    
    if (tutorUsers.length > 0 && tutors.length > 0 && usersWithoutTutorProfile.length === 0 && tutorsWithoutUsers.length === 0) {
      console.log('\n✅ TUTOR SETUP IS COMPLETE! Ready for Phase 3.')
    } else {
      console.log('\n⚠️  TUTOR SETUP NEEDS ATTENTION!')
      if (tutorUsers.length === 0) {
        console.log('   - Need to create users with role="tutor"')
      }
      if (tutors.length === 0) {
        console.log('   - Need to create tutor profiles')
      }
      if (usersWithoutTutorProfile.length > 0) {
        console.log('   - Need to create tutor profiles for existing users')
      }
      if (tutorsWithoutUsers.length > 0) {
        console.log('   - Need to fix orphaned tutor profiles')
      }
    }
    
  } catch (error) {
    console.error('❌ Error checking tutors:', error)
  } finally {
    await prisma.$disconnect()
  }
}

checkTutors()
