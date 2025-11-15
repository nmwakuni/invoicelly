// src/routes/invoices.ts
import { Hono } from 'hono'
import { createInvoiceSchema, updateInvoiceSchema, sendInvoiceSchema } from '../utils/validation'
import { requireAuth } from '../middleware/auth'
import { checkSubscription } from '../middleware/subscription'
import { generateInvoicePDF } from '../services/pdf'
import { sendInvoiceEmail } from '../services/email'

interface User {
  id: string
  email: string
  name?: string
  invoice_prefix?: string
  next_invoice_number?: number
}

interface Invoice {
  id: string
  user_id: string
  client_id: string
  invoice_number: string
  status: string
  issue_date: number
  due_date: number
  subtotal: number
  tax_rate: number
  tax_amount: number
  discount_rate: number
  discount_amount: number
  total: number
  currency: string
  notes?: string
  terms?: string
  pdf_url?: string
  amount_paid?: number
  created_at: number
  updated_at: number
}

type Bindings = {
  DB: D1Database
  R2: R2Bucket
  R2_PUBLIC_DOMAIN?: string
  RESEND_API_KEY?: string
  EMAIL_FROM_DOMAIN?: string
}

type Variables = {
  user: User
}

const app = new Hono<{ Bindings: Bindings; Variables: Variables }>()

app.use('/*', requireAuth)

// GET /api/invoices - List invoices with pagination
app.get('/', async (c) => {
  const user = c.get('user')
  const userId = user.id
  const status = c.req.query('status') // Filter by status
  const clientId = c.req.query('clientId') // Filter by client
  const page = parseInt(c.req.query('page') || '1', 10)
  const limit = parseInt(c.req.query('limit') || '50', 10)
  const offset = (page - 1) * limit

  // Validate pagination params
  const validLimit = Math.min(Math.max(limit, 1), 100) // Between 1-100
  const validOffset = Math.max(offset, 0)

  let query = `
    SELECT
      i.*,
      c.name as client_name,
      c.email as client_email
    FROM invoices i
    JOIN clients c ON i.client_id = c.id
    WHERE i.user_id = ?
  `
  const bindings: (string | number)[] = [userId]

  if (status) {
    query += ' AND i.status = ?'
    bindings.push(status)
  }

  if (clientId) {
    query += ' AND i.client_id = ?'
    bindings.push(clientId)
  }

  query += ' ORDER BY i.created_at DESC LIMIT ? OFFSET ?'
  bindings.push(validLimit, validOffset)

  // Get total count for pagination metadata
  let countQuery = 'SELECT COUNT(*) as count FROM invoices WHERE user_id = ?'
  const countBindings: (string | number)[] = [userId]

  if (status) {
    countQuery += ' AND status = ?'
    countBindings.push(status)
  }

  if (clientId) {
    countQuery += ' AND client_id = ?'
    countBindings.push(clientId)
  }

  const [invoicesResult, countResult] = await Promise.all([
    c.env.DB.prepare(query).bind(...bindings).all(),
    c.env.DB.prepare(countQuery).bind(...countBindings).first() as Promise<{ count: number } | null>,
  ])

  const total = countResult?.count || 0
  const totalPages = Math.ceil(total / validLimit)

  return c.json({
    invoices: invoicesResult.results,
    pagination: {
      page,
      limit: validLimit,
      total,
      totalPages,
      hasMore: page < totalPages,
    },
  })
})

// GET /api/invoices/:id - Get invoice with items
app.get('/:id', async (c) => {
  const user = c.get('user')
  const userId = user.id
  const invoiceId = c.req.param('id')
  
  const invoice = await c.env.DB.prepare(`
    SELECT 
      i.*,
      c.name as client_name,
      c.email as client_email,
      c.company as client_company,
      c.address_line1, c.address_line2, c.city, c.state, 
      c.postal_code, c.country, c.tax_id as client_tax_id
    FROM invoices i
    JOIN clients c ON i.client_id = c.id
    WHERE i.id = ? AND i.user_id = ?
  `).bind(invoiceId, userId).first()
  
  if (!invoice) {
    return c.json({ error: 'Invoice not found' }, 404)
  }
  
  // Get items
  const items = await c.env.DB.prepare(`
    SELECT * FROM invoice_items 
    WHERE invoice_id = ? 
    ORDER BY sort_order, created_at
  `).bind(invoiceId).all()
  
  // Get payments
  const payments = await c.env.DB.prepare(`
    SELECT * FROM payment_records 
    WHERE invoice_id = ? 
    ORDER BY payment_date DESC
  `).bind(invoiceId).all()
  
  return c.json({ 
    invoice,
    items: items.results,
    payments: payments.results
  })
})

// POST /api/invoices - Create invoice
app.post('/', checkSubscription('invoices'), async (c) => {
  const user = c.get('user')
  const userId = user.id
  const body = await c.req.json()
  
  const validation = createInvoiceSchema.safeParse(body)
  if (!validation.success) {
    return c.json({ 
      error: 'Validation failed', 
      details: validation.error.flatten() 
    }, 400)
  }
  
  const data = validation.data
  
  // Calculate totals
  const subtotal = data.items.reduce((sum, item) => sum + item.amount, 0)
  const taxAmount = subtotal * (data.taxRate / 100)
  const discountAmount = subtotal * (data.discountRate / 100)
  const total = subtotal + taxAmount - discountAmount

  // Get next invoice number and increment atomically using a batch
  const userRecord = await c.env.DB.prepare(`
    SELECT invoice_prefix, next_invoice_number
    FROM user WHERE id = ?
  `).bind(userId).first() as { invoice_prefix?: string; next_invoice_number?: number } | null

  if (!userRecord) {
    return c.json({ error: 'User not found' }, 404)
  }

  const invoiceNumber = `${userRecord.invoice_prefix || 'INV'}-${String(userRecord.next_invoice_number || 1).padStart(4, '0')}`

  // Create invoice
  const invoiceId = crypto.randomUUID()
  const now = Math.floor(Date.now() / 1000)

  // Use batch to ensure atomic operations
  const statements = [
    // Create invoice
    c.env.DB.prepare(`
      INSERT INTO invoices (
        id, user_id, client_id, invoice_number, status,
        issue_date, due_date, subtotal, tax_rate, tax_amount,
        discount_rate, discount_amount, total, currency, notes, terms,
        created_at, updated_at
      ) VALUES (?, ?, ?, ?, 'draft', ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?)
    `).bind(
      invoiceId, userId, data.clientId, invoiceNumber,
      Math.floor(data.issueDate.getTime() / 1000),
      Math.floor(data.dueDate.getTime() / 1000),
      subtotal, data.taxRate, taxAmount,
      data.discountRate, discountAmount, total,
      data.currency, data.notes, data.terms,
      now, now
    ),
    // Increment invoice number atomically
    c.env.DB.prepare(`
      UPDATE user
      SET next_invoice_number = next_invoice_number + 1
      WHERE id = ?
    `).bind(userId)
  ]

  // Add invoice items to batch
  for (const [index, item] of data.items.entries()) {
    statements.push(
      c.env.DB.prepare(`
        INSERT INTO invoice_items (
          id, invoice_id, description, quantity,
          unit_price, amount, sort_order
        ) VALUES (?, ?, ?, ?, ?, ?, ?)
      `).bind(
        crypto.randomUUID(),
        invoiceId,
        item.description,
        item.quantity,
        item.unitPrice,
        item.amount,
        index
      )
    )
  }

  // Execute all statements in a batch (atomic)
  await c.env.DB.batch(statements)
  
  const invoice = await c.env.DB.prepare(
    'SELECT * FROM invoices WHERE id = ?'
  ).bind(invoiceId).first() as Invoice | null
  
  return c.json({ invoice }, 201)
})

// PATCH /api/invoices/:id - Update invoice
app.patch('/:id', async (c) => {
  const user = c.get('user')
  const userId = user.id
  const invoiceId = c.req.param('id')
  const body = await c.req.json()
  
  const validation = updateInvoiceSchema.safeParse(body)
  if (!validation.success) {
    return c.json({ 
      error: 'Validation failed', 
      details: validation.error.flatten() 
    }, 400)
  }
  
  // Check invoice exists and is editable
  const existing = await c.env.DB.prepare(`
    SELECT status, tax_rate, discount_rate FROM invoices 
    WHERE id = ? AND user_id = ?
  `).bind(invoiceId, userId).first() as { status: string; tax_rate: number; discount_rate: number } | null
  
  if (!existing) {
    return c.json({ error: 'Invoice not found' }, 404)
  }
  
  if (existing.status === 'paid') {
    return c.json({ error: 'Cannot edit paid invoice' }, 400)
  }
  
  const data = validation.data
  
  // If items are being updated, recalculate totals
  if (data.items) {
    const subtotal = data.items.reduce((sum, item) => sum + item.amount, 0)
    const taxRate = data.taxRate ?? existing.tax_rate
    const discountRate = data.discountRate ?? existing.discount_rate
    const taxAmount = subtotal * (taxRate / 100)
    const discountAmount = subtotal * (discountRate / 100)
    const total = subtotal + taxAmount - discountAmount
    
    // Update invoice
    await c.env.DB.prepare(`
      UPDATE invoices 
      SET subtotal = ?, tax_rate = ?, tax_amount = ?,
          discount_rate = ?, discount_amount = ?, total = ?,
          updated_at = unixepoch()
      WHERE id = ?
    `).bind(
      subtotal, taxRate, taxAmount,
      discountRate, discountAmount, total,
      invoiceId
    ).run()
    
    // Delete old items
    await c.env.DB.prepare(
      'DELETE FROM invoice_items WHERE invoice_id = ?'
    ).bind(invoiceId).run()
    
    // Insert new items
    for (const [index, item] of data.items.entries()) {
      await c.env.DB.prepare(`
        INSERT INTO invoice_items (
          id, invoice_id, description, quantity, 
          unit_price, amount, sort_order
        ) VALUES (?, ?, ?, ?, ?, ?, ?)
      `).bind(
        crypto.randomUUID(),
        invoiceId,
        item.description,
        item.quantity,
        item.unitPrice,
        item.amount,
        index
      ).run()
    }
  }
  
  // Update other fields
  const updates: string[] = []
  const values: any[] = []
  
  const fieldMap: Record<string, string> = {
    status: 'status',
    notes: 'notes',
    terms: 'terms',
    issueDate: 'issue_date',
    dueDate: 'due_date'
  }
  
  Object.entries(data).forEach(([key, value]) => {
    if (value !== undefined && fieldMap[key]) {
      updates.push(`${fieldMap[key]} = ?`)
      if (value instanceof Date) {
        values.push(Math.floor(value.getTime() / 1000))
      } else {
        values.push(value)
      }
    }
  })
  
  if (updates.length > 0) {
    updates.push('updated_at = unixepoch()')
    values.push(invoiceId)
    
    await c.env.DB.prepare(`
      UPDATE invoices 
      SET ${updates.join(', ')} 
      WHERE id = ?
    `).bind(...values).run()
  }
  
  const invoice = await c.env.DB.prepare(
    'SELECT * FROM invoices WHERE id = ?'
  ).bind(invoiceId).first() as Invoice | null
  
  return c.json({ invoice })
})

// POST /api/invoices/:id/send - Send invoice via email
app.post('/:id/send', async (c) => {
  const user = c.get('user')
  const userId = user.id
  const invoiceId = c.req.param('id')
  const body = await c.req.json()
  
  const validation = sendInvoiceSchema.safeParse(body)
  if (!validation.success) {
    return c.json({ 
      error: 'Validation failed', 
      details: validation.error.flatten() 
    }, 400)
  }
  
  // Get full invoice data
  const invoice = await c.env.DB.prepare(`
    SELECT i.*, c.*, u.name as user_name, u.email as user_email,
           u.business_name, u.business_address, u.logo_url
    FROM invoices i
    JOIN clients c ON i.client_id = c.id
    JOIN users u ON i.user_id = u.id
    WHERE i.id = ? AND i.user_id = ?
  `).bind(invoiceId, userId).first() as any
  
  if (!invoice) {
    return c.json({ error: 'Invoice not found' }, 404)
  }
  
  const items = await c.env.DB.prepare(`
    SELECT * FROM invoice_items 
    WHERE invoice_id = ? 
    ORDER BY sort_order
  `).bind(invoiceId).all()
  
  // Generate PDF if not exists
  let pdfUrl = invoice.pdf_url
  if (!pdfUrl) {
    try {
      const pdfBuffer = await generateInvoicePDF({
        invoice,
        items: items.results as any[]
      })

      const filename = `invoices/${invoiceId}.pdf`
      await c.env.R2.put(filename, pdfBuffer, {
        httpMetadata: { contentType: 'application/pdf' }
      })

      // Use environment variable for R2 domain
      const r2Domain = c.env.R2_PUBLIC_DOMAIN || 'https://your-r2-domain.com'
      pdfUrl = `${r2Domain}/${filename}`

      await c.env.DB.prepare(
        'UPDATE invoices SET pdf_url = ? WHERE id = ?'
      ).bind(pdfUrl, invoiceId).run()
    } catch (error) {
      console.error('PDF generation failed:', error)
      return c.json({
        error: 'Failed to generate invoice PDF',
        details: error instanceof Error ? error.message : 'Unknown error'
      }, 500)
    }
  }
  
  // Send email
  await sendInvoiceEmail({
    to: validation.data.to,
    subject: validation.data.subject || `Invoice ${invoice.invoice_number}`,
    message: validation.data.message,
    invoice,
    pdfUrl
  }, {
    RESEND_API_KEY: c.env.RESEND_API_KEY || '',
    EMAIL_FROM_DOMAIN: c.env.EMAIL_FROM_DOMAIN
  })
  
  // Update invoice status
  await c.env.DB.prepare(`
    UPDATE invoices 
    SET status = 'sent', sent_at = unixepoch(), updated_at = unixepoch()
    WHERE id = ?
  `).bind(invoiceId).run()
  
  return c.json({ success: true, message: 'Invoice sent successfully' })
})

// POST /api/invoices/:id/mark-paid - Mark invoice as paid
app.post('/:id/mark-paid', async (c) => {
  const user = c.get('user')
  const userId = user.id
  const invoiceId = c.req.param('id')
  
  await c.env.DB.prepare(`
    UPDATE invoices 
    SET status = 'paid', 
        paid_date = unixepoch(),
        amount_paid = total,
        updated_at = unixepoch()
    WHERE id = ? AND user_id = ?
  `).bind(invoiceId, userId).run()
  
  return c.json({ success: true })
})

// DELETE /api/invoices/:id - Delete invoice (soft delete via status)
app.delete('/:id', async (c) => {
  const user = c.get('user')
  const userId = user.id
  const invoiceId = c.req.param('id')
  
  const invoice = await c.env.DB.prepare(`
    SELECT status FROM invoices 
    WHERE id = ? AND user_id = ?
  `).bind(invoiceId, userId).first() as { status: string } | null
  
  if (!invoice) {
    return c.json({ error: 'Invoice not found' }, 404)
  }
  
  if (invoice.status === 'paid') {
    return c.json({ error: 'Cannot delete paid invoice' }, 400)
  }
  
  // Soft delete by marking as canceled
  await c.env.DB.prepare(`
    UPDATE invoices 
    SET status = 'canceled', updated_at = unixepoch()
    WHERE id = ?
  `).bind(invoiceId).run()
  
  return c.json({ success: true })
})

export default app
