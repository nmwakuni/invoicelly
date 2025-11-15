import { type ClassValue, clsx } from 'clsx'
import { twMerge } from 'tailwind-merge'

export function cn(...inputs: ClassValue[]) {
  return twMerge(clsx(inputs))
}

export function formatCurrency(amount: number, currency: string = 'USD'): string {
  return new Intl.NumberFormat('en-US', {
    style: 'currency',
    currency: currency,
  }).format(amount)
}

export function formatDate(date: Date | number, format: 'short' | 'long' = 'short'): string {
  const d = typeof date === 'number' ? new Date(date * 1000) : date
  
  if (format === 'long') {
    return new Intl.DateTimeFormat('en-US', {
      dateStyle: 'long',
    }).format(d)
  }
  
  return new Intl.DateTimeFormat('en-US', {
    dateStyle: 'short',
  }).format(d)
}

export function getInitials(name: string): string {
  return name
    .split(' ')
    .map((n) => n[0])
    .join('')
    .toUpperCase()
    .slice(0, 2)
}

export function calculateInvoiceTotal(
  subtotal: number,
  taxRate: number = 0,
  discountRate: number = 0
): {
  taxAmount: number
  discountAmount: number
  total: number
} {
  const taxAmount = subtotal * (taxRate / 100)
  const discountAmount = subtotal * (discountRate / 100)
  const total = subtotal + taxAmount - discountAmount

  return {
    taxAmount,
    discountAmount,
    total,
  }
}

export function getDaysUntilDue(dueDate: number): number {
  const now = Date.now()
  const due = dueDate * 1000
  const diff = due - now
  return Math.ceil(diff / (1000 * 60 * 60 * 24))
}

export function isOverdue(dueDate: number, status: string): boolean {
  if (status === 'paid' || status === 'canceled') return false
  return getDaysUntilDue(dueDate) < 0
}
