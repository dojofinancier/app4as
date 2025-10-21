import { NextRequest, NextResponse } from 'next/server'
import { createClient } from '@/lib/supabase/server'
import { prisma } from '@/lib/prisma'
import { sendSignupWebhook } from '@/lib/webhooks/make'

export async function GET(request: NextRequest) {
  const requestUrl = new URL(request.url)
  const code = requestUrl.searchParams.get('code')

  if (code) {
    const supabase = await createClient()
    const { data, error } = await supabase.auth.exchangeCodeForSession(code)

    if (!error && data.user) {
      // Check if user exists in database
      const existingUser = await prisma.user.findUnique({
        where: { id: data.user.id },
      })

      if (!existingUser) {
        // Create user from OAuth data
        const user = await prisma.user.create({
          data: {
            id: data.user.id,
            email: data.user.email!,
            firstName: data.user.user_metadata.given_name || '',
            lastName: data.user.user_metadata.family_name || '',
            role: 'student',
          },
        })

        // Send signup webhook
        await sendSignupWebhook({
          userId: user.id,
          role: user.role,
          email: user.email,
          firstName: user.firstName,
          lastName: user.lastName,
          createdAt: user.createdAt.toISOString(),
        })
      }
    }
  }

  // Redirect to home or dashboard
  return NextResponse.redirect(new URL('/tableau-de-bord', request.url))
}


