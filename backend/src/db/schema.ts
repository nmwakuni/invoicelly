// src/db/schema.ts
import { sqliteTable, text, integer, real } from 'drizzle-orm/sqlite-core'
import { relations } from 'drizzle-orm'

// ============= USERS =============
export const users = sqliteTable('users', {
  id: text('id').primaryKey(),
  email: text('email').notNull().unique(),
  name: text('name').notNull(),
  passwordHash: text('password_hash'), // null if OAuth
  
  // Business info
  businessName: text('business_name'),
  businessAddress: text('business_address'),
  businessPhone: text('business_phone'),
  taxId: text('tax_id'),
  logoUrl: text('logo_url'),
  
  // Settings
  currency: text('currency').default('USD'),
  defaultPaymentTerms: integer('default_payment_terms').default(30), // days
  invoicePrefix: text('invoice_prefix').default('INV'),
  nextInvoiceNumber: integer('next_invoice_number').default(1),
  
  // Subscription
  subscriptionId: text('subscription_id'),
  
  // Timestamps
  createdAt: integer('created_at', { mode: 'timestamp' }).$defaultFn(() => new Date()),
  updatedAt: integer('updated_at', { mode: 'timestamp' }).$defaultFn(() => new Date())
})

// ============= CLIENTS =============
export const clients = sqliteTable('clients', {
  id: text('id').primaryKey(),
  userId: text('user_id').notNull().references(() => users.id, { onDelete: 'cascade' }),
  
  // Basic info
  name: text('name').notNull(),
  email: text('email'),
  phone: text('phone'),
  company: text('company'),
  
  // Address
  addressLine1: text('address_line1'),
  addressLine2: text('address_line2'),
  city: text('city'),
  state: text('state'),
  postalCode: text('postal_code'),
  country: text('country'),
  
  // Financial
  taxId: text('tax_id'),
  currency: text('currency'),
  
  // Notes
  notes: text('notes'),
  
  // Timestamps
  createdAt: integer('created_at', { mode: 'timestamp' }).$defaultFn(() => new Date()),
  updatedAt: integer('updated_at', { mode: 'timestamp' }).$defaultFn(() => new Date())
})

// ============= INVOICES =============
export const invoices = sqliteTable('invoices', {
  id: text('id').primaryKey(),
  userId: text('user_id').notNull().references(() => users.id, { onDelete: 'cascade' }),
  clientId: text('client_id').notNull().references(() => clients.id, { onDelete: 'restrict' }),
  
  // Invoice details
  invoiceNumber: text('invoice_number').notNull(),
  status: text('status', { 
    enum: ['draft', 'sent', 'viewed', 'paid', 'overdue', 'canceled'] 
  }).default('draft'),
  
  // Dates
  issueDate: integer('issue_date', { mode: 'timestamp' }).notNull(),
  dueDate: integer('due_date', { mode: 'timestamp' }).notNull(),
  paidDate: integer('paid_date', { mode: 'timestamp' }),
  
  // Amounts
  subtotal: real('subtotal').notNull(),
  taxRate: real('tax_rate').default(0),
  taxAmount: real('tax_amount').default(0),
  discountRate: real('discount_rate').default(0),
  discountAmount: real('discount_amount').default(0),
  total: real('total').notNull(),
  currency: text('currency').default('USD'),
  
  // Payment
  amountPaid: real('amount_paid').default(0),
  paymentMethod: text('payment_method'),
  
  // Content
  notes: text('notes'),
  terms: text('terms'),
  
  // Files
  pdfUrl: text('pdf_url'),
  
  // Tracking
  viewCount: integer('view_count').default(0),
  lastViewedAt: integer('last_viewed_at', { mode: 'timestamp' }),
  sentAt: integer('sent_at', { mode: 'timestamp' }),
  
  // Recurring
  isRecurring: integer('is_recurring', { mode: 'boolean' }).default(false),
  recurringId: text('recurring_id'),
  
  // Timestamps
  createdAt: integer('created_at', { mode: 'timestamp' }).$defaultFn(() => new Date()),
  updatedAt: integer('updated_at', { mode: 'timestamp' }).$defaultFn(() => new Date())
})

// ============= INVOICE ITEMS =============
export const invoiceItems = sqliteTable('invoice_items', {
  id: text('id').primaryKey(),
  invoiceId: text('invoice_id').notNull().references(() => invoices.id, { onDelete: 'cascade' }),
  
  description: text('description').notNull(),
  quantity: real('quantity').notNull(),
  unitPrice: real('unit_price').notNull(),
  amount: real('amount').notNull(),
  
  // Optional
  taxRate: real('tax_rate'),
  
  // Ordering
  sortOrder: integer('sort_order').default(0),
  
  createdAt: integer('created_at', { mode: 'timestamp' }).$defaultFn(() => new Date())
})

// ============= RECURRING INVOICES =============
export const recurringInvoices = sqliteTable('recurring_invoices', {
  id: text('id').primaryKey(),
  userId: text('user_id').notNull().references(() => users.id, { onDelete: 'cascade' }),
  clientId: text('client_id').notNull().references(() => clients.id, { onDelete: 'cascade' }),
  
  // Template (same fields as invoices but for generation)
  frequency: text('frequency', { enum: ['weekly', 'monthly', 'quarterly', 'yearly'] }).notNull(),
  startDate: integer('start_date', { mode: 'timestamp' }).notNull(),
  endDate: integer('end_date', { mode: 'timestamp' }),
  
  nextGenerationDate: integer('next_generation_date', { mode: 'timestamp' }).notNull(),
  lastGeneratedAt: integer('last_generated_at', { mode: 'timestamp' }),
  
  // Invoice template
  subtotal: real('subtotal').notNull(),
  taxRate: real('tax_rate').default(0),
  currency: text('currency').default('USD'),
  notes: text('notes'),
  terms: text('terms'),
  
  status: text('status', { enum: ['active', 'paused', 'completed'] }).default('active'),
  
  createdAt: integer('created_at', { mode: 'timestamp' }).$defaultFn(() => new Date()),
  updatedAt: integer('updated_at', { mode: 'timestamp' }).$defaultFn(() => new Date())
})

// ============= RECURRING INVOICE ITEMS =============
export const recurringInvoiceItems = sqliteTable('recurring_invoice_items', {
  id: text('id').primaryKey(),
  recurringInvoiceId: text('recurring_invoice_id').notNull()
    .references(() => recurringInvoices.id, { onDelete: 'cascade' }),
  
  description: text('description').notNull(),
  quantity: real('quantity').notNull(),
  unitPrice: real('unit_price').notNull(),
  amount: real('amount').notNull(),
  sortOrder: integer('sort_order').default(0)
})

// ============= PAYMENT RECORDS =============
export const paymentRecords = sqliteTable('payment_records', {
  id: text('id').primaryKey(),
  invoiceId: text('invoice_id').notNull().references(() => invoices.id, { onDelete: 'cascade' }),
  userId: text('user_id').notNull().references(() => users.id, { onDelete: 'cascade' }),
  
  amount: real('amount').notNull(),
  currency: text('currency').default('USD'),
  paymentMethod: text('payment_method'), // 'bank_transfer', 'paypal', 'stripe', 'cash', etc.
  paymentDate: integer('payment_date', { mode: 'timestamp' }).notNull(),
  
  reference: text('reference'), // Check number, transaction ID, etc.
  notes: text('notes'),
  
  createdAt: integer('created_at', { mode: 'timestamp' }).$defaultFn(() => new Date())
})

// ============= EXPENSES (BONUS FEATURE) =============
export const expenses = sqliteTable('expenses', {
  id: text('id').primaryKey(),
  userId: text('user_id').notNull().references(() => users.id, { onDelete: 'cascade' }),
  
  description: text('description').notNull(),
  amount: real('amount').notNull(),
  currency: text('currency').default('USD'),
  category: text('category'), // 'software', 'hardware', 'travel', etc.
  
  date: integer('date', { mode: 'timestamp' }).notNull(),
  
  receiptUrl: text('receipt_url'),
  notes: text('notes'),
  
  createdAt: integer('created_at', { mode: 'timestamp' }).$defaultFn(() => new Date())
})

// ============= SUBSCRIPTIONS (already defined, but included for completeness) =============
export const subscriptions = sqliteTable('subscriptions', {
  id: text('id').primaryKey(),
  userId: text('user_id').notNull().references(() => users.id, { onDelete: 'cascade' }),
  plan: text('plan', { enum: ['free', 'starter', 'pro', 'business'] }).notNull(),
  status: text('status', { enum: ['active', 'canceled', 'past_due', 'trialing'] }).notNull(),
  provider: text('provider', { enum: ['paddle', 'paypal', 'stripe'] }).notNull(),
  providerSubscriptionId: text('provider_subscription_id'),
  providerCustomerId: text('provider_customer_id'),
  currentPeriodStart: integer('current_period_start', { mode: 'timestamp' }).notNull(),
  currentPeriodEnd: integer('current_period_end', { mode: 'timestamp' }).notNull(),
  cancelAtPeriodEnd: integer('cancel_at_period_end', { mode: 'boolean' }).default(false),
  createdAt: integer('created_at', { mode: 'timestamp' }).$defaultFn(() => new Date()),
  updatedAt: integer('updated_at', { mode: 'timestamp' }).$defaultFn(() => new Date())
})

// ============= PAYMENTS (Subscription payments) =============
export const payments = sqliteTable('payments', {
  id: text('id').primaryKey(),
  userId: text('user_id').notNull().references(() => users.id, { onDelete: 'cascade' }),
  subscriptionId: text('subscription_id').references(() => subscriptions.id),
  amount: real('amount').notNull(),
  currency: text('currency').default('USD'),
  status: text('status', { enum: ['succeeded', 'failed', 'pending', 'refunded'] }).notNull(),
  provider: text('provider', { enum: ['paddle', 'paypal', 'stripe'] }).notNull(),
  providerPaymentId: text('provider_payment_id'),
  description: text('description'),
  createdAt: integer('created_at', { mode: 'timestamp' }).$defaultFn(() => new Date())
})

// ============= WEBHOOK EVENTS =============
export const webhookEvents = sqliteTable('webhook_events', {
  id: text('id').primaryKey(),
  provider: text('provider', { enum: ['paddle', 'paypal', 'stripe'] }).notNull(),
  eventType: text('event_type').notNull(),
  payload: text('payload').notNull(), // JSON string
  processed: integer('processed', { mode: 'boolean' }).default(false),
  error: text('error'),
  createdAt: integer('created_at', { mode: 'timestamp' }).$defaultFn(() => new Date())
})

// ============= RELATIONS =============
export const usersRelations = relations(users, ({ many, one }) => ({
  clients: many(clients),
  invoices: many(invoices),
  subscription: one(subscriptions, {
    fields: [users.subscriptionId],
    references: [subscriptions.id]
  })
}))

export const clientsRelations = relations(clients, ({ one, many }) => ({
  user: one(users, {
    fields: [clients.userId],
    references: [users.id]
  }),
  invoices: many(invoices)
}))

export const invoicesRelations = relations(invoices, ({ one, many }) => ({
  user: one(users, {
    fields: [invoices.userId],
    references: [users.id]
  }),
  client: one(clients, {
    fields: [invoices.clientId],
    references: [clients.id]
  }),
  items: many(invoiceItems),
  payments: many(paymentRecords)
}))

export const invoiceItemsRelations = relations(invoiceItems, ({ one }) => ({
  invoice: one(invoices, {
    fields: [invoiceItems.invoiceId],
    references: [invoices.id]
  })
}))
