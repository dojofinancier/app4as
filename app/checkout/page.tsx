'use client'

import { useState, useEffect, useRef } from 'react'
import { useRouter } from 'next/navigation'
import { loadStripe } from '@stripe/stripe-js'
import { Elements } from '@stripe/react-stripe-js'
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card'
import { Button } from '@/components/ui/button'
import { formatCurrency } from '@/lib/utils'
import { DollarSign, ArrowLeft, Lock, ShoppingCart } from 'lucide-react'
import { getCurrentUser } from '@/lib/actions/auth'
import { PaymentIntentCheckoutForm } from '@/components/payment/payment-intent-checkout-form'
import Link from 'next/link'

// Initialize Stripe
const stripePromise = loadStripe(process.env.NEXT_PUBLIC_STRIPE_PUBLISHABLE_KEY!)

interface CartItem {
  id: string
  courseId: string
  tutorId: string
  startDatetime: string
  durationMin: number
  unitPriceCad: number
  lineTotalCad: number
  course: {
    titleFr: string
    studentRateCad: number
  }
  tutor: {
    displayName: string
    hourlyBaseRateCad: number
  }
}

interface Cart {
  id: string
  items: CartItem[]
  coupon?: {
    code: string
    type: 'percent' | 'fixed'
    value: number
  }
}

export default function CheckoutPage() {
  const router = useRouter()
  const [loading, setLoading] = useState(true)
  const [currentUser, setCurrentUser] = useState<any>(null)
  const [cart, setCart] = useState<Cart | null>(null)
  const [clientSecret, setClientSecret] = useState<string | null>(null)
  const [paymentIntentId, setPaymentIntentId] = useState<string | null>(null)
  const [error, setError] = useState<string | null>(null)
  const [initializationComplete, setInitializationComplete] = useState(false)
  const paymentIntentCreatedRef = useRef(false)

  // Function to create payment intent when needed
  const createPaymentIntent = async () => {
    if (paymentIntentCreatedRef.current) {
      console.log('Payment intent already created, skipping...')
      return
    }

    try {
      console.log('Creating payment intent...')
      const paymentResponse = await fetch('/api/checkout/create-payment-intent', {
        method: 'POST',
      })

      if (!paymentResponse.ok) {
        throw new Error('Failed to create payment intent')
      }

      const { clientSecret: secret, paymentIntentId: piId } = await paymentResponse.json()
      console.log('Payment intent created successfully:', piId)
      setClientSecret(secret)
      setPaymentIntentId(piId)
      paymentIntentCreatedRef.current = true
    } catch (error) {
      console.error('Error creating payment intent:', error)
      setError('Erreur lors de la création du paiement')
    }
  }


  useEffect(() => {
    const initializeCheckout = async () => {
      try {
        // Get current user (can be null for guests)
        const user = await getCurrentUser()
        setCurrentUser(user)

        // Get cart data (works for both authenticated and guest users)
        const cartResponse = await fetch('/api/cart/get')
        if (!cartResponse.ok) {
          throw new Error('Failed to load cart')
        }

        const { cart: cartData } = await cartResponse.json()
        if (!cartData || cartData.items.length === 0) {
          router.push('/panier')
          return
        }

        setCart(cartData)

        // Always create payment intent (simplified - no credit system)
        await createPaymentIntent()
      } catch (error) {
        console.error('Error initializing checkout:', error)
        router.push('/panier')
      } finally {
        setLoading(false)
        setInitializationComplete(true)
      }
    }

    initializeCheckout()
  }, [router])

  if (loading) {
    return (
      <div className="min-h-screen bg-background flex items-center justify-center">
        <div className="text-center">
          <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-primary mx-auto mb-4"></div>
          <p className="text-muted-foreground">Chargement...</p>
        </div>
      </div>
    )
  }

  // Only check clientSecret requirements after initialization is complete
  const requiresClientSecret = initializationComplete
  
  if (!cart || (requiresClientSecret && !clientSecret)) {
    return (
      <div className="min-h-screen bg-background flex items-center justify-center">
        <div className="text-center">
          <p className="text-muted-foreground mb-4">Panier introuvable</p>
          <Link href="/panier" className="text-primary hover:underline">
            Retour au panier
          </Link>
        </div>
      </div>
    )
  }

  const totalPrice = cart.items.reduce((sum, item) => {
    const lineTotal = typeof item.lineTotalCad === 'number' ? item.lineTotalCad : Number(item.lineTotalCad)
    return sum + lineTotal
  }, 0)
  const discount = cart.coupon ? 
    (cart.coupon.type === 'percent' ? 
      totalPrice * (cart.coupon.value / 100) : 
      cart.coupon.value) : 0
  const finalTotal = totalPrice - discount

  return (
    <div className="min-h-screen bg-background">
      <div className="max-w-4xl mx-auto px-4 py-8">
        {/* Header */}
        <div className="mb-8">
          <Link 
            href="/panier" 
            className="inline-flex items-center text-primary hover:text-primary/80 mb-4"
          >
            <ArrowLeft className="h-4 w-4 mr-2" />
            Retour au panier
          </Link>
          <h1 className="text-3xl font-bold text-foreground">Finaliser votre commande</h1>
          <p className="text-muted-foreground mt-2">Vérifiez vos sessions et procédez au paiement</p>
        </div>

        <div className="grid grid-cols-1 lg:grid-cols-2 gap-8">
          {/* Order Summary */}
          <div>
            <Card className="mb-6">
              <CardHeader>
                <CardTitle className="flex items-center gap-2">
                  <ShoppingCart className="h-5 w-5" />
                  Résumé de la commande ({cart.items.length} sessions)
                </CardTitle>
              </CardHeader>
              <CardContent className="space-y-4">
                {/* Cart Items */}
                <div className="space-y-3">
                  {cart.items.map((item) => (
                    <div key={item.id} className="flex items-center justify-between p-3 border rounded-lg">
                      <div className="flex-1">
                        <div className="font-medium">{item.course.titleFr}</div>
                        <div className="text-sm text-muted-foreground">
                          {item.tutor.displayName}
                        </div>
                        <div className="text-sm text-muted-foreground">
                          {new Date(item.startDatetime).toLocaleDateString('fr-CA', {
                            weekday: 'short',
                            month: 'short',
                            day: 'numeric'
                          })} à {new Date(item.startDatetime).toLocaleTimeString('fr-CA', {
                            hour: '2-digit',
                            minute: '2-digit'
                          })}
                        </div>
                        <div className="text-xs text-muted-foreground">
                          {item.durationMin === 60 ? '1h' : 
                           item.durationMin === 90 ? '1h30' : '2h'}
                        </div>
                      </div>
                      <div className="text-right">
                        <div className="font-medium">
                          {formatCurrency(typeof item.lineTotalCad === 'number' ? item.lineTotalCad : Number(item.lineTotalCad))}
                        </div>
                      </div>
                    </div>
                  ))}
                </div>

                {/* Coupon */}
                {cart.coupon && (
                  <div className="bg-success-light border border-success-border rounded-lg p-3">
                    <div className="flex items-center justify-between">
                      <div className="flex items-center gap-2">
                        <div className="w-2 h-2 bg-success rounded-full"></div>
                        <span className="text-sm font-medium text-success">
                          Rabais: {cart.coupon.code}
                        </span>
                      </div>
                      <span className="text-sm font-medium text-success">
                        -{formatCurrency(discount)}
                      </span>
                    </div>
                  </div>
                )}

                {/* Price Breakdown */}
                <div className="pt-4 border-t space-y-2">
                  <div className="flex justify-between text-sm">
                    <span>Sous-total:</span>
                    <span>{formatCurrency(totalPrice)}</span>
                  </div>
                  {discount > 0 && (
                    <div className="flex justify-between text-sm text-success">
                      <span>Rabais:</span>
                      <span>-{formatCurrency(discount)}</span>
                    </div>
                  )}
                  <div className="flex items-center justify-between pt-2 border-t">
                    <div className="flex items-center gap-2">
                      <DollarSign className="h-5 w-5 text-muted-foreground" />
                      <span className="font-medium">Total</span>
                    </div>
                    <span className="text-2xl font-bold">{formatCurrency(finalTotal)}</span>
                  </div>
                </div>
              </CardContent>
            </Card>
          </div>

          {/* Error Display */}
          {error && (
            <div className="mb-6">
              <Card className="border-error-border bg-error-light">
                <CardContent className="pt-6">
                  <div className="flex items-start gap-3">
                    <div className="flex-shrink-0">
                      <div className="h-5 w-5 rounded-full bg-error/20 flex items-center justify-center">
                        <span className="text-error text-sm">!</span>
                      </div>
                    </div>
                    <div className="flex-1">
                      <p className="text-error text-sm">{error}</p>
                      {error.includes('compte existant') && (
                        <div className="mt-3">
                          <Link href="/connexion">
                            <Button variant="outline" size="sm" className="text-error border-error-border hover:bg-error-light">
                              Se connecter
                            </Button>
                          </Link>
                        </div>
                      )}
                    </div>
                    <button
                      onClick={() => setError(null)}
                      className="flex-shrink-0 text-error hover:text-error/80"
                    >
                      <span className="sr-only">Fermer</span>
                      <svg className="h-4 w-4" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" />
                      </svg>
                    </button>
                  </div>
                </CardContent>
              </Card>
            </div>
          )}


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
                  {clientSecret ? (
                    <Elements 
                      key={paymentIntentId} 
                      stripe={stripePromise} 
                      options={{ clientSecret }}
                    >
                      <PaymentIntentCheckoutForm
                        cart={cart}
                        user={currentUser}
                        clientSecret={clientSecret}
                        onSuccess={(_paymentIntentId) => {
                          router.push('/tableau-de-bord')
                        }}
                        onError={(errorMessage) => {
                          console.error('Payment error:', errorMessage)
                          setError(errorMessage)
                        }}
                      />
                    </Elements>
                  ) : (
                    <div className="text-center py-8">
                      <p className="text-muted-foreground">Chargement du formulaire de paiement...</p>
                    </div>
                  )}
                </CardContent>
              </Card>
          </div>
        </div>
      </div>
    </div>
  )
}