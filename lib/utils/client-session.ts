'use client'

/**
 * Client-side cart session management
 * This works with browser cookies that are accessible from the client
 */

const CART_SESSION_COOKIE = 'cart_session_id'

export function getCartSessionIdFromClient(): string | null {
  if (typeof window === 'undefined') return null
  
  // Get cookie value from document.cookie
  const cookies = document.cookie.split(';')
  const cartCookie = cookies.find(cookie => 
    cookie.trim().startsWith(`${CART_SESSION_COOKIE}=`)
  )
  
  if (cartCookie) {
    return cartCookie.split('=')[1] || null
  }
  
  return null
}

export function setCartSessionIdOnClient(sessionId: string): void {
  if (typeof window === 'undefined') return
  
  // Set cookie with 30 days expiration
  const maxAge = 30 * 24 * 60 * 60 // 30 days in seconds
  document.cookie = `${CART_SESSION_COOKIE}=${sessionId}; path=/; max-age=${maxAge}; SameSite=Lax`
}

export function clearCartSessionIdFromClient(): void {
  if (typeof window === 'undefined') return
  
  document.cookie = `${CART_SESSION_COOKIE}=; path=/; expires=Thu, 01 Jan 1970 00:00:00 GMT`
}
