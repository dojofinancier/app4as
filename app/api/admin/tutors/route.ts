import { NextResponse } from 'next/server'
import { prisma } from '@/lib/prisma'
import { getCurrentUser } from '@/lib/actions/auth'

export async function GET() {
  try {
    const user = await getCurrentUser()
    if (!user || user.role !== 'admin') {
      return NextResponse.json({ error: 'Accès administrateur requis' }, { status: 403 })
    }

    const tutors = await prisma.tutor.findMany({
      where: {
        active: true
      },
      include: {
        user: {
          select: {
            firstName: true,
            lastName: true,
            email: true
          }
        }
      },
      orderBy: {
        displayName: 'asc'
      }
    })

    return NextResponse.json({ tutors })
  } catch (error) {
    console.error('Error fetching tutors:', error)
    return NextResponse.json({ error: 'Erreur lors de la récupération des tuteurs' }, { status: 500 })
  }
}
