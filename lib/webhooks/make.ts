import { prisma } from '@/lib/prisma'

export type MakeEventType =
  | 'signup'
  | 'booking.created'
  | 'booking.cancelled'
  | 'booking.rescheduled'
  | 'appointment.completed'
  | 'order.refunded'
  | 'message.sent'
  | 'rating.created'
  | 'rating.updated'
  | 'ticket.created'
  | 'ticket.status_changed'
  | 'ticket.message_added'
  | 'error.occurred'
  // Admin operations (not recorded in database)
  | 'course.created'
  | 'course.updated'
  | 'course.deleted'
  | 'tutor.created'
  | 'tutor.updated'
  | 'tutor.rate.updated'

// Events that should NOT be recorded in database (admin operations)
const ADMIN_ONLY_EVENTS: MakeEventType[] = [
  'course.created',
  'course.updated',
  'course.deleted',
  'tutor.created',
  'tutor.updated',
  'tutor.rate.updated'
]

function getUrlForType(type: MakeEventType): string | undefined {
  switch (type) {
    case 'signup': 
      return process.env.MAKE_SIGNUP_WEBHOOK_URL
    case 'booking.created': 
      return process.env.MAKE_BOOKING_WEBHOOK_URL
    case 'booking.cancelled': 
      return process.env.MAKE_CANCELLATION_WEBHOOK_URL
    case 'booking.rescheduled': 
      return process.env.MAKE_RESCHEDULE_WEBHOOK_URL || process.env.MAKE_BOOKING_WEBHOOK_URL
    case 'appointment.completed': 
      return process.env.MAKE_COMPLETION_WEBHOOK_URL || process.env.MAKE_BOOKING_WEBHOOK_URL
    case 'order.refunded': 
      return process.env.MAKE_REFUND_WEBHOOK_URL || process.env.MAKE_BOOKING_WEBHOOK_URL
    case 'message.sent': 
      return process.env.MAKE_MESSAGE_WEBHOOK_URL
    case 'rating.created':
    case 'rating.updated':
      return process.env.MAKE_RATING_WEBHOOK_URL || process.env.MAKE_BOOKING_WEBHOOK_URL
    case 'ticket.created':
    case 'ticket.status_changed':
    case 'ticket.message_added':
      return process.env.MAKE_TICKET_WEBHOOK_URL || process.env.MAKE_BOOKING_WEBHOOK_URL
    case 'error.occurred':
      return process.env.MAKE_ERROR_WEBHOOK_URL || process.env.MAKE_BOOKING_WEBHOOK_URL
    // Admin operations use same webhook or fallback
    case 'course.created':
    case 'course.updated':
    case 'course.deleted':
    case 'tutor.created':
    case 'tutor.updated':
    case 'tutor.rate.updated':
      return process.env.MAKE_ADMIN_WEBHOOK_URL || process.env.MAKE_BOOKING_WEBHOOK_URL
    default:
      return process.env.MAKE_BOOKING_WEBHOOK_URL
  }
}

/**
 * Centralized webhook sender with retry logic and event recording
 * Only records non-admin events in database
 */
export async function sendMakeWebhook(
  type: MakeEventType, 
  payload: any, 
  attempt = 1
): Promise<void> {
  const url = getUrlForType(type)
  
  if (!url) {
    console.warn(`No webhook URL configured for event type: ${type}`)
    return
  }

  const shouldRecord = !ADMIN_ONLY_EVENTS.includes(type)
  const eventId = `make_${Date.now()}_${Math.random().toString(36).substr(2, 9)}`

  try {
    const response = await fetch(url, {
      method: 'POST',
      headers: { 
        'Content-Type': 'application/json; charset=utf-8'
      },
      body: JSON.stringify({ 
        type, 
        payload, 
        event_id: eventId,
        sent_at: new Date().toISOString() 
      }),
    })

    if (!response.ok) {
      throw new Error(`Make webhook failed: ${response.status} ${response.statusText}`)
    }

    // Record successful webhook (only for non-admin events)
    if (shouldRecord) {
      try {
        await prisma.webhookEvent.create({
          data: {
            source: 'make',
            type,
            payloadJson: JSON.stringify({ type, payload, eventId }),
            processedAt: new Date()
          }
        })
      } catch (dbError) {
        // Don't fail webhook if recording fails
        console.error('Error recording webhook event:', dbError)
      }
    }

    console.log(`Webhook sent successfully: ${type}`)
  } catch (err) {
    // Retry logic with exponential backoff
    if (attempt < 3) {
      const delayMs = Math.pow(2, attempt) * 500
      console.log(`Webhook retry ${attempt}/3 for ${type} after ${delayMs}ms`)
      await new Promise(r => setTimeout(r, delayMs))
      return sendMakeWebhook(type, payload, attempt + 1)
    }

    // Record failed webhook (only for non-admin events)
    if (shouldRecord) {
      try {
        await prisma.webhookEvent.create({
          data: {
            source: 'make',
            type,
            payloadJson: JSON.stringify({ 
              type, 
              payload, 
              eventId,
              error: err instanceof Error ? err.message : 'Unknown error',
              attempts: attempt
            })
            // processedAt remains null for failed webhooks
          }
        })
      } catch (dbError) {
        console.error('Error recording failed webhook event:', dbError)
      }
    }

    console.error(`Make webhook error after ${attempt} attempts:`, err)
  }
}

/**
 * Send webhook to Make.com for signup events
 */
export async function sendSignupWebhook(data: {
  userId: string
  role: string
  email: string
  firstName: string
  lastName: string
  phone?: string | null
  createdAt: string
}) {
  await sendMakeWebhook('signup', {
    user_id: data.userId,
    role: data.role,
    email: data.email,
    first_name: data.firstName,
    last_name: data.lastName,
    phone: data.phone || null,
    created_at: data.createdAt,
  })
}

/**
 * Send webhook to Make.com for booking created events
 */
export async function sendBookingCreatedWebhook(data: {
  orderId: string
  userId: string
  currency: string
  subtotalCad: number
  discountCad: number
  totalCad: number
  couponCode?: string
  phone?: string | null
  studentEmail: string
  studentFirstName: string
  studentLastName: string
  items: Array<{
    appointmentId: string
    courseId: string
    courseTitleFr: string
    tutorId: string
    tutorName: string
    tutorEmail: string
    tutorPhone?: string | null
    startDatetime: string
    durationMin: number
    priceCad: number
    tutorEarningsCad: number
  }>
  createdAt: string
}) {
  await sendMakeWebhook('booking.created', {
    order_id: data.orderId,
    user_id: data.userId,
    currency: data.currency,
    subtotal_cad: data.subtotalCad,
    discount_cad: data.discountCad,
    total_cad: data.totalCad,
    coupon_code: data.couponCode || null,
    phone: data.phone || null,
    student_email: data.studentEmail,
    student_first_name: data.studentFirstName,
    student_last_name: data.studentLastName,
    items: data.items.map(item => ({
      appointment_id: item.appointmentId,
      course_id: item.courseId,
      course_title_fr: item.courseTitleFr,
      tutor_id: item.tutorId,
      tutor_name: item.tutorName,
      tutor_email: item.tutorEmail,
      tutor_phone: item.tutorPhone || null,
      start_datetime: item.startDatetime,
      duration_min: item.durationMin,
      price_cad: item.priceCad,
      tutor_earnings_cad: item.tutorEarningsCad,
    })),
    created_at: data.createdAt,
  })
}

/**
 * Send webhook to Make.com for booking cancelled events
 */
export async function sendBookingCancelledWebhook(data: {
  appointmentId: string
  userId: string
  tutorId: string
  studentEmail: string
  tutorEmail: string
  courseId: string
  courseTitleFr: string
  cancelledBy: 'student' | 'tutor' | 'admin'
  cancelledById: string
  cancellationReason?: string
  startDatetime: string
  endDatetime: string
  durationMin: number
  priceCad: number
  creditIssued?: number
  timestamp: string
}) {
  await sendMakeWebhook('booking.cancelled', {
    appointment_id: data.appointmentId,
    user_id: data.userId,
    tutor_id: data.tutorId,
    student_email: data.studentEmail,
    tutor_email: data.tutorEmail,
    course_id: data.courseId,
    course_title_fr: data.courseTitleFr,
    cancelled_by: data.cancelledBy,
    cancelled_by_id: data.cancelledById,
    cancellation_reason: data.cancellationReason,
    start_datetime: data.startDatetime,
    end_datetime: data.endDatetime,
    duration_min: data.durationMin,
    price_cad: data.priceCad,
    credit_issued: data.creditIssued,
    timestamp: data.timestamp,
  })
}

/**
 * Send webhook to Make.com for booking rescheduled events
 */
export async function sendBookingRescheduledWebhook(data: {
  appointmentId: string
  userId: string
  tutorId: string
  studentEmail: string
  tutorEmail: string
  courseId: string
  courseTitleFr: string
  rescheduledBy: 'student' | 'tutor' | 'admin'
  rescheduledById: string
  reason: string
  oldStartDatetime: string
  oldEndDatetime: string
  newStartDatetime: string
  newEndDatetime: string
  timestamp: string
}) {
  await sendMakeWebhook('booking.rescheduled', {
    appointment_id: data.appointmentId,
    user_id: data.userId,
    tutor_id: data.tutorId,
    student_email: data.studentEmail,
    tutor_email: data.tutorEmail,
    course_id: data.courseId,
    course_title_fr: data.courseTitleFr,
    rescheduled_by: data.rescheduledBy,
    rescheduled_by_id: data.rescheduledById,
    reason: data.reason,
    old_start_datetime: data.oldStartDatetime,
    old_end_datetime: data.oldEndDatetime,
    new_start_datetime: data.newStartDatetime,
    new_end_datetime: data.newEndDatetime,
    timestamp: data.timestamp,
  })
}

/**
 * Send webhook to Make.com for appointment completed events
 */
export async function sendAppointmentCompletedWebhook(data: {
  appointmentId: string
  userId: string
  tutorId: string
  studentEmail: string
  tutorEmail: string
  courseId: string
  courseTitleFr: string
  startDatetime: string
  endDatetime: string
  durationMin: number
  tutorEarningsCad: number
  completedAt: string
}) {
  await sendMakeWebhook('appointment.completed', {
    appointment_id: data.appointmentId,
    user_id: data.userId,
    tutor_id: data.tutorId,
    student_email: data.studentEmail,
    tutor_email: data.tutorEmail,
    course_id: data.courseId,
    course_title_fr: data.courseTitleFr,
    start_datetime: data.startDatetime,
    end_datetime: data.endDatetime,
    duration_min: data.durationMin,
    tutor_earnings_cad: data.tutorEarningsCad,
    completed_at: data.completedAt,
  })
}

/**
 * Send webhook to Make.com for order refunded events
 */
export async function sendOrderRefundedWebhook(data: {
  orderId: string
  userId: string
  studentEmail: string
  refundAmount: number
  refundReason: string
  stripeRefundId?: string
  processedBy: string
  affectedAppointments: string[]
  timestamp: string
}) {
  await sendMakeWebhook('order.refunded', {
    order_id: data.orderId,
    user_id: data.userId,
    student_email: data.studentEmail,
    refund_amount: data.refundAmount,
    refund_reason: data.refundReason,
    stripe_refund_id: data.stripeRefundId,
    processed_by: data.processedBy,
    affected_appointments: data.affectedAppointments,
    timestamp: data.timestamp,
  })
}

/**
 * Send webhook to Make.com for message sent events
 */
export async function sendMessageWebhook(data: {
  messageId: string
  senderId: string
  receiverId: string
  senderName: string
  receiverName: string
  senderEmail: string
  receiverEmail: string
  content: string
  appointmentId?: string
  appointmentTitle?: string
  timestamp: string
}) {
  await sendMakeWebhook('message.sent', {
    message_id: data.messageId,
    sender_id: data.senderId,
    receiver_id: data.receiverId,
    sender_name: data.senderName,
    receiver_name: data.receiverName,
    sender_email: data.senderEmail,
    receiver_email: data.receiverEmail,
    content: data.content,
    appointment_id: data.appointmentId,
    appointment_title: data.appointmentTitle,
    timestamp: data.timestamp,
  })
}

/**
 * Send webhook to Make.com for ticket created events
 */
export async function sendTicketCreatedWebhook(data: {
  ticketId: string
  userId: string
  userEmail: string
  studentName: string
  subject: string
  category: string
  priority: string
  status: string
  createdAt: string
}) {
  await sendMakeWebhook('ticket.created', {
    ticket_id: data.ticketId,
    user_id: data.userId,
    student_email: data.userEmail,
    student_name: data.studentName,
    subject: data.subject,
    category: data.category,
    priority: data.priority,
    status: data.status,
    created_at: data.createdAt,
  })
}

/**
 * Send webhook to Make.com for ticket status changed events
 */
export async function sendTicketStatusChangedWebhook(data: {
  ticketId: string
  userId: string
  userEmail: string
  studentName: string
  oldStatus: string
  newStatus: string
  changedBy: string
  reason?: string
  timestamp: string
}) {
  await sendMakeWebhook('ticket.status_changed', {
    ticket_id: data.ticketId,
    user_id: data.userId,
    student_email: data.userEmail,
    student_name: data.studentName,
    old_status: data.oldStatus,
    new_status: data.newStatus,
    changed_by: data.changedBy,
    reason: data.reason,
    timestamp: data.timestamp,
  })
}

/**
 * Send webhook to Make.com for ticket message added events
 */
export async function sendTicketMessageWebhook(data: {
  ticketId: string
  messageId: string
  userId: string
  userEmail: string
  studentName: string
  senderRole: string
  message: string
  isInternal: boolean
  timestamp: string
}) {
  await sendMakeWebhook('ticket.message_added', {
    ticket_id: data.ticketId,
    message_id: data.messageId,
    user_id: data.userId,
    student_email: data.userEmail,
    student_name: data.studentName,
    sender_role: data.senderRole,
    message: data.message,
    is_internal: data.isInternal,
    timestamp: data.timestamp,
  })
}

/**
 * Send webhook to Make.com for error occurred events
 */
export async function sendErrorOccurredWebhook(data: {
  errorId: string
  message: string
  errorType: string
  severity: string
  userId?: string
  userEmail?: string
  url?: string
  stack?: string
  context?: object
  timestamp: string
}) {
  await sendMakeWebhook('error.occurred', {
    error_id: data.errorId,
    message: data.message,
    error_type: data.errorType,
    severity: data.severity,
    user_id: data.userId || null,
    user_email: data.userEmail || null,
    url: data.url || null,
    stack: data.stack || null,
    context: data.context || null,
    timestamp: data.timestamp,
  })
}

/**
 * Legacy function for backward compatibility - maps to new booking.created webhook
 */
export async function sendBookingWebhook(data: {
  orderId?: string
  userId: string
  currency?: string
  subtotalCad?: number
  discountCad?: number
  totalCad?: number
  items?: Array<{
    appointmentId: string
    courseId: string
    courseTitleFr: string
    tutorId: string
    tutorName: string
    startDatetime: string
    durationMin: number
    priceCad: number
  }>
  createdAt?: string
  // For appointment events
  type?: string
  appointmentId?: string
  tutorId?: string
  reason?: string
  action?: string
  amount?: number
  oldStartDatetime?: string
  newStartDatetime?: string
  timestamp?: string
}) {
  // Handle different event types
  if (data.type === 'booking.rescheduled' || data.type === 'appointment_rescheduled') {
    // This should use sendBookingRescheduledWebhook instead
    console.warn('Using deprecated sendBookingWebhook for reschedule. Use sendBookingRescheduledWebhook instead.')
    await sendMakeWebhook('booking.rescheduled', {
      appointment_id: data.appointmentId,
      user_id: data.userId,
      tutor_id: data.tutorId,
      reason: data.reason,
      old_start_datetime: data.oldStartDatetime,
      new_start_datetime: data.newStartDatetime,
      timestamp: data.timestamp,
    })
  } else {
    // Default to booking.created
    await sendBookingCreatedWebhook({
      orderId: data.orderId || '',
      userId: data.userId,
      currency: data.currency || 'CAD',
      subtotalCad: data.subtotalCad || 0,
      discountCad: data.discountCad || 0,
      totalCad: data.totalCad || 0,
      phone: null,
      studentEmail: '',
      studentFirstName: '',
      studentLastName: '',
      items: (data.items || []).map(item => ({
        ...item,
        tutorEmail: '',
        tutorPhone: null,
        tutorEarningsCad: 0 // Legacy function doesn't provide this, default to 0
      })),
      createdAt: data.createdAt || new Date().toISOString(),
    })
  }
}
