import { type ClassValue, clsx } from "clsx"
import { twMerge } from "tailwind-merge"
import { frCA } from "./i18n/fr-CA"

export function cn(...inputs: ClassValue[]) {
  return twMerge(clsx(inputs))
}

/**
 * Translate appointment status to French
 */
export function translateAppointmentStatus(status: string): string {
  switch (status) {
    case 'scheduled':
      return frCA.dashboard.appointmentStatus.scheduled
    case 'completed':
      return frCA.dashboard.appointmentStatus.completed
    case 'cancelled':
      return frCA.dashboard.appointmentStatus.cancelled
    case 'refunded':
      return frCA.dashboard.appointmentStatus.refunded
    default:
      return status
  }
}

/**
 * Translate order status to French
 */
export function translateOrderStatus(status: string): string {
  switch (status) {
    case 'created':
      return frCA.dashboard.orderStatus.created
    case 'paid':
      return frCA.dashboard.orderStatus.paid
    case 'failed':
      return frCA.dashboard.orderStatus.failed
    case 'refunded':
      return frCA.dashboard.orderStatus.refunded
    case 'partially_refunded':
      return frCA.dashboard.orderStatus.partially_refunded
    default:
      return status
  }
}

export function formatCurrency(amount: number | string | any): string {
  let numAmount: number
  
  if (typeof amount === 'string') {
    numAmount = parseFloat(amount)
  } else if (typeof amount === 'number') {
    numAmount = amount
  } else if (amount && typeof amount.toNumber === 'function') {
    // Handle Prisma Decimal objects
    numAmount = amount.toNumber()
  } else {
    // Fallback for any other type
    numAmount = Number(amount) || 0
  }
  
  return new Intl.NumberFormat('fr-CA', {
    style: 'currency',
    currency: 'CAD',
  }).format(numAmount)
}

export function formatDate(date: Date | string): string {
  const dateObj = typeof date === 'string' ? new Date(date) : date
  return new Intl.DateTimeFormat('fr-CA', {
    year: 'numeric',
    month: 'long',
    day: 'numeric',
  }).format(dateObj)
}

export function formatDateTime(date: Date | string): string {
  const dateObj = typeof date === 'string' ? new Date(date) : date
  return new Intl.DateTimeFormat('fr-CA', {
    year: 'numeric',
    month: 'long',
    day: 'numeric',
    hour: '2-digit',
    minute: '2-digit',
  }).format(dateObj)
}

export function formatTime(date: Date | string): string {
  const dateObj = typeof date === 'string' ? new Date(date) : date
  return new Intl.DateTimeFormat('fr-CA', {
    hour: '2-digit',
    minute: '2-digit',
  }).format(dateObj)
}


