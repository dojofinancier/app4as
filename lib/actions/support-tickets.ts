'use server'

import { revalidatePath } from 'next/cache'
import { prisma } from '@/lib/prisma'
import { createClient } from '@/lib/supabase/server'
import { sendTicketCreatedWebhook, sendTicketMessageWebhook, sendTicketStatusChangedWebhook } from '@/lib/webhooks/make'
import { TICKET_CATEGORIES, type TicketCategory } from '@/lib/constants/ticket-categories'

/**
 * Create a new support ticket (student only)
 */
export async function createSupportTicket(data: {
  subject: string
  description: string
  category: TicketCategory
  appointmentId?: string
  orderId?: string
}) {
  const supabase = await createClient()
  const { data: { user } } = await supabase.auth.getUser()

  if (!user) {
    return { success: false, error: 'Non autorisé' }
  }

  // Verify user is a student
  const dbUser = await prisma.user.findUnique({
    where: { id: user.id },
    select: { role: true }
  })

  if (!dbUser || dbUser.role !== 'student') {
    return { success: false, error: 'Seuls les étudiants peuvent créer des tickets' }
  }

  // Validate subject
  if (!data.subject || data.subject.trim().length < 5 || data.subject.length > 200) {
    return { success: false, error: 'Le sujet doit contenir entre 5 et 200 caractères' }
  }

  // Validate description
  if (!data.description || data.description.trim().length < 10 || data.description.length > 5000) {
    return { success: false, error: 'La description doit contenir entre 10 et 5000 caractères' }
  }

  // Validate category
  if (!TICKET_CATEGORIES.includes(data.category)) {
    return { success: false, error: 'Catégorie invalide' }
  }

  try {
    // If appointmentId provided, verify it belongs to user
    if (data.appointmentId) {
      const appointment = await prisma.appointment.findFirst({
        where: {
          id: data.appointmentId,
          userId: user.id
        }
      })

      if (!appointment) {
        return { success: false, error: 'Rendez-vous non trouvé ou accès refusé' }
      }
    }

    // If orderId provided, verify it belongs to user
    if (data.orderId) {
      const order = await prisma.order.findFirst({
        where: {
          id: data.orderId,
          userId: user.id
        }
      })

      if (!order) {
        return { success: false, error: 'Commande non trouvée ou accès refusé' }
      }
    }

    // Create ticket
    const ticket = await prisma.supportTicket.create({
      data: {
        userId: user.id,
        subject: data.subject.trim(),
        description: data.description.trim(),
        category: data.category,
        appointmentId: data.appointmentId || null,
        orderId: data.orderId || null,
        status: 'open',
        priority: 'medium'
      },
      include: {
        user: {
          select: {
            id: true,
            firstName: true,
            lastName: true,
            email: true
          }
        }
      }
    })

    // Send webhook
    await sendTicketCreatedWebhook({
      ticketId: ticket.id,
      userId: ticket.userId,
      userEmail: ticket.user.email,
      subject: ticket.subject,
      category: ticket.category,
      priority: ticket.priority,
      status: ticket.status,
      createdAt: ticket.createdAt.toISOString()
    })

    revalidatePath('/tableau-de-bord')
    return { success: true, data: ticket }
  } catch (error) {
    console.error('Error creating support ticket:', error)
    return { success: false, error: 'Une erreur est survenue lors de la création du ticket' }
  }
}

/**
 * Get all tickets for current student
 */
export async function getStudentTickets(params?: {
  status?: 'open' | 'in_progress' | 'resolved' | 'closed' | 'all'
  cursor?: string
  limit?: number
}) {
  const supabase = await createClient()
  const { data: { user } } = await supabase.auth.getUser()

  if (!user) {
    return { success: false, error: 'Non autorisé' }
  }

  // Verify user is a student
  const dbUser = await prisma.user.findUnique({
    where: { id: user.id },
    select: { role: true }
  })

  if (!dbUser || dbUser.role !== 'student') {
    return { success: false, error: 'Accès refusé' }
  }

  try {
    const limit = params?.limit || 20
    const status = params?.status || 'all'

    // Build where clause
    const where: any = {
      userId: user.id
    }

    if (status !== 'all') {
      where.status = status
    }

    // Build cursor condition
    const cursorWhere = params?.cursor ? {
      createdAt: { lt: new Date(params.cursor) }
    } : {}

    // Get tickets with message count
    const tickets = await prisma.supportTicket.findMany({
      where: {
        ...where,
        ...cursorWhere
      },
      orderBy: {
        createdAt: 'desc'
      },
      take: limit + 1,
      include: {
        messages: {
          where: {
            isInternal: false
          },
          orderBy: {
            createdAt: 'desc'
          },
          take: 1,
          select: {
            createdAt: true
          }
        },
        _count: {
          select: {
            messages: {
              where: {
                isInternal: false
              }
            }
          }
        }
      }
    })

    const hasMore = tickets.length > limit
    const data = hasMore ? tickets.slice(0, limit) : tickets
    const nextCursor = hasMore ? data[data.length - 1].createdAt.toISOString() : null

    return {
      success: true,
      data: data.map(ticket => ({
        ...ticket,
        lastMessageDate: ticket.messages[0]?.createdAt || null,
        messageCount: ticket._count.messages
      })),
      nextCursor
    }
  } catch (error) {
    console.error('Error fetching student tickets:', error)
    return { success: false, error: 'Une erreur est survenue' }
  }
}

/**
 * Get ticket details (student version - excludes internal messages)
 */
export async function getTicketDetails(ticketId: string) {
  const supabase = await createClient()
  const { data: { user } } = await supabase.auth.getUser()

  if (!user) {
    return { success: false, error: 'Non autorisé' }
  }

  // Verify user is a student
  const dbUser = await prisma.user.findUnique({
    where: { id: user.id },
    select: { role: true }
  })

  if (!dbUser || dbUser.role !== 'student') {
    return { success: false, error: 'Accès refusé' }
  }

  try {
    const ticket = await prisma.supportTicket.findFirst({
      where: {
        id: ticketId,
        userId: user.id
      },
      include: {
        user: {
          select: {
            id: true,
            firstName: true,
            lastName: true,
            email: true
          }
        },
        assignee: {
          select: {
            id: true,
            firstName: true,
            lastName: true
          }
        },
        appointment: {
          include: {
            course: {
              select: {
                titleFr: true
              }
            },
            tutor: {
              select: {
                displayName: true
              }
            }
          }
        },
        order: {
          select: {
            id: true,
            totalCad: true,
            status: true,
            createdAt: true
          }
        },
        attachments: {
          orderBy: {
            createdAt: 'desc'
          }
        },
        messages: {
          where: {
            isInternal: false // Exclude internal messages
          },
          orderBy: {
            createdAt: 'asc'
          },
          include: {
            user: {
              select: {
                id: true,
                firstName: true,
                lastName: true,
                role: true
              }
            }
          }
        }
      }
    })

    if (!ticket) {
      return { success: false, error: 'Ticket non trouvé ou accès refusé' }
    }

    return { success: true, data: ticket }
  } catch (error) {
    console.error('Error fetching ticket details:', error)
    return { success: false, error: 'Une erreur est survenue' }
  }
}

/**
 * Add a message to a ticket (student version)
 */
export async function addTicketMessage(
  ticketId: string,
  message: string,
  attachmentIds?: string[]
) {
  const supabase = await createClient()
  const { data: { user } } = await supabase.auth.getUser()

  if (!user) {
    return { success: false, error: 'Non autorisé' }
  }

  // Verify user is a student
  const dbUser = await prisma.user.findUnique({
    where: { id: user.id },
    select: { role: true }
  })

  if (!dbUser || dbUser.role !== 'student') {
    return { success: false, error: 'Accès refusé' }
  }

  // Validate message
  if (!message || message.trim().length < 1 || message.length > 5000) {
    return { success: false, error: 'Le message doit contenir entre 1 et 5000 caractères' }
  }

  try {
    // Verify ticket exists and belongs to user
    const ticket = await prisma.supportTicket.findFirst({
      where: {
        id: ticketId,
        userId: user.id
      }
    })

    if (!ticket) {
      return { success: false, error: 'Ticket non trouvé ou accès refusé' }
    }

    // Verify ticket is not closed
    if (ticket.status === 'closed') {
      return { success: false, error: 'Impossible d\'ajouter un message à un ticket fermé' }
    }

    // Create message
    const ticketMessage = await prisma.ticketMessage.create({
      data: {
        ticketId,
        userId: user.id,
        message: message.trim(),
        isInternal: false
      },
      include: {
        user: {
          select: {
            id: true,
            firstName: true,
            lastName: true,
            email: true,
            role: true
          }
        }
      }
    })

    // Update ticket updatedAt
    await prisma.supportTicket.update({
      where: { id: ticketId },
      data: { updatedAt: new Date() }
    })

    // Send webhook
    await sendTicketMessageWebhook({
      ticketId,
      messageId: ticketMessage.id,
      userId: user.id,
      userEmail: ticketMessage.user.email,
      senderRole: ticketMessage.user.role,
      message: ticketMessage.message,
      isInternal: false,
      timestamp: ticketMessage.createdAt.toISOString()
    })

    revalidatePath('/tableau-de-bord')
    return { success: true, data: ticketMessage }
  } catch (error) {
    console.error('Error adding ticket message:', error)
    return { success: false, error: 'Une erreur est survenue' }
  }
}

/**
 * Close a ticket (student can close their own tickets)
 */
export async function closeTicket(ticketId: string) {
  const supabase = await createClient()
  const { data: { user } } = await supabase.auth.getUser()

  if (!user) {
    return { success: false, error: 'Non autorisé' }
  }

  // Verify user is a student
  const dbUser = await prisma.user.findUnique({
    where: { id: user.id },
    select: { role: true }
  })

  if (!dbUser || dbUser.role !== 'student') {
    return { success: false, error: 'Accès refusé' }
  }

  try {
    // Verify ticket exists and belongs to user
    const ticket = await prisma.supportTicket.findFirst({
      where: {
        id: ticketId,
        userId: user.id
      }
    })

    if (!ticket) {
      return { success: false, error: 'Ticket non trouvé ou accès refusé' }
    }

    // Verify ticket is not already closed
    if (ticket.status === 'closed') {
      return { success: false, error: 'Le ticket est déjà fermé' }
    }

    const oldStatus = ticket.status

    // Update ticket status
    const updatedTicket = await prisma.supportTicket.update({
      where: { id: ticketId },
      data: {
        status: 'closed',
        updatedAt: new Date()
      },
      include: {
        user: {
          select: {
            email: true
          }
        }
      }
    })

    // Send webhook
    await sendTicketStatusChangedWebhook({
      ticketId,
      userId: ticket.userId,
      userEmail: updatedTicket.user.email,
      oldStatus,
      newStatus: 'closed',
      changedBy: user.id,
      timestamp: new Date().toISOString()
    })

    revalidatePath('/tableau-de-bord')
    return { success: true, data: updatedTicket }
  } catch (error) {
    console.error('Error closing ticket:', error)
    return { success: false, error: 'Une erreur est survenue' }
  }
}

/**
 * Get student's appointments for ticket linking
 */
export async function getStudentAppointmentsForTicket() {
  const supabase = await createClient()
  const { data: { user } } = await supabase.auth.getUser()

  if (!user) {
    return { success: false, error: 'Non autorisé' }
  }

  // Verify user is a student
  const dbUser = await prisma.user.findUnique({
    where: { id: user.id },
    select: { role: true }
  })

  if (!dbUser || dbUser.role !== 'student') {
    return { success: false, error: 'Accès refusé' }
  }

  try {
    const appointments = await prisma.appointment.findMany({
      where: {
        userId: user.id
      },
      orderBy: {
        startDatetime: 'desc'
      },
      take: 50, // Limit to recent 50 appointments
      select: {
        id: true,
        startDatetime: true,
        status: true,
        course: {
          select: {
            titleFr: true
          }
        },
        tutor: {
          select: {
            displayName: true
          }
        }
      }
    })

    return {
      success: true,
      data: appointments.map(apt => ({
        id: apt.id,
        label: `${apt.course.titleFr} - ${apt.tutor.displayName} - ${new Date(apt.startDatetime).toLocaleDateString('fr-CA')}`,
        courseTitle: apt.course.titleFr,
        tutorName: apt.tutor.displayName,
        date: apt.startDatetime,
        status: apt.status
      }))
    }
  } catch (error) {
    console.error('Error fetching student appointments:', error)
    return { success: false, error: 'Une erreur est survenue' }
  }
}

/**
 * Get student's orders for ticket linking
 */
export async function getStudentOrdersForTicket() {
  const supabase = await createClient()
  const { data: { user } } = await supabase.auth.getUser()

  if (!user) {
    return { success: false, error: 'Non autorisé' }
  }

  // Verify user is a student
  const dbUser = await prisma.user.findUnique({
    where: { id: user.id },
    select: { role: true }
  })

  if (!dbUser || dbUser.role !== 'student') {
    return { success: false, error: 'Accès refusé' }
  }

  try {
    const orders = await prisma.order.findMany({
      where: {
        userId: user.id
      },
      orderBy: {
        createdAt: 'desc'
      },
      take: 50, // Limit to recent 50 orders
      select: {
        id: true,
        totalCad: true,
        status: true,
        createdAt: true
      }
    })

    return {
      success: true,
      data: orders.map(order => ({
        id: order.id,
        label: `Commande #${order.id.substring(0, 8)} - ${new Intl.NumberFormat('fr-CA', { style: 'currency', currency: 'CAD' }).format(Number(order.totalCad))} - ${new Date(order.createdAt).toLocaleDateString('fr-CA')}`,
        total: order.totalCad,
        status: order.status,
        date: order.createdAt
      }))
    }
  } catch (error) {
    console.error('Error fetching student orders:', error)
    return { success: false, error: 'Une erreur est survenue' }
  }
}

