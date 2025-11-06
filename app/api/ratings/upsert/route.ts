import { NextResponse } from 'next/server'
import { upsertRating } from '@/lib/actions/ratings'

export async function POST(req: Request) {
  try {
    const body = await req.json()
    const { tutorId, courseId, q1Courtoisie, q2Maitrise, q3Pedagogie, q4Dynamisme, comment } = body || {}
    if (!tutorId || !courseId) return NextResponse.json({ success: false, error: 'Paramètres requis manquants' }, { status: 400 })
    const res = await upsertRating({ tutorId, courseId, q1Courtoisie, q2Maitrise, q3Pedagogie, q4Dynamisme, comment })
    return NextResponse.json(res, { status: res.success ? 200 : 400 })
  } catch (error) {
    console.error('ratings/upsert error:', error)
    return NextResponse.json({ success: false, error: 'Une erreur est survenue' }, { status: 500 })
  }
}











