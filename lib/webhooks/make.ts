/**
 * Send webhook to Make.com for signup events
 */
export async function sendSignupWebhook(data: {
  userId: string
  role: string
  email: string
  firstName: string
  lastName: string
  createdAt: string
}) {
  const webhookUrl = process.env.MAKE_SIGNUP_WEBHOOK_URL

  if (!webhookUrl) {
    console.warn('MAKE_SIGNUP_WEBHOOK_URL not configured')
    return
  }

  try {
    const response = await fetch(webhookUrl, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
      },
      body: JSON.stringify({
        type: 'signup',
        user_id: data.userId,
        role: data.role,
        email: data.email,
        first_name: data.firstName,
        last_name: data.lastName,
        created_at: data.createdAt,
      }),
    })

    if (!response.ok) {
      throw new Error(`Webhook failed: ${response.statusText}`)
    }

    console.log('Signup webhook sent successfully')
  } catch (error) {
    console.error('Error sending signup webhook:', error)
  }
}

/**
 * Send webhook to Make.com for booking created events
 */
export async function sendMessageWebhook(data: {
  messageId: string
  senderId: string
  receiverId: string
  senderName: string
  receiverName: string
  content: string
  appointmentId?: string
  appointmentTitle?: string
  timestamp: string
}) {
  const webhookUrl = process.env.MAKE_MESSAGE_WEBHOOK_URL

  if (!webhookUrl) {
    console.warn('MAKE_MESSAGE_WEBHOOK_URL not configured')
    return
  }

  try {
    const response = await fetch(webhookUrl, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
      },
      body: JSON.stringify({
        type: 'message.sent',
        message_id: data.messageId,
        sender_id: data.senderId,
        receiver_id: data.receiverId,
        sender_name: data.senderName,
        receiver_name: data.receiverName,
        content: data.content,
        appointment_id: data.appointmentId,
        appointment_title: data.appointmentTitle,
        timestamp: data.timestamp,
      }),
    })

    if (!response.ok) {
      throw new Error(`Webhook failed: ${response.statusText}`)
    }

    console.log('Message webhook sent successfully')
  } catch (error) {
    console.error('Error sending message webhook:', error)
  }
}

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
  const webhookUrl = process.env.MAKE_BOOKING_WEBHOOK_URL

  if (!webhookUrl) {
    console.warn('MAKE_BOOKING_WEBHOOK_URL not configured')
    return
  }

  try {
    const response = await fetch(webhookUrl, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
      },
      body: JSON.stringify({
        type: data.type || 'booking.created',
        order_id: data.orderId,
        user_id: data.userId,
        currency: data.currency,
        subtotal_cad: data.subtotalCad,
        discount_cad: data.discountCad,
        total_cad: data.totalCad,
        items: data.items,
        created_at: data.createdAt,
        // Appointment event fields
        appointment_id: data.appointmentId,
        tutor_id: data.tutorId,
        reason: data.reason,
        action: data.action,
        amount: data.amount,
        old_start_datetime: data.oldStartDatetime,
        new_start_datetime: data.newStartDatetime,
        timestamp: data.timestamp,
      }),
    })

    if (!response.ok) {
      throw new Error(`Webhook failed: ${response.statusText}`)
    }

    console.log('Booking webhook sent successfully')
  } catch (error) {
    console.error('Error sending booking webhook:', error)
  }
}


