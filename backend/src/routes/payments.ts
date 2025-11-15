// src/routes/payments.ts
import { Hono } from 'hono'
import { requireAuth } from '../middleware/auth'
import { recordPaymentSchema } from '../utils/validation'

interface User {
  id: string
  email: string
  name?: string
}

interface Invoice {
  id: string
  user_id: string
  currency: string
  amount_paid: number
  total: number
  status: string
  payment_method?: string
  paid_date?: number
}

interface Payment {
  id: string
  invoice_id: string
  user_id: string
  amount: number
  currency: string
  payment_method: string
  payment_date: number
  reference?: string
  notes?: string
}

type Bindings = {
  DB: D1Database
}

type Variables = {
  user: User
}

const app = new Hono<{ Bindings: Bindings; Variables: Variables }>()

app.use('/*', requireAuth)

// POST /api/payments - Record a payment
app.post('/', async (c) => {
  const user = c.get('user')
  const userId = user.id
  
  const body = await c.req.json()
  
  const validation = recordPaymentSchema.safeParse(body)
  
  if (!validation.success) {
    return c.json({ 
      error: 'Validation failed', 
      details: validation.error.flatten() 
    }, 400)
  }

  const data = validation.data

  // Get invoice
  const invoice = await c.env.DB.prepare(`
    SELECT * FROM invoices 
    WHERE id = ? AND user_id = ?
  `).bind(data.invoiceId, userId).first() as Invoice | null

  if (!invoice) {
    return c.json({ error: 'Invoice not found' }, 404)
  }

  // Record payment
  const paymentId = crypto.randomUUID()
  
  await c.env.DB.prepare(`
    INSERT INTO payment_records (
      id, invoice_id, user_id, amount, currency,
      payment_method, payment_date, reference, notes
    ) VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?)
  `).bind(
    paymentId,
    data.invoiceId,
    userId,
    data.amount,
    invoice.currency,
    data.paymentMethod,
    Math.floor(data.paymentDate.getTime() / 1000),
    data.reference,
    data.notes
  ).run()

  // Update invoice
  const newAmountPaid = (invoice.amount_paid || 0) + data.amount
  const newStatus = newAmountPaid >= invoice.total ? 'paid' : invoice.status

  await c.env.DB.prepare(`
    UPDATE invoices 
    SET 
      amount_paid = ?,
      status = ?,
      payment_method = COALESCE(payment_method, ?),
      paid_date = CASE WHEN ? = 'paid' THEN unixepoch() ELSE paid_date END,
      updated_at = unixepoch()
    WHERE id = ?
  `).bind(
    newAmountPaid,
    newStatus,
    data.paymentMethod,
    newStatus,
    data.invoiceId
  ).run()

  const payment = await c.env.DB.prepare(
    'SELECT * FROM payment_records WHERE id = ?'
  ).bind(paymentId).first() as Payment | null

  return c.json({ payment }, 201)
})

// GET /api/payments/invoice/:invoiceId - Get payments for invoice
app.get('/invoice/:invoiceId', async (c) => {
  const user = c.get('user')
  const userId = user.id
  const invoiceId = c.req.param('invoiceId')

  // Verify invoice belongs to user
  const invoice = await c.env.DB.prepare(`
    SELECT id FROM invoices WHERE id = ? AND user_id = ?
  `).bind(invoiceId, userId).first() as { id: string } | null

  if (!invoice) {
    return c.json({ error: 'Invoice not found' }, 404)
  }

  const payments = await c.env.DB.prepare(`
    SELECT * FROM payment_records 
    WHERE invoice_id = ? 
    ORDER BY payment_date DESC
  `).bind(invoiceId).all()

  return c.json({ payments: payments.results })
})

// DELETE /api/payments/:id - Delete payment record
app.delete('/:id', async (c) => {
  const user = c.get('user')
  const userId = user.id
  const paymentId = c.req.param('id')

  // Get payment
  const payment = await c.env.DB.prepare(`
    SELECT * FROM payment_records WHERE id = ? AND user_id = ?
  `).bind(paymentId, userId).first() as Payment | null

  if (!payment) {
    return c.json({ error: 'Payment not found' }, 404)
  }

  // Get invoice
  const invoice = await c.env.DB.prepare(`
    SELECT * FROM invoices WHERE id = ?
  `).bind(payment.invoice_id).first() as Invoice | null

  if (!invoice) {
    return c.json({ error: 'Invoice not found' }, 404)
  }

  // Delete payment
  await c.env.DB.prepare(
    'DELETE FROM payment_records WHERE id = ?'
  ).bind(paymentId).run()

  // Update invoice
  const newAmountPaid = Math.max(0, (invoice.amount_paid || 0) - payment.amount)
  const newStatus = newAmountPaid >= invoice.total ? 'paid' : 
                    newAmountPaid > 0 ? 'sent' : 
                    invoice.status

  await c.env.DB.prepare(`
    UPDATE invoices 
    SET 
      amount_paid = ?,
      status = ?,
      paid_date = CASE WHEN ? != 'paid' THEN NULL ELSE paid_date END,
      updated_at = unixepoch()
    WHERE id = ?
  `).bind(newAmountPaid, newStatus, newStatus, payment.invoice_id).run()

  return c.json({ success: true })
})

export default app
