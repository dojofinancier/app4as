'use server'

import { revalidatePath } from 'next/cache'
import { prisma } from '@/lib/prisma'
import { getCurrentUser } from './auth'
import { sendMessageWebhook } from '@/lib/webhooks/make'

export async function sendMessage(data: {
  receiverId: string
  content: string
  appointmentId?: string
}) {
  try {
    const currentUser = await getCurrentUser()
    if (!currentUser) {
      return { success: false, error: 'Non autorisé' }
    }

    // Validate content
    if (!data.content.trim()) {
      return { success: false, error: 'Le message ne peut pas être vide' }
    }

    // Check if receiver exists and is a tutor
    const receiver = await prisma.user.findUnique({
      where: { id: data.receiverId },
      include: { tutor: true }
    })

    if (!receiver) {
      return { success: false, error: 'Destinataire non trouvé' }
    }

    // Check if current user has appointments with this tutor
    if (currentUser.role === 'student') {
      const hasAppointments = await prisma.appointment.findFirst({
        where: {
          userId: currentUser.id,
          tutorId: data.receiverId,
          status: { in: ['scheduled', 'completed'] }
        }
      })

      if (!hasAppointments) {
        return { success: false, error: 'Vous ne pouvez pas envoyer de messages à ce tuteur' }
      }
    }

    // Create the message
    const message = await prisma.message.create({
      data: {
        senderId: currentUser.id,
        receiverId: data.receiverId,
        content: data.content.trim(),
        appointmentId: data.appointmentId || null
      },
      include: {
        sender: {
          select: {
            id: true,
            firstName: true,
            lastName: true,
            email: true,
            role: true
          }
        },
        receiver: {
          select: {
            id: true,
            firstName: true,
            lastName: true,
            email: true,
            role: true
          }
        },
        appointment: {
          select: {
            id: true,
            startDatetime: true,
            course: {
              select: {
                titleFr: true
              }
            }
          }
        }
      }
    })

    // Send webhook notification
    await sendMessageWebhook({
      messageId: message.id,
      senderId: message.senderId,
      receiverId: message.receiverId,
      senderName: `${message.sender.firstName} ${message.sender.lastName}`,
      receiverName: `${message.receiver.firstName} ${message.receiver.lastName}`,
      senderEmail: message.sender.email,
      receiverEmail: message.receiver.email,
      content: message.content,
      appointmentId: message.appointmentId || undefined,
      appointmentTitle: message.appointment?.course.titleFr,
      timestamp: message.createdAt?.toISOString() || new Date().toISOString()
    })

    revalidatePath('/tableau-de-bord')
    return { success: true, message }
  } catch (error) {
    console.error('Error sending message:', error)
    return { success: false, error: 'Une erreur est survenue lors de l\'envoi du message' }
  }
}

export async function getConversation(participantId: string) {
  try {
    const currentUser = await getCurrentUser()
    if (!currentUser) {
      return { success: false, error: 'Non autorisé' }
    }

    // Get all messages between current user and participant
    const messages = await prisma.message.findMany({
      where: {
        OR: [
          {
            senderId: currentUser.id,
            receiverId: participantId
          },
          {
            senderId: participantId,
            receiverId: currentUser.id
          }
        ]
      },
      include: {
        sender: {
          select: {
            id: true,
            firstName: true,
            lastName: true,
            role: true
          }
        },
        receiver: {
          select: {
            id: true,
            firstName: true,
            lastName: true,
            role: true
          }
        },
        appointment: {
          select: {
            id: true,
            startDatetime: true,
            course: {
              select: {
                titleFr: true
              }
            }
          }
        },
        attachments: {
          select: {
            id: true,
            fileName: true,
            fileSize: true,
            fileType: true,
            createdAt: true
          }
        }
      },
      orderBy: { createdAt: 'asc' }
    })

    // Mark messages as read for current user
    await prisma.message.updateMany({
      where: {
        receiverId: currentUser.id,
        senderId: participantId,
        isRead: false
      },
      data: { isRead: true }
    })

    // Serialize the data
    const serializedMessages = messages.map(msg => ({
      ...msg,
      createdAt: msg.createdAt?.toISOString() || new Date().toISOString(),
      appointment: msg.appointment ? {
        ...msg.appointment,
        startDatetime: msg.appointment.startDatetime.toISOString()
      } : null,
      attachments: msg.attachments.map(attachment => ({
        ...attachment,
        createdAt: attachment.createdAt?.toISOString() || new Date().toISOString()
      }))
    }))

    return { success: true, messages: serializedMessages }
  } catch (error) {
    console.error('Error fetching conversation:', error)
    return { success: false, error: 'Une erreur est survenue lors de la récupération des messages' }
  }
}

export async function getConversations() {
  try {
    const currentUser = await getCurrentUser()
    if (!currentUser) {
      return { success: false, error: 'Non autorisé' }
    }

    // Get all unique participants (people who have sent or received messages)
    const participants = await prisma.message.findMany({
      where: {
        OR: [
          { senderId: currentUser.id },
          { receiverId: currentUser.id }
        ]
      },
      select: {
        senderId: true,
        receiverId: true,
        sender: {
          select: {
            id: true,
            firstName: true,
            lastName: true,
            role: true
          }
        },
        receiver: {
          select: {
            id: true,
            firstName: true,
            lastName: true,
            role: true
          }
        }
      },
      distinct: ['senderId', 'receiverId']
    })

    // Get unique participants (excluding current user)
    const uniqueParticipants = new Map()
    participants.forEach(msg => {
      const participant = msg.senderId === currentUser.id ? msg.receiver : msg.sender
      if (participant.id !== currentUser.id) {
        uniqueParticipants.set(participant.id, participant)
      }
    })

    // Get latest message and unread count for each participant
    const conversations = await Promise.all(
      Array.from(uniqueParticipants.values()).map(async (participant) => {
        const latestMessage = await prisma.message.findFirst({
          where: {
            OR: [
              {
                senderId: currentUser.id,
                receiverId: participant.id
              },
              {
                senderId: participant.id,
                receiverId: currentUser.id
              }
            ]
          },
          orderBy: { createdAt: 'desc' },
          include: {
            sender: {
              select: {
                id: true,
                firstName: true,
                lastName: true
              }
            }
          }
        })

        const unreadCount = await prisma.message.count({
          where: {
            senderId: participant.id,
            receiverId: currentUser.id,
            isRead: false
          }
        })

        return {
          participant,
          latestMessage: latestMessage ? {
            ...latestMessage,
            createdAt: latestMessage.createdAt?.toISOString() || new Date().toISOString(),
            sender: {
              ...latestMessage.sender,
              isCurrentUser: latestMessage.sender.id === currentUser.id
            }
          } : null,
          unreadCount
        }
      })
    )

    // Sort by latest message date
    conversations.sort((a, b) => {
      if (!a.latestMessage && !b.latestMessage) return 0
      if (!a.latestMessage) return 1
      if (!b.latestMessage) return -1
      return new Date(b.latestMessage.createdAt).getTime() - new Date(a.latestMessage.createdAt).getTime()
    })

    return { success: true, conversations }
  } catch (error) {
    console.error('Error fetching conversations:', error)
    return { success: false, error: 'Une erreur est survenue lors de la récupération des conversations' }
  }
}

export async function markMessagesAsRead(participantId: string) {
  try {
    const currentUser = await getCurrentUser()
    if (!currentUser) {
      return { success: false, error: 'Non autorisé' }
    }

    await prisma.message.updateMany({
      where: {
        senderId: participantId,
        receiverId: currentUser.id,
        isRead: false
      },
      data: { isRead: true }
    })

    revalidatePath('/tableau-de-bord')
    return { success: true }
  } catch (error) {
    console.error('Error marking messages as read:', error)
    return { success: false, error: 'Une erreur est survenue' }
  }
}

export async function getUnreadMessageCount() {
  try {
    const currentUser = await getCurrentUser()
    if (!currentUser) {
      return { success: false, error: 'Non autorisé' }
    }

    const unreadCount = await prisma.message.count({
      where: {
        receiverId: currentUser.id,
        isRead: false
      }
    })

    return { success: true, count: unreadCount }
  } catch (error) {
    console.error('Error fetching unread message count:', error)
    return { success: false, error: 'Une erreur est survenue' }
  }
}

export async function getUnreadMessageCountForStudent(studentId: string) {
  try {
    const currentUser = await getCurrentUser()
    if (!currentUser) {
      return { success: false, error: 'Non autorisé' }
    }

    // For tutors, count unread messages from this specific student
    const unreadCount = await prisma.message.count({
      where: {
        senderId: studentId,
        receiverId: currentUser.id,
        isRead: false
      }
    })

    return { success: true, count: unreadCount }
  } catch (error) {
    console.error('Error fetching unread message count for student:', error)
    return { success: false, error: 'Une erreur est survenue' }
  }
}

export async function getTutorStudents() {
  try {
    const currentUser = await getCurrentUser()
    if (!currentUser) {
      return { success: false, error: 'Non autorisé' }
    }

    // Get all students who have appointments with this tutor
    const students = await prisma.appointment.findMany({
      where: {
        tutorId: currentUser.id,
        status: { in: ['scheduled', 'completed'] }
      },
      select: {
        user: {
          select: {
            id: true,
            firstName: true,
            lastName: true,
            email: true,
            role: true
          }
        }
      },
      distinct: ['userId']
    })

    // Count appointments for each student
    const studentsWithCounts = await Promise.all(
      students.map(async (appointment) => {
        const appointmentCount = await prisma.appointment.count({
          where: {
            tutorId: currentUser.id,
            userId: appointment.user.id,
            status: { in: ['scheduled', 'completed'] }
          }
        })

        return {
          ...appointment.user,
          appointmentCount
        }
      })
    )

    return { success: true, students: studentsWithCounts }
  } catch (error) {
    console.error('Error fetching tutor students:', error)
    return { success: false, error: 'Une erreur est survenue' }
  }
}
