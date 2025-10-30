/**
 * Categories for support tickets
 */
export const TICKET_CATEGORIES = [
  'réservations',
  'soutient technique',
  'demande de cours',
  'changement de cours/tuteur',
  'paiement',
  'autre'
] as const

export type TicketCategory = typeof TICKET_CATEGORIES[number]

