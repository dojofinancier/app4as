import { schedule } from '@netlify/functions'
import { PrismaClient } from '@prisma/client'

const prisma = new PrismaClient()

const completePastAppointments = async () => {
  try {
    const now = new Date()

    // Find all scheduled appointments that have passed
    const pastAppointments = await prisma.appointment.findMany({
      where: {
        status: 'scheduled',
        endDatetime: {
          lt: now
        }
      },
      include: {
        orderItem: {
          select: {
            id: true
          }
        }
      }
    })

    if (pastAppointments.length === 0) {
      return {
        statusCode: 200,
        body: JSON.stringify({
          message: 'No past appointments to complete',
          count: 0
        }),
      }
    }

    // Update appointments and orderItems in a transaction
    const result = await prisma.$transaction(async (tx) => {
      const appointmentIds = pastAppointments.map(apt => apt.id)
      const orderItemIds = pastAppointments
        .map(apt => apt.orderItem?.id)
        .filter((id): id is string => !!id)

      // Update appointments to completed
      const updatedAppointments = await tx.appointment.updateMany({
        where: {
          id: { in: appointmentIds }
        },
        data: {
          status: 'completed'
        }
      })

      // Update orderItems earningsStatus to 'earned'
      if (orderItemIds.length > 0) {
        await tx.orderItem.updateMany({
          where: {
            id: { in: orderItemIds }
          },
          data: {
            earningsStatus: 'earned'
          }
        })
      }

      return updatedAppointments.count
    })

    console.log(`Auto-completed ${result} past appointments`)

    return {
      statusCode: 200,
      body: JSON.stringify({
        message: `Auto-completed ${result} past appointments`,
        count: result
      }),
    }
  } catch (error) {
    console.error('Error auto-completing past appointments:', error)
    return {
      statusCode: 500,
      body: JSON.stringify({ error: 'Failed to auto-complete appointments' }),
    }
  } finally {
    await prisma.$disconnect()
  }
}

// Run every hour
export const handler = schedule('0 * * * *', completePastAppointments)






