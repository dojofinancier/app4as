import { NextResponse } from 'next/server'
import { getAdminRatings, hideRatingAdmin } from '@/lib/actions/ratings'

export async function GET(req: Request) {
  try {
    const url = new URL(req.url)
    const tutorId = url.searchParams.get('tutorId') || undefined
    const courseId = url.searchParams.get('courseId') || undefined
    const studentId = url.searchParams.get('studentId') || undefined
    const from = url.searchParams.get('from') || undefined
    const to = url.searchParams.get('to') || undefined
    const includeHidden = url.searchParams.get('includeHidden') === 'true'
    const page = parseInt(url.searchParams.get('page') || '1', 10)
    const pageSize = parseInt(url.searchParams.get('pageSize') || '20', 10)

    const res = await getAdminRatings({ tutorId, courseId, studentId, from, to, page, pageSize, includeHidden })
    if (!res.success) return NextResponse.json({ error: res.error }, { status: 500 })
    return NextResponse.json(res.data)
  } catch (error) {
    console.error('Admin ratings list API error:', error)
    return NextResponse.json({ error: 'Une erreur est survenue' }, { status: 500 })
  }
}

export async function PATCH(req: Request) {
  try {
    const body = await req.json()
    const { ratingId, hidden } = body || {}
    if (!ratingId || typeof hidden !== 'boolean') return NextResponse.json({ error: 'Paramètres invalides' }, { status: 400 })
    const res = await hideRatingAdmin(ratingId, hidden)
    if (!res.success) return NextResponse.json({ error: res.error }, { status: 500 })
    return NextResponse.json({ ok: true })
  } catch (error) {
    console.error('Admin ratings hide API error:', error)
    return NextResponse.json({ error: 'Une erreur est survenue' }, { status: 500 })
  }
}












