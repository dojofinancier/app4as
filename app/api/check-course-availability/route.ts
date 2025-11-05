import { NextRequest, NextResponse } from 'next/server'
import { prisma } from '@/lib/prisma'
import { rateLimit } from '@/lib/utils/rate-limit'

/**
 * Get CORS headers based on request origin
 */
function getCorsHeaders(origin: string | null): Record<string, string> {
  // Allowed origins from environment or defaults
  const allowedOrigins = process.env.ALLOWED_ORIGINS?.split(',') || [
    'https://carredastutorat.com',
    'http://localhost:5173',
  ]

  // Check if origin is allowed
  const isAllowedOrigin = origin && allowedOrigins.includes(origin)

  return {
    'Access-Control-Allow-Origin': isAllowedOrigin ? origin : allowedOrigins[0],
    'Access-Control-Allow-Methods': 'GET, OPTIONS',
    'Access-Control-Allow-Headers': 'Content-Type',
    'Access-Control-Max-Age': '86400', // 24 hours
  }
}

/**
 * Handle OPTIONS request for CORS preflight
 */
export async function OPTIONS(request: NextRequest) {
  const origin = request.headers.get('origin')
  const headers = getCorsHeaders(origin)

  return new NextResponse(null, {
    status: 204,
    headers,
  })
}

/**
 * Check if a course is available for booking
 * 
 * Query parameters:
 * - courseCode: string (required) - The course code to check
 * 
 * Returns:
 * {
 *   available: boolean,      // true if course exists, is active, and has at least 1 active tutor
 *   slug: string | null,      // course slug if available, null otherwise
 *   tutorsCount: number       // number of active tutors for this course
 * }
 */
export async function GET(request: NextRequest) {
  // Rate limiting: 100 requests per minute per IP (public endpoint)
  const rateLimitResponse = rateLimit(request, 'PUBLIC')
  if (rateLimitResponse) {
    const origin = request.headers.get('origin')
    const corsHeaders = getCorsHeaders(origin)
    return new NextResponse(rateLimitResponse.body, {
      status: 429,
      headers: {
        ...rateLimitResponse.headers,
        ...corsHeaders,
      },
    })
  }

  // Get CORS headers
  const origin = request.headers.get('origin')
  const corsHeaders = getCorsHeaders(origin)

  try {
    const { searchParams } = new URL(request.url)
    const courseCode = searchParams.get('courseCode')

    if (!courseCode) {
      return NextResponse.json(
        { error: 'Missing required parameter: courseCode' },
        {
          status: 400,
          headers: corsHeaders,
        }
      )
    }

    // Find course by code where active = true
    const course = await prisma.course.findFirst({
      where: {
        code: courseCode,
        active: true,
      },
      select: {
        id: true,
        slug: true,
        code: true,
        active: true,
      },
    })

    if (!course) {
      return NextResponse.json(
        {
          available: false,
          slug: null,
          tutorsCount: 0,
        },
        {
          headers: corsHeaders,
        }
      )
    }

    // Count active tutors for this course
    // Join tutor_courses where active = true and tutors.active = true
    const tutorsCount = await prisma.tutorCourse.count({
      where: {
        courseId: course.id,
        active: true,
        tutor: {
          active: true,
        },
      },
    })

    const available = tutorsCount > 0

    return NextResponse.json(
      {
        available,
        slug: available ? course.slug : null,
        tutorsCount,
      },
      {
        headers: corsHeaders,
      }
    )
  } catch (error) {
    console.error('Error checking course availability:', error)
    return NextResponse.json(
      {
        available: false,
        slug: null,
        tutorsCount: 0,
      },
      {
        status: 500,
        headers: corsHeaders,
      }
    )
  }
}

