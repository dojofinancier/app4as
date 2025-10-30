'use server'

import { createClient } from '@/lib/supabase/server'
import { prisma } from '@/lib/prisma'

/**
 * Check current authentication state and active users
 */
export async function checkAuthState() {
  const supabase = await createClient()
  
  try {
    // Get current user from Supabase
    const { data: { user }, error } = await supabase.auth.getUser()
    
    if (error) {
      return {
        success: false,
        error: error.message,
        currentUser: null,
        userInDatabase: false
      }
    }
    
    if (!user) {
      return {
        success: true,
        currentUser: null,
        userInDatabase: false,
        message: 'No user currently authenticated'
      }
    }
    
    // Check if user exists in our database
    const dbUser = await prisma.user.findUnique({
      where: { id: user.id },
      select: {
        id: true,
        email: true,
        firstName: true,
        lastName: true,
        role: true,
        createdAt: true
      }
    })
    
    return {
      success: true,
      currentUser: {
        id: user.id,
        email: user.email,
        metadata: user.user_metadata,
        lastSignIn: user.last_sign_in_at,
        createdAt: user.created_at
      },
      userInDatabase: !!dbUser,
      dbUser: dbUser,
      message: dbUser ? 'User authenticated and exists in database' : 'User authenticated but NOT in database'
    }
    
  } catch (error) {
    console.error('Error checking auth state:', error)
    return {
      success: false,
      error: 'Failed to check authentication state',
      currentUser: null,
      userInDatabase: false
    }
  }
}

/**
 * Get all users from database (for debugging)
 */
export async function getAllDatabaseUsers() {
  try {
    const users = await prisma.user.findMany({
      select: {
        id: true,
        email: true,
        firstName: true,
        lastName: true,
        role: true,
        createdAt: true
      },
      orderBy: { createdAt: 'desc' }
    })
    
    return {
      success: true,
      users,
      count: users.length
    }
  } catch (error) {
    console.error('Error fetching users:', error)
    return {
      success: false,
      error: 'Failed to fetch users',
      users: [],
      count: 0
    }
  }
}

/**
 * Clear all authentication state (server-side)
 */
export async function clearServerAuthState() {
  const supabase = await createClient()
  
  try {
    // Sign out current user
    await supabase.auth.signOut()
    
    return {
      success: true,
      message: 'Authentication state cleared'
    }
  } catch (error) {
    console.error('Error clearing auth state:', error)
    return {
      success: false,
      error: 'Failed to clear authentication state'
    }
  }
}
