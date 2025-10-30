'use server'

import { prisma } from '@/lib/prisma'
import { createClient } from '@/lib/supabase/server'

/**
 * Test function to verify admin tutor creation works
 * This will help us debug the service role key issue
 */
export async function testAdminTutorCreation() {
  const supabase = await createClient()
  const { data: { user: currentUser } } = await supabase.auth.getUser()

  if (!currentUser) {
    return { success: false, error: 'Non autorisé' }
  }

  // Check if current user is admin
  const adminUser = await prisma.user.findUnique({
    where: { id: currentUser.id },
    select: { role: true }
  })

  if (!adminUser || adminUser.role !== 'admin') {
    return { success: false, error: 'Accès administrateur requis' }
  }

  // Test data
  const testData = {
    email: 'test-tutor@example.com',
    password: 'TestPassword123!',
    firstName: 'Test',
    lastName: 'Tutor',
    displayName: 'Test Tutor',
    bioFr: 'Tuteur de test',
    hourlyBaseRateCad: 30.00,
    priority: 80,
    availabilityRules: [
      { weekday: 1, startTime: '09:00', endTime: '17:00' },
      { weekday: 2, startTime: '09:00', endTime: '17:00' }
    ],
    courseIds: []
  }

  try {
    // Check if service role key is available
    const serviceRoleKey = process.env.SUPABASE_SERVICE_ROLE_KEY
    if (!serviceRoleKey) {
      return { 
        success: false, 
        error: 'SUPABASE_SERVICE_ROLE_KEY not found in environment variables. Please check your .env.local file.' 
      }
    }

    // Test admin client creation
    const { createClient: createSupabaseClient } = await import('@supabase/supabase-js')
    const adminClient = createSupabaseClient(
      process.env.NEXT_PUBLIC_SUPABASE_URL!,
      serviceRoleKey,
      {
        auth: {
          autoRefreshToken: false,
          persistSession: false
        }
      }
    )

    // Test admin API call
    const { data: authData, error: authError } = await adminClient.auth.admin.createUser({
      email: testData.email,
      password: testData.password,
      email_confirm: true,
      user_metadata: {
        first_name: testData.firstName,
        last_name: testData.lastName,
        role: 'tutor'
      }
    })

    if (authError) {
      return { 
        success: false, 
        error: `Supabase Auth error: ${authError.message}`,
        details: authError
      }
    }

    if (!authData.user) {
      return { success: false, error: 'No user returned from Supabase Auth' }
    }

    // Clean up test user
    await adminClient.auth.admin.deleteUser(authData.user.id)

    return { 
      success: true, 
      message: 'Admin API test successful! Service role key is working.',
      userId: authData.user.id
    }

  } catch (error) {
    console.error('Test error:', error)
    return { 
      success: false, 
      error: 'Test failed', 
      details: error instanceof Error ? error.message : 'Unknown error'
    }
  }
}
