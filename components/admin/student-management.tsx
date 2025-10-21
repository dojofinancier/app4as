'use client'

import { useState, useEffect } from 'react'
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card'
import { Button } from '@/components/ui/button'
import { Badge } from '@/components/ui/badge'
import { Input } from '@/components/ui/input'
import { getAdminUserPaymentMethod } from '@/lib/actions/payment-methods'
import { CreditCard, Search, User, Mail, Phone, Calendar } from 'lucide-react'

interface Student {
  id: string
  firstName: string
  lastName: string
  email: string
  phone?: string
  role: string
  stripeCustomerId?: string
  defaultPaymentMethodId?: string
  createdAt: Date
}

export function StudentManagement() {
  const [students, setStudents] = useState<Student[]>([])
  const [loading, setLoading] = useState(true)
  const [searchTerm, setSearchTerm] = useState('')
  const [selectedStudent, setSelectedStudent] = useState<Student | null>(null)
  const [paymentMethod, setPaymentMethod] = useState<any>(null)
  const [loadingPaymentMethod, setLoadingPaymentMethod] = useState(false)

  useEffect(() => {
    fetchStudents()
  }, [])

  const fetchStudents = async () => {
    try {
      // TODO: Replace with actual API call
      // Mock data for now
      const mockStudents: Student[] = [
        {
          id: '1',
          firstName: 'Jean',
          lastName: 'Dupont',
          email: 'jean.dupont@email.com',
          phone: '+1-514-123-4567',
          role: 'student',
          stripeCustomerId: 'cus_1234567890',
          defaultPaymentMethodId: 'pm_1234567890',
          createdAt: new Date('2024-01-15')
        },
        {
          id: '2',
          firstName: 'Marie',
          lastName: 'Martin',
          email: 'marie.martin@email.com',
          phone: '+1-514-987-6543',
          role: 'student',
          stripeCustomerId: 'cus_0987654321',
          defaultPaymentMethodId: null,
          createdAt: new Date('2024-02-20')
        }
      ]
      setStudents(mockStudents)
    } catch (error) {
      console.error('Error fetching students:', error)
    } finally {
      setLoading(false)
    }
  }

  const handleViewPaymentMethod = async (student: Student) => {
    setSelectedStudent(student)
    setLoadingPaymentMethod(true)
    
    try {
      const result = await getAdminUserPaymentMethod(student.id)
      if (result.success) {
        setPaymentMethod(result.paymentMethod)
      } else {
        console.error('Error fetching payment method:', result.error)
        setPaymentMethod(null)
      }
    } catch (error) {
      console.error('Error fetching payment method:', error)
      setPaymentMethod(null)
    } finally {
      setLoadingPaymentMethod(false)
    }
  }

  const filteredStudents = students.filter(student =>
    student.firstName.toLowerCase().includes(searchTerm.toLowerCase()) ||
    student.lastName.toLowerCase().includes(searchTerm.toLowerCase()) ||
    student.email.toLowerCase().includes(searchTerm.toLowerCase())
  )

  if (loading) {
    return (
      <Card>
        <CardContent className="p-6">
          <div className="text-center text-muted-foreground">
            Chargement des étudiants...
          </div>
        </CardContent>
      </Card>
    )
  }

  return (
    <div className="space-y-6">
      {/* Search */}
      <div className="flex items-center space-x-2">
        <Search className="h-4 w-4 text-muted-foreground" />
        <Input
          placeholder="Rechercher un étudiant..."
          value={searchTerm}
          onChange={(e) => setSearchTerm(e.target.value)}
          className="max-w-sm"
        />
      </div>

      {/* Students List */}
      <div className="grid gap-4">
        {filteredStudents.map((student) => (
          <Card key={student.id}>
            <CardContent className="p-6">
              <div className="flex items-center justify-between">
                <div className="flex items-center space-x-4">
                  <div className="flex items-center space-x-2">
                    <User className="h-5 w-5 text-muted-foreground" />
                    <div>
                      <p className="font-medium">
                        {student.firstName} {student.lastName}
                      </p>
                      <div className="flex items-center space-x-4 text-sm text-muted-foreground">
                        <div className="flex items-center space-x-1">
                          <Mail className="h-3 w-3" />
                          <span>{student.email}</span>
                        </div>
                        {student.phone && (
                          <div className="flex items-center space-x-1">
                            <Phone className="h-3 w-3" />
                            <span>{student.phone}</span>
                          </div>
                        )}
                        <div className="flex items-center space-x-1">
                          <Calendar className="h-3 w-3" />
                          <span>
                            Membre depuis {student.createdAt.toLocaleDateString('fr-CA')}
                          </span>
                        </div>
                      </div>
                    </div>
                  </div>
                </div>
                
                <div className="flex items-center space-x-2">
                  <Badge variant={student.defaultPaymentMethodId ? "default" : "secondary"}>
                    {student.defaultPaymentMethodId ? "Carte enregistrée" : "Aucune carte"}
                  </Badge>
                  <Button
                    variant="outline"
                    size="sm"
                    onClick={() => handleViewPaymentMethod(student)}
                  >
                    <CreditCard className="h-4 w-4 mr-2" />
                    Voir la carte
                  </Button>
                </div>
              </div>
            </CardContent>
          </Card>
        ))}
      </div>

      {/* Payment Method Modal */}
      {selectedStudent && (
        <Card>
          <CardHeader>
            <CardTitle>
              Méthode de paiement - {selectedStudent.firstName} {selectedStudent.lastName}
            </CardTitle>
          </CardHeader>
          <CardContent>
            {loadingPaymentMethod ? (
              <div className="text-center text-muted-foreground">
                Chargement de la méthode de paiement...
              </div>
            ) : paymentMethod ? (
              <div className="space-y-4">
                <div className="flex items-center space-x-3 p-4 border rounded-lg">
                  <CreditCard className="h-8 w-8 text-muted-foreground" />
                  <div>
                    <p className="font-medium">
                      •••• •••• •••• {paymentMethod.card.last4}
                    </p>
                    <p className="text-sm text-muted-foreground">
                      {paymentMethod.card.brand.toUpperCase()} • Expire {paymentMethod.card.exp_month}/{paymentMethod.card.exp_year}
                    </p>
                  </div>
                </div>
                <div className="text-sm text-muted-foreground">
                  <p><strong>ID Stripe:</strong> {paymentMethod.id}</p>
                  <p><strong>Type:</strong> {paymentMethod.type}</p>
                  <p><strong>Client Stripe:</strong> {selectedStudent.stripeCustomerId}</p>
                </div>
              </div>
            ) : (
              <div className="text-center text-muted-foreground">
                Aucune méthode de paiement enregistrée
              </div>
            )}
          </CardContent>
        </Card>
      )}
    </div>
  )
}
