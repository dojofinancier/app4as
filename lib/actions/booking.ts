'use server'

import { revalidatePath } from 'next/cache'
import { prisma } from '@/lib/prisma'
import { getStripe } from '@/lib/stripe'
import { getCurrentUser } from './auth'

export async function createBookingCheckout(bookingData: {
  courseSlug: string
  tutorId: string
  slot: {
    start: Date
    end: Date
  }
  duration: number
}) {
  try {
    const stripe = getStripe()
    
    // Fetch tutor data
    const tutor = await prisma.tutor.findUnique({
      where: { id: bookingData.tutorId },
      include: { user: true }
    })

    if (!tutor) {
      return { 
        success: false, 
        error: 'Tuteur non trouvé' 
      }
    }

    // Get course ID from slug
    const course = await prisma.course.findFirst({
      where: { slug: bookingData.courseSlug }
    })

    if (!course) {
      return { 
        success: false, 
        error: 'Cours non trouvé' 
      }
    }

    // Calculate price
    const multiplier = bookingData.duration === 60 ? 1 : 
                     bookingData.duration === 90 ? 1.5 : 2
    const totalPrice = Number(tutor.hourlyBaseRateCad) * multiplier

    // Check if user is logged in
    const currentUser = await getCurrentUser()
    let userId = currentUser?.id

    // For guest users, create a temporary user
    if (!userId) {
      const tempUser = await prisma.user.create({
        data: {
          firstName: 'Guest',
          lastName: 'User',
          email: `guest-${Date.now()}@temp.com`,
          role: 'student'
        }
      })
      userId = tempUser.id
    }

    // Create a slot hold to prevent double booking
    const hold = await prisma.slotHold.create({
      data: {
        tutorId: bookingData.tutorId,
        courseId: course.id,
        startDatetime: bookingData.slot.start,
        durationMin: bookingData.duration,
        expiresAt: new Date(Date.now() + 15 * 60 * 1000), // 15 minutes
        userId: userId
      }
    })

    // Create Stripe checkout session
    const session = await stripe.checkout.sessions.create({
      payment_method_types: ['card'],
      line_items: [
        {
          price_data: {
            currency: 'cad',
            product_data: {
              name: `Cours avec ${tutor.user.firstName} ${tutor.user.lastName}`,
              description: `${bookingData.duration === 60 ? '1 heure' : 
                           bookingData.duration === 90 ? '1h30' : '2 heures'} de tutorat`,
            },
            unit_amount: Math.round(totalPrice * 100), // Convert to cents
          },
          quantity: 1,
        },
      ],
      mode: 'payment',
      success_url: `${process.env.NEXT_PUBLIC_APP_URL}/reservation/success?session_id={CHECKOUT_SESSION_ID}`,
      cancel_url: `${process.env.NEXT_PUBLIC_APP_URL}/cours/${bookingData.courseSlug}/reservation`,
      metadata: {
        holdId: hold.id,
        tutorId: bookingData.tutorId,
        startDatetime: bookingData.slot.start.toISOString(),
        endDatetime: bookingData.slot.end.toISOString(),
        duration: bookingData.duration.toString(),
        courseSlug: bookingData.courseSlug,
        isNewUser: (!userId).toString()
      },
      billing_address_collection: 'required',
    })

    return { 
      success: true, 
      checkoutUrl: session.url,
      holdId: hold.id
    }
  } catch (error) {
    console.error('Error creating booking checkout:', error)
    return { 
      success: false, 
      error: 'Une erreur est survenue lors de la création de la réservation' 
    }
  }
}
