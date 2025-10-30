'use client'

import { useState, useEffect, useRef } from 'react'
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card'
import { Button } from '@/components/ui/button'
import { Badge } from '@/components/ui/badge'
import { formatCurrency, formatDateTime } from '@/lib/utils'
import { 
  ShoppingCart, 
  CreditCard, 
  Tag, 
  DollarSign,
  RefreshCw,
  CheckCircle,
  XCircle,
  Clock,
  Loader2,
  ExternalLink
} from 'lucide-react'
import { getStudentOrders } from '@/lib/actions/admin'

interface StudentOrdersListProps {
  studentId: string
}

interface Order {
  id: string
  totalCad: number
  status: string
  createdAt: Date
  stripePaymentIntentId?: string
  items: {
    course: {
      titleFr: string
    }
    tutor: {
      displayName: string
    }
    startDatetime: Date
    durationMin: number
    lineTotalCad: number
    appointment?: {
      refundRequests: {
        id: string
        amount: number
        status: string
        reason: string
        processedAt?: Date
      }[]
    }
  }[]
  coupon?: {
    code: string
    type: string
    value: number
  }
}

export function StudentOrdersList({ studentId }: StudentOrdersListProps) {
  const [orders, setOrders] = useState<Order[]>([])
  const [loading, setLoading] = useState(false)
  const [loadingMore, setLoadingMore] = useState(false)
  const [error, setError] = useState<string | null>(null)
  const [hasMore, setHasMore] = useState(true)
  const [nextCursor, setNextCursor] = useState<string | null>(null)
  const [initialLoad, setInitialLoad] = useState(true)
  const loadMoreRef = useRef<HTMLDivElement>(null)

  const fetchOrders = async (cursor?: string, append = false) => {
    if (!studentId) return

    const loadingState = append ? setLoadingMore : setLoading
    loadingState(true)
    setError(null)

    try {
      const result = await getStudentOrders(studentId, {
        cursor,
        limit: 20
      })

      if (result.success && result.data) {
        const newOrders = result.data.orders.map((order: any) => ({
          ...order,
          createdAt: new Date(order.createdAt),
          items: order.items.map((item: any) => ({
            ...item,
            startDatetime: new Date(item.startDatetime)
          }))
        }))

        if (append) {
          setOrders(prev => [...prev, ...newOrders])
        } else {
          setOrders(newOrders)
        }

        setHasMore(result.data.hasMore)
        setNextCursor(result.data.nextCursor)
      } else {
        setError(result.error || 'Erreur lors du chargement des commandes')
      }
    } catch (error) {
      console.error('Error fetching orders:', error)
      setError('Une erreur est survenue')
    } finally {
      loadingState(false)
      setInitialLoad(false)
    }
  }

  const loadMore = () => {
    if (hasMore && nextCursor && !loadingMore) {
      fetchOrders(nextCursor, true)
    }
  }

  // Load orders on mount
  useEffect(() => {
    fetchOrders()
  }, [studentId])

  // Intersection Observer for infinite scroll
  useEffect(() => {
    const observer = new IntersectionObserver(
      (entries) => {
        if (entries[0].isIntersecting && hasMore && !loadingMore) {
          loadMore()
        }
      },
      { threshold: 0.1 }
    )

    if (loadMoreRef.current) {
      observer.observe(loadMoreRef.current)
    }

    return () => observer.disconnect()
  }, [hasMore, loadingMore, nextCursor])

  const getStatusBadge = (status: string) => {
    switch (status) {
      case 'paid':
        return <Badge variant="default" className="bg-green-100 text-green-800">Payé</Badge>
      case 'created':
        return <Badge variant="outline" className="border-yellow-200 text-yellow-800">Créé</Badge>
      case 'failed':
        return <Badge variant="destructive">Échoué</Badge>
      case 'refunded':
        return <Badge variant="outline" className="border-orange-200 text-orange-800">Remboursé</Badge>
      default:
        return <Badge variant="secondary">{status}</Badge>
    }
  }

  const getStatusIcon = (status: string) => {
    switch (status) {
      case 'paid':
        return <CheckCircle className="h-4 w-4 text-green-500" />
      case 'created':
        return <Clock className="h-4 w-4 text-yellow-500" />
      case 'failed':
        return <XCircle className="h-4 w-4 text-red-500" />
      case 'refunded':
        return <RefreshCw className="h-4 w-4 text-orange-500" />
      default:
        return <ShoppingCart className="h-4 w-4 text-gray-500" />
    }
  }

  const getRefundStatusBadge = (status: string) => {
    switch (status) {
      case 'approved':
        return <Badge variant="default" className="bg-green-100 text-green-800">Approuvé</Badge>
      case 'pending':
        return <Badge variant="outline" className="border-yellow-200 text-yellow-800">En attente</Badge>
      case 'rejected':
        return <Badge variant="destructive">Rejeté</Badge>
      default:
        return <Badge variant="secondary">{status}</Badge>
    }
  }

  if (initialLoad && loading) {
    return (
      <div className="p-6">
        <div className="text-center text-muted-foreground">
          <Loader2 className="h-6 w-6 animate-spin mx-auto mb-2" />
          Chargement des commandes...
        </div>
      </div>
    )
  }

  return (
    <div className="h-full flex flex-col">
      {/* Orders List */}
      <div className="flex-1 overflow-y-auto p-6 scrollbar-thin scrollbar-thumb-gray-300 scrollbar-track-gray-100">
        {error ? (
          <div className="text-center text-destructive py-8">
            {error}
          </div>
        ) : orders.length === 0 ? (
          <div className="text-center text-muted-foreground py-8">
            <ShoppingCart className="h-12 w-12 mx-auto mb-4 opacity-50" />
            <p>Aucune commande trouvée</p>
            <p className="text-sm">Cet étudiant n'a pas encore passé de commande.</p>
          </div>
        ) : (
          <div className="space-y-4">
            {orders.map((order) => (
              <Card key={order.id}>
                <CardContent className="p-6">
                  <div className="flex items-start justify-between mb-4">
                    <div className="flex items-center gap-3">
                      {getStatusIcon(order.status)}
                      <div>
                        <h3 className="font-semibold text-lg">
                          Commande #{order.id.slice(-8)}
                        </h3>
                        <p className="text-sm text-muted-foreground">
                          {formatDateTime(order.createdAt)}
                        </p>
                      </div>
                    </div>
                    <div className="text-right">
                      <div className="text-2xl font-bold">
                        {formatCurrency(order.totalCad)}
                      </div>
                      {getStatusBadge(order.status)}
                    </div>
                  </div>

                  {/* Order Items */}
                  <div className="mb-4">
                    <h4 className="font-medium mb-2">Articles commandés:</h4>
                    <div className="space-y-2">
                      {order.items.map((item, index) => (
                        <div key={index} className="flex justify-between items-center p-2 bg-gray-50 rounded">
                          <div>
                            <p className="font-medium">{item.course.titleFr}</p>
                            <p className="text-sm text-muted-foreground">
                              avec {item.tutor.displayName} • {formatDateTime(item.startDatetime)} • {item.durationMin} min
                            </p>
                          </div>
                          <div className="text-right">
                            <p className="font-medium">{formatCurrency(item.lineTotalCad)}</p>
                          </div>
                        </div>
                      ))}
                    </div>
                  </div>

                  {/* Coupon Information */}
                  {order.coupon && (
                    <div className="mb-4 p-3 bg-blue-50 border border-blue-200 rounded-lg">
                      <div className="flex items-center gap-2">
                        <Tag className="h-4 w-4 text-blue-500" />
                        <span className="text-sm font-medium text-blue-800">
                          Coupon utilisé: {order.coupon.code}
                        </span>
                        <span className="text-sm text-blue-600">
                          ({order.coupon.type === 'percent' ? `${order.coupon.value}%` : formatCurrency(order.coupon.value)} de réduction)
                        </span>
                      </div>
                    </div>
                  )}

                  {/* Payment Information */}
                  {order.stripePaymentIntentId && (
                    <div className="mb-4 p-3 bg-gray-50 rounded-lg">
                      <div className="flex items-center gap-2">
                        <CreditCard className="h-4 w-4 text-gray-500" />
                        <span className="text-sm font-medium">ID de paiement Stripe:</span>
                        <code className="text-xs bg-white px-2 py-1 rounded border">
                          {order.stripePaymentIntentId}
                        </code>
                        <Button
                          variant="ghost"
                          size="sm"
                          className="h-6 px-2"
                          onClick={() => window.open(`https://dashboard.stripe.com/payments/${order.stripePaymentIntentId}`, '_blank')}
                        >
                          <ExternalLink className="h-3 w-3" />
                        </Button>
                      </div>
                    </div>
                  )}

                  {/* Refund Information */}
                  {(() => {
                    const allRefunds = order.items
                      .filter(item => item.appointment?.refundRequests)
                      .flatMap(item => item.appointment!.refundRequests)
                    
                    return allRefunds.length > 0 && (
                      <div className="border-t pt-4">
                        <h4 className="font-medium mb-2 flex items-center gap-2">
                          <RefreshCw className="h-4 w-4" />
                          Demandes de remboursement:
                        </h4>
                        <div className="space-y-2">
                          {allRefunds.map((refund) => (
                            <div key={refund.id} className="p-3 bg-orange-50 border border-orange-200 rounded-lg">
                              <div className="flex justify-between items-start">
                                <div className="flex-1">
                                  <div className="flex items-center gap-2 mb-1">
                                    <DollarSign className="h-4 w-4 text-orange-500" />
                                    <span className="font-medium">
                                      {formatCurrency(refund.amount)}
                                    </span>
                                    {getRefundStatusBadge(refund.status)}
                                  </div>
                                  <p className="text-sm text-orange-700 mb-1">
                                    <span className="font-medium">Raison:</span> {refund.reason}
                                  </p>
                                  {refund.processedAt && (
                                    <p className="text-xs text-orange-600">
                                      Traité le {formatDateTime(refund.processedAt)}
                                    </p>
                                  )}
                                </div>
                              </div>
                            </div>
                          ))}
                        </div>
                      </div>
                    )
                  })()}
                </CardContent>
              </Card>
            ))}

            {/* Load More Trigger */}
            {hasMore && (
              <div ref={loadMoreRef} className="py-4">
                {loadingMore ? (
                  <div className="text-center text-muted-foreground">
                    <Loader2 className="h-4 w-4 animate-spin mx-auto mb-2" />
                    Chargement...
                  </div>
                ) : (
                  <Button
                    variant="outline"
                    onClick={loadMore}
                    className="w-full"
                  >
                    Charger plus
                  </Button>
                )}
              </div>
            )}

            {!hasMore && orders.length > 0 && (
              <div className="text-center text-muted-foreground py-4 text-sm">
                Toutes les commandes ont été chargées
              </div>
            )}
          </div>
        )}
      </div>
    </div>
  )
}
