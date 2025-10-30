"use server"

import { revalidatePath } from 'next/cache'
import { prisma } from '@/lib/prisma'
import { createClient } from '@/lib/supabase/server'
import { sendMakeWebhook } from '@/lib/webhooks/make'

interface UpsertRatingInput {
  tutorId: string
  courseId: string
  q1Courtoisie: number
  q2Maitrise: number
  q3Pedagogie: number
  q4Dynamisme: number
  comment?: string | null
}

export async function upsertRating(input: UpsertRatingInput) {
  const supabase = await createClient()
  const { data: { user } } = await supabase.auth.getUser()
  if (!user) return { success: false, error: 'Non autorisé' }

  // Validate ranges and comment length
  const { q1Courtoisie, q2Maitrise, q3Pedagogie, q4Dynamisme, comment } = input
  const inRange = (v: number) => Number.isInteger(v) && v >= 1 && v <= 5
  if (![q1Courtoisie, q2Maitrise, q3Pedagogie, q4Dynamisme].every(inRange)) {
    return { success: false, error: 'Les notes doivent être entre 1 et 5' }
  }
  if (comment && comment.length > 2000) {
    return { success: false, error: 'Commentaire trop long (2000 caractères max.)' }
  }

  // Eligibility: student must have at least one completed appointment with this tutor+course
  const hasCompleted = await prisma.appointment.findFirst({
    where: {
      userId: user.id,
      tutorId: input.tutorId,
      courseId: input.courseId,
      status: 'completed',
    },
    select: { id: true },
  })
  if (!hasCompleted) {
    return { success: false, error: 'Évaluation non permise (aucun rendez-vous complété)' }
  }

  const generalScore = Number(((q1Courtoisie + q2Maitrise + q3Pedagogie + q4Dynamisme) / 4).toFixed(2))

  try {
    const before = await prisma.tutorRating.findUnique({
      where: {
        studentId_tutorId_courseId: {
          studentId: user.id,
          tutorId: input.tutorId,
          courseId: input.courseId,
        },
      },
    })
    const rating = await prisma.tutorRating.upsert({
      where: {
        studentId_tutorId_courseId: {
          studentId: user.id,
          tutorId: input.tutorId,
          courseId: input.courseId,
        },
      },
      update: {
        q1Courtoisie,
        q2Maitrise,
        q3Pedagogie,
        q4Dynamisme,
        comment: comment ?? null,
        generalScore,
        hidden: false, // unhide on update
      },
      create: {
        studentId: user.id,
        tutorId: input.tutorId,
        courseId: input.courseId,
        q1Courtoisie,
        q2Maitrise,
        q3Pedagogie,
        q4Dynamisme,
        comment: comment ?? null,
        generalScore,
      },
    })

    // Revalidate key views
    revalidatePath('/tableau-de-bord', 'layout')
    revalidatePath('/tuteur', 'layout')
    revalidatePath('/admin', 'layout')

    // Make.com webhook
    const eventType = before ? 'rating.updated' : 'rating.created'
    await sendMakeWebhook(eventType, {
      ratingId: rating.id,
      tutorId: rating.tutorId,
      courseId: rating.courseId,
      studentId: rating.studentId,
      q1Courtoisie: rating.q1Courtoisie,
      q2Maitrise: rating.q2Maitrise,
      q3Pedagogie: rating.q3Pedagogie,
      q4Dynamisme: rating.q4Dynamisme,
      generalScore: rating.generalScore,
      hasComment: !!rating.comment,
      createdAt: rating.createdAt,
      updatedAt: rating.updatedAt,
    })

    return { success: true, data: rating }
  } catch (error) {
    console.error('upsertRating error:', error)
    return { success: false, error: 'Une erreur est survenue' }
  }
}

export async function getMyRatingForTutorCourse(params: { tutorId: string; courseId: string }) {
  const supabase = await createClient()
  const { data: { user } } = await supabase.auth.getUser()
  if (!user) return { success: false, error: 'Non autorisé' }

  try {
    const rating = await prisma.tutorRating.findUnique({
      where: {
        studentId_tutorId_courseId: {
          studentId: user.id,
          tutorId: params.tutorId,
          courseId: params.courseId,
        },
      },
    })
    return { success: true, data: rating }
  } catch (error) {
    console.error('getMyRatingForTutorCourse error:', error)
    return { success: false, error: 'Une erreur est survenue' }
  }
}

export async function getTutorRatingAverages(params: { tutorId: string; courseId?: string; from?: string; to?: string }) {
  try {
    const where: any = {
      tutorId: params.tutorId,
      hidden: false,
    }
    if (params.courseId) where.courseId = params.courseId
    if (params.from || params.to) {
      where.createdAt = {}
      if (params.from) where.createdAt.gte = new Date(params.from)
      if (params.to) where.createdAt.lte = new Date(params.to)
    }

    const [count, avgQ1, avgQ2, avgQ3, avgQ4, avgGeneral] = await Promise.all([
      prisma.tutorRating.count({ where }),
      prisma.tutorRating.aggregate({ where, _avg: { q1Courtoisie: true } }),
      prisma.tutorRating.aggregate({ where, _avg: { q2Maitrise: true } }),
      prisma.tutorRating.aggregate({ where, _avg: { q3Pedagogie: true } }),
      prisma.tutorRating.aggregate({ where, _avg: { q4Dynamisme: true } }),
      prisma.tutorRating.aggregate({ where, _avg: { generalScore: true } }),
    ])

    return {
      success: true,
      data: {
        count,
        avgQ1: Number(avgQ1._avg.q1Courtoisie ?? 0),
        avgQ2: Number(avgQ2._avg.q2Maitrise ?? 0),
        avgQ3: Number(avgQ3._avg.q3Pedagogie ?? 0),
        avgQ4: Number(avgQ4._avg.q4Dynamisme ?? 0),
        avgGeneral: Number(avgGeneral._avg.generalScore ?? 0),
      },
    }
  } catch (error) {
    console.error('getTutorRatingAverages error:', error)
    return { success: false, error: 'Une erreur est survenue' }
  }
}

export async function getTutorRatings(params: { tutorId: string; courseId?: string; from?: string; to?: string; page?: number; pageSize?: number }) {
  const page = params.page && params.page > 0 ? params.page : 1
  const pageSize = params.pageSize && params.pageSize > 0 ? params.pageSize : 20
  const skip = (page - 1) * pageSize

  try {
    const where: any = {
      tutorId: params.tutorId,
      hidden: false,
    }
    if (params.courseId) where.courseId = params.courseId
    if (params.from || params.to) {
      where.createdAt = {}
      if (params.from) where.createdAt.gte = new Date(params.from)
      if (params.to) where.createdAt.lte = new Date(params.to)
    }

    const [total, items] = await Promise.all([
      prisma.tutorRating.count({ where }),
      prisma.tutorRating.findMany({
        where,
        orderBy: { createdAt: 'desc' },
        skip,
        take: pageSize,
        select: {
          id: true,
          courseId: true,
          createdAt: true,
          q1Courtoisie: true,
          q2Maitrise: true,
          q3Pedagogie: true,
          q4Dynamisme: true,
          generalScore: true,
          comment: true,
        },
      }),
    ])

    return { success: true, data: { total, page, pageSize, items } }
  } catch (error) {
    console.error('getTutorRatings error:', error)
    return { success: false, error: 'Une erreur est survenue' }
  }
}

export async function getAdminRatings(params: { tutorId?: string; courseId?: string; studentId?: string; from?: string; to?: string; page?: number; pageSize?: number; includeHidden?: boolean }) {
  const supabase = await createClient()
  const { data: { user } } = await supabase.auth.getUser()
  if (!user) return { success: false, error: 'Non autorisé' }

  const admin = await prisma.user.findUnique({ where: { id: user.id }, select: { role: true } })
  if (!admin || admin.role !== 'admin') return { success: false, error: 'Accès administrateur requis' }

  const page = params.page && params.page > 0 ? params.page : 1
  const pageSize = params.pageSize && params.pageSize > 0 ? params.pageSize : 20
  const skip = (page - 1) * pageSize

  try {
    const where: any = {}
    if (params.tutorId) where.tutorId = params.tutorId
    if (params.courseId) where.courseId = params.courseId
    if (params.studentId) where.studentId = params.studentId
    if (!params.includeHidden) where.hidden = false
    if (params.from || params.to) {
      where.createdAt = {}
      if (params.from) where.createdAt.gte = new Date(params.from)
      if (params.to) where.createdAt.lte = new Date(params.to)
    }

    const [total, items] = await Promise.all([
      prisma.tutorRating.count({ where }),
      prisma.tutorRating.findMany({
        where,
        orderBy: { createdAt: 'desc' },
        skip,
        take: pageSize,
        include: {
          student: { select: { id: true, firstName: true, lastName: true, email: true } },
          tutor: { select: { id: true, displayName: true } },
          course: { select: { id: true, titleFr: true, slug: true } },
        },
      }),
    ])

    return { success: true, data: { total, page, pageSize, items } }
  } catch (error) {
    console.error('getAdminRatings error:', error)
    return { success: false, error: 'Une erreur est survenue' }
  }
}

export async function hideRatingAdmin(ratingId: string, hidden: boolean) {
  const supabase = await createClient()
  const { data: { user } } = await supabase.auth.getUser()
  if (!user) return { success: false, error: 'Non autorisé' }

  const admin = await prisma.user.findUnique({ where: { id: user.id }, select: { role: true } })
  if (!admin || admin.role !== 'admin') return { success: false, error: 'Accès administrateur requis' }

  try {
    const updated = await prisma.tutorRating.update({ where: { id: ratingId }, data: { hidden } })
    revalidatePath('/admin', 'layout')
    revalidatePath('/tuteur', 'layout')
    return { success: true, data: updated }
  } catch (error) {
    console.error('hideRatingAdmin error:', error)
    return { success: false, error: 'Une erreur est survenue' }
  }
}


