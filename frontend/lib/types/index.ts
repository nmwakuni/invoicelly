// lib/types/index.ts

export interface User {
    id: string
    email: string
    name: string
    businessName?: string
    businessAddress?: string
    logoUrl?: string
    currency: string
    subscriptionId?: string
  }
  
  export interface Client {
    id: string
    userId: string
    name: string
    email?: string
    phone?: string
    company?: string
    addressLine1?: string
    addressLine2?: string
    city?: string
    state?: string
    postalCode?: string
    country?: string
    taxId?: string
    notes?: string
    createdAt: number
    updatedAt: number
  }
  
  export interface InvoiceItem {
    id?: string
    description: string
    quantity: number
    unitPrice: number
    amount: number
    taxRate?: number
  }
  
  export interface Invoice {
    id: string
    userId: string
    clientId: string
    invoiceNumber: string
    status: 'draft' | 'sent' | 'viewed' | 'paid' | 'overdue' | 'canceled'
    issueDate: number
    dueDate: number
    paidDate?: number
    subtotal: number
    taxRate: number
    taxAmount: number
    discountRate: number
    discountAmount: number
    total: number
    currency: string
    amountPaid: number
    paymentMethod?: string
    notes?: string
    terms?: string
    pdfUrl?: string
    sentAt?: number
    createdAt: number
    updatedAt: number
    
    // Relations
    clientName?: string
    clientEmail?: string
    items?: InvoiceItem[]
  }
  
  export interface Payment {
    id: string
    invoiceId: string
    userId: string
    amount: number
    currency: string
    paymentMethod: string
    paymentDate: number
    reference?: string
    notes?: string
    createdAt: number
  }
  
  export interface Subscription {
    id: string
    userId: string
    plan: 'free' | 'starter' | 'pro' | 'business'
    status: 'active' | 'canceled' | 'past_due' | 'trialing'
    provider: 'paddle' | 'paypal' | 'stripe'
    providerSubscriptionId?: string
    currentPeriodStart: number
    currentPeriodEnd: number
    cancelAtPeriodEnd: boolean
  }
  
  export interface DashboardStats {
    revenue: {
      total: number
      thisMonth: number
      outstanding: number
      overdue: number
    }
    invoices: {
      total: number
      draft: number
      sent: number
      paid: number
      overdue: number
    }
    clients: {
      total: number
    }
    trends: Array<{
      date: string
      count: number
      amount: number
      status: string
    }>
    topClients: Array<{
      id: string
      name: string
      company?: string
      invoiceCount: number
      totalPaid: number
      outstanding: number
    }>
  }
  
  export type InvoiceStatus = Invoice['status']
  export type SubscriptionPlan = Subscription['plan']
