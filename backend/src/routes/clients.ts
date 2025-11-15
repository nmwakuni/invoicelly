// src/routes/clients.ts
import { Hono } from 'hono'
import { createClientSchema, updateClientSchema } from '../utils/validation'
import { requireAuth } from '../middleware/auth'
import { checkSubscription } from '../middleware/subscription'

interface User {
  id: string
  email: string
  name?: string
}

interface Client {
  id: string
  user_id: string
  name: string
  email: string
  phone?: string
  company?: string
  address_line1?: string
  address_line2?: string
  city?: string
  state?: string
  postal_code?: string
  country?: string
  tax_id?: string
  currency?: string
  notes?: string
  created_at: number
  updated_at: number
}

interface ClientStats {
  total_invoices: number
  total_paid: number
  total_outstanding: number
}

type Bindings = {
  DB: D1Database
}

type Variables = {
  user: User
}

const app = new Hono<{ Bindings: Bindings; Variables: Variables }>()

// All routes require auth
app.use('/*', requireAuth)

// GET /api/clients - List all clients
app.get('/', async (c) => {
  const user = c.get('user')
  const userId = user.id
  
  const clients = await c.env.DB.prepare(`
    SELECT * FROM clients 
    WHERE user_id = ? 
    ORDER BY created_at DESC
  `).bind(userId).all()
  
  return c.json({ clients: clients.results })
})

// GET /api/clients/:id - Get single client
app.get('/:id', async (c) => {
  const user = c.get('user')
  const userId = user.id
  const clientId = c.req.param('id')
  
  const client = await c.env.DB.prepare(`
    SELECT * FROM clients 
    WHERE id = ? AND user_id = ?
  `).bind(clientId, userId).first() as Client | null
  
  if (!client) {
    return c.json({ error: 'Client not found' }, 404)
  }
  
  // Get client stats
  const stats = await c.env.DB.prepare(`
    SELECT 
      COUNT(*) as total_invoices,
      SUM(CASE WHEN status = 'paid' THEN total ELSE 0 END) as total_paid,
      SUM(CASE WHEN status IN ('sent', 'viewed', 'overdue') THEN total ELSE 0 END) as total_outstanding
    FROM invoices 
    WHERE client_id = ? AND user_id = ?
  `).bind(clientId, userId).first() as ClientStats | null
  
  return c.json({ 
    client,
    stats
  })
})

// POST /api/clients - Create client
app.post('/', checkSubscription('clients'), async (c) => {
  const user = c.get('user')
  const userId = user.id
  const body = await c.req.json()
  
  const validation = createClientSchema.safeParse(body)
  if (!validation.success) {
    return c.json({ 
      error: 'Validation failed', 
      details: validation.error.flatten() 
    }, 400)
  }
  
  const data = validation.data
  const clientId = crypto.randomUUID()
  const now = Math.floor(Date.now() / 1000)

  await c.env.DB.prepare(`
    INSERT INTO clients (
      id, user_id, name, email, phone, company,
      address_line1, address_line2, city, state, postal_code, country,
      tax_id, currency, notes, created_at, updated_at
    ) VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?)
  `).bind(
    clientId, userId, data.name, data.email, data.phone, data.company,
    data.addressLine1, data.addressLine2, data.city, data.state,
    data.postalCode, data.country, data.taxId, data.currency, data.notes,
    now, now
  ).run()
  
  const client = await c.env.DB.prepare(
    'SELECT * FROM clients WHERE id = ?'
  ).bind(clientId).first() as Client | null
  
  return c.json({ client }, 201)
})

// PATCH /api/clients/:id - Update client
app.patch('/:id', async (c) => {
  const user = c.get('user')
  const userId = user.id
  const clientId = c.req.param('id')
  const body = await c.req.json()
  
  const validation = updateClientSchema.safeParse(body)
  if (!validation.success) {
    return c.json({ 
      error: 'Validation failed', 
      details: validation.error.flatten() 
    }, 400)
  }
  
  // Check client exists and belongs to user
  const existing = await c.env.DB.prepare(`
    SELECT id FROM clients WHERE id = ? AND user_id = ?
  `).bind(clientId, userId).first()
  
  if (!existing) {
    return c.json({ error: 'Client not found' }, 404)
  }
  
  const data = validation.data
  const updates: string[] = []
  const values: any[] = []

  // Whitelist of allowed fields to prevent SQL injection
  const allowedFields: Record<string, string> = {
    name: 'name',
    email: 'email',
    phone: 'phone',
    company: 'company',
    addressLine1: 'address_line1',
    addressLine2: 'address_line2',
    city: 'city',
    state: 'state',
    postalCode: 'postal_code',
    country: 'country',
    taxId: 'tax_id',
    currency: 'currency',
    notes: 'notes'
  }

  Object.entries(data).forEach(([key, value]) => {
    if (value !== undefined && allowedFields[key]) {
      updates.push(`${allowedFields[key]} = ?`)
      values.push(value)
    }
  })
  
  if (updates.length > 0) {
    updates.push('updated_at = unixepoch()')
    values.push(clientId, userId)
    
    await c.env.DB.prepare(`
      UPDATE clients 
      SET ${updates.join(', ')} 
      WHERE id = ? AND user_id = ?
    `).bind(...values).run()
  }
  
  const client = await c.env.DB.prepare(
    'SELECT * FROM clients WHERE id = ?'
  ).bind(clientId).first() as Client | null
  
  return c.json({ client })
})

// DELETE /api/clients/:id - Delete client
app.delete('/:id', async (c) => {
  const user = c.get('user')
  const userId = user.id
  const clientId = c.req.param('id')
  
  // Check if client has invoices
  const hasInvoices = await c.env.DB.prepare(`
    SELECT COUNT(*) as count 
    FROM invoices 
    WHERE client_id = ? AND user_id = ?
  `).bind(clientId, userId).first() as { count: number } | null
  
  if (hasInvoices && hasInvoices.count > 0) {
    return c.json({ 
      error: 'Cannot delete client with existing invoices' 
    }, 400)
  }
  
  const result = await c.env.DB.prepare(`
    DELETE FROM clients 
    WHERE id = ? AND user_id = ?
  `).bind(clientId, userId).run()
  
  if (result.meta.changes === 0) {
    return c.json({ error: 'Client not found' }, 404)
  }
  
  return c.json({ success: true })
})

export default app
