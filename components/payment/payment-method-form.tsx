'use client'

import { useState } from 'react'
import { useStripe, useElements, CardElement } from '@stripe/react-stripe-js'
import { Button } from '@/components/ui/button'
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card'
import { createPaymentMethod, updatePaymentMethod, deletePaymentMethod } from '@/lib/actions/payment-methods'
import { CreditCard, Trash2 } from 'lucide-react'

interface PaymentMethodFormProps {
  existingPaymentMethod?: any
  onSuccess: () => void
  onError: (error: string) => void
}

export function PaymentMethodForm({ existingPaymentMethod, onSuccess, onError }: PaymentMethodFormProps) {
  const stripe = useStripe()
  const elements = useElements()
  const [isLoading, setIsLoading] = useState(false)
  const [isDeleting, setIsDeleting] = useState(false)

  const handleSubmit = async (event: React.FormEvent) => {
    event.preventDefault()

    if (!stripe || !elements) {
      onError('Stripe n\'est pas encore chargé')
      return
    }

    const cardElement = elements.getElement(CardElement)
    if (!cardElement) {
      onError('Élément de carte non trouvé')
      return
    }

    setIsLoading(true)

    try {
      // Create payment method
      const { error, paymentMethod } = await stripe.createPaymentMethod({
        type: 'card',
        card: cardElement,
      })

      if (error) {
        onError(error.message || 'Erreur lors de la création de la méthode de paiement')
        return
      }

      // Save to database
      const result = existingPaymentMethod 
        ? await updatePaymentMethod(paymentMethod.id)
        : await createPaymentMethod(paymentMethod.id)

      if (result.success) {
        onSuccess()
      } else {
        onError(result.error || 'Erreur lors de la sauvegarde')
      }
    } catch (error) {
      onError('Une erreur inattendue est survenue')
    } finally {
      setIsLoading(false)
    }
  }

  const handleDelete = async () => {
    if (!confirm('Êtes-vous sûr de vouloir supprimer cette méthode de paiement ?')) {
      return
    }

    setIsDeleting(true)

    try {
      const result = await deletePaymentMethod()
      if (result.success) {
        onSuccess()
      } else {
        onError(result.error || 'Erreur lors de la suppression')
      }
    } catch (error) {
      onError('Une erreur inattendue est survenue')
    } finally {
      setIsDeleting(false)
    }
  }

  const cardElementOptions = {
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
  }

  return (
    <Card>
      <CardHeader>
        <CardTitle className="flex items-center gap-2">
          <CreditCard className="h-5 w-5" />
          {existingPaymentMethod ? 'Modifier la méthode de paiement' : 'Ajouter une méthode de paiement'}
        </CardTitle>
      </CardHeader>
      <CardContent>
        {existingPaymentMethod ? (
          <div className="space-y-4">
            <div className="flex items-center justify-between p-4 border rounded-lg">
              <div className="flex items-center gap-3">
                <CreditCard className="h-8 w-8 text-muted-foreground" />
                <div>
                  <p className="font-medium">
                    •••• •••• •••• {existingPaymentMethod.card.last4}
                  </p>
                  <p className="text-sm text-muted-foreground">
                    {existingPaymentMethod.card.brand.toUpperCase()} • Expire {existingPaymentMethod.card.exp_month}/{existingPaymentMethod.card.exp_year}
                  </p>
                </div>
              </div>
              <Button
                variant="outline"
                size="sm"
                onClick={handleDelete}
                disabled={isDeleting}
              >
                <Trash2 className="h-4 w-4" />
              </Button>
            </div>
            
            <div className="border-t pt-4">
              <h4 className="font-medium mb-3">Nouvelle carte</h4>
              <form onSubmit={handleSubmit} className="space-y-4">
                <div className="p-4 border rounded-lg">
                  <CardElement options={cardElementOptions} />
                </div>
                <Button type="submit" disabled={!stripe || isLoading} className="w-full">
                  {isLoading ? 'Mise à jour...' : 'Mettre à jour la carte'}
                </Button>
              </form>
            </div>
          </div>
        ) : (
          <form onSubmit={handleSubmit} className="space-y-4">
            <div className="p-4 border rounded-lg">
              <CardElement options={cardElementOptions} />
            </div>
            <Button type="submit" disabled={!stripe || isLoading} className="w-full">
              {isLoading ? 'Ajout en cours...' : 'Ajouter la carte'}
            </Button>
          </form>
        )}
      </CardContent>
    </Card>
  )
}
