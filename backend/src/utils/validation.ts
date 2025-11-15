// src/utils/validation.ts
import { z } from 'zod'

// ============= CLIENT SCHEMAS =============
export const createClientSchema = z.object({
  name: z.string().min(1, 'Name is required'),
  email: z.string().email('Invalid email').optional().or(z.literal('')),
  phone: z.string().optional(),
  company: z.string().optional(),
  addressLine1: z.string().optional(),
  addressLine2: z.string().optional(),
  city: z.string().optional(),
  state: z.string().optional(),
  postalCode: z.string().optional(),
  country: z.string().optional(),
  taxId: z.string().optional(),
  currency: z.string().optional(),
  notes: z.string().optional()
})

export const updateClientSchema = createClientSchema.partial()

export type CreateClientInput = z.infer<typeof createClientSchema>
export type UpdateClientInput = z.infer<typeof updateClientSchema>

// ============= INVOICE ITEM SCHEMA =============
export const invoiceItemSchema = z.object({
  description: z.string().min(1, 'Description required'),
  quantity: z.number().positive('Quantity must be positive').max(999999, 'Quantity too large'),
  unitPrice: z.number().nonnegative('Price cannot be negative').max(9999999999, 'Price exceeds maximum'),
  amount: z.number().nonnegative().max(9999999999, 'Amount exceeds maximum'),
  taxRate: z.number().min(0).max(100).optional()
})

// ============= INVOICE SCHEMAS =============
export const createInvoiceSchema = z.object({
  clientId: z.string().uuid('Invalid client ID'),
  issueDate: z.coerce.date(),
  dueDate: z.coerce.date(),
  items: z.array(invoiceItemSchema).min(1, 'At least one item required'),
  taxRate: z.number().min(0).max(100).default(0),
  discountRate: z.number().min(0).max(100).default(0),
  notes: z.string().optional(),
  terms: z.string().optional(),
  currency: z.string().default('USD')
})

export const updateInvoiceSchema = createInvoiceSchema.partial().extend({
  status: z.enum(['draft', 'sent', 'viewed', 'paid', 'overdue', 'canceled']).optional()
})

export const sendInvoiceSchema = z.object({
  to: z.string().email('Invalid email'),
  subject: z.string().optional(),
  message: z.string().optional()
})

export type CreateInvoiceInput = z.infer<typeof createInvoiceSchema>
export type UpdateInvoiceInput = z.infer<typeof updateInvoiceSchema>
export type SendInvoiceInput = z.infer<typeof sendInvoiceSchema>

// ============= PAYMENT SCHEMA =============
export const recordPaymentSchema = z.object({
  invoiceId: z.string().uuid(),
  amount: z.number().positive('Amount must be positive').max(9999999999, 'Payment amount exceeds maximum'),
  paymentMethod: z.string().min(1, 'Payment method required'),
  paymentDate: z.coerce.date(),
  reference: z.string().optional(),
  notes: z.string().optional()
})

export type RecordPaymentInput = z.infer<typeof recordPaymentSchema>

// ============= RECURRING INVOICE SCHEMA =============
export const createRecurringInvoiceSchema = z.object({
  clientId: z.string().uuid(),
  frequency: z.enum(['weekly', 'monthly', 'quarterly', 'yearly']),
  startDate: z.coerce.date(),
  endDate: z.coerce.date().optional(),
  items: z.array(invoiceItemSchema).min(1),
  taxRate: z.number().min(0).max(100).default(0),
  notes: z.string().optional(),
  terms: z.string().optional(),
  currency: z.string().default('USD')
})

export type CreateRecurringInvoiceInput = z.infer<typeof createRecurringInvoiceSchema>

// ============= USER SETTINGS SCHEMA =============
export const updateUserSettingsSchema = z.object({
  name: z.string().min(1).optional(),
  businessName: z.string().optional(),
  businessAddress: z.string().optional(),
  businessPhone: z.string().optional(),
  taxId: z.string().optional(),
  currency: z.string().optional(),
  defaultPaymentTerms: z.number().int().positive().optional(),
  invoicePrefix: z.string().optional()
})

export type UpdateUserSettingsInput = z.infer<typeof updateUserSettingsSchema>
