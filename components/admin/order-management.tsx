'use client'

import { useState, useEffect, useRef } from 'react'
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import { Label } from '@/components/ui/label'
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select'
import { Dialog, DialogContent, DialogDescription, DialogHeader, DialogTitle, DialogTrigger } from '@/components/ui/dialog'
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card'
import { Badge } from '@/components/ui/badge'
import { Loader2, Eye, Search, Filter, RefreshCw, DollarSign, Calendar, User, BookOpen, Users } from 'lucide-react'
import { formatCurrency, formatDateTime } from '@/lib/utils'
import { getAllOrders, getOrderDetails, refundOrder, getTutorsForAutocomplete, getStudentsForAutocomplete, getCoursesForAutocomplete } from '@/lib/actions/admin'

interface Order {
  id: string
  totalCad: number
  status: string
  createdAt: Date
  stripePaymentIntentId?: string | null
  user: {
    id: string
    firstName: string
    lastName: string
    email: string
  }
  items: Array<{
    id: string
    course: {
      id: string
      titleFr: string
    }
    tutor: {
      id: string
      displayName: string
      user: {
        firstName: string
        lastName: string
      }
    }
    startDatetime: Date
    endDatetime: Date
    unitPriceCad: number
    lineTotalCad: number
    tutorEarningsCad: number
  }>
  refundRequests: Array<{
    id: string
    amount: number
    status: string
    createdAt: Date
  }>
}

interface OrderDetails extends Order {
  subtotalCad: number
  discountCad: number
  currency: string
  stripeCheckoutSessionId?: string | null
  user: {
    id: string
    firstName: string
    lastName: string
    email: string
    phone?: string | null
  }
  items: Array<{
    id: string
    startDatetime: Date
    endDatetime: Date
    durationMin: number
    unitPriceCad: number
    lineTotalCad: number
    tutorEarningsCad: number
    course: {
      id: string
      titleFr: string
      slug: string
    }
    tutor: {
      id: string
      displayName: string
      user: {
        firstName: string
        lastName: string
        email: string
      }
    }
    appointment?: {
      id: string
      status: string
      meetingLink?: string
    }
  }>
  refundRequests: Array<{
    id: string
    amount: number
    reason: string
    status: string
    stripeRefundId?: string
    processedAt?: Date
    createdAt: Date
    processor: {
      firstName: string
      lastName: string
    }
  }>
}

interface Tutor {
  id: string
  displayName: string
  user: {
    firstName: string
    lastName: string
    email: string
  }
}

interface Student {
  id: string
  firstName: string
  lastName: string
  email: string
}

interface Course {
  id: string
  titleFr: string
  slug: string
}

export function OrderManagement() {
  const [orders, setOrders] = useState<Order[]>([])
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState<string | null>(null)
  const [hasMore, setHasMore] = useState(false)
  const [nextCursor, setNextCursor] = useState<string | null>(null)
  const [loadingMore, setLoadingMore] = useState(false)

  // Filters
  const [filters, setFilters] = useState({
    status: 'all',
    startDate: '',
    endDate: '',
    minAmount: '',
    maxAmount: '',
    tutorId: 'all',
    studentId: 'all',
    courseId: 'all',
    search: ''
  })

  // Order details modal
  const [isDetailsModalOpen, setIsDetailsModalOpen] = useState(false)
  const [selectedOrder, setSelectedOrder] = useState<Order | null>(null)
  const [orderDetails, setOrderDetails] = useState<OrderDetails | null>(null)
  const [loadingDetails, setLoadingDetails] = useState(false)

  // Refund modal
  const [isRefundModalOpen, setIsRefundModalOpen] = useState(false)
  const [refundAmount, setRefundAmount] = useState('')
  const [refundReason, setRefundReason] = useState('')
  const [isRefunding, setIsRefunding] = useState(false)
  const [refundError, setRefundError] = useState<string | null>(null)

  // Autocomplete data
  const [tutors, setTutors] = useState<Tutor[]>([])
  const [students, setStudents] = useState<Student[]>([])
  const [courses, setCourses] = useState<Course[]>([])

  // Infinite scroll
  const loadMoreRef = useRef<HTMLDivElement>(null)

  // Load initial data
  useEffect(() => {
    fetchOrders()
    fetchAutocompleteData()
  }, [])

  // Set up infinite scroll
  useEffect(() => {
    const observer = new IntersectionObserver(
      (entries) => {
        if (entries[0].isIntersecting && hasMore && !loadingMore) {
          loadMoreOrders()
        }
      },
      { threshold: 0.1 }
    )

    if (loadMoreRef.current) {
      observer.observe(loadMoreRef.current)
    }

    return () => observer.disconnect()
  }, [hasMore, loadingMore])

  const fetchOrders = async (reset = true) => {
    try {
      setLoading(true)
      if (reset) {
        setOrders([])
        setNextCursor(null)
      }

      const params = {
        status: filters.status === 'all' ? undefined : filters.status as any,
        startDate: filters.startDate || undefined,
        endDate: filters.endDate || undefined,
        minAmount: filters.minAmount ? parseFloat(filters.minAmount) : undefined,
        maxAmount: filters.maxAmount ? parseFloat(filters.maxAmount) : undefined,
        tutorId: filters.tutorId && filters.tutorId !== 'all' ? filters.tutorId : undefined,
        studentId: filters.studentId && filters.studentId !== 'all' ? filters.studentId : undefined,
        courseId: filters.courseId && filters.courseId !== 'all' ? filters.courseId : undefined,
        search: filters.search || undefined,
        cursor: nextCursor || undefined,
        limit: 20
      }

      const result = await getAllOrders(params)

      if (result.success && result.data) {
        const newOrders = result.data.orders.map(order => ({
          ...order,
          totalCad: Number(order.totalCad),
          createdAt: new Date(order.createdAt),
          items: order.items.map(item => ({
            ...item,
            unitPriceCad: Number(item.unitPriceCad),
            lineTotalCad: Number(item.lineTotalCad),
            tutorEarningsCad: Number(item.tutorEarningsCad),
            startDatetime: new Date(item.startDatetime),
            endDatetime: new Date(item.endDatetime)
          })),
          refundRequests: order.refundRequests.map(refund => ({
            ...refund,
            amount: Number(refund.amount),
            status: refund.status || 'pending',
            createdAt: refund.createdAt ? new Date(refund.createdAt) : new Date()
          }))
        }))

        if (reset) {
          setOrders(newOrders)
        } else {
          setOrders(prev => [...prev, ...newOrders])
        }
        setHasMore(result.data.hasMore)
        setNextCursor(result.data.nextCursor || null)
      } else {
        setError(result.error || 'Erreur lors du chargement des commandes')
      }
    } catch (err) {
      setError('Une erreur est survenue')
    } finally {
      setLoading(false)
    }
  }

  const loadMoreOrders = async () => {
    if (loadingMore || !hasMore) return

    try {
      setLoadingMore(true)
      await fetchOrders(false)
    } finally {
      setLoadingMore(false)
    }
  }

  const fetchAutocompleteData = async () => {
    try {
      const [tutorsResult, studentsResult, coursesResult] = await Promise.all([
        getTutorsForAutocomplete(),
        getStudentsForAutocomplete(),
        getCoursesForAutocomplete()
      ])

      if (tutorsResult.success && tutorsResult.data) setTutors(tutorsResult.data)
      if (studentsResult.success && studentsResult.data) setStudents(studentsResult.data)
      if (coursesResult.success && coursesResult.data) setCourses(coursesResult.data)
    } catch (err) {
      console.error('Error fetching autocomplete data:', err)
    }
  }

  const handleFilterChange = (key: string, value: string) => {
    setFilters(prev => ({ ...prev, [key]: value }))
  }

  const applyFilters = () => {
    fetchOrders(true)
  }

  const clearFilters = () => {
    setFilters({
      status: 'all',
      startDate: '',
      endDate: '',
      minAmount: '',
      maxAmount: '',
      tutorId: 'all',
      studentId: 'all',
      courseId: 'all',
      search: ''
    })
  }

  const loadOrderDetails = async (order: Order) => {
    try {
      setLoadingDetails(true)
      const result = await getOrderDetails(order.id)

      if (result.success && result.data) {
        const details = {
          ...result.data,
          totalCad: Number(result.data.totalCad),
          subtotalCad: Number(result.data.subtotalCad),
          discountCad: Number(result.data.discountCad),
          createdAt: new Date(result.data.createdAt),
          items: result.data.items.map(item => ({
            ...item,
            unitPriceCad: Number(item.unitPriceCad),
            lineTotalCad: Number(item.lineTotalCad),
            tutorEarningsCad: Number(item.tutorEarningsCad),
            startDatetime: new Date(item.startDatetime),
            endDatetime: new Date(item.endDatetime),
            appointment: item.appointment ? {
              id: item.appointment.id,
              status: item.appointment.status,
              meetingLink: item.appointment.meetingLink || undefined
            } : undefined
          })),
          refundRequests: result.data.refundRequests.map(refund => ({
            ...refund,
            amount: Number(refund.amount),
            status: refund.status || 'pending',
            createdAt: refund.createdAt ? new Date(refund.createdAt) : new Date(),
            processedAt: refund.processedAt ? new Date(refund.processedAt) : undefined,
            stripeRefundId: refund.stripeRefundId || undefined,
            processor: refund.processor || { firstName: 'Unknown', lastName: 'User' }
          }))
        }
        setOrderDetails(details)
      } else {
        setError(result.error || 'Erreur lors du chargement des détails')
      }
    } catch (err) {
      setError('Une erreur est survenue')
    } finally {
      setLoadingDetails(false)
    }
  }

  const handleViewDetails = (order: Order) => {
    setSelectedOrder(order)
    setIsDetailsModalOpen(true)
    loadOrderDetails(order)
  }

  const handleRefund = async () => {
    if (!selectedOrder || !refundAmount || !refundReason) return

    try {
      setIsRefunding(true)
      setRefundError(null)

      const amount = parseFloat(refundAmount)
      if (amount <= 0 || amount > selectedOrder.totalCad) {
        setRefundError('Montant invalide')
        return
      }

      const result = await refundOrder(selectedOrder.id, amount, refundReason, true)

      if (result.success) {
        setIsRefundModalOpen(false)
        setRefundAmount('')
        setRefundReason('')
        // Refresh the order details
        loadOrderDetails(selectedOrder)
        // Refresh the orders list
        fetchOrders(true)
      } else {
        setRefundError(result.error || 'Erreur lors du remboursement')
      }
    } catch (err) {
      setRefundError('Une erreur est survenue')
    } finally {
      setIsRefunding(false)
    }
  }

  const getStatusBadgeVariant = (status: string) => {
    switch (status) {
      case 'paid': return 'default'
      case 'refunded': return 'destructive'
      case 'partially_refunded': return 'secondary'
      case 'failed': return 'destructive'
      default: return 'outline'
    }
  }

  const getStatusLabel = (status: string) => {
    switch (status) {
      case 'created': return 'Créée'
      case 'paid': return 'Payée'
      case 'failed': return 'Échouée'
      case 'refunded': return 'Remboursée'
      case 'partially_refunded': return 'Partiellement remboursée'
      default: return status
    }
  }

  const getTotalRefunded = (order: Order) => {
    return order.refundRequests.reduce((sum, refund) => sum + refund.amount, 0)
  }

  if (loading) {
    return (
      <div className="flex items-center justify-center p-8">
        <Loader2 className="h-8 w-8 animate-spin" />
        <span className="ml-2">Chargement des commandes...</span>
      </div>
    )
  }

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex justify-between items-center">
        <div>
          <h2 className="text-2xl font-bold">Gestion des commandes</h2>
          <p className="text-muted-foreground">Gérez les commandes et les remboursements</p>
        </div>
        <Button onClick={() => fetchOrders(true)} variant="outline">
          <RefreshCw className="h-4 w-4 mr-2" />
          Actualiser
        </Button>
      </div>

      {/* Filters */}
      <Card>
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <Filter className="h-5 w-5" />
            Filtres
          </CardTitle>
        </CardHeader>
        <CardContent>
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4">
            {/* Status Filter */}
            <div>
              <Label htmlFor="status">Statut</Label>
              <Select value={filters.status} onValueChange={(value) => handleFilterChange('status', value)}>
                <SelectTrigger>
                  <SelectValue placeholder="Tous les statuts" />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="all">Tous</SelectItem>
                  <SelectItem value="created">Créée</SelectItem>
                  <SelectItem value="paid">Payée</SelectItem>
                  <SelectItem value="failed">Échouée</SelectItem>
                  <SelectItem value="refunded">Remboursée</SelectItem>
                  <SelectItem value="partially_refunded">Partiellement remboursée</SelectItem>
                </SelectContent>
              </Select>
            </div>

            {/* Date Range */}
            <div>
              <Label htmlFor="startDate">Date de début</Label>
              <Input
                id="startDate"
                type="date"
                value={filters.startDate}
                onChange={(e) => handleFilterChange('startDate', e.target.value)}
              />
            </div>

            <div>
              <Label htmlFor="endDate">Date de fin</Label>
              <Input
                id="endDate"
                type="date"
                value={filters.endDate}
                onChange={(e) => handleFilterChange('endDate', e.target.value)}
              />
            </div>

            {/* Amount Range */}
            <div>
              <Label htmlFor="minAmount">Montant min ($)</Label>
              <Input
                id="minAmount"
                type="number"
                step="0.01"
                value={filters.minAmount}
                onChange={(e) => handleFilterChange('minAmount', e.target.value)}
              />
            </div>

            <div>
              <Label htmlFor="maxAmount">Montant max ($)</Label>
              <Input
                id="maxAmount"
                type="number"
                step="0.01"
                value={filters.maxAmount}
                onChange={(e) => handleFilterChange('maxAmount', e.target.value)}
              />
            </div>

            {/* Tutor Filter */}
            <div>
              <Label htmlFor="tutor">Tuteur</Label>
              <Select value={filters.tutorId} onValueChange={(value) => handleFilterChange('tutorId', value)}>
                <SelectTrigger>
                  <SelectValue placeholder="Tous les tuteurs" />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="all">Tous les tuteurs</SelectItem>
                  {tutors.map((tutor) => (
                    <SelectItem key={tutor.id} value={tutor.id}>
                      {tutor.user.firstName} {tutor.user.lastName} ({tutor.displayName})
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>

            {/* Student Filter */}
            <div>
              <Label htmlFor="student">Étudiant</Label>
              <Select value={filters.studentId} onValueChange={(value) => handleFilterChange('studentId', value)}>
                <SelectTrigger>
                  <SelectValue placeholder="Tous les étudiants" />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="all">Tous les étudiants</SelectItem>
                  {students.map((student) => (
                    <SelectItem key={student.id} value={student.id}>
                      {student.firstName} {student.lastName} ({student.email})
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>

            {/* Course Filter */}
            <div>
              <Label htmlFor="course">Cours</Label>
              <Select value={filters.courseId} onValueChange={(value) => handleFilterChange('courseId', value)}>
                <SelectTrigger>
                  <SelectValue placeholder="Tous les cours" />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="all">Tous les cours</SelectItem>
                  {courses.map((course) => (
                    <SelectItem key={course.id} value={course.id}>
                      {course.titleFr}
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>
          </div>

          {/* Search */}
          <div className="mt-4">
            <Label htmlFor="search">Recherche</Label>
            <div className="relative">
              <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 text-muted-foreground h-4 w-4" />
              <Input
                id="search"
                placeholder="Rechercher par nom, email, ID de commande..."
                value={filters.search}
                onChange={(e) => handleFilterChange('search', e.target.value)}
                className="pl-10"
              />
            </div>
          </div>

          {/* Filter Actions */}
          <div className="flex gap-2 mt-4">
            <Button onClick={applyFilters}>
              <Filter className="h-4 w-4 mr-2" />
              Appliquer les filtres
            </Button>
            <Button onClick={clearFilters} variant="outline">
              Effacer
            </Button>
          </div>
        </CardContent>
      </Card>

      {/* Error Message */}
      {error && (
        <div className="p-4 bg-error-light border border-error-border rounded-md text-error">
          {error}
        </div>
      )}

      {/* Orders List */}
      <div className="space-y-4">
        {orders.length === 0 ? (
          <Card>
            <CardContent className="p-8 text-center">
              <p className="text-muted-foreground">Aucune commande trouvée</p>
            </CardContent>
          </Card>
        ) : (
          orders.map((order) => {
            const totalRefunded = getTotalRefunded(order)
            return (
              <Card key={order.id}>
                <CardContent className="p-6">
                  <div className="flex justify-between items-start">
                    <div className="space-y-2">
                      <div className="flex items-center gap-2">
                        <h3 className="font-semibold">Commande #{order.id.slice(-8)}</h3>
                        <Badge variant={getStatusBadgeVariant(order.status)}>
                          {getStatusLabel(order.status)}
                        </Badge>
                      </div>
                      <div className="text-sm text-muted-foreground">
                        <p><strong>Étudiant:</strong> {order.user.firstName} {order.user.lastName}</p>
                        <p><strong>Email:</strong> {order.user.email}</p>
                        <p><strong>Date:</strong> {formatDateTime(order.createdAt)}</p>
                        {order.stripePaymentIntentId && (
                          <p><strong>ID Stripe:</strong> {order.stripePaymentIntentId}</p>
                        )}
                      </div>
                    </div>

                    <div className="text-right space-y-2">
                      <div className="text-2xl font-bold">
                        {formatCurrency(order.totalCad)}
                        {order.totalCad === 0 && ' (Gratuit)'}
                      </div>
                      {totalRefunded > 0 && (
                        <div className="text-sm text-error">
                          Remboursé: {formatCurrency(totalRefunded)}
                        </div>
                      )}
                      <div className="text-sm text-muted-foreground">
                        {order.items.length} article{order.items.length > 1 ? 's' : ''}
                      </div>
                    </div>
                  </div>

                  {/* Order Items Summary */}
                  <div className="mt-4 space-y-2">
                    {order.items.map((item) => (
                      <div key={item.id} className="flex justify-between items-center text-sm bg-muted p-2 rounded">
                        <div>
                          <span className="font-medium">{item.course.titleFr}</span>
                          <span className="text-muted-foreground ml-2">
                            avec {item.tutor.user.firstName} {item.tutor.user.lastName}
                          </span>
                        </div>
                        <div className="text-right">
                          <div>{formatCurrency(item.lineTotalCad)}</div>
                          <div className="text-xs text-muted-foreground">
                            {formatDateTime(item.startDatetime)}
                          </div>
                        </div>
                      </div>
                    ))}
                  </div>

                  {/* Actions */}
                  <div className="flex justify-end gap-2 mt-4">
                    <Button
                      variant="outline"
                      size="sm"
                      onClick={() => handleViewDetails(order)}
                    >
                      <Eye className="h-4 w-4 mr-2" />
                      Voir les détails
                    </Button>
                    {order.status === 'paid' && (
                      <Button
                        variant="outline"
                        size="sm"
                        onClick={() => {
                          setSelectedOrder(order)
                          setIsRefundModalOpen(true)
                          setRefundAmount(order.totalCad.toString())
                        }}
                      >
                        <DollarSign className="h-4 w-4 mr-2" />
                        Rembourser
                      </Button>
                    )}
                  </div>
                </CardContent>
              </Card>
            )
          })
        )}

        {/* Load More */}
        {hasMore && (
          <div ref={loadMoreRef} className="flex justify-center p-4">
            {loadingMore ? (
              <Loader2 className="h-6 w-6 animate-spin" />
            ) : (
              <Button onClick={loadMoreOrders} variant="outline">
                Charger plus
              </Button>
            )}
          </div>
        )}
      </div>

      {/* Order Details Modal */}
      <Dialog open={isDetailsModalOpen} onOpenChange={setIsDetailsModalOpen}>
        <DialogContent className="max-w-4xl max-h-[90vh] overflow-y-auto">
          <DialogHeader>
            <DialogTitle>Détails de la commande</DialogTitle>
            <DialogDescription>
              Informations complètes et historique des remboursements
            </DialogDescription>
          </DialogHeader>
          
          {loadingDetails ? (
            <div className="flex items-center justify-center p-8">
              <Loader2 className="h-8 w-8 animate-spin" />
              <span className="ml-2">Chargement des détails...</span>
            </div>
          ) : orderDetails ? (
            <div className="space-y-6">
              {/* Order Information */}
              <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                <Card>
                  <CardHeader>
                    <CardTitle className="text-lg">Informations générales</CardTitle>
                  </CardHeader>
                  <CardContent className="space-y-3">
                    <div>
                      <Label className="text-sm font-medium">ID de commande</Label>
                      <p className="text-sm text-muted-foreground">{orderDetails.id}</p>
                    </div>
                    <div>
                      <Label className="text-sm font-medium">Statut</Label>
                      <div className="mt-1">
                        <Badge variant={getStatusBadgeVariant(orderDetails.status)}>
                          {getStatusLabel(orderDetails.status)}
                        </Badge>
                      </div>
                    </div>
                    <div>
                      <Label className="text-sm font-medium">Date de création</Label>
                      <p className="text-sm text-muted-foreground">{formatDateTime(orderDetails.createdAt)}</p>
                    </div>
                    <div>
                      <Label className="text-sm font-medium">Devise</Label>
                      <p className="text-sm text-muted-foreground">{orderDetails.currency}</p>
                    </div>
                    {orderDetails.stripePaymentIntentId && (
                      <div>
                        <Label className="text-sm font-medium">ID de paiement Stripe</Label>
                        <p className="text-sm font-mono">{orderDetails.stripePaymentIntentId}</p>
                      </div>
                    )}
                  </CardContent>
                </Card>

                <Card>
                  <CardHeader>
                    <CardTitle className="text-lg">Client</CardTitle>
                  </CardHeader>
                  <CardContent className="space-y-3">
                    <div>
                      <Label className="text-sm font-medium">Nom</Label>
                      <p className="text-sm">{orderDetails.user.firstName} {orderDetails.user.lastName}</p>
                    </div>
                    <div>
                      <Label className="text-sm font-medium">Email</Label>
                      <p className="text-sm">{orderDetails.user.email}</p>
                    </div>
                    {orderDetails.user.phone && (
                      <div>
                        <Label className="text-sm font-medium">Téléphone</Label>
                        <p className="text-sm">{orderDetails.user.phone}</p>
                      </div>
                    )}
                  </CardContent>
                </Card>
              </div>

              {/* Financial Information */}
              <Card>
                <CardHeader>
                  <CardTitle className="text-lg">Informations financières</CardTitle>
                </CardHeader>
                <CardContent>
                  <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
                    <div>
                      <Label className="text-sm font-medium">Sous-total</Label>
                      <p className="text-lg font-semibold">{formatCurrency(orderDetails.subtotalCad)}</p>
                    </div>
                    <div>
                      <Label className="text-sm font-medium">Remise</Label>
                      <p className="text-lg font-semibold text-success">
                        -{formatCurrency(orderDetails.discountCad)}
                      </p>
                    </div>
                    <div>
                      <Label className="text-sm font-medium">Total</Label>
                      <p className="text-lg font-semibold">
                        {formatCurrency(orderDetails.totalCad)}
                        {orderDetails.totalCad === 0 && ' (Gratuit)'}
                      </p>
                    </div>
                  </div>
                </CardContent>
              </Card>

              {/* Order Items */}
              <Card>
                <CardHeader>
                  <CardTitle className="text-lg">Articles de la commande</CardTitle>
                </CardHeader>
                <CardContent>
                  <div className="space-y-4">
                    {orderDetails.items.map((item) => (
                      <div key={item.id} className="border rounded-lg p-4">
                        <div className="flex justify-between items-start">
                          <div className="space-y-2">
                            <h4 className="font-medium">{item.course.titleFr}</h4>
                            <p className="text-sm text-muted-foreground">
                              Tuteur: {item.tutor.user.firstName} {item.tutor.user.lastName} ({item.tutor.displayName})
                            </p>
                            <p className="text-sm text-muted-foreground">
                              Email: {item.tutor.user.email}
                            </p>
                            <p className="text-sm text-muted-foreground">
                              {formatDateTime(item.startDatetime)} - {formatDateTime(item.endDatetime)}
                            </p>
                            <p className="text-sm text-muted-foreground">
                              Durée: {item.durationMin} minutes
                            </p>
                            {item.appointment && (
                              <div className="flex items-center gap-2">
                                <Badge variant={getStatusBadgeVariant(item.appointment.status)}>
                                  {getStatusLabel(item.appointment.status)}
                                </Badge>
                                {item.appointment.meetingLink && (
                                  <a 
                                    href={item.appointment.meetingLink} 
                                    target="_blank" 
                                    rel="noopener noreferrer"
                                    className="text-info hover:underline text-sm"
                                  >
                                    Lien de réunion
                                  </a>
                                )}
                              </div>
                            )}
                          </div>
                          <div className="text-right space-y-1">
                            <div className="font-semibold">{formatCurrency(item.lineTotalCad)}</div>
                            <div className="text-sm text-muted-foreground">
                              Prix unitaire: {formatCurrency(item.unitPriceCad)}
                            </div>
                            <div className="text-sm text-success">
                              Gains tuteur: {formatCurrency(item.tutorEarningsCad)}
                            </div>
                          </div>
                        </div>
                      </div>
                    ))}
                  </div>
                </CardContent>
              </Card>

              {/* Refund History */}
              {orderDetails.refundRequests.length > 0 && (
                <Card>
                  <CardHeader>
                    <CardTitle className="text-lg">Historique des remboursements</CardTitle>
                  </CardHeader>
                  <CardContent>
                    <div className="space-y-4">
                      {orderDetails.refundRequests.map((refund) => (
                        <div key={refund.id} className="border-l-4 border-error-border pl-4 py-2">
                          <div className="flex justify-between items-start">
                            <div>
                              <p className="font-medium text-sm">
                                {formatCurrency(refund.amount)} - {refund.reason}
                              </p>
                              <p className="text-sm text-muted-foreground">
                                Traité par: {refund.processor.firstName} {refund.processor.lastName}
                              </p>
                              {refund.stripeRefundId && (
                                <p className="text-sm text-muted-foreground">
                                  ID Stripe: {refund.stripeRefundId}
                                </p>
                              )}
                            </div>
                            <div className="text-right text-sm text-muted-foreground">
                              <p>{formatDateTime(refund.processedAt || refund.createdAt)}</p>
                              <Badge variant="outline">{refund.status}</Badge>
                            </div>
                          </div>
                        </div>
                      ))}
                    </div>
                  </CardContent>
                </Card>
              )}
            </div>
          ) : (
            <div className="p-4 text-center text-muted-foreground">
              Aucun détail disponible
            </div>
          )}
        </DialogContent>
      </Dialog>

      {/* Refund Modal */}
      <Dialog open={isRefundModalOpen} onOpenChange={setIsRefundModalOpen}>
        <DialogContent>
          <DialogHeader>
            <DialogTitle>Rembourser la commande</DialogTitle>
            <DialogDescription>
              Traiter un remboursement pour cette commande
            </DialogDescription>
          </DialogHeader>
          
          <div className="space-y-4">
            {refundError && (
              <div className="p-3 bg-error-light border border-error-border rounded-md text-error text-sm">
                {refundError}
              </div>
            )}

            <div>
              <Label htmlFor="refundAmount">Montant du remboursement ($)</Label>
              <Input
                id="refundAmount"
                type="number"
                step="0.01"
                min="0"
                max={selectedOrder?.totalCad || 0}
                value={refundAmount}
                onChange={(e) => setRefundAmount(e.target.value)}
                placeholder="0.00"
              />
              <p className="text-sm text-muted-foreground mt-1">
                Montant maximum: {formatCurrency(selectedOrder?.totalCad || 0)}
              </p>
            </div>

            <div>
              <Label htmlFor="refundReason">Raison du remboursement</Label>
              <Input
                id="refundReason"
                value={refundReason}
                onChange={(e) => setRefundReason(e.target.value)}
                placeholder="Raison du remboursement..."
              />
            </div>

            <div className="flex justify-end gap-2 pt-4">
              <Button
                variant="outline"
                onClick={() => {
                  setIsRefundModalOpen(false)
                  setRefundAmount('')
                  setRefundReason('')
                  setRefundError(null)
                }}
                disabled={isRefunding}
              >
                Annuler
              </Button>
              <Button
                onClick={handleRefund}
                disabled={isRefunding || !refundAmount || !refundReason}
              >
                {isRefunding ? (
                  <>
                    <Loader2 className="h-4 w-4 mr-2 animate-spin" />
                    Traitement...
                  </>
                ) : (
                  <>
                    <DollarSign className="h-4 w-4 mr-2" />
                    Rembourser
                  </>
                )}
              </Button>
            </div>
          </div>
        </DialogContent>
      </Dialog>
    </div>
  )
}
