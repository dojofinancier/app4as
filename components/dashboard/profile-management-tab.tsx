import { ProfileInfoForm } from './profile-info-form'
import { ChangePasswordForm } from './change-password-form'
import type { User } from '@prisma/client'

interface ProfileManagementTabProps {
  user: {
    id: string
    firstName: string
    lastName: string
    email: string
    phone: string | null
    role: string
    stripeCustomerId: string | null
    defaultPaymentMethodId: string | null
    createdAt: Date
  }
}

export function ProfileManagementTab({ user }: ProfileManagementTabProps) {

  return (
    <div className="space-y-8">
      <div>
        <h2 className="text-2xl font-bold mb-2">Gestion du profil</h2>
        <p className="text-muted-foreground">
          Gérez vos informations personnelles et la sécurité de votre compte
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


      <div className="bg-muted border border-border rounded-lg p-4">
        <h3 className="font-medium text-foreground mb-2">Informations de compte</h3>
        <div className="grid grid-cols-1 md:grid-cols-2 gap-4 text-sm text-muted-foreground">
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
