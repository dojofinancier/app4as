import { redirect } from 'next/navigation'
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card'
import { CheckCircle, Calendar, User, Mail } from 'lucide-react'

interface SuccessPageProps {
  searchParams: {
    session_id?: string
  }
}

export default async function ReservationSuccessPage({ searchParams }: SuccessPageProps) {
  const sessionId = searchParams.session_id

  if (!sessionId) {
    redirect('/')
  }

  // TODO: Verify the session with Stripe and create the user account if needed
  // For now, we'll just show a success message

  return (
    <div className="container mx-auto px-4 py-12">
      <div className="max-w-2xl mx-auto">
        <Card>
          <CardHeader className="text-center">
            <div className="flex justify-center mb-4">
              <CheckCircle className="h-16 w-16 text-green-500" />
            </div>
            <CardTitle className="text-2xl">Réservation confirmée!</CardTitle>
            <p className="text-muted-foreground">
              Votre paiement a été traité avec succès
            </p>
          </CardHeader>
          <CardContent className="space-y-6">
            <div className="text-center">
              <h3 className="font-semibold mb-4">Prochaines étapes</h3>
              <div className="space-y-3 text-sm text-muted-foreground">
                <div className="flex items-center justify-center gap-2">
                  <Mail className="h-4 w-4" />
                  <span>Vous recevrez un email de confirmation sous peu</span>
                </div>
                <div className="flex items-center justify-center gap-2">
                  <Calendar className="h-4 w-4" />
                  <span>Ajoutez le rendez-vous à votre calendrier</span>
                </div>
                <div className="flex items-center justify-center gap-2">
                  <User className="h-4 w-4" />
                  <span>Accédez à votre tableau de bord étudiant</span>
                </div>
              </div>
            </div>

            <div className="bg-blue-50 border border-blue-200 rounded-lg p-4">
              <h4 className="font-medium text-blue-900 mb-2">Informations importantes</h4>
              <ul className="text-sm text-blue-800 space-y-1">
                <li>• Le lien de la session vous sera envoyé par email</li>
                <li>• Vous pouvez annuler jusqu'à 2 heures avant le rendez-vous</li>
                <li>• En cas de problème, contactez-nous par email</li>
              </ul>
            </div>

            <div className="flex flex-col sm:flex-row gap-3">
              <a 
                href="/tableau-de-bord" 
                className="flex-1 bg-primary text-primary-foreground hover:bg-primary/90 px-4 py-2 rounded-md text-center font-medium transition-colors"
              >
                Accéder au tableau de bord
              </a>
              <a 
                href="/cours" 
                className="flex-1 border border-input bg-background hover:bg-accent hover:text-accent-foreground px-4 py-2 rounded-md text-center font-medium transition-colors"
              >
                Réserver un autre cours
              </a>
            </div>
          </CardContent>
        </Card>
      </div>
    </div>
  )
}

