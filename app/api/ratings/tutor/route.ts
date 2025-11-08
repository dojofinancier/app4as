import { NextResponse } from 'next/server'
import { getTutorRatingAverages, getTutorRatings } from '@/lib/actions/ratings'
import { createClient } from '@/lib/supabase/server'

export async function GET(req: Request) {
  try {
    const url = new URL(req.url)
    const tutorId = url.searchParams.get('tutorId') || ''
    const courseId = url.searchParams.get('courseId') || undefined
    const from = url.searchParams.get('from') || undefined
    const to = url.searchParams.get('to') || undefined
    const page = parseInt(url.searchParams.get('page') || '1', 10)
    const pageSize = parseInt(url.searchParams.get('pageSize') || '20', 10)

    if (!tutorId) return NextResponse.json({ error: 'Paramètre manquant: tutorId' }, { status: 400 })

    // Ensure the requester is the tutor themself
    const supabase = await createClient()
    const { data: { user } } = await supabase.auth.getUser()
    if (!user) return NextResponse.json({ error: 'Non autorisé' }, { status: 401 })
    if (user.id !== tutorId) return NextResponse.json({ error: 'Accès refusé' }, { status: 403 })

    const [avgRes, listRes] = await Promise.all([
      getTutorRatingAverages({ tutorId, courseId, from, to }),
      getTutorRatings({ tutorId, courseId, from, to, page, pageSize }),
    ])

    if (!avgRes.success) return NextResponse.json({ error: avgRes.error }, { status: 500 })
    if (!listRes.success) return NextResponse.json({ error: listRes.error }, { status: 500 })

    return NextResponse.json({ averages: avgRes.data, list: listRes.data })
  } catch (error) {
    console.error('Tutor ratings API error:', error)
    return NextResponse.json({ error: 'Une erreur est survenue' }, { status: 500 })
  }
}












