'use client'

import { useState, useEffect } from 'react'
import { useStripe, useElements, CardElement } from '@stripe/react-stripe-js'
import { Button } from '@/components/ui/button'
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card'
import { Input } from '@/components/ui/input'
import { Label } from '@/components/ui/label'
import { getPaymentMethod } from '@/lib/actions/payment-methods'
import { CreditCard, Plus, AlertCircle } from 'lucide-react'

interface CheckoutWithSavedMethodsProps {
  tutor: any
  slot: any
  duration: number
  totalPrice: number
  userInfo?: any
  isLoggedIn: boolean
  courseSlug: string
  sessionId: string | null
  onSuccess: (paymentIntentId: string) => void
  onError: (error: string) => void
}

export function CheckoutWithSavedMethods({
  tutor,
  slot,
  duration,
  totalPrice,
  userInfo,
  isLoggedIn,
  courseSlug,
  sessionId,
  onSuccess,
  onError
}: CheckoutWithSavedMethodsProps) {
  const stripe = useStripe()
  const elements = useElements()
  
  const [loading, setLoading] = useState(false)
  const [savedPaymentMethod, setSavedPaymentMethod] = useState<any>(null)
  const [useSavedMethod, setUseSavedMethod] = useState(true)
  const [loadingPaymentMethod, setLoadingPaymentMethod] = useState(true)

  useEffect(() => {
    if (isLoggedIn) {
      const fetchSavedPaymentMethod = async () => {
        try {
          const result = await getPaymentMethod()
          if (result.success) {
            setSavedPaymentMethod(result.paymentMethod)
            setUseSavedMethod(!!result.paymentMethod)
          }
        } catch (error) {
          console.error('Error fetching payment method:', error)
        } finally {
          setLoadingPaymentMethod(false)
        }
      }
      fetchSavedPaymentMethod()
    } else {
      setLoadingPaymentMethod(false)
    }
  }, [isLoggedIn])

  const handleSubmit = async (event: React.FormEvent) => {
    event.preventDefault()
    setLoading(true)

    try {
      if (useSavedMethod && savedPaymentMethod && isLoggedIn) {
        // Use saved payment method
        const response = await fetch('/api/create-payment-intent', {
          method: 'POST',
          headers: {
            'Content-Type': 'application/json',
          },
          body: JSON.stringify({
            sessionId: sessionId,
            useSavedPaymentMethod: true,
            paymentMethodId: savedPaymentMethod.id,
          }),
        })

        const { clientSecret, error: apiError } = await response.json()

        if (apiError) {
          onError(apiError)
          return
        }

        // Confirm payment with saved method
        const { error: stripeError, paymentIntent } = await stripe!.confirmCardPayment(clientSecret)

        if (stripeError) {
          // Handle specific payment method errors
          if (stripeError.code === 'card_declined') {
            onError('Votre carte a été refusée. Veuillez vérifier vos informations ou utiliser une autre carte.')
          } else if (stripeError.code === 'expired_card') {
            onError('Votre carte a expiré. Veuillez utiliser une autre carte.')
          } else if (stripeError.code === 'insufficient_funds') {
            onError('Fonds insuffisants. Veuillez vérifier votre solde ou utiliser une autre carte.')
          } else if (stripeError.code === 'processing_error') {
            onError('Erreur de traitement. Veuillez réessayer ou utiliser une autre carte.')
          } else {
            onError(stripeError.message || 'Erreur de paiement. Veuillez réessayer.')
          }
          return
        }

        if (paymentIntent?.status === 'succeeded') {
          onSuccess(paymentIntent.id)
        }
      } else {
        // Use new payment method (existing flow)
        const cardElement = elements?.getElement(CardElement)
        if (!cardElement) {
          onError('Élément de carte non trouvé')
          return
        }

        const response = await fetch('/api/create-payment-intent', {
          method: 'POST',
          headers: {
            'Content-Type': 'application/json',
          },
          body: JSON.stringify({
            sessionId: sessionId,
            useSavedPaymentMethod: false,
            savePaymentMethod: false
          }),
        })

        const { clientSecret, error: apiError } = await response.json()

        if (apiError) {
          onError(apiError)
          return
        }

        // Confirm payment with new card
        const { error: stripeError, paymentIntent } = await stripe!.confirmCardPayment(clientSecret, {
          payment_method: {
            card: cardElement,
            billing_details: {
              name: isLoggedIn ? `${userInfo?.firstName} ${userInfo?.lastName}` : 'Guest User',
              email: isLoggedIn ? userInfo?.email : 'guest@temp.com',
            },
          },
        })

        if (stripeError) {
          // Handle specific payment method errors
          if (stripeError.code === 'card_declined') {
            onError('Votre carte a été refusée. Veuillez vérifier vos informations ou utiliser une autre carte.')
          } else if (stripeError.code === 'expired_card') {
            onError('Votre carte a expiré. Veuillez utiliser une autre carte.')
          } else if (stripeError.code === 'insufficient_funds') {
            onError('Fonds insuffisants. Veuillez vérifier votre solde ou utiliser une autre carte.')
          } else if (stripeError.code === 'processing_error') {
            onError('Erreur de traitement. Veuillez réessayer ou utiliser une autre carte.')
          } else {
            onError(stripeError.message || 'Erreur de paiement. Veuillez réessayer.')
          }
          return
        }

        if (paymentIntent?.status === 'succeeded') {
          onSuccess(paymentIntent.id)
        }
      }
    } catch (error) {
      onError('Une erreur inattendue est survenue')
    } finally {
      setLoading(false)
    }
  }

  if (loadingPaymentMethod) {
    return (
      <Card>
        <CardContent className="p-6">
          <div className="text-center text-muted-foreground">
            Chargement des méthodes de paiement...
          </div>
        </CardContent>
      </Card>
    )
  }

  return (
    <Card>
      <CardHeader>
        <CardTitle className="flex items-center gap-2">
          <CreditCard className="h-5 w-5" />
          Paiement
        </CardTitle>
      </CardHeader>
      <CardContent>
        <form onSubmit={handleSubmit} className="space-y-6">
          {/* Saved Payment Method Option */}
          {isLoggedIn && savedPaymentMethod && (
            <div className="space-y-4">
              <div className="flex items-center space-x-2">
                <input
                  type="radio"
                  id="saved-method"
                  name="payment-method"
                  checked={useSavedMethod}
                  onChange={() => setUseSavedMethod(true)}
                  className="h-4 w-4"
                />
                <Label htmlFor="saved-method" className="font-medium">
                  Utiliser ma carte enregistrée
                </Label>
              </div>
              
              {useSavedMethod && (
                <div className="p-4 border rounded-lg bg-gray-50">
                  <div className="flex items-center gap-3">
                    <CreditCard className="h-6 w-6 text-muted-foreground" />
                    <div>
                      <p className="font-medium">
                        •••• •••• •••• {savedPaymentMethod.card.last4}
                      </p>
                      <p className="text-sm text-muted-foreground">
                        {savedPaymentMethod.card.brand.toUpperCase()} • Expire {savedPaymentMethod.card.exp_month}/{savedPaymentMethod.card.exp_year}
                      </p>
                    </div>
                  </div>
                </div>
              )}
            </div>
          )}

          {/* New Payment Method Option */}
          <div className="space-y-4">
            <div className="flex items-center space-x-2">
              <input
                type="radio"
                id="new-method"
                name="payment-method"
                checked={!useSavedMethod}
                onChange={() => setUseSavedMethod(false)}
                className="h-4 w-4"
              />
              <Label htmlFor="new-method" className="font-medium">
                {isLoggedIn && savedPaymentMethod ? 'Utiliser une nouvelle carte' : 'Ajouter une carte'}
              </Label>
            </div>
            
            {!useSavedMethod && (
              <div className="space-y-4">
                <div className="p-4 border rounded-lg">
                  <CardElement
                    options={{
                      style: {
                        base: {
                          fontSize: '16px',
                          color: '#424770',
                          '::placeholder': {
                            color: '#aab7c4',
                          },
                        },
                        invalid: {
                          color: '#9e2146',
                        },
                      },
                    }}
                  />
                </div>
                
              </div>
            )}
          </div>

          {/* Submit Button */}
          <Button 
            type="submit" 
            disabled={!stripe || loading} 
            className="w-full"
          >
            {loading ? 'Traitement...' : `Payer ${totalPrice.toFixed(2)} $ CAD`}
          </Button>
        </form>
      </CardContent>
    </Card>
  )
}
