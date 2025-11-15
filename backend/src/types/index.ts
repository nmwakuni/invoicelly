// src/types/index.ts
import { z } from 'zod'

export const PlanSchema = z.enum(['free', 'starter', 'pro', 'business'])
export type Plan = z.infer<typeof PlanSchema>

export const SubscriptionStatusSchema = z.enum([
  'active', 
  'canceled', 
  'past_due', 
  'trialing'
])
export type SubscriptionStatus = z.infer<typeof SubscriptionStatusSchema>

export const PaymentProviderSchema = z.enum(['paddle', 'paypal', 'stripe'])
export type PaymentProvider = z.infer<typeof PaymentProviderSchema>

export interface Subscription {
  id: string
  userId: string
  plan: Plan
  status: SubscriptionStatus
  provider: PaymentProvider
  providerSubscriptionId?: string
  providerCustomerId?: string
  currentPeriodStart: number
  currentPeriodEnd: number
  cancelAtPeriodEnd: boolean
  createdAt: number
  updatedAt: number
}

export const PLAN_LIMITS = {
  free: {
    invoicesPerMonth: 3,
    clients: 5,
    features: ['basic_templates']
  },
  starter: {
    invoicesPerMonth: -1, // unlimited
    clients: 50,
    features: ['basic_templates', 'email_sending', 'payment_tracking']
  },
  pro: {
    invoicesPerMonth: -1,
    clients: -1,
    features: ['all_templates', 'email_sending', 'payment_tracking', 'recurring_invoices', 'client_portal']
  },
  business: {
    invoicesPerMonth: -1,
    clients: -1,
    features: ['everything', 'white_label', 'priority_support', 'team_members']
  }
} as const

export const PLAN_PRICES = {
  starter: { monthly: 10, annual: 100 },
  pro: { monthly: 25, annual: 250 },
  business: { monthly: 49, annual: 490 }
} as const
