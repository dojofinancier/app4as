'use client'

import { createClient } from '@/lib/supabase/client'

/**
 * Clear all authentication state from Supabase
 * Useful for testing guest flows
 */
export async function clearAllAuthState() {
  const supabase = createClient()
  
  try {
    // Sign out from Supabase
    await supabase.auth.signOut()
    
    // Clear any local storage items related to auth
    if (typeof window !== 'undefined') {
      // Clear Supabase auth tokens
      localStorage.removeItem('sb-' + process.env.NEXT_PUBLIC_SUPABASE_URL?.split('//')[1]?.split('.')[0] + '-auth-token')
      
      // Clear any other auth-related items
      const keysToRemove = []
      for (let i = 0; i < localStorage.length; i++) {
        const key = localStorage.key(i)
        if (key && (key.includes('supabase') || key.includes('auth'))) {
          keysToRemove.push(key)
        }
      }
      
      keysToRemove.forEach(key => localStorage.removeItem(key))
      
      // Clear session storage as well
      sessionStorage.clear()
      
      console.log('✅ All authentication state cleared')
    }
  } catch (error) {
    console.error('Error clearing auth state:', error)
  }
}

/**
 * Clear cart session data (for testing guest flow)
 */
export function clearCartSession() {
  if (typeof window !== 'undefined') {
    // Clear cart session ID
    localStorage.removeItem('cart-session-id')
    sessionStorage.removeItem('cart-session-id')
    
    console.log('✅ Cart session cleared')
  }
}

/**
 * Clear all app state (auth + cart)
 */
export async function clearAllAppState() {
  await clearAllAuthState()
  clearCartSession()
  
  if (typeof window !== 'undefined') {
    // Reload the page to ensure clean state
    window.location.reload()
  }
}
