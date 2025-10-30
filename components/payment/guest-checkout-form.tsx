'use client'

import { useState } from 'react'
import { useStripe, useElements, CardElement } from '@stripe/react-stripe-js'
import { Button } from '@/components/ui/button'
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card'
import { Input } from '@/components/ui/input'
import { Label } from '@/components/ui/label'
import { CreditCard, User, Mail, MapPin, Lock } from 'lucide-react'

interface GuestCheckoutFormProps {
  tutor: any
  slot: any
  duration: number
  totalPrice: number
  courseSlug: string
  sessionId: string | null
  onSuccess: (paymentIntentId: string) => void
  onError: (error: string) => void
}

export function GuestCheckoutForm({
  tutor,
  slot,
  duration,
  totalPrice,
  courseSlug,
  sessionId,
  onSuccess,
  onError
}: GuestCheckoutFormProps) {
  const stripe = useStripe()
  const elements = useElements()
  
  const [loading, setLoading] = useState(false)
  
  // Form data
  const [formData, setFormData] = useState({
    firstName: '',
    lastName: '',
    email: '',
    phone: '',
    billingAddress: {
      line1: '',
      line2: '',
      city: '',
      state: '',
      postalCode: '',
      country: 'CA'
    }
  })

  const handleInputChange = (field: string, value: string) => {
    if (field.startsWith('billingAddress.')) {
      const addressField = field.split('.')[1]
      setFormData(prev => ({
        ...prev,
        billingAddress: {
          ...prev.billingAddress,
          [addressField]: value
        }
      }))
    } else {
      setFormData(prev => ({
        ...prev,
        [field]: value
      }))
    }
  }

  const handleSubmit = async (event: React.FormEvent) => {
    event.preventDefault()
    
    if (!stripe || !elements || !sessionId) {
      return
    }

    setLoading(true)

    try {
      // Validate required fields
      if (!formData.firstName || !formData.lastName || !formData.email) {
        throw new Error('Veuillez remplir tous les champs obligatoires')
      }

      // Create payment intent
      const response = await fetch('/api/create-payment-intent', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          sessionId: sessionId,
          useSavedPaymentMethod: false,
          billingAddress: formData.billingAddress,
          savePaymentMethod: false,
          // Include user info for account creation
          userInfo: {
            firstName: formData.firstName,
            lastName: formData.lastName,
            email: formData.email,
            phone: formData.phone,
            password: '', // Will be generated in webhook
            confirmPassword: ''
          }
        }),
      })

      if (!response.ok) {
        const errorData = await response.json()
        throw new Error(errorData.error || 'Erreur lors de la création du paiement')
      }

      const { clientSecret } = await response.json()

      // Confirm payment with Stripe
      const { error, paymentIntent } = await stripe.confirmCardPayment(clientSecret, {
        payment_method: {
          card: elements.getElement(CardElement)!,
          billing_details: {
            name: `${formData.firstName} ${formData.lastName}`,
            email: formData.email,
            phone: formData.phone,
            address: {
              line1: formData.billingAddress.line1,
              line2: formData.billingAddress.line2,
              city: formData.billingAddress.city,
              state: formData.billingAddress.state,
              postal_code: formData.billingAddress.postalCode,
              country: formData.billingAddress.country,
            },
          },
        },
      })

      if (error) {
        throw new Error(error.message || 'Erreur lors du paiement')
      }

      if (paymentIntent?.status === 'succeeded') {
        onSuccess(paymentIntent.id)
      } else {
        throw new Error('Le paiement n\'a pas été traité')
      }
    } catch (error: any) {
      console.error('Payment error:', error)
      onError(error.message || 'Une erreur est survenue')
    } finally {
      setLoading(false)
    }
  }

  return (
    <form onSubmit={handleSubmit} className="space-y-6">
      {/* Personal Information */}
      <Card>
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <User className="h-5 w-5" />
            Informations personnelles
          </CardTitle>
        </CardHeader>
        <CardContent className="space-y-4">
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            <div>
              <Label htmlFor="firstName">Prénom *</Label>
              <Input
                id="firstName"
                type="text"
                value={formData.firstName}
                onChange={(e) => handleInputChange('firstName', e.target.value)}
                required
                placeholder="Votre prénom"
              />
            </div>
            <div>
              <Label htmlFor="lastName">Nom *</Label>
              <Input
                id="lastName"
                type="text"
                value={formData.lastName}
                onChange={(e) => handleInputChange('lastName', e.target.value)}
                required
                placeholder="Votre nom"
              />
            </div>
          </div>
          
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            <div>
              <Label htmlFor="email">Courriel *</Label>
              <Input
                id="email"
                type="email"
                value={formData.email}
                onChange={(e) => handleInputChange('email', e.target.value)}
                required
                placeholder="votre@email.com"
              />
            </div>
            <div>
              <Label htmlFor="phone">Téléphone</Label>
              <Input
                id="phone"
                type="tel"
                value={formData.phone}
                onChange={(e) => handleInputChange('phone', e.target.value)}
                placeholder="(555) 123-4567"
              />
            </div>
          </div>
        </CardContent>
      </Card>

      {/* Billing Address */}
      <Card>
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <MapPin className="h-5 w-5" />
            Adresse de facturation
          </CardTitle>
        </CardHeader>
        <CardContent className="space-y-4">
          <div>
            <Label htmlFor="line1">Adresse *</Label>
            <Input
              id="line1"
              type="text"
              value={formData.billingAddress.line1}
              onChange={(e) => handleInputChange('billingAddress.line1', e.target.value)}
              required
              placeholder="123 rue Principale"
            />
          </div>
          
          <div>
            <Label htmlFor="line2">Appartement, suite, etc. (optionnel)</Label>
            <Input
              id="line2"
              type="text"
              value={formData.billingAddress.line2}
              onChange={(e) => handleInputChange('billingAddress.line2', e.target.value)}
              placeholder="Apt 4B"
            />
          </div>
          
          <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
            <div>
              <Label htmlFor="city">Ville *</Label>
              <Input
                id="city"
                type="text"
                value={formData.billingAddress.city}
                onChange={(e) => handleInputChange('billingAddress.city', e.target.value)}
                required
                placeholder="Montréal"
              />
            </div>
            <div>
              <Label htmlFor="state">Province *</Label>
              <Input
                id="state"
                type="text"
                value={formData.billingAddress.state}
                onChange={(e) => handleInputChange('billingAddress.state', e.target.value)}
                required
                placeholder="QC"
              />
            </div>
            <div>
              <Label htmlFor="postalCode">Code postal *</Label>
              <Input
                id="postalCode"
                type="text"
                value={formData.billingAddress.postalCode}
                onChange={(e) => handleInputChange('billingAddress.postalCode', e.target.value)}
                required
                placeholder="H1A 1A1"
              />
            </div>
          </div>
        </CardContent>
      </Card>

      {/* Payment Information */}
      <Card>
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <CreditCard className="h-5 w-5" />
            Informations de paiement
          </CardTitle>
        </CardHeader>
        <CardContent className="space-y-4">
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
                },
              }}
            />
          </div>

        </CardContent>
      </Card>

      {/* Security Notice */}
      <div className="flex items-center gap-2 p-4 bg-green-50 border border-green-200 rounded-lg">
        <Lock className="h-5 w-5 text-green-600" />
        <p className="text-sm text-green-800">
          Vos informations sont sécurisées et cryptées. Nous ne stockons jamais vos informations de carte de crédit.
        </p>
      </div>

      {/* Submit Button */}
      <Button
        type="submit"
        disabled={loading || !stripe}
        className="w-full"
        size="lg"
      >
        {loading ? 'Traitement...' : `Payer ${totalPrice.toFixed(2)} $ CAD`}
      </Button>
    </form>
  )
}


