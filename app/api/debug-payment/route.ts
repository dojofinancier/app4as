import { NextRequest, NextResponse } from 'next/server'
import { prisma } from '@/lib/prisma'
import { getCurrentUser } from '@/lib/actions/auth'

export async function POST(request: NextRequest) {
  try {
    console.log('Debug payment intent...')
    const body = await request.json()
    console.log('Request body:', body)
    
    const { 
      tutorId, 
      courseSlug, 
      slot, 
      duration,
      userInfo 
    } = body

    // Step 1: Test tutor lookup
    console.log('Step 1: Fetching tutor:', tutorId)
    const tutor = await prisma.tutor.findUnique({
      where: { id: tutorId },
      include: { user: true }
    })

    if (!tutor) {
      return NextResponse.json({ error: 'Tuteur non trouvé', step: 1 }, { status: 404 })
    }
    console.log('Step 1: Tutor found:', tutor.displayName)

    // Step 2: Test course lookup
    console.log('Step 2: Fetching course:', courseSlug)
    const course = await prisma.course.findFirst({
      where: { slug: courseSlug }
    })

    if (!course) {
      return NextResponse.json({ error: 'Cours non trouvé', step: 2 }, { status: 404 })
    }
    console.log('Step 2: Course found:', course.titleFr)

    // Step 3: Test user lookup
    console.log('Step 3: Checking current user')
    const currentUser = await getCurrentUser()
    console.log('Step 3: Current user:', currentUser ? 'logged in' : 'not logged in')

    // Step 4: Test user creation (if needed)
    let userId = currentUser?.id
    if (!userId && userInfo) {
      console.log('Step 4: Creating temporary user')
      const tempUser = await prisma.user.create({
        data: {
          firstName: userInfo.firstName,
          lastName: userInfo.lastName,
          email: userInfo.email,
          phone: userInfo.phone || null,
          role: 'student'
        }
      })
      userId = tempUser.id
      console.log('Step 4: User created:', userId)
    }

    // Step 5: Test slot hold creation
    console.log('Step 5: Creating slot hold')
    const hold = await prisma.slotHold.create({
      data: {
        tutorId: tutorId,
        courseId: course.id,
        startDatetime: new Date(slot.start),
        durationMin: duration,
        expiresAt: new Date(Date.now() + 15 * 60 * 1000),
        userId: userId || 'temp-user-id'
      }
    })
    console.log('Step 5: Slot hold created:', hold.id)

    return NextResponse.json({
      success: true,
      steps: {
        tutor: tutor.displayName,
        course: course.titleFr,
        user: userId,
        hold: hold.id
      }
    })

  } catch (error) {
    console.error('Debug error:', error)
    return NextResponse.json(
      { error: 'Debug error', details: error.message, stack: error.stack },
      { status: 500 }
    )
  }
}

