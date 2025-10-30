'use client'

import { useState, useEffect } from 'react'
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogHeader,
  DialogTitle,
} from '@/components/ui/dialog'
import {
  Dialog as PaymentDialog,
  DialogContent as PaymentDialogContent,
  DialogDescription as PaymentDialogDescription,
  DialogFooter as PaymentDialogFooter,
  DialogHeader as PaymentDialogHeader,
  DialogTitle as PaymentDialogTitle,
} from '@/components/ui/dialog'
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import { Label } from '@/components/ui/label'
import { Textarea } from '@/components/ui/textarea'
import { Badge } from '@/components/ui/badge'
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs'
import { formatCurrency, formatDateTime, formatDate } from '@/lib/utils'
import { 
  getTutorUnpaidAppointments, 
  getTutorPaymentHistory, 
  markAppointmentsAsPaid 
} from '@/lib/actions/admin'
import {
  getTutorOwnUnpaidAppointments,
  getTutorOwnPaymentHistory
} from '@/lib/actions/tutor-earnings'
import { DollarSign, Clock, Calendar, CheckCircle2, AlertCircle } from 'lucide-react'

interface UnpaidAppointment {
  id: string
  orderItemId: string
  startDatetime: Date
  endDatetime: Date
  course: { titleFr: string }
  hoursWorked: number | null
  tutorEarningsCad: number
  rateAtTime: number | null
}

interface UnpaidMonthGroup {
  month: string
  monthName: string
  appointments: UnpaidAppointment[]
  totalHours: number
  totalAmount: number
}

interface PaidAppointment {
  id: string
  orderItemId: string
  startDatetime: Date
  endDatetime: Date
  course: { titleFr: string }
  hoursWorked: number | null
  tutorEarningsCad: number
  paidAt: Date
}

interface PaymentHistoryGroup {
  paymentMonth: string
  monthName: string
  paidAt: Date
  appointments: PaidAppointment[]
  totalHours: number
  totalAmount: number
}

interface TutorPaymentsModalProps {
  tutorId: string
  tutorName: string
  isOpen: boolean
  onClose: () => void
  onPaymentMarked?: () => void
  readOnly?: boolean
  useTutorActions?: boolean
}

export function TutorPaymentsModal({
  tutorId,
  tutorName,
  isOpen,
  onClose,
  onPaymentMarked,
  readOnly = false,
  useTutorActions = false,
}: TutorPaymentsModalProps) {
  const [activeTab, setActiveTab] = useState<'unpaid' | 'history'>('unpaid')
  const [loading, setLoading] = useState(true)
  const [unpaidMonths, setUnpaidMonths] = useState<UnpaidMonthGroup[]>([])
  const [paymentHistory, setPaymentHistory] = useState<PaymentHistoryGroup[]>([])
  const [selectedAppointments, setSelectedAppointments] = useState<Set<string>>(new Set())
  const [expandedMonths, setExpandedMonths] = useState<Set<string>>(new Set())
  const [expandedPayments, setExpandedPayments] = useState<Set<string>>(new Set())
  const [showMarkPaidDialog, setShowMarkPaidDialog] = useState(false)
  const [paidAt, setPaidAt] = useState('')
  const [adminNote, setAdminNote] = useState('')
  const [markingPaid, setMarkingPaid] = useState(false)

  useEffect(() => {
    if (isOpen && tutorId) {
      loadData()
      // Set default paidAt to today
      const today = new Date()
      setPaidAt(today.toISOString().split('T')[0])
    }
  }, [isOpen, tutorId])

  const loadData = async () => {
    setLoading(true)
    try {
      const [unpaidResult, historyResult] = await Promise.all([
        useTutorActions 
          ? getTutorOwnUnpaidAppointments(tutorId)
          : getTutorUnpaidAppointments(tutorId),
        useTutorActions
          ? getTutorOwnPaymentHistory(tutorId)
          : getTutorPaymentHistory(tutorId),
      ])

      if (unpaidResult.success && unpaidResult.data) {
        setUnpaidMonths(unpaidResult.data)
        // Expand all months by default
        setExpandedMonths(new Set(unpaidResult.data.map(m => m.month)))
      }

      if (historyResult.success && historyResult.data) {
        setPaymentHistory(historyResult.data)
      }
    } catch (error) {
      console.error('Error loading payment data:', error)
    } finally {
      setLoading(false)
    }
  }

  const toggleMonth = (month: string) => {
    const newExpanded = new Set(expandedMonths)
    if (newExpanded.has(month)) {
      newExpanded.delete(month)
    } else {
      newExpanded.add(month)
    }
    setExpandedMonths(newExpanded)
  }

  const togglePayment = (paymentMonth: string) => {
    const newExpanded = new Set(expandedPayments)
    if (newExpanded.has(paymentMonth)) {
      newExpanded.delete(paymentMonth)
    } else {
      newExpanded.add(paymentMonth)
    }
    setExpandedPayments(newExpanded)
  }

  const toggleAppointment = (orderItemId: string) => {
    const newSelected = new Set(selectedAppointments)
    if (newSelected.has(orderItemId)) {
      newSelected.delete(orderItemId)
    } else {
      newSelected.add(orderItemId)
    }
    setSelectedAppointments(newSelected)
  }

  const selectMonth = (monthGroup: UnpaidMonthGroup) => {
    const newSelected = new Set(selectedAppointments)
    const allInMonth = monthGroup.appointments.map(a => a.orderItemId)
    const allSelected = allInMonth.every(id => selectedAppointments.has(id))

    if (allSelected) {
      // Deselect all
      allInMonth.forEach(id => newSelected.delete(id))
    } else {
      // Select all
      allInMonth.forEach(id => newSelected.add(id))
    }
    setSelectedAppointments(newSelected)
  }

  const selectAllMonth = () => {
    const allOrderItemIds = unpaidMonths.flatMap(m => m.appointments.map(a => a.orderItemId))
    const allSelected = allOrderItemIds.every(id => selectedAppointments.has(id))

    if (allSelected) {
      setSelectedAppointments(new Set())
    } else {
      setSelectedAppointments(new Set(allOrderItemIds))
    }
  }

  const getSelectionSummary = () => {
    const selected = unpaidMonths.flatMap(m => 
      m.appointments.filter(a => selectedAppointments.has(a.orderItemId))
    )
    const totalHours = selected.reduce((sum, a) => sum + (a.hoursWorked || (a.endDatetime.getTime() - a.startDatetime.getTime()) / (1000 * 60 * 60)), 0)
    const totalAmount = selected.reduce((sum, a) => sum + a.tutorEarningsCad, 0)
    return { count: selected.length, hours: totalHours, amount: totalAmount }
  }

  const handleMarkMonthAsPaid = async (monthGroup: UnpaidMonthGroup) => {
    const orderItemIds = monthGroup.appointments.map(a => a.orderItemId)
    // Pre-select all appointments in this month
    setSelectedAppointments(new Set(orderItemIds))
    setShowMarkPaidDialog(true)
  }

  const handleMarkSelectionAsPaid = async () => {
    const orderItemIds = Array.from(selectedAppointments)
    if (orderItemIds.length === 0) return

    await markAsPaid(orderItemIds)
  }

  const markAsPaid = async (orderItemIds: string[]) => {
    setMarkingPaid(true)
    try {
      const paidDate = new Date(paidAt)
      const result = await markAppointmentsAsPaid(
        orderItemIds,
        paidDate,
        adminNote || undefined
      )

      if (result.success) {
        alert(`${orderItemIds.length} rendez-vous marqués comme payés avec succès`)
        setSelectedAppointments(new Set())
        setShowMarkPaidDialog(false)
        setAdminNote('')
        await loadData()
        if (onPaymentMarked) {
          onPaymentMarked()
        }
      } else {
        alert(result.error || 'Erreur lors du marquage du paiement')
      }
    } catch (error) {
      alert('Une erreur est survenue')
    } finally {
      setMarkingPaid(false)
    }
  }

  const summary = getSelectionSummary()

  return (
    <>
      <Dialog open={isOpen} onOpenChange={onClose}>
        <DialogContent className="max-w-5xl max-h-[90vh] overflow-hidden flex flex-col">
          <DialogHeader>
            <DialogTitle>Honoraires - {tutorName}</DialogTitle>
            <DialogDescription>
              Gérez les paiements et consultez l'historique des paiements
            </DialogDescription>
          </DialogHeader>

          {loading ? (
            <div className="flex items-center justify-center py-12">
              <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-primary"></div>
            </div>
          ) : (
            <Tabs value={activeTab} onValueChange={(v) => setActiveTab(v as 'unpaid' | 'history')} className="flex-1 flex flex-col overflow-hidden">
              <TabsList className="grid w-full grid-cols-2">
                <TabsTrigger value="unpaid">Appointments non payés</TabsTrigger>
                <TabsTrigger value="history">Historique des paiements</TabsTrigger>
              </TabsList>

              {/* Unpaid Tab */}
              <TabsContent value="unpaid" className="flex-1 overflow-y-auto space-y-4 pb-20">
                {unpaidMonths.length === 0 ? (
                  <div className="text-center py-12 text-muted-foreground">
                    <AlertCircle className="h-12 w-12 mx-auto mb-4 opacity-50" />
                    <p>Aucun rendez-vous non payé</p>
                  </div>
                ) : (
                  <>
                    {!readOnly && (
                      <div className="flex justify-end mb-4">
                        <Button variant="outline" size="sm" onClick={selectAllMonth}>
                          {unpaidMonths.flatMap(m => m.appointments).every(a => selectedAppointments.has(a.orderItemId)) 
                            ? 'Tout désélectionner' 
                            : 'Tout sélectionner'}
                        </Button>
                      </div>
                    )}

                    {unpaidMonths.map((monthGroup) => {
                      const allSelected = monthGroup.appointments.every(a => selectedAppointments.has(a.orderItemId))
                      const someSelected = monthGroup.appointments.some(a => selectedAppointments.has(a.orderItemId))
                      const isExpanded = expandedMonths.has(monthGroup.month)

                      return (
                        <div key={monthGroup.month} className="border rounded-lg p-4">
                          <div className="flex items-center justify-between mb-3">
                            <div className="flex items-center gap-3">
                              <button
                                onClick={() => toggleMonth(monthGroup.month)}
                                className="text-sm font-medium hover:text-primary"
                              >
                                {isExpanded ? '▼' : '▶'} {monthGroup.monthName}
                              </button>
                              <Badge variant="outline">
                                {monthGroup.appointments.length} rendez-vous
                              </Badge>
                              <span className="text-sm text-muted-foreground">
                                {monthGroup.totalHours.toFixed(1)}h • {formatCurrency(monthGroup.totalAmount)}
                              </span>
                            </div>
                            <div className="flex gap-2">
                              <input
                                type="checkbox"
                                checked={allSelected}
                                ref={(input) => {
                                  if (input) input.indeterminate = someSelected && !allSelected
                                }}
                                onChange={() => selectMonth(monthGroup)}
                                className="w-4 h-4"
                                disabled={readOnly}
                              />
                              <Button
                                variant="outline"
                                size="sm"
                                onClick={() => handleMarkMonthAsPaid(monthGroup)}
                                disabled={readOnly}
                              >
                                Marquer tout le mois comme payé
                              </Button>
                            </div>
                          </div>

                          {isExpanded && (
                            <div className="space-y-2 mt-3">
                              {monthGroup.appointments.map((appointment) => (
                                <div
                                  key={appointment.orderItemId}
                                  className="flex items-center gap-3 p-2 hover:bg-muted rounded"
                                >
                                  <input
                                    type="checkbox"
                                    checked={selectedAppointments.has(appointment.orderItemId)}
                                    onChange={() => toggleAppointment(appointment.orderItemId)}
                                    className="w-4 h-4"
                                    disabled={readOnly}
                                  />
                                  <div className="flex-1 grid grid-cols-4 gap-4 text-sm">
                                    <div>
                                      <Calendar className="h-3 w-3 inline mr-1" />
                                      {formatDateTime(appointment.startDatetime)}
                                    </div>
                                    <div>{appointment.course.titleFr}</div>
                                    <div>
                                      <Clock className="h-3 w-3 inline mr-1" />
                                      {(appointment.hoursWorked || 
                                        (appointment.endDatetime.getTime() - appointment.startDatetime.getTime()) / (1000 * 60 * 60)
                                      ).toFixed(1)}h
                                    </div>
                                    <div>
                                      <DollarSign className="h-3 w-3 inline mr-1" />
                                      {formatCurrency(appointment.tutorEarningsCad)}
                                    </div>
                                  </div>
                                </div>
                              ))}
                            </div>
                          )}
                        </div>
                      )
                    })}
                  </>
                )}
              </TabsContent>

              {/* History Tab */}
              <TabsContent value="history" className="flex-1 overflow-y-auto">
                {paymentHistory.length === 0 ? (
                  <div className="text-center py-12 text-muted-foreground">
                    <AlertCircle className="h-12 w-12 mx-auto mb-4 opacity-50" />
                    <p>Aucun historique de paiement</p>
                  </div>
                ) : (
                  <div className="space-y-4">
                    {paymentHistory.map((paymentGroup) => {
                      const isExpanded = expandedPayments.has(paymentGroup.paymentMonth)

                      return (
                        <div key={paymentGroup.paymentMonth} className="border rounded-lg p-4">
                          <div className="flex items-center justify-between mb-3">
                            <div className="flex items-center gap-3">
                              <button
                                onClick={() => togglePayment(paymentGroup.paymentMonth)}
                                className="text-sm font-medium hover:text-primary"
                              >
                                {isExpanded ? '▼' : '▶'} Paiement du {formatDate(paymentGroup.paidAt)}
                              </button>
                              <Badge variant="outline">
                                {paymentGroup.appointments.length} rendez-vous
                              </Badge>
                              <span className="text-sm text-muted-foreground">
                                {paymentGroup.totalHours.toFixed(1)}h • {formatCurrency(paymentGroup.totalAmount)}
                              </span>
                            </div>
                            <span className="text-xs text-muted-foreground">
                              {paymentGroup.monthName}
                            </span>
                          </div>

                          {isExpanded && (
                            <div className="space-y-2 mt-3">
                              {paymentGroup.appointments.map((appointment) => (
                                <div
                                  key={appointment.orderItemId}
                                  className="p-2 bg-muted/50 rounded text-sm"
                                >
                                  <div className="grid grid-cols-4 gap-4">
                                    <div>
                                      <Calendar className="h-3 w-3 inline mr-1" />
                                      {formatDateTime(appointment.startDatetime)}
                                    </div>
                                    <div>{appointment.course.titleFr}</div>
                                    <div>
                                      <Clock className="h-3 w-3 inline mr-1" />
                                      {(appointment.hoursWorked || 
                                        (appointment.endDatetime.getTime() - appointment.startDatetime.getTime()) / (1000 * 60 * 60)
                                      ).toFixed(1)}h
                                    </div>
                                    <div>
                                      <DollarSign className="h-3 w-3 inline mr-1" />
                                      {formatCurrency(appointment.tutorEarningsCad)}
                                    </div>
                                  </div>
                                </div>
                              ))}
                            </div>
                          )}
                        </div>
                      )
                    })}
                  </div>
                )}
              </TabsContent>
            </Tabs>
          )}

          {/* Sticky Footer */}
          {activeTab === 'unpaid' && summary.count > 0 && !readOnly && (
            <div className="sticky bottom-0 left-0 right-0 bg-background border-t p-4 flex items-center justify-between shadow-lg">
              <div className="text-sm">
                <strong>{summary.count}</strong> sélectionné{summary.count > 1 ? 's' : ''} • 
                <strong> {summary.hours.toFixed(1)}h</strong> • 
                <strong> {formatCurrency(summary.amount)}</strong>
              </div>
              <Button
                onClick={() => setShowMarkPaidDialog(true)}
                disabled={summary.count === 0}
              >
                <CheckCircle2 className="h-4 w-4 mr-2" />
                Marquer sélection comme payé
              </Button>
            </div>
          )}
          
          {/* Read-only summary footer */}
          {activeTab === 'unpaid' && summary.count > 0 && readOnly && (
            <div className="sticky bottom-0 left-0 right-0 bg-background border-t p-4 shadow-lg">
              <div className="text-sm text-center text-muted-foreground">
                <strong>{summary.count}</strong> rendez-vous non payé{summary.count > 1 ? 's' : ''} • 
                <strong> {summary.hours.toFixed(1)}h</strong> • 
                <strong> {formatCurrency(summary.amount)}</strong>
              </div>
            </div>
          )}
        </DialogContent>
      </Dialog>

      {/* Mark as Paid Dialog */}
      <PaymentDialog open={showMarkPaidDialog} onOpenChange={setShowMarkPaidDialog}>
        <PaymentDialogContent>
          <PaymentDialogHeader>
            <PaymentDialogTitle>Marquer comme payé</PaymentDialogTitle>
            <PaymentDialogDescription>
              {selectedAppointments.size > 0 
                ? `${selectedAppointments.size} rendez-vous sélectionnés`
                : 'Marquer tous les rendez-vous du mois sélectionné'}
            </PaymentDialogDescription>
          </PaymentDialogHeader>

          <div className="space-y-4">
            <div className="bg-muted p-3 rounded">
              <div className="text-sm space-y-1">
                <p><strong>Nombre:</strong> {summary.count}</p>
                <p><strong>Heures totales:</strong> {summary.hours.toFixed(1)}h</p>
                <p><strong>Montant total:</strong> {formatCurrency(summary.amount)}</p>
              </div>
            </div>

            <div>
              <Label htmlFor="paid-at">Date de paiement</Label>
              <Input
                id="paid-at"
                type="date"
                value={paidAt}
                onChange={(e) => setPaidAt(e.target.value)}
                max={new Date().toISOString().split('T')[0]}
              />
            </div>

            <div>
              <Label htmlFor="admin-note">Note d'administration (optionnel)</Label>
              <Textarea
                id="admin-note"
                value={adminNote}
                onChange={(e) => setAdminNote(e.target.value)}
                placeholder="Ajoutez une note pour ce paiement..."
                rows={3}
              />
            </div>
          </div>

          <PaymentDialogFooter>
            <Button variant="outline" onClick={() => setShowMarkPaidDialog(false)}>
              Annuler
            </Button>
            <Button
              onClick={handleMarkSelectionAsPaid}
              disabled={markingPaid || !paidAt}
            >
              {markingPaid ? 'Traitement...' : 'Confirmer le paiement'}
            </Button>
          </PaymentDialogFooter>
        </PaymentDialogContent>
      </PaymentDialog>
    </>
  )
}

