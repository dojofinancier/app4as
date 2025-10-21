'use client'

import { useState, useEffect } from 'react'
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card'
import { Button } from '@/components/ui/button'
import { Badge } from '@/components/ui/badge'
import { formatCurrency, formatDate } from '@/lib/utils'
import { 
  BookOpen, 
  Users, 
  Tag, 
  Calendar, 
  ShoppingCart, 
  Webhook, 
  Plus,
  Edit,
  Trash2,
  DollarSign,
  TrendingUp,
  UserCheck
} from 'lucide-react'
import { TutorManagement } from '@/components/admin/tutor-management'
import { StudentManagement } from '@/components/admin/student-management'
import { RecurringSessionsManagement } from '@/components/admin/recurring-sessions-management'
import type { User } from '@prisma/client'

interface AdminDashboardProps {
  user: User
}

interface Course {
  id: string
  slug: string
  titleFr: string
  descriptionFr: string
  active: boolean
  createdAt: Date
}

interface Tutor {
  id: string
  displayName: string
  bioFr: string
  hourlyBaseRateCad: number
  priority: number
  active: boolean
  user: {
    firstName: string
    lastName: string
    email: string
  }
}

interface Coupon {
  id: string
  code: string
  type: 'percent' | 'fixed'
  value: number
  active: boolean
  redemptionCount: number
  maxRedemptions: number | null
}

interface Appointment {
  id: string
  startDatetime: Date
  endDatetime: Date
  status: string
  course: { titleFr: string }
  user: { firstName: string; lastName: string }
  tutor: { displayName: string }
}

interface Order {
  id: string
  totalCad: number
  status: string
  createdAt: Date
  user: { firstName: string; lastName: string }
}

export function AdminDashboard({ user }: AdminDashboardProps) {
  const [activeTab, setActiveTab] = useState<'overview' | 'courses' | 'tutors' | 'students' | 'coupons' | 'appointments' | 'orders' | 'recurring'>('overview')
  const [courses, setCourses] = useState<Course[]>([])
  const [tutors, setTutors] = useState<Tutor[]>([])
  const [coupons, setCoupons] = useState<Coupon[]>([])
  const [appointments, setAppointments] = useState<Appointment[]>([])
  const [orders, setOrders] = useState<Order[]>([])
  const [loading, setLoading] = useState(true)

  useEffect(() => {
    fetchAdminData()
  }, [])

  const fetchAdminData = async () => {
    try {
      // TODO: Replace with actual API calls
      // Mock data for now
      const mockCourses: Course[] = [
        {
          id: '1',
          slug: 'mathematiques-secondaire',
          titleFr: 'Mathématiques - Secondaire',
          descriptionFr: 'Cours de mathématiques pour étudiants du secondaire.',
          active: true,
          createdAt: new Date()
        },
        {
          id: '2',
          slug: 'francais-secondaire',
          titleFr: 'Français - Secondaire',
          descriptionFr: 'Cours de français langue maternelle.',
          active: true,
          createdAt: new Date()
        },
        {
          id: '3',
          slug: 'sciences-secondaire',
          titleFr: 'Sciences - Secondaire',
          descriptionFr: 'Cours de sciences: biologie, chimie et physique.',
          active: true,
          createdAt: new Date()
        }
      ]

      const mockTutors: Tutor[] = [
        {
          id: '1',
          displayName: 'Marie Dubois',
          bioFr: 'Tutrice expérimentée en mathématiques.',
          hourlyBaseRateCad: 75,
          priority: 1,
          active: true,
          user: { firstName: 'Marie', lastName: 'Dubois', email: 'marie@example.com' }
        },
        {
          id: '2',
          displayName: 'Jean Tremblay',
          bioFr: 'Professeur de français passionné.',
          hourlyBaseRateCad: 70,
          priority: 2,
          active: true,
          user: { firstName: 'Jean', lastName: 'Tremblay', email: 'jean@example.com' }
        },
        {
          id: '3',
          displayName: 'Sophie Martin',
          bioFr: 'Scientifique de formation.',
          hourlyBaseRateCad: 80,
          priority: 3,
          active: true,
          user: { firstName: 'Sophie', lastName: 'Martin', email: 'sophie@example.com' }
        }
      ]

      const mockCoupons: Coupon[] = [
        {
          id: '1',
          code: 'ETE2024',
          type: 'percent',
          value: 15,
          active: true,
          redemptionCount: 5,
          maxRedemptions: 100
        },
        {
          id: '2',
          code: 'BIENVENUE50',
          type: 'fixed',
          value: 50,
          active: true,
          redemptionCount: 12,
          maxRedemptions: null
        }
      ]

      const mockAppointments: Appointment[] = [
        {
          id: '1',
          startDatetime: new Date('2024-01-15T10:00:00'),
          endDatetime: new Date('2024-01-15T11:00:00'),
          status: 'confirmed',
          course: { titleFr: 'Mathématiques - Secondaire' },
          user: { firstName: 'Emma', lastName: 'Dubois' },
          tutor: { displayName: 'Marie Dubois' }
        },
        {
          id: '2',
          startDatetime: new Date('2024-01-16T14:00:00'),
          endDatetime: new Date('2024-01-16T15:30:00'),
          status: 'confirmed',
          course: { titleFr: 'Français - Secondaire' },
          user: { firstName: 'Lucas', lastName: 'Gagnon' },
          tutor: { displayName: 'Jean Tremblay' }
        }
      ]

      const mockOrders: Order[] = [
        {
          id: '1',
          totalCad: 75,
          status: 'completed',
          createdAt: new Date('2024-01-15T09:00:00'),
          user: { firstName: 'Emma', lastName: 'Dubois' }
        },
        {
          id: '2',
          totalCad: 105,
          status: 'completed',
          createdAt: new Date('2024-01-16T13:00:00'),
          user: { firstName: 'Lucas', lastName: 'Gagnon' }
        }
      ]

      setCourses(mockCourses)
      setTutors(mockTutors)
      setCoupons(mockCoupons)
      setAppointments(mockAppointments)
      setOrders(mockOrders)
    } catch (error) {
      console.error('Error fetching admin data:', error)
    } finally {
      setLoading(false)
    }
  }

  const getTotalRevenue = () => {
    return orders.reduce((sum, order) => sum + order.totalCad, 0)
  }

  const getActiveCoupons = () => {
    return coupons.filter(coupon => coupon.active).length
  }

  if (loading) {
    return (
      <div className="container mx-auto px-4 py-12">
        <div className="flex items-center justify-center py-12">
          <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-primary"></div>
        </div>
      </div>
    )
  }

  return (
    <div className="container mx-auto px-4 py-12">
      <div className="mb-8">
        <h1 className="text-4xl font-bold">Administration</h1>
        <p className="mt-2 text-muted-foreground">
          Bienvenue, {user.firstName} {user.lastName}
        </p>
      </div>

      {/* Navigation Tabs */}
      <div className="flex flex-wrap gap-2 mb-8">
        <Button
          variant={activeTab === 'overview' ? 'default' : 'outline'}
          onClick={() => setActiveTab('overview')}
        >
          Vue d'ensemble
        </Button>
        <Button
          variant={activeTab === 'courses' ? 'default' : 'outline'}
          onClick={() => setActiveTab('courses')}
        >
          <BookOpen className="h-4 w-4 mr-2" />
          Cours
        </Button>
        <Button
          variant={activeTab === 'tutors' ? 'default' : 'outline'}
          onClick={() => setActiveTab('tutors')}
        >
          <UserCheck className="h-4 w-4 mr-2" />
          Tuteurs
        </Button>
        <Button
          variant={activeTab === 'students' ? 'default' : 'outline'}
          onClick={() => setActiveTab('students')}
        >
          <Users className="h-4 w-4 mr-2" />
          Étudiants
        </Button>
        <Button
          variant={activeTab === 'coupons' ? 'default' : 'outline'}
          onClick={() => setActiveTab('coupons')}
        >
          <Tag className="h-4 w-4 mr-2" />
          Coupons
        </Button>
        <Button
          variant={activeTab === 'appointments' ? 'default' : 'outline'}
          onClick={() => setActiveTab('appointments')}
        >
          <Calendar className="h-4 w-4 mr-2" />
          Rendez-vous
        </Button>
        <Button
          variant={activeTab === 'orders' ? 'default' : 'outline'}
          onClick={() => setActiveTab('orders')}
        >
          <ShoppingCart className="h-4 w-4 mr-2" />
          Commandes
        </Button>
        <Button
          variant={activeTab === 'recurring' ? 'default' : 'outline'}
          onClick={() => setActiveTab('recurring')}
        >
          <Calendar className="h-4 w-4 mr-2" />
          Sessions récurrentes
        </Button>
      </div>

      {/* Overview Tab */}
      {activeTab === 'overview' && (
        <div className="space-y-6">
          {/* Stats Cards */}
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6">
            <Card>
              <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
                <CardTitle className="text-sm font-medium">Cours actifs</CardTitle>
                <BookOpen className="h-4 w-4 text-muted-foreground" />
              </CardHeader>
              <CardContent>
                <div className="text-2xl font-bold">{courses.filter(c => c.active).length}</div>
                <p className="text-xs text-muted-foreground">
                  sur {courses.length} cours total
                </p>
              </CardContent>
            </Card>

            <Card>
              <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
                <CardTitle className="text-sm font-medium">Tuteurs actifs</CardTitle>
                <Users className="h-4 w-4 text-muted-foreground" />
              </CardHeader>
              <CardContent>
                <div className="text-2xl font-bold">{tutors.filter(t => t.active).length}</div>
                <p className="text-xs text-muted-foreground">
                  sur {tutors.length} tuteurs total
                </p>
              </CardContent>
            </Card>

            <Card>
              <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
                <CardTitle className="text-sm font-medium">Coupons actifs</CardTitle>
                <Tag className="h-4 w-4 text-muted-foreground" />
              </CardHeader>
              <CardContent>
                <div className="text-2xl font-bold">{getActiveCoupons()}</div>
                <p className="text-xs text-muted-foreground">
                  codes promotionnels
                </p>
              </CardContent>
            </Card>

            <Card>
              <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
                <CardTitle className="text-sm font-medium">Revenus totaux</CardTitle>
                <DollarSign className="h-4 w-4 text-muted-foreground" />
              </CardHeader>
              <CardContent>
                <div className="text-2xl font-bold">{formatCurrency(getTotalRevenue())}</div>
                <p className="text-xs text-muted-foreground">
                  {orders.length} commandes
                </p>
              </CardContent>
            </Card>
          </div>

          {/* Recent Activity */}
          <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
            <Card>
              <CardHeader>
                <CardTitle>Rendez-vous récents</CardTitle>
              </CardHeader>
              <CardContent>
                <div className="space-y-4">
                  {appointments.slice(0, 3).map((appointment) => (
                    <div key={appointment.id} className="flex items-center justify-between">
                      <div>
                        <p className="font-medium">{appointment.course.titleFr}</p>
                        <p className="text-sm text-muted-foreground">
                          {appointment.user.firstName} {appointment.user.lastName} avec {appointment.tutor.displayName}
                        </p>
                      </div>
                      <Badge variant="secondary">{appointment.status}</Badge>
                    </div>
                  ))}
                </div>
              </CardContent>
            </Card>

            <Card>
              <CardHeader>
                <CardTitle>Commandes récentes</CardTitle>
              </CardHeader>
              <CardContent>
                <div className="space-y-4">
                  {orders.slice(0, 3).map((order) => (
                    <div key={order.id} className="flex items-center justify-between">
                      <div>
                        <p className="font-medium">{formatCurrency(order.totalCad)}</p>
                        <p className="text-sm text-muted-foreground">
                          {order.user.firstName} {order.user.lastName}
                        </p>
                      </div>
                      <Badge variant="secondary">{order.status}</Badge>
                    </div>
                  ))}
                </div>
              </CardContent>
            </Card>
          </div>
        </div>
      )}

      {/* Courses Tab */}
      {activeTab === 'courses' && (
        <Card>
          <CardHeader>
            <div className="flex items-center justify-between">
              <CardTitle>Gestion des cours</CardTitle>
              <Button>
                <Plus className="h-4 w-4 mr-2" />
                Nouveau cours
              </Button>
            </div>
          </CardHeader>
          <CardContent>
            <div className="space-y-4">
              {courses.map((course) => (
                <div key={course.id} className="flex items-center justify-between p-4 border rounded-lg">
                  <div>
                    <p className="font-medium">{course.titleFr}</p>
                    <p className="text-sm text-muted-foreground">{course.descriptionFr}</p>
                    <p className="text-xs text-muted-foreground">Slug: {course.slug}</p>
                  </div>
                  <div className="flex items-center space-x-2">
                    <Badge variant={course.active ? "default" : "secondary"}>
                      {course.active ? "Actif" : "Inactif"}
                    </Badge>
                    <Button variant="outline" size="sm">
                      <Edit className="h-4 w-4" />
                    </Button>
                    <Button variant="outline" size="sm">
                      <Trash2 className="h-4 w-4" />
                    </Button>
                  </div>
                </div>
              ))}
            </div>
          </CardContent>
        </Card>
      )}

      {/* Tutors Tab */}
      {activeTab === 'tutors' && (
        <TutorManagement />
      )}

      {/* Students Tab */}
      {activeTab === 'students' && (
        <StudentManagement />
      )}

      {/* Coupons Tab */}
      {activeTab === 'coupons' && (
        <Card>
          <CardHeader>
            <div className="flex items-center justify-between">
              <CardTitle>Gestion des coupons</CardTitle>
              <Button>
                <Plus className="h-4 w-4 mr-2" />
                Nouveau coupon
              </Button>
            </div>
          </CardHeader>
          <CardContent>
            <div className="space-y-4">
              {coupons.map((coupon) => (
                <div key={coupon.id} className="flex items-center justify-between p-4 border rounded-lg">
                  <div>
                    <p className="font-medium">{coupon.code}</p>
                    <p className="text-sm text-muted-foreground">
                      {coupon.type === 'percent' ? `${coupon.value}% de réduction` : `${formatCurrency(coupon.value)} de réduction`}
                    </p>
                    <p className="text-xs text-muted-foreground">
                      {coupon.redemptionCount} utilisations
                      {coupon.maxRedemptions && ` / ${coupon.maxRedemptions} max`}
                    </p>
                  </div>
                  <div className="flex items-center space-x-2">
                    <Badge variant={coupon.active ? "default" : "secondary"}>
                      {coupon.active ? "Actif" : "Inactif"}
                    </Badge>
                    <Button variant="outline" size="sm">
                      <Edit className="h-4 w-4" />
                    </Button>
                    <Button variant="outline" size="sm">
                      <Trash2 className="h-4 w-4" />
                    </Button>
                  </div>
                </div>
              ))}
            </div>
          </CardContent>
        </Card>
      )}

      {/* Appointments Tab */}
      {activeTab === 'appointments' && (
        <Card>
          <CardHeader>
            <CardTitle>Tous les rendez-vous</CardTitle>
          </CardHeader>
          <CardContent>
            <div className="space-y-4">
              {appointments.map((appointment) => (
                <div key={appointment.id} className="flex items-center justify-between p-4 border rounded-lg">
                  <div>
                    <p className="font-medium">{appointment.course.titleFr}</p>
                    <p className="text-sm text-muted-foreground">
                      {appointment.user.firstName} {appointment.user.lastName} avec {appointment.tutor.displayName}
                    </p>
                    <p className="text-sm text-muted-foreground">
                      {formatDate(appointment.startDatetime)} • {appointment.startDatetime.toLocaleTimeString('fr-CA', { hour: '2-digit', minute: '2-digit' })} - {appointment.endDatetime.toLocaleTimeString('fr-CA', { hour: '2-digit', minute: '2-digit' })}
                    </p>
                  </div>
                  <div className="flex items-center space-x-2">
                    <Badge variant="secondary">{appointment.status}</Badge>
                    <Button variant="outline" size="sm">Détails</Button>
                  </div>
                </div>
              ))}
            </div>
          </CardContent>
        </Card>
      )}

      {/* Orders Tab */}
      {activeTab === 'orders' && (
        <Card>
          <CardHeader>
            <CardTitle>Toutes les commandes</CardTitle>
          </CardHeader>
          <CardContent>
            <div className="space-y-4">
              {orders.map((order) => (
                <div key={order.id} className="flex items-center justify-between p-4 border rounded-lg">
                  <div>
                    <p className="font-medium">{formatCurrency(order.totalCad)}</p>
                    <p className="text-sm text-muted-foreground">
                      {order.user.firstName} {order.user.lastName}
                    </p>
                    <p className="text-sm text-muted-foreground">
                      {formatDate(order.createdAt)}
                    </p>
                  </div>
                  <div className="flex items-center space-x-2">
                    <Badge variant="secondary">{order.status}</Badge>
                    <Button variant="outline" size="sm">Détails</Button>
                  </div>
                </div>
              ))}
            </div>
          </CardContent>
        </Card>
      )}

      {/* Recurring Sessions Tab */}
      {activeTab === 'recurring' && (
        <RecurringSessionsManagement />
      )}
    </div>
  )
}

