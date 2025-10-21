import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card'
import { Badge } from '@/components/ui/badge'
import { formatCurrency } from '@/lib/utils'
import { PiggyBank, TrendingUp, Clock } from 'lucide-react'

interface CreditBankCardProps {
  creditBalance: number
  creditTransactions: any[]
}

export function CreditBankCard({ creditBalance, creditTransactions }: CreditBankCardProps) {
  // Calculate recent activity
  const recentTransactions = creditTransactions.slice(0, 3)
  const totalEarned = creditTransactions
    .filter(t => t.type === 'earned')
    .reduce((sum, t) => sum + Number(t.amount), 0)
  const totalUsed = creditTransactions
    .filter(t => t.type === 'used')
    .reduce((sum, t) => sum + Number(t.amount), 0)

  return (
    <Card>
      <CardHeader>
        <CardTitle className="flex items-center gap-2">
          <PiggyBank className="h-5 w-5" />
          Banque d'heures
        </CardTitle>
        <CardDescription>
          Vos crédits de tutorat disponibles
        </CardDescription>
      </CardHeader>
      <CardContent>
        <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
          {/* Current Balance */}
          <div className="text-center">
            <div className="text-3xl font-bold text-primary mb-1">
              {formatCurrency(creditBalance)}
            </div>
            <p className="text-sm text-muted-foreground">Solde actuel</p>
          </div>

          {/* Total Earned */}
          <div className="text-center">
            <div className="text-2xl font-semibold text-green-600 mb-1">
              {formatCurrency(totalEarned)}
            </div>
            <p className="text-sm text-muted-foreground">Total gagné</p>
          </div>

          {/* Total Used */}
          <div className="text-center">
            <div className="text-2xl font-semibold text-blue-600 mb-1">
              {formatCurrency(totalUsed)}
            </div>
            <p className="text-sm text-muted-foreground">Total utilisé</p>
          </div>
        </div>

        {/* Recent Activity */}
        {recentTransactions.length > 0 && (
          <div className="mt-6 pt-6 border-t">
            <h4 className="font-medium mb-3 flex items-center gap-2">
              <Clock className="h-4 w-4" />
              Activité récente
            </h4>
            <div className="space-y-2">
              {recentTransactions.map((transaction) => (
                <div key={transaction.id} className="flex items-center justify-between text-sm">
                  <div className="flex items-center gap-2">
                    <Badge
                      variant={
                        transaction.type === 'earned' 
                          ? 'default' 
                          : transaction.type === 'used' 
                          ? 'secondary' 
                          : 'outline'
                      }
                      className="text-xs"
                    >
                      {transaction.type === 'earned' && 'Crédit'}
                      {transaction.type === 'used' && 'Utilisé'}
                      {transaction.type === 'refunded' && 'Remboursé'}
                    </Badge>
                    {transaction.appointment && (
                      <span className="text-muted-foreground">
                        {transaction.appointment.course.titleFr}
                      </span>
                    )}
                  </div>
                  <span className={`font-medium ${
                    transaction.type === 'earned' 
                      ? 'text-green-600' 
                      : transaction.type === 'used' 
                      ? 'text-blue-600' 
                      : 'text-gray-600'
                  }`}>
                    {transaction.type === 'earned' ? '+' : transaction.type === 'used' ? '-' : ''}
                    {formatCurrency(transaction.amount)}
                  </span>
                </div>
              ))}
            </div>
          </div>
        )}

        {/* Info Box */}
        <div className="mt-6 p-4 bg-blue-50 border border-blue-200 rounded-lg">
          <h4 className="font-medium text-blue-900 mb-2">Comment ça fonctionne ?</h4>
          <ul className="text-sm text-blue-800 space-y-1">
            <li>• Annulez un rendez-vous → crédit ajouté à votre banque d'heures</li>
            <li>• Utilisez vos crédits pour réserver de nouveaux cours</li>
            <li>• Demandez un remboursement si vous préférez</li>
            <li>• Les crédits n'expirent jamais</li>
          </ul>
        </div>
      </CardContent>
    </Card>
  )
}
