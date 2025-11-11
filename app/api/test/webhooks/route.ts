import { NextRequest, NextResponse } from 'next/server'
import { headers } from 'next/headers'
import { createClient } from '@/lib/supabase/server'
import { prisma } from '@/lib/prisma'
import {
  sendSignupWebhook,
  sendBookingCreatedWebhook,
  sendBookingCancelledWebhook,
  sendBookingRescheduledWebhook,
  sendAppointmentCompletedWebhook,
  sendOrderRefundedWebhook,
  sendMessageWebhook,
  sendTicketCreatedWebhook,
  sendTicketStatusChangedWebhook,
  sendTicketMessageWebhook,
  sendMakeWebhook
} from '@/lib/webhooks/make'

/**
 * Test endpoint to manually trigger webhooks
 * Usage: POST /api/test/webhooks
 * Body: { type: 'webhook_type', payload: {...} }
 * 
 * Available types:
 * - signup
 * - booking.created
 * - booking.cancelled
 * - booking.rescheduled
 * - appointment.completed
 * - order.refunded
 * - message.sent
 * - ticket.created
 * - ticket.status_changed
 * - ticket.message_added
 * - rating.created
 * - rating.updated
 */
export async function POST(req: NextRequest) {
  // Check authentication (admin only) OR test API key
  const headersList = await headers()
  const testApiKey = headersList.get('x-test-api-key')
  
  // Allow test API key for local development
  const isTestMode = process.env.NODE_ENV === 'development' && 
                     testApiKey === process.env.TEST_WEBHOOK_API_KEY

  if (!isTestMode) {
    // Normal authentication check
    const supabase = await createClient()
    const { data: { user } } = await supabase.auth.getUser()

    if (!user) {
      return NextResponse.json({ error: 'Non autorisé' }, { status: 401 })
    }

    const dbUser = await prisma.user.findUnique({
      where: { id: user.id },
      select: { role: true }
    })

    if (dbUser?.role !== 'admin') {
      return NextResponse.json({ error: 'Accès administrateur requis' }, { status: 403 })
    }
  }

  try {
    const body = await req.json()
    const { type, payload } = body

    if (!type) {
      return NextResponse.json({ error: 'Type de webhook requis' }, { status: 400 })
    }

    console.log(`[TEST WEBHOOK] Triggering ${type} webhook...`)

    switch (type) {
      case 'signup':
        await sendSignupWebhook({
          userId: payload.userId || 'test-user-id',
          role: payload.role || 'student',
          email: payload.email || 'test@example.com',
          firstName: payload.firstName || 'Test',
          lastName: payload.lastName || 'User',
          phone: payload.phone || null,
          createdAt: payload.createdAt || new Date().toISOString()
        })
        break

      case 'booking.created':
        await sendBookingCreatedWebhook({
          orderId: payload.orderId || 'test-order-id',
          userId: payload.userId || 'test-user-id',
          currency: payload.currency || 'CAD',
          subtotalCad: payload.subtotalCad || 100,
          discountCad: payload.discountCad || 0,
          totalCad: payload.totalCad || 100,
          couponCode: payload.couponCode,
          phone: payload.phone || null,
          studentEmail: payload.studentEmail || 'student@example.com',
          studentFirstName: payload.studentFirstName || 'John',
          studentLastName: payload.studentLastName || 'Doe',
          items: payload.items || [{
            appointmentId: 'test-appointment-id',
            courseId: 'test-course-id',
            courseTitleFr: 'Test Course',
            tutorId: 'test-tutor-id',
            tutorName: 'Test Tutor',
            tutorEmail: payload.tutorEmail || 'tutor@example.com',
            tutorPhone: payload.tutorPhone || null,
            startDatetime: new Date().toISOString(),
            durationMin: 60,
            priceCad: 100,
            tutorEarningsCad: 80
          }],
          createdAt: payload.createdAt || new Date().toISOString()
        })
        break

      case 'booking.cancelled':
        await sendBookingCancelledWebhook({
          appointmentId: payload.appointmentId || 'test-appointment-id',
          userId: payload.userId || 'test-user-id',
          tutorId: payload.tutorId || 'test-tutor-id',
          studentEmail: payload.studentEmail || 'student@example.com',
          tutorEmail: payload.tutorEmail || 'tutor@example.com',
          courseId: payload.courseId || 'test-course-id',
          courseTitleFr: payload.courseTitleFr || 'Test Course',
          cancelledBy: payload.cancelledBy || 'admin',
          cancelledById: payload.cancelledById || 'test-admin-id',
          cancellationReason: payload.cancellationReason || 'Test cancellation',
          startDatetime: payload.startDatetime || new Date().toISOString(),
          endDatetime: payload.endDatetime || new Date(Date.now() + 3600000).toISOString(),
          durationMin: payload.durationMin || 60,
          priceCad: payload.priceCad || 100,
          creditIssued: payload.creditIssued,
          timestamp: payload.timestamp || new Date().toISOString()
        })
        break

      case 'booking.rescheduled':
        await sendBookingRescheduledWebhook({
          appointmentId: payload.appointmentId || 'test-appointment-id',
          userId: payload.userId || 'test-user-id',
          tutorId: payload.tutorId || 'test-tutor-id',
          studentEmail: payload.studentEmail || 'student@example.com',
          tutorEmail: payload.tutorEmail || 'tutor@example.com',
          courseId: payload.courseId || 'test-course-id',
          courseTitleFr: payload.courseTitleFr || 'Test Course',
          rescheduledBy: payload.rescheduledBy || 'student',
          rescheduledById: payload.rescheduledById || 'test-user-id',
          reason: payload.reason || 'Test reschedule',
          oldStartDatetime: payload.oldStartDatetime || new Date().toISOString(),
          oldEndDatetime: payload.oldEndDatetime || new Date(Date.now() + 3600000).toISOString(),
          newStartDatetime: payload.newStartDatetime || new Date(Date.now() + 86400000).toISOString(),
          newEndDatetime: payload.newEndDatetime || new Date(Date.now() + 86400000 + 3600000).toISOString(),
          timestamp: payload.timestamp || new Date().toISOString()
        })
        break

      case 'appointment.completed':
        await sendAppointmentCompletedWebhook({
          appointmentId: payload.appointmentId || 'test-appointment-id',
          userId: payload.userId || 'test-user-id',
          tutorId: payload.tutorId || 'test-tutor-id',
          studentEmail: payload.studentEmail || 'student@example.com',
          tutorEmail: payload.tutorEmail || 'tutor@example.com',
          courseId: payload.courseId || 'test-course-id',
          courseTitleFr: payload.courseTitleFr || 'Test Course',
          startDatetime: payload.startDatetime || new Date().toISOString(),
          endDatetime: payload.endDatetime || new Date(Date.now() + 3600000).toISOString(),
          durationMin: payload.durationMin || 60,
          tutorEarningsCad: payload.tutorEarningsCad || 80,
          completedAt: payload.completedAt || new Date().toISOString()
        })
        break

      case 'order.refunded':
        await sendOrderRefundedWebhook({
          orderId: payload.orderId || 'test-order-id',
          userId: payload.userId || 'test-user-id',
          studentEmail: payload.studentEmail || 'student@example.com',
          refundAmount: payload.refundAmount || 100,
          refundReason: payload.refundReason || 'Test refund',
          stripeRefundId: payload.stripeRefundId,
          processedBy: payload.processedBy || 'test-admin-id',
          affectedAppointments: payload.affectedAppointments || ['test-appointment-id'],
          timestamp: payload.timestamp || new Date().toISOString()
        })
        break

      case 'message.sent':
        await sendMessageWebhook({
          messageId: payload.messageId || 'test-message-id',
          senderId: payload.senderId || 'test-sender-id',
          receiverId: payload.receiverId || 'test-receiver-id',
          senderName: payload.senderName || 'Test Sender',
          receiverName: payload.receiverName || 'Test Receiver',
          senderEmail: payload.senderEmail || 'sender@example.com',
          receiverEmail: payload.receiverEmail || 'receiver@example.com',
          content: payload.content || 'Test message content',
          appointmentId: payload.appointmentId,
          appointmentTitle: payload.appointmentTitle,
          timestamp: payload.timestamp || new Date().toISOString()
        })
        break

      case 'ticket.created':
        await sendTicketCreatedWebhook({
          ticketId: payload.ticketId || 'test-ticket-id',
          userId: payload.userId || 'test-user-id',
          userEmail: payload.userEmail || 'user@example.com',
          studentName: payload.studentName || 'Jean Dupont',
          subject: payload.subject || 'Test Ticket',
          category: payload.category || 'technical',
          priority: payload.priority || 'medium',
          status: payload.status || 'open',
          createdAt: payload.createdAt || new Date().toISOString()
        })
        break

      case 'ticket.status_changed':
        await sendTicketStatusChangedWebhook({
          ticketId: payload.ticketId || 'test-ticket-id',
          userId: payload.userId || 'test-user-id',
          userEmail: payload.userEmail || 'user@example.com',
          studentName: payload.studentName || 'Jean Dupont',
          oldStatus: payload.oldStatus || 'open',
          newStatus: payload.newStatus || 'closed',
          changedBy: payload.changedBy || 'test-admin-id',
          reason: payload.reason,
          timestamp: payload.timestamp || new Date().toISOString()
        })
        break

      case 'ticket.message_added':
        await sendTicketMessageWebhook({
          ticketId: payload.ticketId || 'test-ticket-id',
          messageId: payload.messageId || 'test-message-id',
          userId: payload.userId || 'test-user-id',
          userEmail: payload.userEmail || 'user@example.com',
          studentName: payload.studentName || 'Jean Dupont',
          senderRole: payload.senderRole || 'student',
          message: payload.message || 'Test ticket message',
          isInternal: payload.isInternal || false,
          timestamp: payload.timestamp || new Date().toISOString()
        })
        break

      case 'rating.created':
      case 'rating.updated':
        await sendMakeWebhook(type, {
          ratingId: payload.ratingId || 'test-rating-id',
          tutorId: payload.tutorId || 'test-tutor-id',
          courseId: payload.courseId || 'test-course-id',
          studentId: payload.studentId || 'test-student-id',
          studentEmail: payload.studentEmail || 'student@example.com',
          tutorEmail: payload.tutorEmail || 'tutor@example.com',
          q1Courtoisie: payload.q1Courtoisie || 5,
          q2Maitrise: payload.q2Maitrise || 5,
          q3Pedagogie: payload.q3Pedagogie || 5,
          q4Dynamisme: payload.q4Dynamisme || 5,
          generalScore: payload.generalScore || 5,
          hasComment: payload.hasComment || false,
          createdAt: payload.createdAt || new Date().toISOString(),
          updatedAt: payload.updatedAt || new Date().toISOString()
        })
        break

      default:
        return NextResponse.json({ 
          error: `Type de webhook non supporté: ${type}`,
          availableTypes: [
            'signup',
            'booking.created',
            'booking.cancelled',
            'booking.rescheduled',
            'appointment.completed',
            'order.refunded',
            'message.sent',
            'ticket.created',
            'ticket.status_changed',
            'ticket.message_added',
            'rating.created',
            'rating.updated'
          ]
        }, { status: 400 })
    }

    return NextResponse.json({ 
      success: true, 
      message: `Webhook ${type} déclenché avec succès`,
      timestamp: new Date().toISOString()
    })

  } catch (error) {
    console.error('[TEST WEBHOOK] Error:', error)
    return NextResponse.json({ 
      error: 'Erreur lors du déclenchement du webhook',
      details: error instanceof Error ? error.message : 'Unknown error'
    }, { status: 500 })
  }
}

/**
 * GET endpoint to list available webhook types and their required payloads
 */
export async function GET() {
  return NextResponse.json({
    message: 'Endpoint de test pour les webhooks',
    usage: {
      method: 'POST',
      url: '/api/test/webhooks',
      body: {
        type: 'webhook_type',
        payload: { /* webhook-specific data */ }
      }
    },
    availableTypes: [
      'signup',
      'booking.created',
      'booking.cancelled',
      'booking.rescheduled',
      'appointment.completed',
      'order.refunded',
      'message.sent',
      'ticket.created',
      'ticket.status_changed',
      'ticket.message_added',
      'rating.created',
      'rating.updated'
    ],
    example: {
      type: 'message.sent',
      payload: {
        messageId: 'msg_123',
        senderId: 'user_123',
        receiverId: 'user_456',
        senderName: 'John Doe',
        receiverName: 'Jane Smith',
        senderEmail: 'john@example.com',
        receiverEmail: 'jane@example.com',
        content: 'Test message',
        timestamp: new Date().toISOString()
      }
    }
  })
}

