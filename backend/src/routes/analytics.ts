// src/routes/analytics.ts
import { Hono } from 'hono'
import { requireAuth } from '../middleware/auth'

interface User {
  id: string
  email: string
  name?: string
}

interface RevenueStats {
  total_revenue: number
  revenue_this_month: number
  outstanding: number
  overdue_amount: number
}

interface InvoiceCounts {
  total_invoices: number
  draft_count: number
  sent_count: number
  paid_count: number
  overdue_count: number
}

interface ClientCount {
  count: number
}

type Bindings = {
  DB: D1Database
}

type Variables = {
  user: User
}

const app = new Hono<{ Bindings: Bindings; Variables: Variables }>()

app.use('/*', requireAuth)

// GET /api/analytics/dashboard - Main dashboard stats
app.get('/dashboard', async (c) => {
  const user = c.get('user')
  const userId = user.id
  
  // Get date ranges
  const now = Math.floor(Date.now() / 1000)
  const thirtyDaysAgo = now - (30 * 24 * 60 * 60)
  const startOfMonth = Math.floor(new Date(new Date().getFullYear(), new Date().getMonth(), 1).getTime() / 1000)
  
  // Total revenue
  const revenueStats = await c.env.DB.prepare(`
    SELECT 
      SUM(CASE WHEN status = 'paid' THEN total ELSE 0 END) as total_revenue,
      SUM(CASE WHEN status = 'paid' AND paid_date >= ? THEN total ELSE 0 END) as revenue_this_month,
      SUM(CASE WHEN status IN ('sent', 'viewed', 'overdue') THEN total ELSE 0 END) as outstanding,
      SUM(CASE WHEN status = 'overdue' THEN total ELSE 0 END) as overdue_amount
    FROM invoices
    WHERE user_id = ?
  `).bind(startOfMonth, userId).first() as RevenueStats | null
  
  // Invoice counts
  const invoiceCounts = await c.env.DB.prepare(`
    SELECT 
      COUNT(*) as total_invoices,
      SUM(CASE WHEN status = 'draft' THEN 1 ELSE 0 END) as draft_count,
      SUM(CASE WHEN status = 'sent' THEN 1 ELSE 0 END) as sent_count,
      SUM(CASE WHEN status = 'paid' THEN 1 ELSE 0 END) as paid_count,
      SUM(CASE WHEN status = 'overdue' THEN 1 ELSE 0 END) as overdue_count
    FROM invoices
    WHERE user_id = ?
  `).bind(userId).first() as InvoiceCounts | null
  
  // Client count
  const clientCount = await c.env.DB.prepare(`
    SELECT COUNT(*) as count FROM clients WHERE user_id = ?
  `).bind(userId).first() as ClientCount | null
  
  // Recent invoices (last 30 days trend)
  const recentInvoices = await c.env.DB.prepare(`
    SELECT 
      DATE(issue_date, 'unixepoch') as date,
      COUNT(*) as count,
      SUM(total) as amount,
      status
    FROM invoices
    WHERE user_id = ? AND issue_date >= ?
    GROUP BY DATE(issue_date, 'unixepoch'), status
    ORDER BY date DESC
  `).bind(userId, thirtyDaysAgo).all()
  
  // Top clients by revenue
  const topClients = await c.env.DB.prepare(`
    SELECT 
      c.id,
      c.name,
      c.company,
      COUNT(i.id) as invoice_count,
      SUM(CASE WHEN i.status = 'paid' THEN i.total ELSE 0 END) as total_paid,
      SUM(CASE WHEN i.status IN ('sent', 'viewed', 'overdue') THEN i.total ELSE 0 END) as outstanding
    FROM clients c
    LEFT JOIN invoices i ON c.id = i.client_id
    WHERE c.user_id = ?
    GROUP BY c.id
    ORDER BY total_paid DESC
    LIMIT 10
  `).bind(userId).all()
  
  // Payment methods breakdown
  const paymentMethods = await c.env.DB.prepare(`
    SELECT 
      payment_method,
      COUNT(*) as count,
      SUM(total) as amount
    FROM invoices
    WHERE user_id = ? AND status = 'paid' AND payment_method IS NOT NULL
    GROUP BY payment_method
  `).bind(userId).all()
  
  return c.json({
    revenue: {
      total: revenueStats?.total_revenue || 0,
      thisMonth: revenueStats?.revenue_this_month || 0,
      outstanding: revenueStats?.outstanding || 0,
      overdue: revenueStats?.overdue_amount || 0
    },
    invoices: {
      total: invoiceCounts?.total_invoices || 0,
      draft: invoiceCounts?.draft_count || 0,
      sent: invoiceCounts?.sent_count || 0,
      paid: invoiceCounts?.paid_count || 0,
      overdue: invoiceCounts?.overdue_count || 0
    },
    clients: {
      total: clientCount?.count || 0
    },
    trends: recentInvoices.results,
    topClients: topClients.results,
    paymentMethods: paymentMethods.results
  })
})

// GET /api/analytics/revenue - Revenue over time
app.get('/revenue', async (c) => {
  const user = c.get('user')
  const userId = user.id
  const period = c.req.query('period') || '30d' // 7d, 30d, 90d, 1y
  
  let daysAgo = 30
  if (period === '7d') daysAgo = 7
  if (period === '90d') daysAgo = 90
  if (period === '1y') daysAgo = 365
  
  const startDate = Math.floor(Date.now() / 1000) - (daysAgo * 24 * 60 * 60)
  
  const revenue = await c.env.DB.prepare(`
    SELECT 
      DATE(paid_date, 'unixepoch') as date,
      SUM(total) as amount,
      COUNT(*) as count
    FROM invoices
    WHERE user_id = ? 
    AND status = 'paid' 
    AND paid_date >= ?
    GROUP BY DATE(paid_date, 'unixepoch')
    ORDER BY date ASC
  `).bind(userId, startDate).all()
  
  return c.json({ revenue: revenue.results })
})

export default app
