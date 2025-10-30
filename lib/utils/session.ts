import { cookies } from 'next/headers'
import { randomUUID } from 'crypto'

const CART_SESSION_COOKIE = 'cart_session_id'
const CART_SESSION_MAX_AGE_DAYS = 30 // persist guest carts for 30 days

export async function getOrCreateCartSessionId(): Promise<string> {
  const cookieStore = await cookies()
  const existing = cookieStore.get(CART_SESSION_COOKIE)?.value
  if (existing && existing.length > 0) {
    return existing
  }

  const sessionId = randomUUID()
  const maxAge = CART_SESSION_MAX_AGE_DAYS * 24 * 60 * 60

  cookieStore.set(CART_SESSION_COOKIE, sessionId, {
    httpOnly: true,
    sameSite: 'lax',
    secure: process.env.NODE_ENV === 'production',
    path: '/',
    maxAge,
  })

  return sessionId
}

export async function getCartSessionId(): Promise<string | null> {
  const cookieStore = await cookies()
  const existing = cookieStore.get(CART_SESSION_COOKIE)?.value
  return existing || null
}

export async function clearCartSessionId(): Promise<void> {
  const cookieStore = await cookies()
  cookieStore.delete(CART_SESSION_COOKIE)
}


