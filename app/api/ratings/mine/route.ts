import { NextResponse } from 'next/server'
import { getMyRatingForTutorCourse } from '@/lib/actions/ratings'

export async function GET(req: Request) {
  try {
    const url = new URL(req.url)
    const tutorId = url.searchParams.get('tutorId') || ''
    const courseId = url.searchParams.get('courseId') || ''
    if (!tutorId || !courseId) return NextResponse.json({ success: false, error: 'Paramètres requis manquants' }, { status: 400 })
    const res = await getMyRatingForTutorCourse({ tutorId, courseId })
    return NextResponse.json(res, { status: res.success ? 200 : 400 })
  } catch (error) {
    console.error('ratings/mine error:', error)
    return NextResponse.json({ success: false, error: 'Une erreur est survenue' }, { status: 500 })
  }
}










