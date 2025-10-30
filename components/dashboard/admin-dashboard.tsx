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
  UserCheck,
  Clock,
  Activity,
  AlertTriangle,
  CheckCircle,
  XCircle
} from 'lucide-react'
import { TutorManagement } from '@/components/admin/tutor-management'
import { StudentManagement } from '@/components/admin/student-management'
import { CourseManagement } from '@/components/admin/course-management'
import { CourseRequests } from '@/components/admin/course-requests'
import { CouponManagement } from '@/components/admin/coupon-management'
import { AppointmentManagement } from '@/components/admin/appointment-management'
import { OrderManagement } from '@/components/admin/order-management'
import { SupportTicketsManagement } from '@/components/admin/support-tickets-management'
import { RatingsManagement } from '@/components/dashboard/admin/ratings-management'
import { 
  getOrderAnalytics,
  getFinancialAnalytics,
  getOperationalMetrics,
  getPerformanceAnalytics,
  getSystemHealth,
  getSupportTickets,
  getRevenueBreakdown
} from '@/lib/actions/admin'
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

interface OrderAnalytics {
  totalRevenue: number
  totalRefunded: number
  refundRate: number
  averageOrderValue: number
  totalOrders: number
  monthlyData: Array<{
    month: number
    orders: number
    revenue: number
  }>
  topCourses: Array<{
    id: string
    title: string
    count: number
  }>
  topTutors: Array<{
    id: string
    name: string
    appointments: number
  }>
}

interface FinancialAnalytics {
  yearly: {
    revenue: number
    refunds: number
    refundRate: number
    avgOrderValue: number
    grossMargin: number
    grossMarginPercent: number
    tutorPayments: number
    orders: number
  }
  monthly: {
    revenue: number
    refunds: number
    avgOrderValue: number
    grossMargin: number
    tutorPayments: number
    orders: number
  }
  monthlyBreakdown: Array<{
    month: number
    revenue: number
    refunds: number
    tutorPayments: number
    grossMargin: number
    orders: number
  }>
}

interface OperationalMetrics {
  activeCourses: number
  activeTutors: number
  yearlyOrders: number
  monthlyOrders: number
  tutorOutstanding: number
}

interface PerformanceAnalytics {
  topCourses: Array<{
    id: string
    title: string
    count: number
  }>
  topTutors: Array<{
    id: string
    name: string
    appointments: number
  }>
  topStudents: Array<{
    id: string
    name: string
    totalSpent: number
    orderCount: number
  }>
}

interface SystemHealth {
  database: { status: string; message: string }
  stripe: { status: string; message: string }
  errors: { status: string; message: string; rate: number }
  uptime: { status: string; message: string }
}

interface SupportTickets {
  totalCount: number
  recentTickets: Array<{
    id: string
    title: string
    status: string
    priority: string
    createdAt: Date
  }>
}

interface RevenueBreakdown {
  byCourse: {
    yearly: Array<{ title: string; yearly: number; monthly: number }>
    monthly: Array<{ title: string; yearly: number; monthly: number }>
  }
  byTutor: {
    yearly: Array<{ name: string; yearly: number; monthly: number }>
    monthly: Array<{ name: string; yearly: number; monthly: number }>
  }
}

export function AdminDashboard({ user }: AdminDashboardProps) {
  const [activeTab, setActiveTab] = useState<'overview' | 'courses' | 'course-requests' | 'tutors' | 'students' | 'coupons' | 'appointments' | 'orders' | 'tickets'>('overview')
  const [courses, setCourses] = useState<Course[]>([])
  const [tutors, setTutors] = useState<Tutor[]>([])
  const [coupons, setCoupons] = useState<Coupon[]>([])
  const [appointments, setAppointments] = useState<Appointment[]>([])
  const [orders, setOrders] = useState<Order[]>([])
  const [orderAnalytics, setOrderAnalytics] = useState<OrderAnalytics | null>(null)
  const [financialAnalytics, setFinancialAnalytics] = useState<FinancialAnalytics | null>(null)
  const [operationalMetrics, setOperationalMetrics] = useState<OperationalMetrics | null>(null)
  const [performanceAnalytics, setPerformanceAnalytics] = useState<PerformanceAnalytics | null>(null)
  const [systemHealth, setSystemHealth] = useState<SystemHealth | null>(null)
  const [supportTickets, setSupportTickets] = useState<SupportTickets | null>(null)
  const [revenueBreakdown, setRevenueBreakdown] = useState<RevenueBreakdown | null>(null)
  const [loading, setLoading] = useState(true)
  const [showMonthlyModal, setShowMonthlyModal] = useState(false)

  useEffect(() => {
    fetchAdminData()
  }, [])

  const fetchAdminData = async () => {
    try {
      // Fetch all analytics in parallel
      const [
        orderAnalyticsResult,
        financialAnalyticsResult,
        operationalMetricsResult,
        performanceAnalyticsResult,
        systemHealthResult,
        supportTicketsResult,
        revenueBreakdownResult
      ] = await Promise.all([
        getOrderAnalytics(),
        getFinancialAnalytics(),
        getOperationalMetrics(),
        getPerformanceAnalytics(),
        getSystemHealth(),
        getSupportTickets(),
        getRevenueBreakdown()
      ])

      if (orderAnalyticsResult.success && orderAnalyticsResult.data) {
        setOrderAnalytics(orderAnalyticsResult.data)
      }
      if (financialAnalyticsResult.success && financialAnalyticsResult.data) {
        setFinancialAnalytics(financialAnalyticsResult.data)
      }
      if (operationalMetricsResult.success && operationalMetricsResult.data) {
        setOperationalMetrics(operationalMetricsResult.data)
      }
      if (performanceAnalyticsResult.success && performanceAnalyticsResult.data) {
        setPerformanceAnalytics(performanceAnalyticsResult.data)
      }
      if (systemHealthResult.success && systemHealthResult.data) {
        setSystemHealth(systemHealthResult.data)
      }
      if (supportTicketsResult.success && supportTicketsResult.data) {
        setSupportTickets(supportTicketsResult.data)
      }
      if (revenueBreakdownResult.success && revenueBreakdownResult.data) {
        setRevenueBreakdown(revenueBreakdownResult.data)
      }

      // TODO: Replace with actual API calls for other data
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
          variant={activeTab === 'course-requests' ? 'default' : 'outline'}
          onClick={() => setActiveTab('course-requests')}
        >
          <Clock className="h-4 w-4 mr-2" />
          Demandes de cours
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
          variant={activeTab === 'tickets' ? 'default' : 'outline'}
          onClick={() => setActiveTab('tickets')}
        >
          <AlertTriangle className="h-4 w-4 mr-2" />
          Tickets de support
        </Button>
      </div>

      {/* Overview Tab */}
      {activeTab === 'overview' && (
        <div className="space-y-6">
          {/* Financial Overview - Prominent Cards */}
          {financialAnalytics && (
            <div className="space-y-6">
              <h2 className="text-2xl font-bold">Aperçu financier</h2>
              
              {/* Yearly Financial Cards */}
              <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
                <Card className="bg-gradient-to-r from-green-50 to-green-100 border-green-200">
                  <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
                    <CardTitle className="text-sm font-medium">Revenus totaux (Année)</CardTitle>
                    <DollarSign className="h-4 w-4 text-green-600" />
                  </CardHeader>
                  <CardContent>
                    <div className="text-3xl font-bold text-green-700">{formatCurrency(financialAnalytics.yearly.revenue)}</div>
                    <p className="text-xs text-green-600">
                      {financialAnalytics.yearly.orders} commandes
                    </p>
                  </CardContent>
                </Card>

                <Card className="bg-gradient-to-r from-red-50 to-red-100 border-red-200">
                  <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
                    <CardTitle className="text-sm font-medium">Remboursements (Année)</CardTitle>
                    <TrendingUp className="h-4 w-4 text-red-600" />
                  </CardHeader>
                  <CardContent>
                    <div className="text-3xl font-bold text-red-700">{formatCurrency(financialAnalytics.yearly.refunds)}</div>
                    <p className="text-xs text-red-600">
                      {financialAnalytics.yearly.refundRate.toFixed(1)}% du total
                    </p>
                  </CardContent>
                </Card>

                <Card className="bg-gradient-to-r from-blue-50 to-blue-100 border-blue-200">
                  <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
                    <CardTitle className="text-sm font-medium">Marge brute (Année)</CardTitle>
                    <TrendingUp className="h-4 w-4 text-blue-600" />
                  </CardHeader>
                  <CardContent>
                    <div className="text-3xl font-bold text-blue-700">{formatCurrency(financialAnalytics.yearly.grossMargin)}</div>
                    <p className="text-xs text-blue-600">
                      {financialAnalytics.yearly.grossMarginPercent.toFixed(1)}% de marge
                    </p>
                  </CardContent>
                </Card>
              </div>

              {/* Monthly Financial Cards */}
              <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
                <Card>
                  <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
                    <CardTitle className="text-sm font-medium">Valeur moyenne (Mois)</CardTitle>
                    <DollarSign className="h-4 w-4 text-muted-foreground" />
                  </CardHeader>
                  <CardContent>
                    <div className="text-2xl font-bold">{formatCurrency(financialAnalytics.monthly.avgOrderValue)}</div>
                    <p className="text-xs text-muted-foreground">
                      par commande ce mois
                    </p>
                  </CardContent>
                </Card>

                <Card>
                  <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
                    <CardTitle className="text-sm font-medium">Marge brute (Mois)</CardTitle>
                    <TrendingUp className="h-4 w-4 text-muted-foreground" />
                  </CardHeader>
                  <CardContent>
                    <div className="text-2xl font-bold">{formatCurrency(financialAnalytics.monthly.grossMargin)}</div>
                    <p className="text-xs text-muted-foreground">
                      ce mois-ci
                    </p>
                  </CardContent>
                </Card>

                <Card className="cursor-pointer hover:bg-muted/50 transition-colors" onClick={() => setShowMonthlyModal(true)}>
                  <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
                    <CardTitle className="text-sm font-medium">Revenus par mois</CardTitle>
                    <Calendar className="h-4 w-4 text-muted-foreground" />
                  </CardHeader>
                  <CardContent>
                    <div className="text-2xl font-bold">{formatCurrency(financialAnalytics.monthly.revenue)}</div>
                    <p className="text-xs text-muted-foreground">
                      Cliquez pour voir le détail
                    </p>
                  </CardContent>
                </Card>
              </div>
            </div>
          )}

          {/* Operational Metrics */}
          {operationalMetrics && (
            <div className="space-y-6">
              <h2 className="text-2xl font-bold">Métriques opérationnelles</h2>
              
              <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
                <Card>
                  <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
                    <CardTitle className="text-sm font-medium">Cours actifs</CardTitle>
                    <BookOpen className="h-4 w-4 text-muted-foreground" />
                  </CardHeader>
                  <CardContent>
                    <div className="text-2xl font-bold">{operationalMetrics.activeCourses}</div>
                    <p className="text-xs text-muted-foreground">
                      cours disponibles
                    </p>
                  </CardContent>
                </Card>

                <Card>
                  <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
                    <CardTitle className="text-sm font-medium">Tuteurs actifs</CardTitle>
                    <Users className="h-4 w-4 text-muted-foreground" />
                  </CardHeader>
                  <CardContent>
                    <div className="text-2xl font-bold">{operationalMetrics.activeTutors}</div>
                    <p className="text-xs text-muted-foreground">
                      tuteurs disponibles
                    </p>
                  </CardContent>
                </Card>

                <Card>
                  <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
                    <CardTitle className="text-sm font-medium">Commandes (Année)</CardTitle>
                    <ShoppingCart className="h-4 w-4 text-muted-foreground" />
                  </CardHeader>
                  <CardContent>
                    <div className="text-2xl font-bold">{operationalMetrics.yearlyOrders}</div>
                    <p className="text-xs text-muted-foreground">
                      {operationalMetrics.monthlyOrders} ce mois
                    </p>
                  </CardContent>
                </Card>

                <Card>
                  <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
                    <CardTitle className="text-sm font-medium">Paiements tuteurs dus</CardTitle>
                    <DollarSign className="h-4 w-4 text-muted-foreground" />
                  </CardHeader>
                  <CardContent>
                    <div className="text-2xl font-bold">{formatCurrency(operationalMetrics.tutorOutstanding)}</div>
                    <p className="text-xs text-muted-foreground">
                      montant en attente
                    </p>
                  </CardContent>
                </Card>
              </div>
            </div>
          )}

          {/* Performance Analytics */}
          {performanceAnalytics && (
            <div className="space-y-6">
              <h2 className="text-2xl font-bold">Analyses de performance</h2>
              
              <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
                <Card>
                  <CardHeader>
                    <CardTitle className="text-sm font-medium">Top 5 Cours</CardTitle>
                  </CardHeader>
                  <CardContent>
                    <div className="space-y-2">
                      {performanceAnalytics.topCourses.map((course, index) => (
                        <div key={course.id} className="flex justify-between items-center">
                          <span className="text-sm truncate">{course.title}</span>
                          <Badge variant="secondary">{course.count}</Badge>
                        </div>
                      ))}
                    </div>
                  </CardContent>
                </Card>

                <Card>
                  <CardHeader>
                    <CardTitle className="text-sm font-medium">Top 5 Tuteurs</CardTitle>
                  </CardHeader>
                  <CardContent>
                    <div className="space-y-2">
                      {performanceAnalytics.topTutors.map((tutor, index) => (
                        <div key={tutor.id} className="flex justify-between items-center">
                          <span className="text-sm truncate">{tutor.name}</span>
                          <Badge variant="secondary">{tutor.appointments}</Badge>
                        </div>
                      ))}
                    </div>
                  </CardContent>
                </Card>

                <Card>
                  <CardHeader>
                    <CardTitle className="text-sm font-medium">Top 5 Étudiants</CardTitle>
                  </CardHeader>
                  <CardContent>
                    <div className="space-y-2">
                      {performanceAnalytics.topStudents.map((student, index) => (
                        <div key={student.id} className="flex justify-between items-center">
                          <span className="text-sm truncate">{student.name}</span>
                          <Badge variant="secondary">{formatCurrency(student.totalSpent)}</Badge>
                        </div>
                      ))}
                    </div>
                  </CardContent>
                </Card>
              </div>
            </div>
          )}

          {/* System Status */}
          <div className="space-y-6">
            <h2 className="text-2xl font-bold">État du système</h2>
            
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6">
              {/* System Health Indicators */}
              {systemHealth && (
                <>
                  <Card>
                    <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
                      <CardTitle className="text-sm font-medium">Base de données</CardTitle>
                      <div className={`h-2 w-2 rounded-full ${systemHealth.database.status === 'healthy' ? 'bg-green-500' : 'bg-red-500'}`} />
                    </CardHeader>
                    <CardContent>
                      <div className="text-sm font-medium">{systemHealth.database.message}</div>
                    </CardContent>
                  </Card>

                  <Card>
                    <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
                      <CardTitle className="text-sm font-medium">Stripe API</CardTitle>
                      <div className={`h-2 w-2 rounded-full ${systemHealth.stripe.status === 'healthy' ? 'bg-green-500' : 'bg-red-500'}`} />
                    </CardHeader>
                    <CardContent>
                      <div className="text-sm font-medium">{systemHealth.stripe.message}</div>
                    </CardContent>
                  </Card>

                  <Card>
                    <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
                      <CardTitle className="text-sm font-medium">Taux d'erreur</CardTitle>
                      <div className={`h-2 w-2 rounded-full ${systemHealth.errors.status === 'healthy' ? 'bg-green-500' : systemHealth.errors.status === 'warning' ? 'bg-yellow-500' : 'bg-red-500'}`} />
                    </CardHeader>
                    <CardContent>
                      <div className="text-sm font-medium">{systemHealth.errors.message}</div>
                    </CardContent>
                  </Card>

                  <Card>
                    <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
                      <CardTitle className="text-sm font-medium">Activité</CardTitle>
                      <div className={`h-2 w-2 rounded-full ${systemHealth.uptime.status === 'healthy' ? 'bg-green-500' : 'bg-yellow-500'}`} />
                    </CardHeader>
                    <CardContent>
                      <div className="text-sm font-medium">{systemHealth.uptime.message}</div>
                    </CardContent>
                  </Card>
                </>
              )}

              {/* Support Tickets */}
              {supportTickets && (
                <Card>
                  <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
                    <CardTitle className="text-sm font-medium">Tickets de support</CardTitle>
                    <Badge variant="destructive">{supportTickets.totalCount}</Badge>
                  </CardHeader>
                  <CardContent>
                    <div className="text-sm font-medium">Tickets non résolus</div>
                    <p className="text-xs text-muted-foreground">
                      {supportTickets.recentTickets.length} récents
                    </p>
                  </CardContent>
                </Card>
              )}
            </div>
          </div>
        </div>
      )}

      {/* Courses Tab */}
      {activeTab === 'courses' && (
        <CourseManagement />
      )}

      {/* Course Requests Tab */}
      {activeTab === 'course-requests' && (
        <CourseRequests />
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
      {activeTab === 'coupons' && <CouponManagement />}

      {/* Appointments Tab */}
      {activeTab === 'appointments' && <AppointmentManagement />}

      {/* Orders Tab */}
      {activeTab === 'orders' && <OrderManagement />}

      {activeTab === 'tickets' && <SupportTicketsManagement />}

      {activeTab === 'ratings' && (
        <RatingsManagement />
      )}

      {/* Monthly Breakdown Modal */}
      {showMonthlyModal && financialAnalytics && (
        <div className="fixed inset-0 bg-black/50 flex items-center justify-center z-50 p-4">
          <div className="bg-white rounded-lg max-w-4xl w-full max-h-[80vh] overflow-y-auto">
            <div className="p-6">
              <div className="flex justify-between items-center mb-6">
                <h2 className="text-2xl font-bold">Revenus par mois - {new Date().getFullYear()}</h2>
                <Button variant="outline" onClick={() => setShowMonthlyModal(false)}>
                  Fermer
                </Button>
              </div>
              
              <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
                {financialAnalytics.monthlyBreakdown.map((monthData) => {
                  const monthNames = [
                    'Janvier', 'Février', 'Mars', 'Avril', 'Mai', 'Juin',
                    'Juillet', 'Août', 'Septembre', 'Octobre', 'Novembre', 'Décembre'
                  ]
                  
                  return (
                    <Card key={monthData.month} className="p-4">
                      <div className="space-y-2">
                        <h3 className="font-semibold text-lg">{monthNames[monthData.month - 1]}</h3>
                        <div className="space-y-1 text-sm">
                          <div className="flex justify-between">
                            <span>Revenus:</span>
                            <span className="font-medium text-green-600">{formatCurrency(monthData.revenue)}</span>
                          </div>
                          <div className="flex justify-between">
                            <span>Remboursements:</span>
                            <span className="font-medium text-red-600">{formatCurrency(monthData.refunds)}</span>
                          </div>
                          <div className="flex justify-between">
                            <span>Paiements tuteurs:</span>
                            <span className="font-medium text-blue-600">{formatCurrency(monthData.tutorPayments)}</span>
                          </div>
                          <div className="flex justify-between border-t pt-1">
                            <span className="font-semibold">Marge brute:</span>
                            <span className="font-bold text-purple-600">{formatCurrency(monthData.grossMargin)}</span>
                          </div>
                          <div className="flex justify-between">
                            <span>Commandes:</span>
                            <span className="font-medium">{monthData.orders}</span>
                          </div>
                        </div>
                      </div>
                    </Card>
                  )
                })}
              </div>
            </div>
          </div>
        </div>
      )}

    </div>
  )
}

