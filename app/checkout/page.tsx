'use client'

import { useState, useEffect } from 'react'
import { useSearchParams, useRouter } from 'next/navigation'
import { loadStripe } from '@stripe/stripe-js'
import { Elements } from '@stripe/react-stripe-js'
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card'
import { formatCurrency } from '@/lib/utils'
import { Clock, User, DollarSign, ArrowLeft, Lock } from 'lucide-react'
import { getCurrentUser } from '@/lib/actions/auth'
import { CheckoutWithSavedMethods } from '@/components/payment/checkout-with-saved-methods'
import { GuestCheckoutForm } from '@/components/payment/guest-checkout-form'
import Link from 'next/link'

// Initialize Stripe
const stripePromise = loadStripe(process.env.NEXT_PUBLIC_STRIPE_PUBLISHABLE_KEY!)

interface TimeSlot {
  start: Date
  end: Date
  available: boolean
  duration: number
}

interface Tutor {
  id: string
  displayName: string
  bioFr: string
  hourlyBaseRateCad: number
}

export default function CheckoutPage() {
  const searchParams = useSearchParams()
  const router = useRouter()
  const [loading, setLoading] = useState(true)
  const [currentUser, setCurrentUser] = useState<any>(null)
  const [sessionId, setSessionId] = useState<string | null>(null)
  const [bookingData, setBookingData] = useState<{
    tutor: Tutor
    slot: TimeSlot
    duration: number
    totalPrice: number
    courseSlug: string
    recurringSession?: {
      id: string
      frequency: string
      totalSessions: number
      startDate: string
      endDate?: string
    }
  } | null>(null)

  useEffect(() => {
    const initializeCheckout = async () => {
      try {
        // Get current user
        const user = await getCurrentUser()
        setCurrentUser(user)

        // Get session ID from URL
        const sessionIdParam = searchParams.get('sessionId')
        if (!sessionIdParam) {
          router.push('/cours')
          return
        }
        setSessionId(sessionIdParam)

        // Get booking session data
        const response = await fetch(`/api/booking-session/get?sessionId=${sessionIdParam}`)
        if (!response.ok) {
          const errorText = await response.text()
          console.error('API Error:', errorText)
          throw new Error('Failed to load booking session')
        }

        const { session } = await response.json()
        console.log('Session data:', session)
        
        // Validate session data
        if (!session || !session.slot) {
          console.error('Invalid session data:', session)
          throw new Error('Invalid session data')
        }
        
        // Mock tutor data for now - in real implementation, this would come from the session
        const mockTutor: Tutor = {
          id: session.tutorId,
          displayName: session.tutorName || 'Tuteur',
          bioFr: 'Tuteur expérimenté',
          hourlyBaseRateCad: session.tutorRate || 50
        }

        const slot: TimeSlot = {
          start: new Date(session.slot.start),
          end: new Date(session.slot.end),
          available: true,
          duration: session.duration
        }

        // Calculate total price
        const multiplier = session.duration === 60 ? 1 : session.duration === 90 ? 1.5 : 2
        const totalPrice = mockTutor.hourlyBaseRateCad * multiplier

        setBookingData({
          tutor: mockTutor,
          slot,
          duration: session.duration,
          totalPrice: session.recurringSession ? 
            (totalPrice * session.recurringSession.totalSessions) : totalPrice,
          courseSlug: session.courseSlug,
          recurringSession: session.recurringSession
        })
      } catch (error) {
        console.error('Error initializing checkout:', error)
        router.push('/cours')
      } finally {
        setLoading(false)
      }
    }

    initializeCheckout()
  }, [searchParams, router])

  if (loading) {
    return (
      <div className="min-h-screen bg-gray-50 flex items-center justify-center">
        <div className="text-center">
          <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-blue-600 mx-auto mb-4"></div>
          <p className="text-gray-600">Chargement...</p>
        </div>
      </div>
    )
  }

  if (!bookingData) {
    return (
      <div className="min-h-screen bg-gray-50 flex items-center justify-center">
        <div className="text-center">
          <p className="text-gray-600 mb-4">Session de réservation introuvable</p>
          <Link href="/cours" className="text-blue-600 hover:underline">
            Retour aux cours
          </Link>
        </div>
      </div>
    )
  }

  const { tutor, slot, duration, totalPrice, courseSlug, recurringSession } = bookingData
  const isLoggedIn = !!currentUser

  return (
    <div className="min-h-screen bg-gray-50">
      <div className="max-w-4xl mx-auto px-4 py-8">
        {/* Header */}
        <div className="mb-8">
          <Link 
            href="/cours" 
            className="inline-flex items-center text-blue-600 hover:text-blue-800 mb-4"
          >
            <ArrowLeft className="h-4 w-4 mr-2" />
            Retour aux cours
          </Link>
          <h1 className="text-3xl font-bold text-gray-900">Finaliser votre réservation</h1>
          <p className="text-gray-600 mt-2">Vérifiez vos informations et procédez au paiement</p>
        </div>

        <div className="grid grid-cols-1 lg:grid-cols-2 gap-8">
          {/* Booking Summary */}
          <div>
            <Card className="mb-6">
              <CardHeader>
                <CardTitle className="flex items-center gap-2">
                  <User className="h-5 w-5" />
                  Résumé de la réservation
                </CardTitle>
              </CardHeader>
              <CardContent className="space-y-4">
                <div className="flex items-center justify-between">
                  <div>
                    <p className="font-medium">Tuteur</p>
                    <p className="text-sm text-muted-foreground">{tutor.displayName}</p>
                  </div>
                </div>

                <div className="flex items-center justify-between">
                  <div>
                    <p className="font-medium">Date et heure</p>
                    <p className="text-sm text-muted-foreground">
                      {new Date(slot.start).toLocaleDateString('fr-CA', {
                        weekday: 'long',
                        year: 'numeric',
                        month: 'long',
                        day: 'numeric'
                      })}
                    </p>
                    <p className="text-sm text-muted-foreground">
                      {new Date(slot.start).toLocaleTimeString('fr-CA', {
                        hour: '2-digit',
                        minute: '2-digit'
                      })} - {new Date(slot.end).toLocaleTimeString('fr-CA', {
                        hour: '2-digit',
                        minute: '2-digit'
                      })}
                    </p>
                  </div>
                  <Clock className="h-5 w-5 text-muted-foreground" />
                </div>

                <div className="flex items-center justify-between">
                  <div>
                    <p className="font-medium">Durée</p>
                    <p className="text-sm text-muted-foreground">{duration} minutes</p>
                  </div>
                </div>

                {/* Recurring Session Info */}
                {recurringSession && (
                  <div className="bg-blue-50 border border-blue-200 rounded-lg p-4 space-y-2">
                    <div className="flex items-center gap-2">
                      <div className="w-2 h-2 bg-blue-500 rounded-full"></div>
                      <p className="font-medium text-blue-900">Sessions récurrentes</p>
                    </div>
                    <div className="text-sm text-blue-800 space-y-1">
                      <p><strong>Fréquence:</strong> {recurringSession.frequency === 'weekly' ? 'Hebdomadaire' : 'Bi-hebdomadaire'}</p>
                      <p><strong>Nombre de sessions:</strong> {recurringSession.totalSessions}</p>
                      <p><strong>Première session:</strong> {new Date(recurringSession.startDate).toLocaleDateString('fr-CA')}</p>
                      {recurringSession.endDate && (
                        <p><strong>Dernière session:</strong> {new Date(recurringSession.endDate).toLocaleDateString('fr-CA')}</p>
                      )}
                    </div>
                  </div>
                )}

                {/* Price */}
                <div className="pt-4 border-t space-y-2">
                  {recurringSession && (
                    <div className="text-sm text-muted-foreground space-y-1">
                      <div className="flex justify-between">
                        <span>Prix par session:</span>
                        <span>{formatCurrency(totalPrice / recurringSession.totalSessions)}</span>
                      </div>
                      <div className="flex justify-between">
                        <span>Nombre de sessions:</span>
                        <span>{recurringSession.totalSessions}</span>
                      </div>
                    </div>
                  )}
                  <div className="flex items-center justify-between">
                    <div className="flex items-center gap-2">
                      <DollarSign className="h-5 w-5 text-muted-foreground" />
                      <span className="font-medium">Total</span>
                    </div>
                    <span className="text-2xl font-bold">{formatCurrency(totalPrice)}</span>
                  </div>
                </div>
              </CardContent>
            </Card>
          </div>

          {/* Payment Form */}
          <div>
            <Card>
              <CardHeader>
                <CardTitle className="flex items-center gap-2">
                  <Lock className="h-5 w-5" />
                  Paiement sécurisé
                </CardTitle>
              </CardHeader>
              <CardContent>
                <Elements stripe={stripePromise}>
                  {isLoggedIn ? (
                    <CheckoutWithSavedMethods
                      tutor={tutor}
                      slot={slot}
                      duration={duration}
                      totalPrice={totalPrice}
                      userInfo={{
                        firstName: currentUser.firstName,
                        lastName: currentUser.lastName,
                        email: currentUser.email,
                        phone: currentUser.phone || '',
                        password: ''
                      }}
                      isLoggedIn={isLoggedIn}
                      courseSlug={courseSlug}
                      sessionId={sessionId}
                      recurringSession={recurringSession}
                      onSuccess={(paymentIntentId) => {
                        router.push(`/paiement/succes?payment_intent=${paymentIntentId}`)
                      }}
                      onError={(error) => {
                        console.error('Payment error:', error)
                      }}
                    />
                  ) : (
                    <GuestCheckoutForm
                      tutor={tutor}
                      slot={slot}
                      duration={duration}
                      totalPrice={totalPrice}
                      courseSlug={courseSlug}
                      sessionId={sessionId}
                      recurringSession={recurringSession}
                      onSuccess={(paymentIntentId) => {
                        router.push(`/paiement/succes?payment_intent=${paymentIntentId}`)
                      }}
                      onError={(error) => {
                        console.error('Payment error:', error)
                      }}
                    />
                  )}
                </Elements>
              </CardContent>
            </Card>
          </div>
        </div>
      </div>
    </div>
  )
}