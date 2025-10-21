interface BookingSession {
  id: string
  tutorId: string
  courseSlug: string
  slot: {
    start: string
    end: string
  }
  duration: number
  holdId: string
  userInfo: {
    firstName: string
    lastName: string
    email: string
    phone?: string
    password: string
    confirmPassword: string
  }
  billingAddress: {
    line1: string
    line2?: string
    city: string
    state: string
    postalCode: string
    country: string
  }
  createdAt: Date
  expiresAt: Date
}

class BookingSessionManager {
  private sessions: Map<string, BookingSession> = new Map()
  private cleanupInterval: NodeJS.Timeout | null = null

  constructor() {
    // Start cleanup interval (check every 5 minutes)
    this.cleanupInterval = setInterval(() => {
      this.cleanupExpiredSessions()
    }, 5 * 60 * 1000)
  }

  createSession(data: Omit<BookingSession, 'id' | 'createdAt' | 'expiresAt'>): string {
    const id = `booking_${Date.now()}_${Math.random().toString(36).substr(2, 9)}`
    const now = new Date()
    const expiresAt = new Date(now.getTime() + 15 * 60 * 1000) // 15 minutes

    const session: BookingSession = {
      ...data,
      id,
      createdAt: now,
      expiresAt
    }

    this.sessions.set(id, session)
    return id
  }

  getSession(id: string): BookingSession | null {
    const session = this.sessions.get(id)
    if (!session) return null

    // Check if expired
    if (new Date() > session.expiresAt) {
      this.sessions.delete(id)
      return null
    }

    return session
  }

  updateSession(id: string, updates: Partial<BookingSession>): boolean {
    const session = this.sessions.get(id)
    if (!session) return false

    // Check if expired
    if (new Date() > session.expiresAt) {
      this.sessions.delete(id)
      return false
    }

    // Update session
    Object.assign(session, updates)
    return true
  }

  deleteSession(id: string): boolean {
    return this.sessions.delete(id)
  }

  private cleanupExpiredSessions(): void {
    const now = new Date()
    for (const [id, session] of this.sessions.entries()) {
      if (now > session.expiresAt) {
        this.sessions.delete(id)
      }
    }
  }

  // Get session count for monitoring
  getSessionCount(): number {
    return this.sessions.size
  }

  // Get all active sessions (for debugging)
  getAllSessions(): BookingSession[] {
    const now = new Date()
    return Array.from(this.sessions.values()).filter(session => now <= session.expiresAt)
  }

  // Cleanup on shutdown
  destroy(): void {
    if (this.cleanupInterval) {
      clearInterval(this.cleanupInterval)
      this.cleanupInterval = null
    }
    this.sessions.clear()
  }
}

// Singleton instance
export const bookingSessionManager = new BookingSessionManager()

// Export types
export type { BookingSession }
