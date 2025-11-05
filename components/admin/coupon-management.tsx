'use client'

import { useState, useEffect } from 'react'
import { Card, CardContent, CardTitle } from '@/components/ui/card'
import { Button } from '@/components/ui/button'
import { Badge } from '@/components/ui/badge'
import { Input } from '@/components/ui/input'
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select'
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogTrigger } from '@/components/ui/dialog'
import { Label } from '@/components/ui/label'
import { Textarea } from '@/components/ui/textarea'
import { formatCurrency, formatDate, formatDateTime } from '@/lib/utils'
import { 
  Search, 
  Plus, 
  Edit, 
  Trash2, 
  ToggleLeft, 
  ToggleRight,
  Tag,
  DollarSign,
  Percent,
  Calendar,
  Users,
  Loader2,
  SortAsc,
  SortDesc,
  Eye,
  X
} from 'lucide-react'
import { 
  getAllCoupons, 
  createCoupon, 
  updateCoupon, 
  deleteCoupon, 
  toggleCouponStatus,
  getCouponDetails 
} from '@/lib/actions/admin'

interface Coupon {
  id: string
  code: string
  type: 'percent' | 'fixed'
  value: number
  active: boolean
  startsAt: Date | null
  endsAt: Date | null
  maxRedemptions: number | null
  redemptionCount: number
  createdAt: Date
  totalDiscount: number
  orderCount: number
  _count: {
    carts: number
  }
}

// Type for the server response
type CouponWithAnalytics = Coupon & {
  totalDiscount: number
  orderCount: number
}

type SortBy = 'code' | 'redemptionCount' | 'totalDiscount'
type SortOrder = 'asc' | 'desc'

export function CouponManagement() {
  const [coupons, setCoupons] = useState<any[]>([])
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState<string | null>(null)
  const [searchTerm, setSearchTerm] = useState('')
  const [sortBy, setSortBy] = useState<SortBy>('code')
  const [sortOrder, setSortOrder] = useState<SortOrder>('desc')
  const [page, setPage] = useState(1)
  const [hasMore, setHasMore] = useState(false)
  const [loadingMore, setLoadingMore] = useState(false)

  // Modal states
  const [isCreateModalOpen, setIsCreateModalOpen] = useState(false)
  const [isEditModalOpen, setIsEditModalOpen] = useState(false)
  const [isDetailsModalOpen, setIsDetailsModalOpen] = useState(false)
  const [selectedCoupon, setSelectedCoupon] = useState<any>(null)

  // Form states
  const [formData, setFormData] = useState({
    code: '',
    type: 'percent' as 'percent' | 'fixed',
    value: 0,
    startsAt: '',
    endsAt: '',
    maxRedemptions: ''
  })
  const [formLoading, setFormLoading] = useState(false)
  const [formError, setFormError] = useState<string | null>(null)

  // Fetch coupons
  const fetchCoupons = async (pageNum = 1, append = false) => {
    try {
      if (pageNum === 1) {
        setLoading(true)
        setError(null)
      } else {
        setLoadingMore(true)
      }

      const result = await getAllCoupons({
        search: searchTerm,
        sortBy,
        sortOrder,
        page: pageNum,
        limit: 20
      })

      if (result.success && result.data) {
        if (append) {
          setCoupons(prev => [...prev, ...result.data.coupons])
        } else {
          setCoupons(result.data.coupons)
        }
        setHasMore(result.data.hasMore)
        setPage(pageNum)
      } else {
        setError(result.error || 'Erreur lors du chargement des coupons')
      }
    } catch (err) {
      setError('Une erreur est survenue')
    } finally {
      setLoading(false)
      setLoadingMore(false)
    }
  }

  // Load coupons on mount and when filters change
  useEffect(() => {
    fetchCoupons(1, false)
  }, [searchTerm, sortBy, sortOrder])

  // Handle search
  const handleSearch = (value: string) => {
    setSearchTerm(value)
    setPage(1)
  }

  // Handle sort
  const handleSort = (field: SortBy) => {
    if (sortBy === field) {
      setSortOrder(sortOrder === 'asc' ? 'desc' : 'asc')
    } else {
      setSortBy(field)
      setSortOrder('asc')
    }
    setPage(1)
  }

  // Load more coupons
  const loadMore = () => {
    if (hasMore && !loadingMore) {
      fetchCoupons(page + 1, true)
    }
  }

  // Get sort icon
  const getSortIcon = (field: SortBy) => {
    if (sortBy !== field) return null
    return sortOrder === 'asc' ? <SortAsc className="h-4 w-4" /> : <SortDesc className="h-4 w-4" />
  }

  // Reset form
  const resetForm = () => {
    setFormData({
      code: '',
      type: 'percent',
      value: 0,
      startsAt: '',
      endsAt: '',
      maxRedemptions: ''
    })
    setFormError(null)
  }

  // Open create modal
  const openCreateModal = () => {
    resetForm()
    setIsCreateModalOpen(true)
  }

  // Open edit modal
  const openEditModal = (coupon: Coupon) => {
    setFormData({
      code: coupon.code,
      type: coupon.type,
      value: coupon.value,
      startsAt: coupon.startsAt ? new Date(coupon.startsAt).toISOString().slice(0, 16) : '',
      endsAt: coupon.endsAt ? new Date(coupon.endsAt).toISOString().slice(0, 16) : '',
      maxRedemptions: coupon.maxRedemptions?.toString() || ''
    })
    setSelectedCoupon(coupon)
    setIsEditModalOpen(true)
  }

  // Open details modal
  const openDetailsModal = async (coupon: Coupon) => {
    setSelectedCoupon(coupon)
    setIsDetailsModalOpen(true)
  }

  // Handle create coupon
  const handleCreateCoupon = async (e: React.FormEvent) => {
    e.preventDefault()
    setFormLoading(true)
    setFormError(null)

    try {
      const data = {
        code: formData.code,
        type: formData.type,
        value: formData.value,
        startsAt: formData.startsAt ? new Date(formData.startsAt) : undefined,
        endsAt: formData.endsAt ? new Date(formData.endsAt) : undefined,
        maxRedemptions: formData.maxRedemptions ? parseInt(formData.maxRedemptions) : undefined
      }

      const result = await createCoupon(data)

      if (result.success) {
        setIsCreateModalOpen(false)
        resetForm()
        fetchCoupons(1, false)
      } else {
        setFormError(result.error || 'Erreur lors de la création')
      }
    } catch (err) {
      setFormError('Une erreur est survenue')
    } finally {
      setFormLoading(false)
    }
  }

  // Handle update coupon
  const handleUpdateCoupon = async (e: React.FormEvent) => {
    e.preventDefault()
    if (!selectedCoupon) return

    setFormLoading(true)
    setFormError(null)

    try {
      const data = {
        code: formData.code,
        type: formData.type,
        value: formData.value,
        startsAt: formData.startsAt ? new Date(formData.startsAt) : null,
        endsAt: formData.endsAt ? new Date(formData.endsAt) : null,
        maxRedemptions: formData.maxRedemptions ? parseInt(formData.maxRedemptions) : null
      }

      const result = await updateCoupon(selectedCoupon.id, data)

      if (result.success) {
        setIsEditModalOpen(false)
        resetForm()
        fetchCoupons(1, false)
      } else {
        setFormError(result.error || 'Erreur lors de la mise à jour')
      }
    } catch (err) {
      setFormError('Une erreur est survenue')
    } finally {
      setFormLoading(false)
    }
  }

  // Handle delete coupon
  const handleDeleteCoupon = async (coupon: Coupon) => {
    if (!confirm(`Êtes-vous sûr de vouloir supprimer le coupon "${coupon.code}" ?`)) {
      return
    }

    try {
      const result = await deleteCoupon(coupon.id)

      if (result.success) {
        fetchCoupons(1, false)
        if (result.message) {
          alert(result.message)
        }
      } else {
        alert(result.error || 'Erreur lors de la suppression')
      }
    } catch (err) {
      alert('Une erreur est survenue')
    }
  }

  // Handle toggle status
  const handleToggleStatus = async (coupon: Coupon) => {
    try {
      const result = await toggleCouponStatus(coupon.id)

      if (result.success) {
        fetchCoupons(1, false)
      } else {
        alert(result.error || 'Erreur lors du changement de statut')
      }
    } catch (err) {
      alert('Une erreur est survenue')
    }
  }

  // Get coupon status badge
  const getStatusBadge = (coupon: Coupon) => {
    if (!coupon.active) {
      return <Badge variant="secondary">Inactif</Badge>
    }

    const now = new Date()
    if (coupon.endsAt && now > coupon.endsAt) {
      return <Badge variant="destructive">Expiré</Badge>
    }

    if (coupon.startsAt && now < coupon.startsAt) {
      return <Badge variant="outline">À venir</Badge>
    }

    if (coupon.maxRedemptions && coupon.redemptionCount >= coupon.maxRedemptions) {
      return <Badge variant="destructive">Limite atteinte</Badge>
    }

    return <Badge variant="default">Actif</Badge>
  }

  // Get coupon type icon
  const getTypeIcon = (type: 'percent' | 'fixed') => {
    return type === 'percent' ? <Percent className="h-4 w-4" /> : <DollarSign className="h-4 w-4" />
  }

  // Format coupon value
  const formatCouponValue = (coupon: Coupon) => {
    if (coupon.type === 'percent') {
      return `${coupon.value}%`
    } else {
      return formatCurrency(coupon.value)
    }
  }

  if (loading) {
    return (
      <Card>
        <CardContent className="p-6">
          <div className="text-center text-muted-foreground">
            <Loader2 className="h-6 w-6 animate-spin mx-auto mb-2" />
            Chargement des coupons...
          </div>
        </CardContent>
      </Card>
    )
  }

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center gap-4">
        <div>
          <h2 className="text-2xl font-bold">Gestion des Coupons</h2>
          <p className="text-muted-foreground">
            Créez et gérez les codes promo de votre plateforme
          </p>
        </div>
        <Button onClick={openCreateModal} className="flex items-center gap-2">
          <Plus className="h-4 w-4" />
          Nouveau Coupon
        </Button>
      </div>

      {/* Search and Sort Controls */}
      <div className="flex flex-col sm:flex-row gap-4">
        <div className="flex items-center space-x-2 flex-1">
          <Search className="h-4 w-4 text-muted-foreground" />
          <Input
            placeholder="Rechercher par code..."
            value={searchTerm}
            onChange={(e) => handleSearch(e.target.value)}
            className="flex-1"
          />
        </div>
        
        <div className="flex items-center gap-2">
          <span className="text-sm text-muted-foreground">Trier par:</span>
          <Button
            variant={sortBy === 'code' ? 'default' : 'outline'}
            size="sm"
            onClick={() => handleSort('code')}
            className="flex items-center gap-2"
          >
            Code {getSortIcon('code')}
          </Button>
          <Button
            variant={sortBy === 'redemptionCount' ? 'default' : 'outline'}
            size="sm"
            onClick={() => handleSort('redemptionCount')}
            className="flex items-center gap-2"
          >
            Utilisations {getSortIcon('redemptionCount')}
          </Button>
          <Button
            variant={sortBy === 'totalDiscount' ? 'default' : 'outline'}
            size="sm"
            onClick={() => handleSort('totalDiscount')}
            className="flex items-center gap-2"
          >
            Réduction {getSortIcon('totalDiscount')}
          </Button>
        </div>
      </div>

      {/* Coupons List */}
      {error ? (
        <Card>
          <CardContent className="p-6">
            <div className="text-center text-destructive">
              {error}
            </div>
          </CardContent>
        </Card>
      ) : coupons.length === 0 ? (
        <Card>
          <CardContent className="p-6">
            <div className="text-center text-muted-foreground">
              <Tag className="h-12 w-12 mx-auto mb-4 opacity-50" />
              <p>Aucun coupon trouvé</p>
              <p className="text-sm">Commencez par créer votre premier coupon.</p>
            </div>
          </CardContent>
        </Card>
      ) : (
        <div className="grid gap-4">
          {coupons.map((coupon) => (
            <Card key={coupon.id}>
              <CardContent className="p-6">
                <div className="flex items-center justify-between">
                  <div className="flex-1">
                    <div className="flex items-center gap-3 mb-2">
                      <h3 className="text-lg font-semibold">{coupon.code}</h3>
                      {getStatusBadge(coupon)}
                      <Button
                        variant="ghost"
                        size="sm"
                        onClick={() => handleToggleStatus(coupon)}
                        className="p-1"
                      >
                        {coupon.active ? (
                          <ToggleRight className="h-4 w-4 text-success" />
                        ) : (
                          <ToggleLeft className="h-4 w-4 text-muted-foreground" />
                        )}
                      </Button>
                    </div>
                    
                    <div className="flex items-center gap-4 text-sm text-muted-foreground mb-3">
                      <div className="flex items-center gap-1">
                        {getTypeIcon(coupon.type)}
                        <span>{formatCouponValue(coupon)}</span>
                      </div>
                      <div className="flex items-center gap-1">
                        <Users className="h-4 w-4" />
                        <span>{coupon.redemptionCount} utilisations</span>
                      </div>
                      <div className="flex items-center gap-1">
                        <DollarSign className="h-4 w-4" />
                        <span>{formatCurrency(coupon.totalDiscount)} économisé</span>
                      </div>
                    </div>

                    {(coupon.startsAt || coupon.endsAt) && (
                      <div className="text-sm text-muted-foreground">
                        {coupon.startsAt && (
                          <span>Valide du {formatDateTime(coupon.startsAt)}</span>
                        )}
                        {coupon.startsAt && coupon.endsAt && <span> au </span>}
                        {coupon.endsAt && (
                          <span>{formatDateTime(coupon.endsAt)}</span>
                        )}
                      </div>
                    )}

                    {coupon.maxRedemptions && (
                      <div className="text-sm text-muted-foreground">
                        Limite: {coupon.redemptionCount}/{coupon.maxRedemptions} utilisations
                      </div>
                    )}
                  </div>

                  <div className="flex items-center gap-2">
                    <Button
                      variant="outline"
                      size="sm"
                      onClick={() => openDetailsModal(coupon)}
                      className="flex items-center gap-2"
                    >
                      <Eye className="h-4 w-4" />
                      Détails
                    </Button>
                    <Button
                      variant="outline"
                      size="sm"
                      onClick={() => openEditModal(coupon)}
                      className="flex items-center gap-2"
                    >
                      <Edit className="h-4 w-4" />
                      Modifier
                    </Button>
                    <Button
                      variant="outline"
                      size="sm"
                      onClick={() => handleDeleteCoupon(coupon)}
                      className="flex items-center gap-2 text-destructive hover:text-destructive"
                    >
                      <Trash2 className="h-4 w-4" />
                      Supprimer
                    </Button>
                  </div>
                </div>
              </CardContent>
            </Card>
          ))}

          {/* Load More Button */}
          {hasMore && (
            <div className="text-center">
              <Button
                variant="outline"
                onClick={loadMore}
                disabled={loadingMore}
                className="flex items-center gap-2"
              >
                {loadingMore ? (
                  <Loader2 className="h-4 w-4 animate-spin" />
                ) : null}
                Charger plus
              </Button>
            </div>
          )}
        </div>
      )}

      {/* Create Coupon Modal */}
      <Dialog open={isCreateModalOpen} onOpenChange={setIsCreateModalOpen}>
        <DialogContent className="max-w-md">
          <DialogHeader>
            <DialogTitle>Créer un nouveau coupon</DialogTitle>
          </DialogHeader>
          <form onSubmit={handleCreateCoupon} className="space-y-4">
            <div>
              <Label htmlFor="code">Code du coupon *</Label>
              <Input
                id="code"
                value={formData.code}
                onChange={(e) => setFormData(prev => ({ ...prev, code: e.target.value }))}
                placeholder="Ex: WELCOME20"
                required
              />
            </div>

            <div className="grid grid-cols-2 gap-4">
              <div>
                <Label htmlFor="type">Type *</Label>
                <Select
                  value={formData.type}
                  onValueChange={(value: 'percent' | 'fixed') => 
                    setFormData(prev => ({ ...prev, type: value }))
                  }
                >
                  <SelectTrigger>
                    <SelectValue />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="percent">Pourcentage</SelectItem>
                    <SelectItem value="fixed">Montant fixe</SelectItem>
                  </SelectContent>
                </Select>
              </div>

              <div>
                <Label htmlFor="value">Valeur *</Label>
                <Input
                  id="value"
                  type="number"
                  min="0"
                  step={formData.type === 'percent' ? '1' : '0.01'}
                  max={formData.type === 'percent' ? '100' : undefined}
                  value={formData.value}
                  onChange={(e) => setFormData(prev => ({ ...prev, value: parseFloat(e.target.value) || 0 }))}
                  placeholder={formData.type === 'percent' ? '20' : '10.00'}
                  required
                />
              </div>
            </div>

            <div className="grid grid-cols-2 gap-4">
              <div>
                <Label htmlFor="startsAt">Date de début</Label>
                <Input
                  id="startsAt"
                  type="datetime-local"
                  value={formData.startsAt}
                  onChange={(e) => setFormData(prev => ({ ...prev, startsAt: e.target.value }))}
                />
              </div>

              <div>
                <Label htmlFor="endsAt">Date de fin</Label>
                <Input
                  id="endsAt"
                  type="datetime-local"
                  value={formData.endsAt}
                  onChange={(e) => setFormData(prev => ({ ...prev, endsAt: e.target.value }))}
                />
              </div>
            </div>

            <div>
              <Label htmlFor="maxRedemptions">Limite d'utilisations</Label>
              <Input
                id="maxRedemptions"
                type="number"
                min="1"
                value={formData.maxRedemptions}
                onChange={(e) => setFormData(prev => ({ ...prev, maxRedemptions: e.target.value }))}
                placeholder="Illimité si vide"
              />
            </div>

            {formError && (
              <div className="text-sm text-destructive">{formError}</div>
            )}

            <div className="flex justify-end gap-2">
              <Button
                type="button"
                variant="outline"
                onClick={() => setIsCreateModalOpen(false)}
              >
                Annuler
              </Button>
              <Button type="submit" disabled={formLoading}>
                {formLoading ? (
                  <Loader2 className="h-4 w-4 animate-spin mr-2" />
                ) : null}
                Créer
              </Button>
            </div>
          </form>
        </DialogContent>
      </Dialog>

      {/* Edit Coupon Modal */}
      <Dialog open={isEditModalOpen} onOpenChange={setIsEditModalOpen}>
        <DialogContent className="max-w-md">
          <DialogHeader>
            <DialogTitle>Modifier le coupon</DialogTitle>
          </DialogHeader>
          <form onSubmit={handleUpdateCoupon} className="space-y-4">
            <div>
              <Label htmlFor="edit-code">Code du coupon *</Label>
              <Input
                id="edit-code"
                value={formData.code}
                onChange={(e) => setFormData(prev => ({ ...prev, code: e.target.value }))}
                placeholder="Ex: WELCOME20"
                required
              />
            </div>

            <div className="grid grid-cols-2 gap-4">
              <div>
                <Label htmlFor="edit-type">Type *</Label>
                <Select
                  value={formData.type}
                  onValueChange={(value: 'percent' | 'fixed') => 
                    setFormData(prev => ({ ...prev, type: value }))
                  }
                >
                  <SelectTrigger>
                    <SelectValue />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="percent">Pourcentage</SelectItem>
                    <SelectItem value="fixed">Montant fixe</SelectItem>
                  </SelectContent>
                </Select>
              </div>

              <div>
                <Label htmlFor="edit-value">Valeur *</Label>
                <Input
                  id="edit-value"
                  type="number"
                  min="0"
                  step={formData.type === 'percent' ? '1' : '0.01'}
                  max={formData.type === 'percent' ? '100' : undefined}
                  value={formData.value}
                  onChange={(e) => setFormData(prev => ({ ...prev, value: parseFloat(e.target.value) || 0 }))}
                  placeholder={formData.type === 'percent' ? '20' : '10.00'}
                  required
                />
              </div>
            </div>

            <div className="grid grid-cols-2 gap-4">
              <div>
                <Label htmlFor="edit-startsAt">Date de début</Label>
                <Input
                  id="edit-startsAt"
                  type="datetime-local"
                  value={formData.startsAt}
                  onChange={(e) => setFormData(prev => ({ ...prev, startsAt: e.target.value }))}
                />
              </div>

              <div>
                <Label htmlFor="edit-endsAt">Date de fin</Label>
                <Input
                  id="edit-endsAt"
                  type="datetime-local"
                  value={formData.endsAt}
                  onChange={(e) => setFormData(prev => ({ ...prev, endsAt: e.target.value }))}
                />
              </div>
            </div>

            <div>
              <Label htmlFor="edit-maxRedemptions">Limite d'utilisations</Label>
              <Input
                id="edit-maxRedemptions"
                type="number"
                min="1"
                value={formData.maxRedemptions}
                onChange={(e) => setFormData(prev => ({ ...prev, maxRedemptions: e.target.value }))}
                placeholder="Illimité si vide"
              />
            </div>

            {formError && (
              <div className="text-sm text-destructive">{formError}</div>
            )}

            <div className="flex justify-end gap-2">
              <Button
                type="button"
                variant="outline"
                onClick={() => setIsEditModalOpen(false)}
              >
                Annuler
              </Button>
              <Button type="submit" disabled={formLoading}>
                {formLoading ? (
                  <Loader2 className="h-4 w-4 animate-spin mr-2" />
                ) : null}
                Modifier
              </Button>
            </div>
          </form>
        </DialogContent>
      </Dialog>

      {/* Coupon Details Modal */}
      <Dialog open={isDetailsModalOpen} onOpenChange={setIsDetailsModalOpen}>
        <DialogContent className="max-w-2xl">
          <DialogHeader>
            <DialogTitle className="flex items-center gap-2">
              <Tag className="h-5 w-5" />
              Détails du coupon
            </DialogTitle>
          </DialogHeader>
          {selectedCoupon && (
            <div className="space-y-6">
              {/* Coupon Info */}
              <div className="grid grid-cols-2 gap-4">
                <div>
                  <Label className="text-sm font-medium">Code</Label>
                  <p className="text-lg font-semibold">{selectedCoupon.code}</p>
                </div>
                <div>
                  <Label className="text-sm font-medium">Type</Label>
                  <p className="flex items-center gap-2">
                    {getTypeIcon(selectedCoupon.type)}
                    {formatCouponValue(selectedCoupon)}
                  </p>
                </div>
                <div>
                  <Label className="text-sm font-medium">Statut</Label>
                  <div className="mt-1">{getStatusBadge(selectedCoupon)}</div>
                </div>
                <div>
                  <Label className="text-sm font-medium">Utilisations</Label>
                  <p>{selectedCoupon.redemptionCount} fois</p>
                </div>
                <div>
                  <Label className="text-sm font-medium">Total économisé</Label>
                  <p className="text-success font-semibold">
                    {formatCurrency(selectedCoupon.totalDiscount)}
                  </p>
                </div>
              </div>

              {/* Validity Period */}
              {(selectedCoupon.startsAt || selectedCoupon.endsAt) && (
                <div>
                  <Label className="text-sm font-medium">Période de validité</Label>
                  <div className="mt-1 text-sm">
                    {selectedCoupon.startsAt && (
                      <p>Début: {formatDateTime(selectedCoupon.startsAt)}</p>
                    )}
                    {selectedCoupon.endsAt && (
                      <p>Fin: {formatDateTime(selectedCoupon.endsAt)}</p>
                    )}
                  </div>
                </div>
              )}

              {/* Usage Limit */}
              {selectedCoupon.maxRedemptions && (
                <div>
                  <Label className="text-sm font-medium">Limite d'utilisations</Label>
                  <p className="text-sm">
                    {selectedCoupon.redemptionCount} / {selectedCoupon.maxRedemptions}
                  </p>
                </div>
              )}

              {/* Actions */}
              <div className="flex justify-end gap-2 pt-4 border-t">
                <Button
                  variant="outline"
                  onClick={() => setIsDetailsModalOpen(false)}
                >
                  Fermer
                </Button>
                <Button
                  onClick={() => {
                    setIsDetailsModalOpen(false)
                    openEditModal(selectedCoupon)
                  }}
                >
                  Modifier
                </Button>
              </div>
            </div>
          )}
        </DialogContent>
      </Dialog>
    </div>
  )
}
