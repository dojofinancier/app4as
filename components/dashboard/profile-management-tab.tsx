import { ProfileInfoForm } from './profile-info-form'
import { ChangePasswordForm } from './change-password-form'
import { PaymentMethodDisplay } from '../payment/payment-method-display'
import { PaymentMethodForm } from '../payment/payment-method-form'
import { useState } from 'react'
import type { User } from '@prisma/client'

interface ProfileManagementTabProps {
  user: User
}

export function ProfileManagementTab({ user }: ProfileManagementTabProps) {
  const [showPaymentForm, setShowPaymentForm] = useState(false)

  const handlePaymentSuccess = () => {
    setShowPaymentForm(false)
  }

  const handlePaymentError = (error: string) => {
    console.error('Payment error:', error)
    // You could add a toast notification here
  }

  return (
    <div className="space-y-8">
      <div>
        <h2 className="text-2xl font-bold mb-2">Gestion du profil</h2>
        <p className="text-muted-foreground">
          Gérez vos informations personnelles, la sécurité de votre compte et vos méthodes de paiement
        </p>
      </div>

      <div className="grid gap-8 lg:grid-cols-2">
        <div>
          <ProfileInfoForm user={user} />
        </div>
        
        <div>
          <ChangePasswordForm />
        </div>
      </div>

      <div className="grid gap-8 lg:grid-cols-2">
        <div>
          {showPaymentForm ? (
            <PaymentMethodForm
              onSuccess={handlePaymentSuccess}
              onError={handlePaymentError}
            />
          ) : (
            <PaymentMethodDisplay onEdit={() => setShowPaymentForm(true)} />
          )}
        </div>
        
        <div>
          {/* Placeholder for future features */}
        </div>
      </div>

      <div className="bg-gray-50 border border-gray-200 rounded-lg p-4">
        <h3 className="font-medium text-gray-900 mb-2">Informations de compte</h3>
        <div className="grid grid-cols-1 md:grid-cols-2 gap-4 text-sm text-gray-600">
          <div>
            <span className="font-medium">Membre depuis :</span>
            <br />
            {new Date(user.createdAt).toLocaleDateString('fr-CA', {
              year: 'numeric',
              month: 'long',
              day: 'numeric'
            })}
          </div>
          <div>
            <span className="font-medium">Rôle :</span>
            <br />
            {user.role === 'student' ? 'Étudiant' : 
             user.role === 'tutor' ? 'Tuteur' : 
             user.role === 'admin' ? 'Administrateur' : user.role}
          </div>
        </div>
      </div>
    </div>
  )
}
